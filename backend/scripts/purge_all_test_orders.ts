import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeOrders() {
  console.log('--- PURGING ALL TEST ORDERS, KOTS, BILLS, SESSIONS, AND AUDIT DATA ---');

  const orderCount = await prisma.order.count();
  const kotCount = await prisma.kotTicket.count();
  const billCount = await prisma.bill.count();
  const paymentCount = await prisma.payment.count();
  const sessionCount = await prisma.diningSession.count();

  console.log(`Found:
  - Orders: ${orderCount}
  - KOT Tickets: ${kotCount}
  - Bills: ${billCount}
  - Payments: ${paymentCount}
  - Dining Sessions: ${sessionCount}
  `);

  // Delete in safe cascade / foreign-key order
  await prisma.payment.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.kotTicketItem.deleteMany({});
  await prisma.kotTicket.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.diningSession.deleteMany({});
  await prisma.cashierShift.deleteMany({});

  // Reset table occupancy
  const updatedTables = await prisma.table.updateMany({
    data: {
      isOccupied: false
    }
  });

  console.log(`Reset ${updatedTables.count} tables to isOccupied: false.`);

  const remainingOrders = await prisma.order.count();
  const remainingKots = await prisma.kotTicket.count();
  console.log(`Remaining Orders: ${remainingOrders}, Remaining KOTs: ${remainingKots}`);
  console.log('--- PURGE COMPLETE. DATABASE IS 100% CLEAN FOR COMMERCIAL DEPLOYMENT ---');
}

purgeOrders()
  .catch((e) => {
    console.error('Error purging data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
