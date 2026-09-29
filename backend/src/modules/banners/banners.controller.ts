import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { realtimeHub } from '../../realtime/websocket.js';
import { z } from 'zod';

const BannerSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().min(5),
  badge: z.string().default('TRENDING'),
  tag: z.string().default("CHEF'S SPECIAL"),
  rating: z.string().default('4.9 ★ (1,400+)'),
  discountPercent: z.number().optional().default(20),
  imageUrl: z.string().url(),
  ctaText: z.string().default('Explore Specials'),
  ctaLink: z.string().optional().nullable(),
  restaurantId: z.string().optional().nullable(),
  displayOrder: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export const bannerRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // 1. Get all promotional banners (Public)
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { activeOnly } = request.query as { activeOnly?: string };
    const whereClause = activeOnly === 'false' ? {} : { isActive: true };

    const banners = await prisma.bannerPromotion.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' },
      include: {
        restaurant: {
          select: { id: true, name: true, slug: true, logoUrl: true }
        }
      }
    });

    return reply.send({ success: true, count: banners.length, data: banners });
  });

  // 2. Get single banner
  server.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const banner = await prisma.bannerPromotion.findUnique({
      where: { id },
      include: { restaurant: true }
    });

    if (!banner) {
      return reply.status(404).send({ success: false, message: 'Banner not found' });
    }

    return reply.send({ success: true, data: banner });
  });

  // 3. Create promotional banner (Admin / Partner)
  server.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = BannerSchema.parse(request.body);
      const banner = await prisma.bannerPromotion.create({
        data,
        include: {
          restaurant: { select: { id: true, name: true, slug: true } }
        }
      });

      realtimeHub.broadcastEvent('BANNER_UPDATED', { action: 'CREATED', banner });

      return reply.status(201).send({ success: true, message: 'Promotional banner created', data: banner });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 4. Update promotional banner
  server.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = BannerSchema.partial().parse(request.body);
      const updated = await prisma.bannerPromotion.update({
        where: { id },
        data,
        include: {
          restaurant: { select: { id: true, name: true, slug: true } }
        }
      });

      realtimeHub.broadcastEvent('BANNER_UPDATED', { action: 'UPDATED', banner: updated });

      return reply.send({ success: true, message: 'Promotional banner updated', data: updated });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 5. Toggle active status
  server.patch('/:id/toggle', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const banner = await prisma.bannerPromotion.findUnique({ where: { id } });
    if (!banner) {
      return reply.status(404).send({ success: false, message: 'Banner not found' });
    }

    const updated = await prisma.bannerPromotion.update({
      where: { id },
      data: { isActive: !banner.isActive }
    });

    realtimeHub.broadcastEvent('BANNER_UPDATED', { action: 'TOGGLED', banner: updated });

    return reply.send({ success: true, message: `Banner ${updated.isActive ? 'activated' : 'deactivated'}`, data: updated });
  });

  // 6. Delete banner
  server.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.bannerPromotion.delete({ where: { id } });

    realtimeHub.broadcastEvent('BANNER_UPDATED', { action: 'DELETED', id });

    return reply.send({ success: true, message: 'Promotional banner deleted' });
  });
};
