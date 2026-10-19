import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeOperationalData() {
  console.log('--- Starting Complete Operational Test Data Wipeout ---');

  // 1. Delete KOT Ticket Items and KOT Tickets
  const kotItems = await prisma.kotTicketItem.deleteMany({});
  console.log(`Deleted ${kotItems.count} KOT ticket items.`);

  const kots = await prisma.kotTicket.deleteMany({});
  console.log(`Deleted ${kots.count} KOT tickets.`);

  // 2. Delete Order Status History and Order Items
  const histories = await prisma.orderStatusHistory.deleteMany({});
  console.log(`Deleted ${histories.count} order status history entries.`);

  const orderItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${orderItems.count} order items.`);

  // 3. Delete Payments
  const payments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${payments.count} payments.`);

  // 4. Delete Bills
  const bills = await prisma.bill.deleteMany({});
  console.log(`Deleted ${bills.count} bills.`);

  // 5. Delete Orders
  const orders = await prisma.order.deleteMany({});
  console.log(`Deleted ${orders.count} orders.`);

  // 6. Delete Dining Sessions
  const sessions = await prisma.diningSession.deleteMany({});
  console.log(`Deleted ${sessions.count} dining sessions.`);

  // 7. Reset all tables to unoccupied
  const tables = await prisma.table.updateMany({
    data: {
      isOccupied: false
    }
  });
  console.log(`Reset ${tables.count} tables to isOccupied: false.`);

  // 8. Delete Service Requests (test buzzes)
  const serviceRequests = await prisma.serviceRequest.deleteMany({});
  console.log(`Deleted ${serviceRequests.count} test service requests.`);

  // 9. Remove duplicate Angaari Paneer Tikka (Signature) items that had broken image links
  const duplicateMenuItems = await prisma.menuItem.deleteMany({
    where: {
      name: 'Angaari Paneer Tikka (Signature)'
    }
  });
  console.log(`Deleted ${duplicateMenuItems.count} duplicate Angaari Paneer Tikka (Signature) test menu items.`);

  // Verify remaining counts
  const [
    remainingOrders,
    remainingKots,
    remainingBills,
    remainingPayments,
    remainingSessions,
    occupiedTables,
    restaurantsCount,
    menuItemsCount,
    usersCount
  ] = await Promise.all([
    prisma.order.count(),
    prisma.kotTicket.count(),
    prisma.bill.count(),
    prisma.payment.count(),
    prisma.diningSession.count(),
    prisma.table.count({ where: { isOccupied: true } }),
    prisma.restaurant.count(),
    prisma.menuItem.count(),
    prisma.user.count()
  ]);

  console.log('--- Wipeout Complete & Clean Slate Verified ---');
  console.log({
    remainingOrders,
    remainingKots,
    remainingBills,
    remainingPayments,
    remainingSessions,
    occupiedTables,
    restaurantsCount,
    menuItemsCount,
    usersCount
  });
}

purgeOperationalData()
  .catch((e) => {
    console.error('Purge error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
