import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanResetData() {
  console.log('====================================================');
  console.log('DINEDECK — CLEAN DATA RESET ENGINE');
  console.log('====================================================');

  try {
    // 1. Transactional data clean
    console.log('Clearing transactional payments, bills, orders, KOTs, service requests...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`- Cleared ${deletedPayments.count} Payments`);

    const deletedBills = await prisma.bill.deleteMany({});
    console.log(`- Cleared ${deletedBills.count} Bills`);

    const deletedStatusHistory = await prisma.orderStatusHistory.deleteMany({});
    console.log(`- Cleared ${deletedStatusHistory.count} OrderStatusHistory records`);

    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`- Cleared ${deletedOrderItems.count} OrderItems`);

    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`- Cleared ${deletedOrders.count} Orders`);

    const deletedServiceRequests = await prisma.serviceRequest.deleteMany({});
    console.log(`- Cleared ${deletedServiceRequests.count} ServiceRequests`);

    const deletedSessions = await prisma.diningSession.deleteMany({});
    console.log(`- Cleared ${deletedSessions.count} DiningSessions`);

    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`- Cleared ${deletedNotifications.count} Notifications`);

    // 2. Reset operational table states -> VACANT
    console.log('Resetting all tables to VACANT (isOccupied = false)...');
    const updatedTables = await prisma.table.updateMany({
      data: {
        isOccupied: false
      }
    });
    console.log(`- Reset ${updatedTables.count} Tables to VACANT`);

    // 3. Verify Master & IAM Integrity
    const restaurants = await prisma.restaurant.findMany({
      include: {
        branches: {
          include: {
            tables: true
          }
        },
        categories: {
          include: {
            items: true
          }
        },
        staff: true
      }
    });

    console.log(`\nVerified ${restaurants.length} Master Restaurants:`);
    for (const r of restaurants) {
      const tableCount = r.branches.reduce((acc, b) => acc + b.tables.length, 0);
      const itemCount = r.categories.reduce((acc, c) => acc + c.items.length, 0);
      console.log(`  ✓ [${r.id}] ${r.name} (${r.status}) - ${r.branches.length} Branches, ${tableCount} Tables, ${itemCount} Menu Items, ${r.staff.length} Staff`);
    }

    const rolesCount = await prisma.role.count();
    const permissionsCount = await prisma.permission.count();
    const usersCount = await prisma.user.count();

    console.log(`\nVerified IAM Master Architecture:`);
    console.log(`  ✓ System Roles: ${rolesCount}`);
    console.log(`  ✓ Granular Permissions: ${permissionsCount}`);
    console.log(`  ✓ Registered Test Users: ${usersCount}`);

    // Verify Active Transactions Count is exactly ZERO
    const activeOrders = await prisma.order.count();
    const activeBills = await prisma.bill.count();
    const activeService = await prisma.serviceRequest.count();
    const occupiedTables = await prisma.table.count({ where: { isOccupied: true } });

    console.log(`\nOperational State Verification:`);
    console.log(`  ✓ Active Orders: ${activeOrders}`);
    console.log(`  ✓ Active Bills: ${activeBills}`);
    console.log(`  ✓ Active Service Calls: ${activeService}`);
    console.log(`  ✓ Occupied Tables: ${occupiedTables}`);

    if (activeOrders === 0 && activeBills === 0 && activeService === 0 && occupiedTables === 0) {
      console.log('\n>>> CLEAN DATA RESET COMPLETE: ALL SYSTEMS READY FOR PRODUCTION TRIAL <<<');
    } else {
      throw new Error('Non-zero transactional records remaining after reset');
    }
  } catch (error) {
    console.error('Data reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanResetData();
