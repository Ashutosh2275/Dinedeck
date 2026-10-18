import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { iamService } from '../iam/iam.service.js';
import { realtimeHub } from '../../realtime/websocket.js';

export async function supportRoutes(fastify: FastifyInstance) {
  // Helper to authenticate user
  const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid token' });
    }
  };

  // 1. Searchable Knowledgebase Articles
  fastify.get('/articles', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as { q?: string; category?: string };
    const articles = [
      {
        id: 'kb_1',
        title: 'Thermal Printer Setup & Direct ESC/POS Spooling',
        category: 'PRINTERS',
        summary: 'How to configure 80mm/58mm thermal printers in DineDeck Desktop without print dialogs.',
        content: 'To enable direct silent thermal printing in DineDeck Windows Desktop, ensure your thermal printer is set as default or select its name in Settings. The desktop Electron IPC bypasses the browser print dialog and sends native ESC/POS print jobs directly to the Windows Spooler.'
      },
      {
        id: 'kb_2',
        title: 'Kitchen Display System (KDS) Multi-Station Routing',
        category: 'KITCHEN_KDS',
        summary: 'Decomposing customer orders into Tandoor, Curry, Chinese/Continental, Bakery, and Bar KOTs.',
        content: 'KOT items automatically decompose into their assigned station queues upon accepting an order. Chefs at each station can tap Complete on individual tickets. The expeditor pass aggregates all completed station tickets into a single READY status.'
      },
      {
        id: 'kb_3',
        title: 'Table Validity & QR Code Session Rules (90-Minute Expiry)',
        category: 'TABLES_QR',
        summary: 'Understanding customer table session lifespans and anti-phantom assignment safeguards.',
        content: 'DineDeck sessions remain valid for 90 minutes from initial table QR scan. If a table session expires or the cashier settles the bill, the table resets cleanly to VACANT to prevent phantom order attachments.'
      },
      {
        id: 'kb_4',
        title: 'Cashier Shift Opening, Safe Drops & Daily Handover',
        category: 'BILLING',
        summary: 'Procedure for opening a cash drawer shift, recording floats, and closing reconciliation.',
        content: 'Cashiers must open a shift with an initial drawer float before taking cash orders. At shift end, enter actual cash counted. DineDeck computes any overage or shortage and locks the cashier shift report.'
      },
      {
        id: 'kb_5',
        title: 'GST Tax Compliance & Platform Commission Deductions',
        category: 'FINANCE',
        summary: 'How 2.5% CGST + 2.5% SGST and DineDeck commission are calculated and reconciled.',
        content: 'Customer bills itemize standard 5% restaurant GST (2.5% CGST + 2.5% SGST). Platform commission is computed on net food sales (excluding GST). Payout batches are generated weekly after deducting commission.'
      },
      {
        id: 'kb_6',
        title: 'Owner Account Access & Two-Factor Recovery Protocol',
        category: 'LOGIN_RECOVERY',
        summary: 'Emergency identity verification if restaurant owner password or phone is lost.',
        content: 'If the restaurant owner cannot log in, submit a ticket via the "Can\'t access your account?" link on the login page. Super Admin officers verify government FSSAI/GSTIN registration records before reissuing root credentials.'
      }
    ];

    let filtered = articles;
    if (query.category) {
      filtered = filtered.filter(a => a.category.toLowerCase() === query.category?.toLowerCase());
    }
    if (query.q) {
      const term = query.q.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(term) || a.summary.toLowerCase().includes(term) || a.content.toLowerCase().includes(term));
    }

    return reply.send({ success: true, count: filtered.length, data: filtered });
  });

  // 2. Fetch Partner Tickets (Filtered by Restaurant)
  fastify.get('/tickets', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const query = req.query as { status?: string; restaurantId?: string };

    let targetRestaurantId = query.restaurantId;
    if (user.role !== 'DINEDECK_SUPER_ADMIN') {
      // Find staff restaurant
      const staff = await prisma.restaurantStaff.findFirst({ where: { userId: user.id } });
      if (staff) targetRestaurantId = staff.restaurantId;
    }

    const where: any = {};
    if (targetRestaurantId) where.restaurantId = targetRestaurantId;
    if (query.status && query.status !== 'ALL') where.status = query.status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: { select: { id: true, name: true, city: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return reply.send({ success: true, count: tickets.length, data: tickets });
  });

  // 3. Create Ticket (from Partner or Customer)
  fastify.post('/tickets', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const body = req.body as {
      title: string;
      description: string;
      category?: string;
      priority?: string;
      restaurantId?: string;
      branchId?: string;
      orderId?: string;
      diagnosticContext?: any;
    };

    let targetRestaurantId = body.restaurantId;
    if (!targetRestaurantId && user.role !== 'DINEDECK_SUPER_ADMIN') {
      const staff = await prisma.restaurantStaff.findFirst({ where: { userId: user.id } });
      if (staff) targetRestaurantId = staff.restaurantId;
    }

    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const initialTimeline = [
      {
        id: `msg_${Date.now()}`,
        time: new Date().toISOString(),
        action: 'TICKET_CREATED',
        senderName: user.email || 'Partner Staff',
        senderRole: user.role,
        message: body.description,
        isInternal: false,
        diagnosticContext: body.diagnosticContext || null
      }
    ];

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        title: body.title,
        description: body.description,
        category: body.category || 'OPERATIONAL',
        priority: body.priority || 'MEDIUM',
        status: 'OPEN',
        restaurantId: targetRestaurantId || null,
        branchId: body.branchId || null,
        userId: user.id,
        orderId: body.orderId || null,
        timelineJson: JSON.stringify(initialTimeline)
      },
      include: {
        restaurant: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Realtime notification to Super Admin Control Center
    realtimeHub.broadcast('SUPPORT_TICKET_CREATED', {
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority: ticket.priority,
      category: ticket.category,
      restaurantId: ticket.restaurantId,
      restaurantName: ticket.restaurant?.name || 'Unassigned',
      createdAt: ticket.createdAt
    });

    await iamService.logAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      action: 'support.ticket_create',
      resource: 'support_ticket',
      resourceId: ticket.id,
      scope: targetRestaurantId || undefined,
      after: { ticketNumber, priority: ticket.priority, status: ticket.status }
    });

    return reply.status(201).send({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket
    });
  });

  // 4. Reply to Ticket
  fastify.post('/tickets/:id/reply', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };
    const { message, isInternal = false } = req.body as { message: string; isInternal?: boolean };

    if (!message || !message.trim()) {
      return reply.status(400).send({ success: false, message: 'Message content is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { restaurant: true, user: true }
    });

    if (!ticket) {
      return reply.status(404).send({ success: false, message: 'Ticket not found' });
    }

    let timeline = [];
    try {
      timeline = ticket.timelineJson ? JSON.parse(ticket.timelineJson) : [];
    } catch {
      timeline = [];
    }

    const isSuperAdmin = user.role === 'DINEDECK_SUPER_ADMIN';

    const newEntry = {
      id: `msg_${Date.now()}`,
      time: new Date().toISOString(),
      action: 'REPLY',
      senderName: isSuperAdmin ? 'DineDeck Support Team' : (user.email || 'Partner Staff'),
      senderRole: user.role,
      message: message.trim(),
      isInternal: isSuperAdmin ? Boolean(isInternal) : false
    };

    timeline.push(newEntry);

    // Update ticket status
    let updatedStatus = ticket.status;
    if (isSuperAdmin) {
      if (!isInternal && (ticket.status === 'OPEN' || ticket.status === 'ASSIGNED')) {
        updatedStatus = 'IN_REVIEW';
      }
    } else {
      if (ticket.status === 'RESOLVED') {
        updatedStatus = 'IN_REVIEW';
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        timelineJson: JSON.stringify(timeline),
        status: updatedStatus
      },
      include: {
        restaurant: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Realtime notification
    realtimeHub.broadcast('SUPPORT_TICKET_REPLY', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      senderRole: user.role,
      status: updatedStatus,
      restaurantId: ticket.restaurantId,
      messagePreview: message.slice(0, 100)
    });

    return reply.send({ success: true, message: 'Reply sent successfully', data: updated });
  });

  // 5. Reopen Ticket
  fastify.post('/tickets/:id/reopen', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason?: string };

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return reply.status(404).send({ success: false, message: 'Ticket not found' });

    let timeline = [];
    try {
      timeline = ticket.timelineJson ? JSON.parse(ticket.timelineJson) : [];
    } catch {
      timeline = [];
    }

    timeline.push({
      id: `msg_${Date.now()}`,
      time: new Date().toISOString(),
      action: 'TICKET_REOPENED',
      senderName: user.email || 'Partner Staff',
      senderRole: user.role,
      message: reason || 'Ticket reopened by partner.',
      isInternal: false
    });

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'OPEN',
        timelineJson: JSON.stringify(timeline)
      }
    });

    realtimeHub.broadcast('SUPPORT_TICKET_REOPENED', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      restaurantId: ticket.restaurantId,
      reason
    });

    return reply.send({ success: true, message: 'Ticket reopened successfully', data: updated });
  });
}
