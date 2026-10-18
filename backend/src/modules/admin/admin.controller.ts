import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { controlCenterService } from './control-center.service.js';
import { iamService } from '../iam/iam.service.js';
import { realtimeHub } from '../../realtime/websocket.js';
import bcrypt from 'bcryptjs';

export async function adminRoutes(fastify: FastifyInstance) {
  const enforceAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, message: 'Unauthorized: Invalid or missing token' });
    }
    const userAuth = (req as any).user;
    if (!userAuth || userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(403).send({ success: false, message: 'Forbidden: Super Administrator access required' });
    }
  };

  // ==========================================
  // 1. OVERVIEW & ANALYTICS
  // ==========================================
  fastify.get('/metrics', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const overview = await controlCenterService.getOverviewMetrics({ range: 'all' });
    return reply.send({
      success: true,
      data: {
        totalRestaurants: overview.restaurants.total,
        activeRestaurants: overview.restaurants.active,
        totalUsers: overview.customers.total + overview.customers.staffMembers,
        totalOrders: overview.operations.totalOrders,
        activeSessions: overview.customers.activeDiningSessions,
        totalRevenueInr: overview.finance.grossOrderValue,
        formattedTotalRevenue: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(overview.finance.grossOrderValue),
        platformCommissionRevenue: overview.finance.platformCommissionRevenue,
        netRestaurantPayable: overview.finance.netRestaurantPayable
      }
    });
  });

  fastify.get('/overview', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const overview = await controlCenterService.getOverviewMetrics({ range: query.range || 'all' });
    return reply.send({ success: true, data: overview });
  });

  // ==========================================
  // 2. GLOBAL PLATFORM SEARCH
  // ==========================================
  fastify.get('/search', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const results = await controlCenterService.globalSearch(query.q || '');
    return reply.send({ success: true, data: results });
  });

  // ==========================================
  // 3. RESTAURANT MANAGEMENT & PROFILE MUTATIONS
  // ==========================================
  fastify.get('/restaurants', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const result = await controlCenterService.getRestaurants(query);
    return reply.send({ success: true, ...result });
  });

  fastify.get('/restaurants/:id', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const detail = await controlCenterService.getRestaurantDetail(id);
    if (!detail) return reply.status(404).send({ success: false, error: 'Restaurant not found' });
    return reply.send({ success: true, data: detail });
  });

  fastify.post('/restaurants/onboard', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any;
    const userAuth = (req as any).user;
    const result = await controlCenterService.onboardRestaurant(body, userAuth.id);
    return reply.status(201).send({ success: true, message: 'Restaurant onboarded successfully', data: result });
  });

  fastify.put('/restaurants/:id/profile', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const userAuth = (req as any).user;
    const updated = await controlCenterService.updateRestaurantProfile(id, body, userAuth.id);
    return reply.send({ success: true, message: 'Restaurant profile updated successfully', data: updated });
  });

  fastify.patch('/restaurants/:id/status', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { isActive, reason } = req.body as { isActive: boolean; reason?: string };
    const userAuth = (req as any).user;
    const newStatus = isActive ? 'ACTIVE' : 'PAUSED';
    const updated = await controlCenterService.updateRestaurantStatus(id, newStatus, reason, userAuth.id);
    return reply.send({ success: true, message: `Restaurant status updated to ${newStatus}`, data: updated });
  });

  fastify.patch('/restaurants/:id/lifecycle', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason?: string };
    const userAuth = (req as any).user;
    const updated = await controlCenterService.updateRestaurantStatus(id, status, reason, userAuth.id);
    return reply.send({ success: true, message: `Restaurant lifecycle updated to ${status}`, data: updated });
  });

  fastify.put('/restaurants/:id/config', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const userAuth = (req as any).user;

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        cgstRatePercent: body.cgstRatePercent !== undefined ? Number(body.cgstRatePercent) : undefined,
        sgstRatePercent: body.sgstRatePercent !== undefined ? Number(body.sgstRatePercent) : undefined,
        serviceChargePercent: body.serviceChargePercent !== undefined ? Number(body.serviceChargePercent) : undefined,
        packagingCharge: body.packagingCharge !== undefined ? Number(body.packagingCharge) : undefined,
        commissionRatePercent: body.commissionRatePercent !== undefined ? Number(body.commissionRatePercent) : undefined
      }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'restaurant.config_update',
      resource: 'restaurant',
      resourceId: id,
      scope: `RESTAURANT:${id}`,
      after: body
    });

    return reply.send({ success: true, message: 'Restaurant billing and commercial configuration updated', data: updated });
  });

  // ==========================================
  // 4. BRANCH & TABLE MANAGEMENT
  // ==========================================
  fastify.get('/restaurants/:id/branches', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const branches = await prisma.restaurantBranch.findMany({
      where: { restaurantId: id },
      include: { tables: true }
    });
    return reply.send({ success: true, data: branches });
  });

  fastify.post('/restaurants/:id/branches', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { name, address, phone } = req.body as any;
    const userAuth = (req as any).user;

    const branch = await prisma.restaurantBranch.create({
      data: { restaurantId: id, name, address, phone, isActive: true }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'branch.create',
      resource: 'branch',
      resourceId: branch.id,
      scope: `RESTAURANT:${id}`,
      after: { name, address, phone }
    });

    return reply.status(201).send({ success: true, data: branch });
  });

  fastify.patch('/branches/:branchId', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { branchId } = req.params as { branchId: string };
    const body = req.body as any;
    const userAuth = (req as any).user;

    const branch = await prisma.restaurantBranch.update({
      where: { id: branchId },
      data: {
        name: body.name ?? undefined,
        address: body.address ?? undefined,
        phone: body.phone ?? undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined
      }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'branch.update',
      resource: 'branch',
      resourceId: branchId,
      after: body
    });

    return reply.send({ success: true, data: branch });
  });

  fastify.post('/branches/:branchId/tables', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { branchId } = req.params as { branchId: string };
    const { tableNumber, capacity } = req.body as any;
    const userAuth = (req as any).user;

    const branch = await prisma.restaurantBranch.findUnique({ where: { id: branchId }, include: { restaurant: true } });
    if (!branch) return reply.status(404).send({ success: false, error: 'Branch not found' });

    const qrCodeToken = `QR_${branch.restaurant.slug}_T${tableNumber}_${Date.now()}`;
    const table = await prisma.table.create({
      data: {
        branchId,
        tableNumber: `${tableNumber}`,
        capacity: Number(capacity || 4),
        qrCodeToken,
        isOccupied: false
      }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'table.create',
      resource: 'table',
      resourceId: table.id,
      scope: `BRANCH:${branchId}`,
      after: { tableNumber, capacity, qrCodeToken }
    });

    realtimeHub.broadcastToRestaurant(branch.restaurantId, {
      event: 'TABLE_CREATED',
      table
    });

    return reply.status(201).send({ success: true, data: table });
  });

  fastify.patch('/tables/:tableId', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tableId } = req.params as { tableId: string };
    const body = req.body as any;
    const userAuth = (req as any).user;

    const table = await prisma.table.update({
      where: { id: tableId },
      data: {
        tableNumber: body.tableNumber !== undefined ? `${body.tableNumber}` : undefined,
        capacity: body.capacity !== undefined ? Number(body.capacity) : undefined,
        isOccupied: body.isOccupied !== undefined ? body.isOccupied : undefined
      },
      include: { branch: true }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'table.update',
      resource: 'table',
      resourceId: tableId,
      after: body
    });

    realtimeHub.broadcastToRestaurant(table.branch.restaurantId, {
      event: 'TABLE_UPDATED',
      table
    });

    return reply.send({ success: true, data: table });
  });

  fastify.post('/tables/:tableId/regenerate-qr', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tableId } = req.params as { tableId: string };
    const userAuth = (req as any).user;

    const table = await prisma.table.findUnique({ where: { id: tableId }, include: { branch: { include: { restaurant: true } } } });
    if (!table) return reply.status(404).send({ success: false, error: 'Table not found' });

    const previousQr = table.qrCodeToken;
    const newQr = `QR_${table.branch.restaurant.slug}_T${table.tableNumber}_${Date.now()}`;
    const updated = await prisma.table.update({
      where: { id: tableId },
      data: { qrCodeToken: newQr }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'table.regenerate_qr',
      resource: 'table',
      resourceId: tableId,
      scope: `RESTAURANT:${table.branch.restaurantId}`,
      before: { qrCodeToken: previousQr },
      after: { qrCodeToken: newQr, previousQrToken: previousQr }
    });

    realtimeHub.broadcastToRestaurant(table.branch.restaurantId, {
      event: 'TABLE_QR_REGENERATED',
      tableId,
      tableNumber: table.tableNumber,
      previousQrToken: previousQr,
      qrCodeToken: newQr
    });

    return reply.send({
      success: true,
      message: `QR Code for Table #${table.tableNumber} regenerated successfully. Previously printed physical QR codes are now invalidated.`,
      data: updated
    });
  });

  // ==========================================
  // 5. MENU GOVERNANCE MUTATIONS
  // ==========================================
  fastify.post('/restaurants/:id/categories', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { name, displayOrder } = req.body as any;
    const userAuth = (req as any).user;

    const category = await prisma.menuCategory.create({
      data: { restaurantId: id, name, displayOrder: Number(displayOrder || 1) }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'menu_category.create',
      resource: 'menu_category',
      resourceId: category.id,
      scope: `RESTAURANT:${id}`,
      after: { name }
    });

    realtimeHub.broadcastToRestaurant(id, { event: 'MENU_UPDATED', restaurantId: id });
    return reply.status(201).send({ success: true, data: category });
  });

  fastify.post('/categories/:categoryId/items', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { categoryId } = req.params as { categoryId: string };
    const body = req.body as any;
    const userAuth = (req as any).user;

    const category = await prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!category) return reply.status(404).send({ success: false, error: 'Category not found' });

    const item = await prisma.menuItem.create({
      data: {
        restaurantId: category.restaurantId,
        categoryId,
        name: body.name,
        description: body.description || '',
        price: Number(body.price),
        isVeg: body.isVeg !== undefined ? body.isVeg : true,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
        imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
      }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'menu_item.create',
      resource: 'menu_item',
      resourceId: item.id,
      scope: `RESTAURANT:${category.restaurantId}`,
      after: { name: item.name, price: item.price }
    });

    realtimeHub.broadcastToRestaurant(category.restaurantId, { event: 'MENU_UPDATED', restaurantId: category.restaurantId });
    return reply.status(201).send({ success: true, data: item });
  });

  fastify.patch('/items/:itemId', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = req.params as { itemId: string };
    const body = req.body as any;
    const userAuth = (req as any).user;

    const prev = await prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!prev) return reply.status(404).send({ success: false, error: 'Item not found' });

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: body.name ?? undefined,
        description: body.description ?? undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        isVeg: body.isVeg !== undefined ? body.isVeg : undefined,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : undefined
      }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'menu_item.update',
      resource: 'menu_item',
      resourceId: itemId,
      scope: `RESTAURANT:${item.restaurantId}`,
      before: { price: prev.price, isAvailable: prev.isAvailable },
      after: body
    });

    realtimeHub.broadcastToRestaurant(item.restaurantId, { event: 'MENU_UPDATED', restaurantId: item.restaurantId });
    return reply.send({ success: true, data: item });
  });

  // ==========================================
  // 6. STAFF & IAM SCOPE MANAGEMENT
  // ==========================================
  fastify.post('/restaurants/:id/staff', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { name, email, phone, role, password = 'StaffPassword@2026' } = req.body as any;
    const userAuth = (req as any).user;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: role || 'WAITER',
        staffProfile: {
          create: {
            restaurantId: id,
            designation: role || 'Captain / Waiter',
            isActive: true
          }
        }
      },
      include: { staffProfile: true }
    });


    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'staff.create',
      resource: 'staff',
      resourceId: user.id,
      scope: `RESTAURANT:${id}`,
      after: { name, email, role }
    });

    return reply.status(201).send({ success: true, message: 'Staff member created successfully', data: user });
  });

  fastify.post('/staff/:staffId/permissions', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { staffId } = req.params as { staffId: string };
    const { permissionId, resource, action, effect, restaurantId, branchId } = req.body as any;
    const userAuth = (req as any).user;

    const finalPermissionId = permissionId || `${resource}.${action}`;
    const override = await iamService.setUserPermissionOverride({
      userId: staffId,
      permissionId: finalPermissionId,
      effect: effect === 'DENY' ? 'DENY' : 'ALLOW',
      restaurantId,
      branchId,
      actorId: userAuth.id
    });

    return reply.status(201).send({ success: true, message: 'Permission override applied', data: override });
  });


  // ==========================================
  // 7. LIVE OPERATIONS TELEMETRY
  // ==========================================
  fastify.get('/operations/live', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const telemetry = await controlCenterService.getLiveOperationsTelemetry();
    return reply.send({ success: true, data: telemetry });
  });

  // ==========================================
  // 8. PAYMENTS & REFUNDS GOVERNANCE
  // ==========================================
  fastify.get('/payments', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const payments = await controlCenterService.getPayments(query);
    return reply.send({ success: true, ...payments });
  });

  fastify.post('/payments/:id/refund', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { reason, amount } = req.body as { reason?: string; amount?: number };
    const userAuth = (req as any).user;

    const payment = await prisma.payment.findUnique({ where: { id }, include: { bill: true } });
    if (!payment) return reply.status(404).send({ success: false, error: 'Payment not found' });

    const refundAmount = amount || payment.amount;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id },
        data: { status: 'REFUNDED' }
      });
      await tx.bill.update({
        where: { id: payment.billId },
        data: { paymentStatus: 'REFUNDED' }
      });
      return p;
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: 'payment.refund_executed',
      resource: 'payment',
      resourceId: id,
      scope: `BILL:${payment.billId}`,
      after: { refundAmount, reason }
    });

    realtimeHub.broadcastToAll({
      event: 'PAYMENT_REFUNDED',
      paymentId: id,
      billId: payment.billId,
      refundAmount,
      reason
    });

    return reply.send({ success: true, message: `Refund of ₹${refundAmount} processed successfully`, data: updated });
  });

  // ==========================================
  // 9. DINEDECK SETTLEMENTS & PAYOUTS
  // ==========================================
  fastify.get('/settlements', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const settlements = await prisma.restaurantSettlement.findMany({
      where: query.restaurantId ? { restaurantId: query.restaurantId } : {},
      orderBy: { createdAt: 'desc' },
      include: { restaurant: { select: { id: true, name: true, city: true } } }
    });
    return reply.send({ success: true, count: settlements.length, data: settlements });
  });

  fastify.post('/settlements/generate', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { restaurantId } = req.body as { restaurantId: string };
    const userAuth = (req as any).user;
    const settlement = await controlCenterService.generateSettlement(restaurantId, userAuth.id);
    return reply.status(201).send({ success: true, message: 'Settlement calculated and created', data: settlement });
  });

  fastify.post('/settlements/:id/payout', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { payoutRef } = req.body as { payoutRef: string };
    const userAuth = (req as any).user;
    const settlement = await controlCenterService.processSettlementPayout(id, payoutRef, userAuth.id);
    return reply.send({ success: true, message: 'Settlement payout marked as settled', data: settlement });
  });

  // ==========================================
  // 10. CUSTOMER GOVERNANCE
  // ==========================================
  fastify.get('/customers', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { orders: true, diningSessions: true, reviews: true } }
      }
    });
    return reply.send({ success: true, count: customers.length, data: customers });
  });

  // ==========================================
  // 11. COUPONS & GROWTH CAMPAIGNS
  // ==========================================
  fastify.get('/coupons', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const coupons = await prisma.coupon.findMany({
      include: { restaurant: { select: { id: true, name: true } } }
    });
    return reply.send({ success: true, count: coupons.length, data: coupons });
  });

  fastify.post('/coupons', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any;
    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        discountPercent: Number(body.discountPercent || body.discountValue || 10),
        minOrderAmount: Number(body.minOrderAmount || 0),
        maxDiscount: Number(body.maxDiscount || body.maxDiscountAmount || 200),
        restaurantId: body.restaurantId || null,
        isActive: true,
        validUntil: body.validUntil || body.expiresAt ? new Date(body.validUntil || body.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    return reply.status(201).send({ success: true, data: coupon });
  });

  // ==========================================
  // 12. SUPPORT & INCIDENT TICKETS
  // ==========================================
  fastify.get('/support/tickets', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

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

  fastify.post('/support/tickets', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any;
    const userAuth = (req as any).user;
    const ticket = await controlCenterService.createSupportTicket(body, userAuth.id);
    return reply.status(201).send({ success: true, data: ticket });
  });

  fastify.patch('/support/tickets/:id', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { status, internalNotes, assignee } = req.body as any;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status, internalNotes, assignee }
    });

    return reply.send({ success: true, data: ticket });
  });

  // ==========================================
  // 13. SECURITY AUDIT & SYSTEM HEALTH
  // ==========================================
  fastify.get('/security/audit-logs', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const where: any = {};
    if (query.resource) where.resource = query.resource;
    if (query.action) where.action = query.action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { id: true, name: true, email: true } } }
    });
    return reply.send({ success: true, count: logs.length, data: logs });
  });

  fastify.get('/system/health', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const health = await controlCenterService.getSystemHealth();
    return reply.send({ success: true, data: health });
  });

  fastify.post('/system/killswitch', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { action, restaurantId, reason } = req.body as { action: 'PAUSE_ALL' | 'RESTORE_ALL' | 'PAUSE_RESTAURANT'; restaurantId?: string; reason?: string };
    const userAuth = (req as any).user;

    if (action === 'PAUSE_RESTAURANT' && restaurantId) {
      await prisma.restaurant.update({ where: { id: restaurantId }, data: { isActive: false, status: 'SUSPENDED' } });
      realtimeHub.broadcastToAll({ event: 'RESTAURANT_STATUS_CHANGED', restaurantId, isActive: false, status: 'SUSPENDED', reason });
    } else if (action === 'PAUSE_ALL') {
      await prisma.restaurant.updateMany({ data: { isActive: false } });
      realtimeHub.broadcastToAll({ event: 'GLOBAL_KILLSWITCH_TRIGGERED', active: false, reason });
    } else if (action === 'RESTORE_ALL') {
      await prisma.restaurant.updateMany({ data: { isActive: true, status: 'ACTIVE' } });
      realtimeHub.broadcastToAll({ event: 'GLOBAL_KILLSWITCH_RESTORED', active: true });
    }

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: 'DINEDECK_SUPER_ADMIN',
      action: `system.killswitch.${action.toLowerCase()}`,
      resource: 'system',
      resourceId: restaurantId || 'global',
      after: { action, restaurantId, reason }
    });

    return reply.send({ success: true, message: `Killswitch action ${action} executed successfully` });
  });

  // ==========================================
  // 14. ORDERS COMMAND & DRILLDOWN
  // ==========================================
  fastify.get('/orders', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as any;
    const result = await controlCenterService.getOrders(query);
    return reply.send({ success: true, ...result });
  });

  fastify.get('/orders/:id', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const order = await controlCenterService.getOrderDetail(id);
    if (!order) return reply.status(404).send({ success: false, error: 'Order not found' });
    return reply.send({ success: true, data: order });
  });

  fastify.patch('/orders/:id/correct', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { status?: string; remarks: string };
    const userAuth = (req as any).user;
    if (!body.remarks) return reply.status(400).send({ success: false, error: 'Reason/remarks required for administrative correction.' });
    const updated = await controlCenterService.correctOrder(id, body, userAuth.id);
    return reply.send({ success: true, message: 'Order administratively corrected', data: updated });
  });

  // ==========================================
  // 15. ONBOARDING & APPROVALS QUEUE
  // ==========================================
  fastify.get('/approvals', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const queue = await controlCenterService.getApprovalsQueue();
    return reply.send({ success: true, data: queue });
  });

  fastify.post('/approvals/:id/review', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const userAuth = (req as any).user;
    const result = await controlCenterService.reviewApproval({
      approvalId: id,
      type: body.type,
      decision: body.decision,
      reason: body.reason || 'SuperAdmin review decision',
      targetId: body.targetId || id
    }, userAuth.id);
    return reply.send(result);
  });

  // ==========================================
  // 16. FINANCIAL RECONCILIATION ENGINE
  // ==========================================
  fastify.get('/reconciliation/exceptions', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const exceptions = await controlCenterService.getReconciliationExceptions();
    return reply.send({ success: true, data: exceptions });
  });

  fastify.post('/reconciliation/resolve', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { exceptionId: string; action: string; notes: string };
    const userAuth = (req as any).user;
    const result = await controlCenterService.resolveReconciliationException(body, userAuth.id);
    return reply.send(result);
  });

  // ==========================================
  // 17. RISK ASSESSMENT ENGINE
  // ==========================================
  fastify.get('/risk/analysis', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const analysis = await controlCenterService.getRestaurantRiskAnalysis();
    return reply.send({ success: true, count: analysis.length, data: analysis });
  });

  // ==========================================
  // 18. BULK OPERATIONS ENGINE
  // ==========================================
  fastify.post('/bulk/execute', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any;
    const userAuth = (req as any).user;
    const result = await controlCenterService.executeBulkOperation(body, userAuth.id);
    return reply.send(result);
  });

  // ==========================================
  // 19. DEVICE FLEET & HARDWARE INTEGRATIONS
  // ==========================================
  fastify.get('/devices', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const fleet = await controlCenterService.getDeviceFleet();
    return reply.send({ success: true, count: fleet.length, data: fleet });
  });

  fastify.post('/devices/:id/diagnostic', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { action } = req.body as { action: 'PING' | 'TEST_PRINT' | 'FORCE_LOGOUT' };
    const userAuth = (req as any).user;
    const result = await controlCenterService.triggerDeviceDiagnostic(id, action || 'PING', userAuth.id);
    return reply.send(result);
  });

  // ==========================================
  // 20. FEATURE FLAGS & CANARY ROLLOUT
  // ==========================================
  fastify.get('/feature-flags', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const flags = await controlCenterService.getFeatureFlags();
    return reply.send({ success: true, count: flags.length, data: flags });
  });

  fastify.patch('/feature-flags/:key', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { key } = req.params as { key: string };
    const body = req.body as any;
    const userAuth = (req as any).user;
    const result = await controlCenterService.updateFeatureFlag(key, body, userAuth.id);
    return reply.send(result);
  });

  // ==========================================
  // 21. CONFIGURATION VERSIONING & ROLLBACK
  // ==========================================
  fastify.get('/config-versions/:restaurantId', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { restaurantId } = req.params as { restaurantId: string };
    const result = await controlCenterService.getConfigVersions(restaurantId);
    return reply.send({ success: true, data: result });
  });

  fastify.post('/config-versions/:restaurantId/rollback', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { restaurantId } = req.params as { restaurantId: string };
    const { versionAuditId } = req.body as { versionAuditId: string };
    const userAuth = (req as any).user;
    const result = await controlCenterService.rollbackConfigVersion(restaurantId, versionAuditId, userAuth.id);
    return reply.send(result);
  });

  // ==========================================
  // 22. AUTHORITATIVE DATA EXPORTS
  // ==========================================
  fastify.get('/reports/export', { preHandler: [enforceAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as { entity?: any; format?: any };
    const entity = query.entity || 'FINANCIAL';
    const format = query.format || 'CSV';
    const data = await controlCenterService.exportPlatformData(entity, format);

    if (format === 'CSV') {
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="DINEDECK_${entity}_REPORT_${Date.now()}.csv"`);
      return reply.send(data);
    }
    return reply.send({ success: true, entity, data });
  });
}

