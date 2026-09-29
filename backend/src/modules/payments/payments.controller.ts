import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { paymentService } from './payment.service.js';
import { prisma } from '../../config/db.js';
import { realtimeHub } from '../../realtime/websocket.js';

const createPaymentSchema = z.object({
  billId: z.string(),
  method: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH']),
  amount: z.number().optional(),
  idempotencyKey: z.string().optional()
});

const verifyPaymentSchema = z.object({
  paymentId: z.string(),
  transactionRef: z.string(),
  gatewaySignature: z.string().optional(),
  gatewayPaymentId: z.string().optional()
});

export async function paymentRoutes(fastify: FastifyInstance) {
  // Get Bill Details (by Bill ID)
  fastify.get('/bill/:id', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    try {
      const data = await paymentService.getBillDetails(id);
      return reply.send({ success: true, data });
    } catch (e: any) {
      return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
    }
  });

  // Get Bill Details (by Order ID)
  fastify.get('/order/:orderId/bill', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { orderId } = req.params as { orderId: string };
    try {
      const bill = await prisma.bill.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      });
      if (!bill) {
        return reply.status(404).send({ success: false, message: 'No bill found for this order' });
      }
      const data = await paymentService.getBillDetails(bill.id);
      return reply.send({ success: true, data });
    } catch (e: any) {
      return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
    }
  });

  // Create Payment Intent
  fastify.post('/create', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = createPaymentSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const userAuth = (req as any).user;
    const { billId, method, amount, idempotencyKey } = parse.data;

    try {
      const result = await paymentService.createPaymentIntent({
        billId,
        method,
        amount,
        userId: userAuth?.id,
        idempotencyKey
      });
      return reply.status(201).send({
        success: true,
        message: 'Payment intent initialized',
        data: result
      });
    } catch (e: any) {
      return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
    }
  });

  // Verify Payment
  fastify.post('/verify', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = verifyPaymentSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { paymentId, transactionRef, gatewaySignature, gatewayPaymentId } = parse.data;

    try {
      const result = await paymentService.verifyPayment({
        paymentId,
        transactionRef,
        gatewaySignature,
        gatewayPaymentId
      });
      return reply.send({
        success: true,
        message: 'Payment verified and settled successfully in INR',
        data: result
      });
    } catch (e: any) {
      return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
    }
  });

  // Webhook Receiver for Gateway Callbacks
  fastify.post('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
    const signature = (req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'] || '') as string;
    const rawBody = JSON.stringify(req.body);

    try {
      const result = await paymentService.handleWebhook(rawBody, signature, req.body);
      return reply.send({ success: true, data: result });
    } catch (e: any) {
      return reply.status(e.statusCode || 500).send({ success: false, message: e.message });
    }
  });

  // Re-synchronization endpoint for client reconnects
  fastify.get('/sync', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { since, restaurantId } = req.query as { since?: string; restaurantId?: string };
    const userAuth = (req as any).user;

    const events = realtimeHub.getEventsSince(since, restaurantId, userAuth?.id);
    return reply.send({
      success: true,
      count: events.length,
      serverTime: new Date().toISOString(),
      data: events
    });
  });
}
