import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';

export async function restaurantRoutes(fastify: FastifyInstance) {
  // List Restaurants
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { city, cuisine, isPureVeg, search } = req.query as {
      city?: string;
      cuisine?: string;
      isPureVeg?: string;
      search?: string;
    };

    const whereClause: any = { isActive: true };

    if (city) {
      whereClause.city = { contains: city };
    }
    if (cuisine) {
      whereClause.cuisineType = { contains: cuisine };
    }
    if (isPureVeg === 'true') {
      whereClause.isPureVeg = true;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { cuisineType: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const restaurants = await prisma.restaurant.findMany({
      where: whereClause,
      orderBy: { rating: 'desc' }
    });

    return reply.send({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  });

  // Get Restaurant Details
  fastify.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: true,
        hours: true
      }
    });

    if (!restaurant) {
      return reply.status(404).send({ success: false, message: 'Restaurant not found' });
    }

    return reply.send({
      success: true,
      data: restaurant
    });
  });

  // Get Restaurant Dynamic Menu
  fastify.get('/:id/menu', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: id, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        items: {
          where: { isAvailable: true },
          include: {
            variants: true,
            addons: {
              include: { addon: true }
            }
          }
        }
      }
    });

    return reply.send({
      success: true,
      restaurantId: id,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        displayOrder: cat.displayOrder,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          discountedPrice: item.discountedPrice,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          isBestseller: item.isBestseller,
          spiceLevel: item.spiceLevel,
          preparationTime: item.preparationTime,
          variants: item.variants,
          addons: item.addons.map((a) => a.addon)
        }))
      }))
    });
  });

  // Update Menu Item (Price, Discount, Availability)
  fastify.patch('/:restaurantId/menu/items/:itemId', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { restaurantId, itemId } = req.params as { restaurantId: string; itemId: string };
    const { price, discountedPrice, isAvailable } = req.body as {
      price?: number;
      discountedPrice?: number;
      isAvailable?: boolean;
    };

    const updateData: any = {};
    if (price !== undefined) updateData.price = price;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: updateData
    });

    const { realtimeHub } = await import('../../realtime/websocket.js');
    realtimeHub.broadcastToRestaurant(restaurantId, {
      event: 'MENU_UPDATED',
      restaurantId,
      itemId,
      updatedFields: updateData
    });

    return reply.send({
      success: true,
      message: `Menu item '${item.name}' updated successfully`,
      data: item
    });
  });
}

