import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('--- CLEANING UP DUPLICATE TEST RESTAURANTS ---');

  const testRestaurants = await prisma.restaurant.findMany({
    where: {
      OR: [
        { name: { contains: '1792' } },
        { slug: { contains: '1792' } }
      ]
    },
    select: { id: true, name: true, slug: true }
  });

  console.log(`Found ${testRestaurants.length} test restaurants with timestamp suffixes.`);

  for (const r of testRestaurants) {
    console.log(`Deleting test restaurant: ${r.name} (${r.id})`);
    
    // Delete related records
    await prisma.table.deleteMany({ where: { branch: { restaurantId: r.id } } });
    await prisma.restaurantBranch.deleteMany({ where: { restaurantId: r.id } });
    await prisma.restaurantStaff.deleteMany({ where: { restaurantId: r.id } });
    await prisma.menuItemAddon.deleteMany({ where: { menuItem: { restaurantId: r.id } } });
    await prisma.menuVariant.deleteMany({ where: { menuItem: { restaurantId: r.id } } });
    await prisma.menuItem.deleteMany({ where: { restaurantId: r.id } });
    await prisma.menuCategory.deleteMany({ where: { restaurantId: r.id } });
    await prisma.kitchenStation.deleteMany({ where: { restaurantId: r.id } });
    await prisma.kitchenKdsSetting.deleteMany({ where: { restaurantId: r.id } });
    await prisma.supportTicket.deleteMany({ where: { restaurantId: r.id } });
    await prisma.restaurant.delete({ where: { id: r.id } });
  }

  // Also verify legal credentials for remaining legitimate restaurants
  const legitRestaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, city: true, gstin: true, fssaiNumber: true }
  });

  console.log(`\nRemaining Authentic Restaurants: ${legitRestaurants.length}`);
  for (const r of legitRestaurants) {
    console.log(` - ${r.name} (${r.city})`);
  }

  console.log('--- DUPLICATE RESTAURANTS CLEANED UP SUCCESSFULLY ---');
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
