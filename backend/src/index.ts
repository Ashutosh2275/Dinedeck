import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket } from 'ws';
import { ENV } from './config/env.js';
import { prisma } from './config/db.js';
import { authRoutes } from './modules/auth/auth.controller.js';
import { restaurantRoutes } from './modules/restaurants/restaurants.controller.js';
import { tableRoutes } from './modules/tables/tables.controller.js';
import { orderRoutes } from './modules/orders/orders.controller.js';
import { paymentRoutes } from './modules/payments/payments.controller.js';
import { serviceRequestRoutes } from './modules/service-requests/service-requests.controller.js';
import { staffRoutes } from './modules/staff/staff.controller.js';
import { adminRoutes } from './modules/admin/admin.controller.js';
import { bannerRoutes } from './modules/banners/banners.controller.js';
import { recommendationRoutes } from './modules/recommendations/recommendations.controller.js';
import { realtimeHub } from './realtime/websocket.js';
import { redisRealtime } from './realtime/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend FastifyInstance types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function buildServer() {
  const fastify = Fastify({
    logger: true
  });

  // CORS
  await fastify.register(cors, {
    origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Security & Hardening Headers
  fastify.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'SAMEORIGIN');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (ENV.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  });

  // JWT
  await fastify.register(jwt, {
    secret: ENV.JWT_SECRET
  });

  // Authentication Decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ success: false, message: 'Unauthorized: Invalid or missing token' });
    }
  });

  // WebSocket
  await fastify.register(websocket);

  // Serve Web Applications & Dashboards
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/'
  });

  // Swagger Documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'DINEDECK India Production API',
        description: 'Single source of truth REST & Realtime API for DINEDECK Customer App, Restaurant Staff, and Admin Platform',
        version: '1.0.0'
      },
      host: `localhost:${ENV.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json']
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // Realtime WebSocket Endpoint
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection: any, req: FastifyRequest) => {
      const socket: WebSocket = connection.socket || connection;
      const { userId, restaurantId, role } = req.query as {
        userId?: string;
        restaurantId?: string;
        role?: string;
      };

      const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      realtimeHub.registerClient({
        id: clientId,
        socket,
        userId,
        restaurantId,
        role
      });

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            event: 'CONNECTED',
            message: 'Connected to DINEDECK Realtime Engine',
            clientId
          })
        );
      }
    });
  });

  // Health Endpoint
  fastify.get('/health', async (req, reply) => {
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - dbStart;
      const redisStatus = redisRealtime.getStatus();

      return reply.send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: ENV.NODE_ENV,
        database: {
          status: 'connected',
          engine: 'PostgreSQL 16',
          latencyMs: dbLatencyMs
        },
        redis: {
          status: redisStatus.connected ? 'connected' : 'connecting_or_standalone',
          channel: redisStatus.channel
        },
        realtime: {
          activeConnections: realtimeHub.getActiveConnectionsCount()
        },
        timezone: 'Asia/Kolkata'
      });
    } catch (e: any) {
      return reply.status(503).send({
        status: 'degraded',
        error: e.message
      });
    }
  });

  // Root redirect to Dashboard
  fastify.get('/', async (req, reply) => {
    return reply.redirect('/dashboard/');
  });

  // Register API Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(restaurantRoutes, { prefix: '/api/restaurants' });
  await fastify.register(tableRoutes, { prefix: '/api/tables' });
  await fastify.register(orderRoutes, { prefix: '/api/orders' });
  await fastify.register(paymentRoutes, { prefix: '/api/payments' });
  await fastify.register(serviceRequestRoutes, { prefix: '/api/service-requests' });
  await fastify.register(staffRoutes, { prefix: '/api/staff' });
  await fastify.register(adminRoutes, { prefix: '/api/admin' });
  const { iamRoutes } = await import('./modules/iam/iam.controller.js');
  await fastify.register(iamRoutes, { prefix: '/api/iam' });
  const { kdsRoutes } = await import('./modules/kds/kds.controller.js');
  await fastify.register(kdsRoutes, { prefix: '/api/kds' });
  const { billingRoutes } = await import('./modules/billing/billing.controller.js');
  await fastify.register(billingRoutes, { prefix: '/api/billing' });
  await fastify.register(bannerRoutes, { prefix: '/api/banners' });
  await fastify.register(recommendationRoutes, { prefix: '/api/recommendations' });
  const { supportRoutes } = await import('./modules/support/support.controller.js');
  await fastify.register(supportRoutes, { prefix: '/api/support' });

  return fastify;

}

async function start() {
  const { iamService } = await import('./modules/iam/iam.service.js');
  await iamService.seedIamDefinitions().catch(err => console.error('[IAM] Seed warning:', err.message));

  const server = await buildServer();
  try {
    await server.listen({ port: ENV.PORT, host: ENV.HOST });
    console.log(`\n🚀 DINEDECK India Production Backend is running at http://${ENV.HOST}:${ENV.PORT}`);
    console.log(`📖 API Documentation available at http://${ENV.HOST}:${ENV.PORT}/docs`);
    console.log(`🖥️ Operations Dashboard at http://${ENV.HOST}:${ENV.PORT}/dashboard/`);
    console.log(`⚡ WebSocket stream available at ws://${ENV.HOST}:${ENV.PORT}/ws\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
