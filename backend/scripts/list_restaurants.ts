import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      phone: true,
      gstin: true,
      fssaiNumber: true
    }
  });
  console.log(`Total restaurants in DB: ${restaurants.length}`);
  console.log(JSON.stringify(restaurants, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
