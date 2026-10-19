import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { realtimeHub } from '../../realtime/websocket.js';
import { iamService } from '../iam/iam.service.js';

const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']),
  remarks: z.string().optional()
});

const placeStaffOrderSchema = z.object({
  tableNumber: z.string(),
  items: z.array(z.object({
    menuItemId: z.string(),
    name: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0)
  })).min(1),
  specialNotes: z.string().optional()
});

const adjustInventorySchema = z.object({
  itemId: z.string(),
  adjustmentQuantity: z.number(),
  reason: z.string().min(2)
});

export async function staffRoutes(fastify: FastifyInstance) {
  // 1. Shift & Operations Overview (Live Metrics)
  fastify.get('/overview', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId } = req.query as { restaurantId?: string };
    const targetRestaurantId = restaurantId || userAuth.restaurantId;

    if (!targetRestaurantId && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(400).send({ success: false, message: 'Restaurant context is required' });
    }

    const authRes = await iamService.authorize(userAuth, 'orders.read', { restaurantId: targetRestaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [ordersToday, activeOrders, cookingQueue, serviceCalls, paidBills, activeSessions, tablesCount, occupiedTablesCount] = await Promise.all([
      prisma.order.count({
        where: {
          restaurantId: targetRestaurantId,
          createdAt: { gte: todayStart }
        }
      }),
      prisma.order.count({
        where: {
          restaurantId: targetRestaurantId,
          status: { in: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'] }
        }
      }),
      prisma.order.count({
        where: {
          restaurantId: targetRestaurantId,
          status: { in: ['CONFIRMED', 'PREPARING'] }
        }
      }),
      prisma.serviceRequest.count({
        where: {
          restaurantId: targetRestaurantId,
          status: 'PENDING'
        }
      }),
      prisma.bill.findMany({
        where: {
          restaurantId: targetRestaurantId,
          paymentStatus: 'PAID',
          createdAt: { gte: todayStart }
        },
        select: { grandTotal: true, subtotal: true, cgstAmount: true, sgstAmount: true }
      }),
      prisma.diningSession.count({
        where: {
          restaurantId: targetRestaurantId,
          status: 'ACTIVE'
        }
      }),
      prisma.table.count({
        where: { branch: { restaurantId: targetRestaurantId } }
      }),
      prisma.table.count({
        where: { branch: { restaurantId: targetRestaurantId }, isOccupied: true }
      })
    ]);

    const settledRevenue = paidBills.reduce((acc, b) => acc + b.grandTotal, 0);
    const totalTaxes = paidBills.reduce((acc, b) => acc + (b.cgstAmount + b.sgstAmount), 0);

    return reply.send({
      success: true,
      data: {
        restaurantId: targetRestaurantId,
        ordersToday,
        activeOrders,
        cookingQueue,
        pendingServiceCalls: serviceCalls,
        settledRevenue,
        settledOrdersCount: paidBills.length,
        totalTaxes,
        activeSessions,
        totalTables: tablesCount,
        occupiedTables: occupiedTablesCount,
        occupancyRatePercent: tablesCount > 0 ? Math.round((occupiedTablesCount / tablesCount) * 100) : 0
      }
    });
  });

  // 2. Get Live Orders for Staff Restaurant (Multi-Tenant & Role Scoped)
  fastify.get('/orders', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId, status } = req.query as { restaurantId?: string; status?: string };

    const targetRestaurantId = restaurantId || userAuth.restaurantId;
    if (!targetRestaurantId && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(400).send({ success: false, message: 'Restaurant context is required' });
    }

    const authRes = await iamService.authorize(userAuth, 'orders.read', { restaurantId: targetRestaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const whereClause: any = {
      restaurantId: targetRestaurantId
    };

    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        items: true,
        restaurant: {
          select: { id: true, name: true, phone: true }
        },
        user: {
          select: { name: true, phone: true }
        },
        bills: {
          select: { id: true, billNumber: true, paymentStatus: true, grandTotal: true }
        }
      }
    });

    return reply.send({
      success: true,
      count: orders.length,
      data: orders
    });
  });

  // 3. Update Order Status (Kitchen & Floor Workflow with Realtime Broadcast)
  fastify.patch('/orders/:id/status', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const parse = updateOrderStatusSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { status, remarks } = parse.data;
    const userAuth = (req as any).user;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { restaurant: true }
    });

    if (!order) {
      return reply.status(404).send({ success: false, message: 'Order not found' });
    }

    // Required permission mapping
    const requiredPerm = status === 'CONFIRMED' ? 'orders.accept'
      : status === 'PREPARING' ? 'orders.prepare'
      : status === 'READY' ? 'orders.ready'
      : status === 'SERVED' ? 'orders.serve'
      : status === 'CANCELLED' ? 'orders.cancel'
      : 'orders.update';

    const authRes = await iamService.authorize(userAuth, requiredPerm, {
      restaurantId: order.restaurantId,
      tableNumber: order.tableNumber
    });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, restaurant: true }
    });

    // Record status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        changedBy: userAuth.name || userAuth.id,
        remarks: remarks || `Status updated to ${status} by ${userAuth.name || userAuth.role}`
      }
    });

    // Audit log
    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: userAuth.role,
      action: `order.${status.toLowerCase()}`,
      resource: 'order',
      resourceId: order.id,
      scope: `REST:${order.restaurantId}|TABLE:${order.tableNumber}`,
      before: { status: order.status },
      after: { status }
    });

    // Realtime notification to customer and staff
    if (order.userId) {
      realtimeHub.notifyUser(order.userId, 'ORDER_STATUS_CHANGED', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status,
        remarks,
        timestamp: new Date().toISOString()
      });
    }

    realtimeHub.notifyRestaurantStaff(order.restaurantId, 'ORDER_STATUS_CHANGED', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status,
      remarks,
      timestamp: new Date().toISOString()
    });

    return reply.send({
      success: true,
      message: `Order status advanced to ${status}`,
      data: updatedOrder
    });
  });

  // 4. Place Order from Staff App (Waiter/Captain)
  fastify.post('/orders', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const parse = placeStaffOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { tableNumber, items, specialNotes } = parse.data;

    const targetRestaurantId = userAuth.restaurantId;
    if (!targetRestaurantId) {
      return reply.status(400).send({ success: false, message: 'User is not linked to a restaurant tenant' });
    }

    const authRes = await iamService.authorize(userAuth, 'orders.create', {
      restaurantId: targetRestaurantId,
      tableNumber
    });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: targetRestaurantId } });
    if (!restaurant) {
      return reply.status(404).send({ success: false, message: 'Restaurant not found' });
    }

    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal
      };
    });

    const cgstAmount = Number(((subtotal * restaurant.cgstRatePercent) / 100).toFixed(2));
    const sgstAmount = Number(((subtotal * restaurant.sgstRatePercent) / 100).toFixed(2));
    const serviceCharge = Number(((subtotal * restaurant.serviceChargePercent) / 100).toFixed(2));
    const grandTotal = Math.round(subtotal + cgstAmount + sgstAmount + serviceCharge);

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.order.create({
      data: {
        restaurantId: targetRestaurantId,
        userId: userAuth.id,
        tableNumber,
        orderNumber,
        status: 'CONFIRMED',
        subtotal,
        discountAmount: 0.0,
        cgstAmount,
        sgstAmount,
        serviceCharge,
        roundOffAmount: grandTotal - (subtotal + cgstAmount + sgstAmount + serviceCharge),
        totalAmount: grandTotal,
        specialNotes: specialNotes || 'Placed by staff',
        items: { create: orderItemsData },
        statusHistory: {
          create: {
            status: 'CONFIRMED',
            changedBy: userAuth.name || userAuth.email,
            remarks: 'Order placed by restaurant staff'
          }
        }
      },
      include: { items: true, restaurant: true }
    });

    realtimeHub.notifyRestaurantStaff(targetRestaurantId, 'ORDER_CREATED', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt
    });

    return reply.status(201).send({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  });

  // 5. Get Table Service Requests
  fastify.get('/service-requests', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId } = req.query as { restaurantId?: string };

    const targetRestaurantId = restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'service_requests.read', { restaurantId: targetRestaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: targetRestaurantId ? { restaurantId: targetRestaurantId } : {},
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    return reply.send({
      success: true,
      data: requests
    });
  });

  // 5b. Create Service Request (Customer / Staff)
  fastify.post('/service-requests', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId, tableNumber, type, notes } = req.body as {
      restaurantId: string;
      tableNumber?: string;
      type: string;
      notes?: string;
    };

    const targetRestaurantId = restaurantId || userAuth.restaurantId;
    if (!targetRestaurantId) {
      return reply.status(400).send({ success: false, message: 'restaurantId is required' });
    }

    const created = await prisma.serviceRequest.create({
      data: {
        restaurantId: targetRestaurantId,
        tableNumber: tableNumber || '1',
        type: type || 'CALL_WAITER',
        notes: notes || null,
        status: 'PENDING',
        userId: userAuth.id
      }
    });

    realtimeHub.notifyRestaurantStaff(targetRestaurantId, 'SERVICE_REQUEST_CREATED', {
      id: created.id,
      tableNumber: created.tableNumber,
      type: created.type,
      notes: created.notes,
      status: created.status,
      createdAt: created.createdAt
    });

    return reply.status(201).send({
      success: true,
      message: 'Service request submitted successfully',
      data: created
    });
  });

  // 6. Acknowledge / Complete Service Request
  fastify.patch('/service-requests/:id', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED' };
    const userAuth = (req as any).user;

    const reqRecord = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!reqRecord) {
      return reply.status(404).send({ success: false, message: 'Service request not found' });
    }

    const authRes = await iamService.authorize(userAuth, 'service_requests.resolve', {
      restaurantId: reqRecord.restaurantId,
      tableNumber: reqRecord.tableNumber
    });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status }
    });

    realtimeHub.notifyRestaurantStaff(reqRecord.restaurantId, 'SERVICE_REQUEST_RESOLVED', {
      id: updated.id,
      tableNumber: updated.tableNumber,
      status: updated.status
    });

    return reply.send({
      success: true,
      message: `Service request marked as ${status}`,
      data: updated
    });
  });

  // 7. Get Full Menu Catalog for Restaurant (With Item Availability Status)
  fastify.get('/menu', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId } = req.query as { restaurantId?: string };
    const targetRestaurantId = restaurantId || userAuth.restaurantId;

    const authRes = await iamService.authorize(userAuth, 'menu.read', { restaurantId: targetRestaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: targetRestaurantId, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        items: {
          orderBy: { name: 'asc' }
        }
      }
    });

    return reply.send({
      success: true,
      data: categories
    });
  });

  // 8. Toggle Menu Item Availability (86 Dish)
  fastify.patch('/menu/items/:id/availability', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { isAvailable } = req.body as { isAvailable: boolean };
    const userAuth = (req as any).user;

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return reply.status(404).send({ success: false, message: 'Menu item not found' });
    }

    const authRes = await iamService.authorize(userAuth, 'menu.availability.update', { restaurantId: item.restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable }
    });

    // Realtime broadcast
    realtimeHub.notifyRestaurantStaff(item.restaurantId, 'MENU_ITEM_AVAILABILITY_CHANGED', {
      itemId: updated.id,
      name: updated.name,
      isAvailable: updated.isAvailable
    });

    return reply.send({
      success: true,
      message: `Menu item '${updated.name}' is now ${isAvailable ? 'AVAILABLE' : 'OUT OF STOCK'}`,
      data: updated
    });
  });

  // 8b. Update Full Menu Item Details (Name, Price, Category, Station, Veg/Non-Veg, Prep Time, Description, etc.)
  fastify.patch('/menu/items/:id', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userAuth = (req as any).user;
    const body = req.body as any;

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return reply.status(404).send({ success: false, message: 'Menu item not found' });
    }

    const authRes = await iamService.authorize(userAuth, 'menu.update', { restaurantId: item.restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.discountedPrice !== undefined) updateData.discountedPrice = body.discountedPrice !== null && body.discountedPrice !== '' ? Number(body.discountedPrice) : null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.isVeg !== undefined) updateData.isVeg = Boolean(body.isVeg);
    if (body.stationCode !== undefined) updateData.stationCode = body.stationCode;
    if (body.preparationTime !== undefined) updateData.preparationTime = Number(body.preparationTime);
    if (body.isAvailable !== undefined) updateData.isAvailable = Boolean(body.isAvailable);
    if (body.isBestseller !== undefined) updateData.isBestseller = Boolean(body.isBestseller);

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updateData
    });

    realtimeHub.notifyRestaurantStaff(item.restaurantId, 'MENU_ITEM_UPDATED', {
      itemId: updated.id,
      item: updated
    });

    return reply.send({
      success: true,
      message: `Menu item '${updated.name}' updated successfully`,
      data: updated
    });
  });

  // 8c. Create New Food Item
  fastify.post('/menu/items', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const body = req.body as any;
    const targetRestaurantId = body.restaurantId || userAuth.restaurantId;

    if (!targetRestaurantId) {
      return reply.status(400).send({ success: false, message: 'Missing target restaurant ID' });
    }

    const authRes = await iamService.authorize(userAuth, 'menu.update', { restaurantId: targetRestaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    if (!body.name || body.price === undefined || !body.categoryId) {
      return reply.status(400).send({ success: false, message: 'Missing required fields: name, price, categoryId' });
    }

    const created = await prisma.menuItem.create({
      data: {
        restaurantId: targetRestaurantId,
        categoryId: body.categoryId,
        name: body.name.trim(),
        description: body.description?.trim() || '',
        price: Number(body.price),
        discountedPrice: body.discountedPrice ? Number(body.discountedPrice) : null,
        imageUrl: body.imageUrl || '',
        isVeg: body.isVeg !== undefined ? Boolean(body.isVeg) : true,
        isBestseller: Boolean(body.isBestseller),
        isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
        stationCode: body.stationCode || 'CURRY',
        preparationTime: Number(body.preparationTime) || 15
      }
    });

    realtimeHub.notifyRestaurantStaff(targetRestaurantId, 'MENU_ITEM_CREATED', {
      itemId: created.id,
      item: created
    });

    return reply.status(201).send({
      success: true,
      message: `Menu item '${created.name}' created successfully`,
      data: created
    });
  });

  // 9. Get Physical Tables & Floor Status
  fastify.get('/tables', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId } = req.query as { restaurantId?: string };
    const targetRestaurantId = restaurantId || userAuth.restaurantId;

    const authRes = await iamService.authorize(userAuth, 'tables.read', { restaurantId: targetRestaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const tables = await prisma.table.findMany({
      where: {
        branch: { restaurantId: targetRestaurantId }
      },
      include: {
        branch: { select: { id: true, name: true } },
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
      data: tables
    });
  });

  // 10. Toggle Table Occupancy
  fastify.patch('/tables/:id/occupancy', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { isOccupied } = req.body as { isOccupied: boolean };
    const userAuth = (req as any).user;

    const table = await prisma.table.findUnique({
      where: { id },
      include: { branch: true }
    });
    if (!table) {
      return reply.status(404).send({ success: false, message: 'Table not found' });
    }

    const authRes = await iamService.authorize(userAuth, 'tables.assign', {
      restaurantId: table.branch.restaurantId,
      tableNumber: table.tableNumber
    });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const updated = await prisma.table.update({
      where: { id },
      data: { isOccupied }
    });

    return reply.send({
      success: true,
      message: `Table #${table.tableNumber} occupancy set to ${isOccupied ? 'OCCUPIED' : 'VACANT'}`,
      data: updated
    });
  });

  // 10b. Update Table Configuration (Floor, Capacity, Table Number)
  fastify.patch('/tables/:id', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { floor, capacity, tableNumber } = req.body as { floor?: string; capacity?: number; tableNumber?: string };
    const userAuth = (req as any).user;

    const table = await prisma.table.findUnique({
      where: { id },
      include: { branch: true }
    });
    if (!table) {
      return reply.status(404).send({ success: false, message: 'Table not found' });
    }

    const authRes = await iamService.authorize(userAuth, 'tables.assign', {
      restaurantId: table.branch.restaurantId
    });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const updateData: any = {};
    if (floor !== undefined) updateData.floor = floor;
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (tableNumber !== undefined) updateData.tableNumber = tableNumber;

    const updated = await prisma.table.update({
      where: { id },
      data: updateData
    });

    realtimeHub.notifyRestaurantStaff(table.branch.restaurantId, 'TABLE_CONFIG_UPDATED', {
      tableId: updated.id,
      tableNumber: updated.tableNumber,
      capacity: updated.capacity,
      floor: updated.floor,
      isOccupied: updated.isOccupied
    });

    return reply.send({
      success: true,
      message: `Table #${updated.tableNumber} configuration updated`,
      data: updated
    });
  });

  // 11. Restaurant Audit Logs
  fastify.get('/audit-logs', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const { restaurantId } = req.query as { restaurantId?: string };
    const targetRestaurantId = restaurantId || userAuth.restaurantId;

    const authRes = await iamService.authorize(userAuth, 'audit.read', { restaurantId: targetRestaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { scope: { contains: targetRestaurantId } },
          { resourceId: targetRestaurantId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        actor: { select: { name: true, email: true, role: true } }
      }
    });

    return reply.send({
      success: true,
      data: logs
    });
  });
}
