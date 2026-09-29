import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { billingService } from './billing.service.js';
import { iamService } from '../iam/iam.service.js';

export const billingRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // 1. Get Active Table Sessions & Running Bills
  server.get('/sessions', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    if (!restaurantId) {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    const authRes = await iamService.authorize(userAuth, 'billing.read', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const data = await billingService.getActiveTableSessions({
        restaurantId,
        branchId: query.branchId
      });
      return reply.send({ success: true, count: data.sessions.length, ...data });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 2. Get Live Bill for a specific Dining Session
  server.get('/sessions/:sessionId/bill', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { sessionId } = request.params as { sessionId: string };
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    if (!restaurantId) {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    const authRes = await iamService.authorize(userAuth, 'billing.read', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const data = await billingService.getTableSessionBill(sessionId, restaurantId);
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 3. Apply Discount
  server.post('/bills/:billId/discount', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { billId } = request.params as { billId: string };
    const body = request.body as any;

    const authRes = await iamService.authorize(userAuth, 'billing.discount', { restaurantId: body.restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const result = await billingService.applyDiscount({
        billId,
        discountType: body.discountType || 'PERCENTAGE',
        discountValue: Number(body.discountValue || 0),
        reason: body.reason,
        complimentaryReason: body.complimentaryReason,
        actor: { id: userAuth.id, name: userAuth.name, role: userAuth.role }
      });
      return reply.send({ success: true, message: 'Discount applied successfully', data: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 4. Settle Bill (Cash / UPI / Card / Split)
  server.post('/bills/:billId/settle', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { billId } = request.params as { billId: string };
    const body = request.body as any;

    const authRes = await iamService.authorize(userAuth, 'billing.settle', { restaurantId: body.restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const result = await billingService.settleBill({
        billId,
        method: body.method || 'CASH',
        amountPaid: Number(body.amountPaid),
        referenceNumber: body.referenceNumber,
        note: body.note,
        splitItems: body.splitItems,
        actor: { id: userAuth.id, name: userAuth.name, role: userAuth.role }
      });
      return reply.send({
        success: true,
        message: 'Bill settled successfully. Dining session closed and table reset to vacant.',
        data: result
      });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 5. Void Bill
  server.post('/bills/:billId/void', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { billId } = request.params as { billId: string };
    const body = request.body as any;

    const authRes = await iamService.authorize(userAuth, 'billing.refund', { restaurantId: body.restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    if (!body.reason || !body.reason.trim()) {
      return reply.status(400).send({ success: false, message: 'Mandatory void reason is required' });
    }

    try {
      const result = await billingService.voidBill({
        billId,
        reason: body.reason,
        actor: { id: userAuth.id, name: userAuth.name, role: userAuth.role }
      });
      return reply.send({ success: true, message: 'Bill voided successfully', data: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 6. Reprint Receipt
  server.post('/bills/:billId/reprint', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { billId } = request.params as { billId: string };
    const body = request.body as any;

    const authRes = await iamService.authorize(userAuth, 'billing.print', { restaurantId: body.restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const result = await billingService.reprintReceipt({
        billId,
        reason: body.reason || 'Customer request duplicate copy',
        actor: { id: userAuth.id, name: userAuth.name, role: userAuth.role }
      });
      return reply.send({ success: true, message: 'Receipt duplicate regenerated', data: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 7. Cashier KPIs
  server.get('/kpis', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    if (!restaurantId) {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    const authRes = await iamService.authorize(userAuth, 'billing.read', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const data = await billingService.getCashierKpis(restaurantId);
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 8. Bill History
  server.get('/history', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    if (!restaurantId) {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    const authRes = await iamService.authorize(userAuth, 'billing.read', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const data = await billingService.getBillingHistory({
        restaurantId,
        period: query.period || 'TODAY',
        search: query.search,
        paymentMethod: query.paymentMethod,
        paymentStatus: query.paymentStatus
      });
      return reply.send({ success: true, count: data.length, data });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 9. Shifts: Current Shift
  server.get('/shifts/current', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    if (!restaurantId) {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    try {
      const shift = await billingService.getCurrentShift(restaurantId);
      return reply.send({ success: true, data: shift });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 10. Shifts: Open Shift
  server.post('/shifts/open', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const body = request.body as any;
    const restaurantId = body.restaurantId || userAuth.restaurantId;

    if (!restaurantId) {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    try {
      const shift = await billingService.openShift({
        restaurantId,
        branchId: body.branchId,
        userId: userAuth.id,
        userName: userAuth.name || 'Cashier',
        openingCash: Number(body.openingCash || 0)
      });
      return reply.status(201).send({ success: true, message: 'Shift opened successfully', data: shift });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 11. Shifts: Cash In / Cash Out
  server.post('/shifts/cash-movement', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const body = request.body as any;

    try {
      const shift = await billingService.recordCashMovement({
        shiftId: body.shiftId,
        type: body.type || 'CASH_IN',
        amount: Number(body.amount || 0),
        notes: body.notes || 'Manual cash movement',
        actor: { id: userAuth.id, name: userAuth.name }
      });
      return reply.send({ success: true, message: 'Cash movement recorded', data: shift });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 12. Shifts: Close Shift
  server.post('/shifts/close', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const body = request.body as any;

    try {
      const shift = await billingService.closeShift({
        shiftId: body.shiftId,
        actualCash: Number(body.actualCash || 0),
        notes: body.notes,
        actor: { id: userAuth.id, name: userAuth.name }
      });
      return reply.send({ success: true, message: 'Shift closed successfully', data: shift });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });
};
