import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { realtimeHub } from '../../realtime/websocket.js';

// In-Memory Real-Time Table Waiter Allocation Registry (tableId -> allocation)
export interface TableWaiterAssignment {
  waiterId: string;
  waiterName: string;
  waiterRole: string;
  assignedAt: string;
  assignedBy?: string;
}

export const tableWaiterAssignments = new Map<string, TableWaiterAssignment>();

export function getTableAssignedWaiter(tableId: string): TableWaiterAssignment | undefined {
  return tableWaiterAssignments.get(tableId);
}

export async function getTableAssignedWaiterByTableNumber(restaurantId: string, tableNumber: string): Promise<TableWaiterAssignment | undefined> {
  const cleanNumber = tableNumber.replace(/^(Table|T)[\s#-]*/i, '').trim();
  
  // 1. Check direct table lookup
  const table = await prisma.table.findFirst({
    where: {
      tableNumber: { in: [cleanNumber, tableNumber, `Table ${cleanNumber}`, `T${cleanNumber}`] },
      branch: { restaurantId }
    }
  });

  if (table && tableWaiterAssignments.has(table.id)) {
    return tableWaiterAssignments.get(table.id);
  }

  // 2. Fallback to default active server
  return {
    waiterId: 'usr-waiter-1',
    waiterName: 'Ramesh Kumar',
    waiterRole: 'CAPTAIN',
    assignedAt: new Date().toISOString()
  };
}

// Auto-Allocation Engine: Assign least-loaded active server
export async function autoAssignWaiterForTable(restaurantId: string, tableId: string): Promise<TableWaiterAssignment> {
  // If already assigned, preserve assignment
  if (tableWaiterAssignments.has(tableId)) {
    return tableWaiterAssignments.get(tableId)!;
  }

  try {
    // 1. Find all active staff with service roles for this restaurant
    const staffMembers = await prisma.restaurantStaff.findMany({
      where: { restaurantId, isActive: true },
      include: { user: true }
    });

    const candidateServers = staffMembers.filter((s) => {
      const r = s.user.role?.toUpperCase() || '';
      const d = s.designation?.toUpperCase() || '';
      return (
        r === 'WAITER' ||
        r === 'CAPTAIN' ||
        r === 'HEAD_WAITER' ||
        d.includes('WAITER') ||
        d.includes('CAPTAIN') ||
        d.includes('STEWARD')
      );
    });

    if (candidateServers.length > 0) {
      // Count current load for each candidate
      const loadMap = new Map<string, number>();
      for (const c of candidateServers) {
        loadMap.set(c.userId || c.id, 0);
      }

      for (const assignment of tableWaiterAssignments.values()) {
        if (loadMap.has(assignment.waiterId)) {
          loadMap.set(assignment.waiterId, (loadMap.get(assignment.waiterId) || 0) + 1);
        }
      }

      // Pick server with least active table load
      let leastLoaded = candidateServers[0];
      let minCount = loadMap.get(leastLoaded.userId || leastLoaded.id) || 0;

      for (const candidate of candidateServers) {
        const count = loadMap.get(candidate.userId || candidate.id) || 0;
        if (count < minCount) {
          leastLoaded = candidate;
          minCount = count;
        }
      }

      const assignment: TableWaiterAssignment = {
        waiterId: leastLoaded.userId || leastLoaded.id,
        waiterName: leastLoaded.user.name || 'Floor Server',
        waiterRole: leastLoaded.user.role || 'CAPTAIN',
        assignedAt: new Date().toISOString(),
        assignedBy: 'AUTO_ROUND_ROBIN'
      };

      tableWaiterAssignments.set(tableId, assignment);
      return assignment;
    }
  } catch (err) {
    console.error('[TableAutoAssign] Error picking server:', err);
  }

  // Default fallback server
  const fallbackAssignment: TableWaiterAssignment = {
    waiterId: 'usr-waiter-1',
    waiterName: 'Ramesh Kumar',
    waiterRole: 'CAPTAIN',
    assignedAt: new Date().toISOString(),
    assignedBy: 'SYSTEM_DEFAULT'
  };

  tableWaiterAssignments.set(tableId, fallbackAssignment);
  return fallbackAssignment;
}

const validateQrSchema = z.object({
  qrToken: z.string().min(1)
});

const startSessionSchema = z.object({
  qrToken: z.string().min(1),
  userId: z.string().optional()
});

const assignWaiterSchema = z.object({
  waiterId: z.string().min(1),
  waiterName: z.string().min(1),
  waiterRole: z.string().optional(),
  restaurantId: z.string().optional()
});

export async function tableRoutes(fastify: FastifyInstance) {
  // 1. Validate QR Token
  fastify.post('/validate', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = validateQrSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { qrToken } = parse.data;

    const table = await prisma.table.findUnique({
      where: { qrCodeToken: qrToken },
      include: {
        branch: {
          include: {
            restaurant: true
          }
        }
      }
    });

    if (!table) {
      return reply.status(404).send({ success: false, message: 'Invalid or unknown QR code' });
    }

    if (!table.branch.restaurant.isActive) {
      return reply.status(403).send({ success: false, message: 'This restaurant is currently closed or inactive' });
    }

    // Lookup or auto-assign server
    const server = await autoAssignWaiterForTable(table.branch.restaurantId, table.id);

    return reply.send({
      success: true,
      data: {
        tableId: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        floor: table.floor,
        branchId: table.branch.id,
        branchName: table.branch.name,
        assignedServer: {
          id: server.waiterId,
          name: server.waiterName,
          role: server.waiterRole
        },
        restaurant: {
          id: table.branch.restaurant.id,
          name: table.branch.restaurant.name,
          slug: table.branch.restaurant.slug,
          logoUrl: table.branch.restaurant.logoUrl,
          coverImageUrl: table.branch.restaurant.coverImageUrl,
          cuisineType: table.branch.restaurant.cuisineType,
          rating: table.branch.restaurant.rating,
          fullAddress: table.branch.restaurant.fullAddress,
          cgstRatePercent: table.branch.restaurant.cgstRatePercent,
          sgstRatePercent: table.branch.restaurant.sgstRatePercent,
          serviceChargePercent: table.branch.restaurant.serviceChargePercent
        }
      }
    });
  });

  // 2. Start or Join Dining Session (Auto-assigns Server)
  fastify.post('/session', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = startSessionSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { qrToken, userId } = parse.data;

    const table = await prisma.table.findUnique({
      where: { qrCodeToken: qrToken },
      include: { branch: true }
    });

    if (!table) {
      return reply.status(404).send({ success: false, message: 'Invalid QR token' });
    }

    // Auto-allocate server for this table
    const assignedServer = await autoAssignWaiterForTable(table.branch.restaurantId, table.id);

    // Check for existing active session on table
    let activeSession = await prisma.diningSession.findFirst({
      where: {
        tableId: table.id,
        status: 'ACTIVE'
      },
      include: {
        restaurant: true,
        table: true
      }
    });

    if (!activeSession) {
      const sessionToken = `ses_${table.branch.restaurantId}_${table.tableNumber}_${Date.now()}`;
      activeSession = await prisma.diningSession.create({
        data: {
          restaurantId: table.branch.restaurantId,
          tableId: table.id,
          userId: userId || null,
          sessionToken,
          status: 'ACTIVE'
        },
        include: {
          restaurant: true,
          table: true
        }
      });

      // Mark table occupied
      await prisma.table.update({
        where: { id: table.id },
        data: { isOccupied: true }
      });
    }

    // Broadcast Table Server Allocation to Staff & Assigned Waiter
    realtimeHub.notifyRestaurantStaff(activeSession.restaurantId, 'TABLE_WAITER_ASSIGNED', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      floor: table.floor,
      sessionId: activeSession.id,
      server: assignedServer,
      timestamp: new Date().toISOString()
    });

    realtimeHub.notifyAssignedWaiter(assignedServer.waiterId, 'TABLE_WAITER_ASSIGNED', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      floor: table.floor,
      sessionId: activeSession.id,
      server: assignedServer,
      timestamp: new Date().toISOString()
    }, activeSession.restaurantId);

    return reply.send({
      success: true,
      data: {
        sessionId: activeSession.id,
        sessionToken: activeSession.sessionToken,
        restaurantId: activeSession.restaurantId,
        restaurantName: activeSession.restaurant.name,
        tableId: activeSession.tableId,
        tableNumber: activeSession.table.tableNumber,
        floor: activeSession.table.floor,
        status: activeSession.status,
        startedAt: activeSession.startedAt,
        assignedServer: {
          id: assignedServer.waiterId,
          name: assignedServer.waiterName,
          role: assignedServer.waiterRole,
          assignedAt: assignedServer.assignedAt
        }
      }
    });
  });

  // 3. Manual Server Reassignment (Captain / GM / Owner)
  fastify.post('/:tableId/assign-waiter', async (req: FastifyRequest, reply: FastifyReply) => {
    const { tableId } = req.params as { tableId: string };
    const parse = assignWaiterSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { waiterId, waiterName, waiterRole, restaurantId } = parse.data;

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { branch: true }
    });

    if (!table) {
      return reply.status(404).send({ success: false, message: 'Table not found' });
    }

    const restId = restaurantId || table.branch.restaurantId;

    const newAssignment: TableWaiterAssignment = {
      waiterId,
      waiterName,
      waiterRole: waiterRole || 'CAPTAIN',
      assignedAt: new Date().toISOString(),
      assignedBy: 'MANUAL_EXECUTIVE_OVERRIDE'
    };

    tableWaiterAssignments.set(tableId, newAssignment);

    // Broadcast update across platform
    realtimeHub.notifyRestaurantStaff(restId, 'TABLE_WAITER_ASSIGNED', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      floor: table.floor,
      server: newAssignment,
      isManualOverride: true,
      timestamp: newAssignment.assignedAt
    });

    realtimeHub.notifyAssignedWaiter(waiterId, 'TABLE_WAITER_ASSIGNED', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      floor: table.floor,
      server: newAssignment,
      isManualOverride: true,
      timestamp: newAssignment.assignedAt
    }, restId);

    return reply.send({
      success: true,
      message: `Table #${table.tableNumber} successfully assigned to ${waiterName}`,
      data: {
        tableId: table.id,
        tableNumber: table.tableNumber,
        assignedServer: newAssignment
      }
    });
  });

  // 4. Executive Surveillance: Live Floor Allocations & Kitchen Pickup SLA Feed
  fastify.get('/surveillance/allocations', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as { restaurantId?: string };
    const restaurantId = query.restaurantId || 'cm09000000000000000000001';

    // 1. Fetch all tables
    const tables = await prisma.table.findMany({
      where: {
        branch: { restaurantId }
      },
      include: {
        branch: true,
        sessions: {
          where: { status: 'ACTIVE' },
          include: {
            orders: {
              where: { status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] } },
              include: { items: true }
            }
          }
        }
      },
      orderBy: { tableNumber: 'asc' }
    });

    // 2. Fetch all orders ready for pickup across kitchen
    const readyOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: 'READY'
      },
      include: { items: true }
    });

    const now = Date.now();

    // 3. Map allocation surveillance records
    const allocations = tables.map((t) => {
      const activeSession = t.sessions[0];
      const assigned = tableWaiterAssignments.get(t.id) || {
        waiterId: 'usr-waiter-1',
        waiterName: 'Ramesh Kumar',
        waiterRole: 'CAPTAIN',
        assignedAt: t.createdAt.toISOString(),
        assignedBy: 'SYSTEM_DEFAULT'
      };

      // Check for ready food tickets on this table
      const tableReadyOrders = readyOrders.filter((ro) => ro.tableNumber === t.tableNumber);
      const pendingPickups = tableReadyOrders.map((ro) => {
        const readyTime = ro.readyAt ? new Date(ro.readyAt).getTime() : ro.updatedAt.getTime();
        const elapsedSeconds = Math.max(0, Math.floor((now - readyTime) / 1000));
        
        let slaLevel: 'GREEN' | 'AMBER' | 'RED_BREACH' = 'GREEN';
        if (elapsedSeconds > 300) {
          slaLevel = 'RED_BREACH'; // > 5 mins
        } else if (elapsedSeconds > 120) {
          slaLevel = 'AMBER'; // 2 - 5 mins
        }

        return {
          orderId: ro.id,
          orderNumber: ro.orderNumber,
          itemsCount: ro.items.length,
          itemNames: ro.items.map((i) => i.name),
          readyAt: ro.readyAt?.toISOString() || ro.updatedAt.toISOString(),
          waiterNotifiedAt: ro.waiterNotifiedAt?.toISOString() || null,
          elapsedSeconds,
          slaLevel
        };
      });

      return {
        tableId: t.id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        floor: t.floor,
        qrCodeToken: t.qrCodeToken,
        isOccupied: t.isOccupied || !!activeSession,
        assignedServer: assigned,
        activeSession: activeSession
          ? {
              sessionId: activeSession.id,
              startedAt: activeSession.startedAt,
              durationMinutes: Math.floor((now - new Date(activeSession.startedAt).getTime()) / 60000),
              activeOrdersCount: activeSession.orders.length,
              totalItemsCount: activeSession.orders.reduce((acc, o) => acc + o.items.length, 0)
            }
          : null,
        pendingPickups
      };
    });

    return reply.send({
      success: true,
      data: {
        restaurantId,
        totalTablesCount: tables.length,
        occupiedTablesCount: allocations.filter((a) => a.isOccupied).length,
        readyOrdersCount: readyOrders.length,
        allocations
      }
    });
  });

  // 5. Query Master Table List with Permanent QR Tokens (Multi-Tenant & Branch Isolated)
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { restaurantId, branchId } = req.query as { restaurantId?: string; branchId?: string };

    const whereClause: any = {};
    if (branchId) {
      whereClause.branchId = branchId;
    } else if (restaurantId) {
      whereClause.branch = { restaurantId };
    }

    const tables = await prisma.table.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        branch: { select: { id: true, name: true, restaurantId: true } },
        sessions: {
          where: { status: 'ACTIVE' },
          include: {
            orders: {
              where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }
            }
          }
        }
      },
      orderBy: { tableNumber: 'asc' }
    });

    return reply.send({
      success: true,
      count: tables.length,
      data: tables.map((t) => ({
        id: t.id,
        branchId: t.branchId,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        floor: t.floor,
        qrCodeToken: t.qrCodeToken,
        isOccupied: t.isOccupied || t.sessions.length > 0,
        branch: t.branch,
        activeSession: t.sessions[0] || null
      }))
    });
  });
}

