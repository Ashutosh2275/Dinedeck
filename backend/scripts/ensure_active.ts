import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setTenantsActive() {
  await prisma.restaurant.updateMany({
    where: { id: 'rest_punjab_heritage' },
    data: { status: 'ACTIVE', isActive: true }
  });

  console.log('Ensured rest_punjab_heritage is ACTIVE and enabled.');
  await prisma.$disconnect();
}

setTenantsActive();
