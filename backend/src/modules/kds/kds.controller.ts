import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { kdsService } from './kds.service.js';
import { iamService } from '../iam/iam.service.js';
import { PREDEFINED_REJECTION_REASONS } from '../../constants/orderRejection.js';

export const kdsRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // 1. Get Live KDS Queue (Multi-Station, ETA, SLA)
  server.get('/queue', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    if (!restaurantId && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(400).send({ success: false, message: 'restaurantId is required' });
    }

    const authRes = await iamService.authorize(userAuth, 'kds.view', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const queueData = await kdsService.getKdsQueue({
      restaurantId,
      stationCode: query.stationCode,
      statusFilter: query.status,
      priorityFilter: query.priority,
      searchQuery: query.search
    });

    return reply.send({ success: true, data: queueData });
  });

  // 2. Accept Order & Automatically Generate Station KOTs
  server.post('/orders/:id/accept', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = (request.body || {}) as any;
    const restaurantId = body.restaurantId || userAuth.restaurantId;

    const authRes = await iamService.authorize(userAuth, 'kds.orders.accept', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const result = await kdsService.acceptOrder(orderId, {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order accepted and station KOTs generated', data: result });
    } catch (err: any) {
      const isConflict = err.message?.includes('expired') || err.message?.includes('already been rejected') || err.message?.includes('cancelled');
      return reply.status(isConflict ? 409 : 400).send({ success: false, message: err.message });
    }
  });

  // 2b. List Predefined Rejection Reasons
  server.get('/rejection-reasons', async (_req, reply) => {
    return reply.send({
      success: true,
      data: PREDEFINED_REJECTION_REASONS
    });
  });

  // 3. Reject Order with Reason
  server.post('/orders/:id/reject', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = request.body as {
      reason?: string;
      reasonCode?: string;
      customReason?: string;
      restaurantId?: string;
    };

    const reasonCode = (body.reasonCode || '').trim().toUpperCase();
    let finalReason = (body.reason || '').trim();

    const predefined = PREDEFINED_REJECTION_REASONS.find(r => r.code === reasonCode);
    if (predefined) {
      finalReason = predefined.description;
    } else if (reasonCode === 'OTHER' || reasonCode === 'CUSTOM') {
      finalReason = (body.customReason || body.reason || '').trim();
      if (!finalReason || finalReason.length < 2) {
        return reply.status(400).send({
          success: false,
          message: 'Custom rejection reason is mandatory and must be at least 2 characters'
        });
      }
      if (finalReason.length > 250) {
        return reply.status(400).send({
          success: false,
          message: 'Custom rejection reason cannot exceed 250 characters'
        });
      }
    } else {
      if (!finalReason || finalReason.length < 2) {
        return reply.status(400).send({
          success: false,
          message: 'Rejection reason is mandatory and must be at least 2 characters'
        });
      }
    }

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'orders.cancel', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const order = await kdsService.rejectOrder(
        orderId,
        finalReason,
        {
          id: userAuth.id,
          name: userAuth.name,
          role: userAuth.role
        },
        reasonCode || 'CUSTOM'
      );
      return reply.send({ success: true, message: 'Order rejected', data: order });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 3b. Partially Accept / Reject Order with Individual Item Checkmarks
  server.post('/orders/:id/partial-decide', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = request.body as {
      itemDecisions: Array<{ itemId: string; accepted: boolean; rejectReason?: string }>;
      restaurantId?: string;
    };

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'kds.orders.accept', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const result = await kdsService.partiallyAcceptOrRejectOrder(orderId, body.itemDecisions || [], {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order items processed successfully', data: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 3c. Revert / Undo Accidental Order Acceptance
  server.post('/orders/:id/undo-accept', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = (request.body || {}) as { restaurantId?: string };

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'kds.orders.accept', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const result = await kdsService.undoOrderAcceptance(orderId, {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order acceptance successfully reverted to Placed state', data: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 4. Update Individual Item Status (Item-Level KDS)
  server.patch('/items/:id/status', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderItemId } = request.params as { id: string };
    const body = request.body as { status: any; restaurantId?: string };

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const requiredPerm = body.status === 'READY' ? 'orders.ready' : 'orders.prepare';

    const authRes = await iamService.authorize(userAuth, requiredPerm, { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const result = await kdsService.updateItemStatus(orderItemId, body.status, {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: `Item status updated to ${body.status}`, data: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 5. Order Hold / Resume
  server.post('/orders/:id/hold', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = request.body as { reason: string; restaurantId?: string };

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'orders.update', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const order = await kdsService.holdOrder(orderId, body.reason || 'Held by kitchen', {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order placed on hold', data: order });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  server.post('/orders/:id/resume', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = (request.body || {}) as any;

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'orders.update', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const order = await kdsService.resumeOrder(orderId, {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order preparation resumed', data: order });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 6. Re-Fire Ticket Generation
  server.post('/orders/:id/refire', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = request.body as { reason: string; itemIds?: string[]; restaurantId?: string };

    if (!body.reason || body.reason.trim().length < 2) {
      return reply.status(400).send({ success: false, message: 'Re-fire reason is mandatory' });
    }

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'orders.prepare', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const refireKot = await kdsService.refireOrder(orderId, body.reason, body.itemIds || [], {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Re-fire KOT ticket generated', data: refireKot });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 7. Recall Order
  server.post('/orders/:id/recall', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = request.body as { reason: string; restaurantId?: string };

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'orders.prepare', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const order = await kdsService.recallOrder(orderId, body.reason || 'Recalled by kitchen', {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order recalled to kitchen station', data: order });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 8. Expo Quality Pass & Ready
  server.post('/orders/:id/expo-pass', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = (request.body || {}) as any;

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'orders.ready', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const order = await kdsService.expoQualityCheck(orderId, {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order passed Expo check and is ready for pickup', data: order });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 9. Notify Waiter & Mark Served
  server.post('/orders/:id/notify-waiter', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id: orderId } = request.params as { id: string };
    const body = (request.body || {}) as any;

    try {
      const res = await kdsService.notifyWaiterForPickup(orderId, body.waiterId);
      return reply.send(res);
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  server.post('/orders/:id/served', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: orderId } = request.params as { id: string };
    const body = (request.body || {}) as any;

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'orders.serve', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const order = await kdsService.markOrderServed(orderId, {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'Order marked served to table', data: order });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 10. Toggle 86 (Unavailable)
  server.patch('/menu-items/:id/86', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: menuItemId } = request.params as { id: string };
    const body = request.body as { isAvailable: boolean; restaurantId?: string };

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'menu.availability.update', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const item = await kdsService.toggleItem86(menuItemId, body.isAvailable, {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: `Menu item availability updated to ${body.isAvailable}`, data: item });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 11. Reprint KOT Ticket
  server.post('/kots/:id/reprint', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: kotId } = request.params as { id: string };
    const body = request.body as { reason: string; restaurantId?: string };

    const restaurantId = body.restaurantId || userAuth.restaurantId;
    const authRes = await iamService.authorize(userAuth, 'kds.view', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    try {
      const res = await kdsService.reprintKot(kotId, body.reason || 'Kitchen reprint', {
        id: userAuth.id,
        name: userAuth.name,
        role: userAuth.role
      });
      return reply.send({ success: true, message: 'KOT reprinted successfully', data: res });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 12. Kitchen Analytics
  server.get('/analytics', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    const authRes = await iamService.authorize(userAuth, 'kds.analytics.read', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const analytics = await kdsService.getKitchenAnalytics(restaurantId);
    return reply.send({ success: true, data: analytics });
  });

  // 13. Stations & Settings
  server.get('/stations', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    const stations = await kdsService.getStations(restaurantId);
    return reply.send({ success: true, data: stations });
  });

  server.get('/settings', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    const settings = await kdsService.getSettings(restaurantId);
    return reply.send({ success: true, data: settings });
  });

  server.put('/settings', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const body = request.body as any;
    const restaurantId = body.restaurantId || userAuth.restaurantId;

    const authRes = await iamService.authorize(userAuth, 'settings.update', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const updated = await kdsService.updateSettings(restaurantId, body);
    return reply.send({ success: true, message: 'KDS settings updated', data: updated });
  });
};
