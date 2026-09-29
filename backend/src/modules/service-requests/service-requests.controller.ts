import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { realtimeHub } from '../../realtime/websocket.js';

const createRequestSchema = z.object({
  restaurantId: z.string(),
  sessionId: z.string().optional(),
  tableNumber: z.string(),
  type: z.enum(['CALL_WAITER', 'WATER', 'NAPKINS', 'REQUEST_BILL', 'GENERAL']),
  notes: z.string().optional()
});

export async function serviceRequestRoutes(fastify: FastifyInstance) {
  // Create Service Request
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = createRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.errors });
    }
    const { restaurantId, sessionId, tableNumber, type, notes } = parse.data;
    const userAuth = (req as any).user;

    const serviceReq = await prisma.serviceRequest.create({
      data: {
        restaurantId,
        sessionId: sessionId || null,
        userId: userAuth.id,
        tableNumber,
        type,
        status: 'PENDING',
        notes: notes || null
      }
    });

    // Notify Restaurant Staff over WebSocket
    realtimeHub.notifyRestaurantStaff(restaurantId, 'SERVICE_REQUEST_CREATED', {
      id: serviceReq.id,
      tableNumber: serviceReq.tableNumber,
      type: serviceReq.type,
      status: serviceReq.status,
      notes: serviceReq.notes,
      createdAt: serviceReq.createdAt
    });

    return reply.status(201).send({
      success: true,
      message: 'Staff request notified to table captain',
      data: serviceReq
    });
  });

  // Get active requests
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;
    const requests = await prisma.serviceRequest.findMany({
      where: { userId: userAuth.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return reply.send({
      success: true,
      data: requests
    });
  });
}
