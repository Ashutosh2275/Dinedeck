import { PrismaClient } from '@prisma/client';
import { iamService } from '../src/modules/iam/iam.service.js';

const prisma = new PrismaClient();

async function resetAndCleanDatabase() {
  console.log('------------------------------------------------------------');
  console.log('🔄 STARTING COMPLETE DATABASE TRANSACTIONAL PURGE & CLEAN RESET');
  console.log('------------------------------------------------------------');

  // 1. Purge all operational and transactional records
  console.log('🗑️ Purging all operational orders, KOTs, bills, and payments...');
  await prisma.kotTicketItem.deleteMany({});
  await prisma.kotTicket.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.diningSession.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.cashierShift.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.restaurantSettlement.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.restaurant.deleteMany({
    where: {
      id: { not: { startsWith: 'rest_' } }
    }
  });

  console.log('✅ All transactional records purged. Zero orders, KOTs, and bills remain.');

  // 2. Clean up any temporary/test tables and reset all table occupancies to VACANT
  console.log('🪑 Purging duplicate/test tables and resetting all tables to VACANT...');
  await prisma.table.deleteMany({
    where: {
      id: { not: { startsWith: 'tbl_' } }
    }
  });
  await prisma.table.updateMany({
    data: {
      isOccupied: false
    }
  });

  // 3. Reset all menu items to Available (clear any 86 out-of-stock items)
  console.log('🍲 Resetting all menu items to available...');
  await prisma.menuItem.updateMany({
    data: {
      isAvailable: true
    }
  });

  // 4. Ensure Kitchen Stations and KDS Settings exist for all restaurants
  const allRestaurants = await prisma.restaurant.findMany();
  const defaultStations = [
    { code: 'MAIN', name: 'Main Kitchen', isExpo: false, displayOrder: 1 },
    { code: 'TANDOOR', name: 'Tandoor & Breads', isExpo: false, displayOrder: 2 },
    { code: 'CURRY', name: 'Curry & Gravy', isExpo: false, displayOrder: 3 },
    { code: 'GRILL', name: 'Charcoal Grill', isExpo: false, displayOrder: 4 },
    { code: 'BEVERAGE', name: 'Beverage Bar', isExpo: false, displayOrder: 5 },
    { code: 'DESSERT', name: 'Dessert Section', isExpo: false, displayOrder: 6 },
    { code: 'EXPO', name: 'Expo / Pass Station', isExpo: true, displayOrder: 7 }
  ];

  for (const r of allRestaurants) {
    for (const st of defaultStations) {
      await prisma.kitchenStation.upsert({
        where: { restaurantId_code: { restaurantId: r.id, code: st.code } },
        update: { name: st.name, isExpo: st.isExpo, displayOrder: st.displayOrder },
        create: {
          restaurantId: r.id,
          code: st.code,
          name: st.name,
          isExpo: st.isExpo,
          displayOrder: st.displayOrder,
          printerIp: '192.168.1.200:9100'
        }
      });
    }

    await prisma.kitchenKdsSetting.upsert({
      where: { restaurantId: r.id },
      update: {
        autoGenerateKot: true,
        autoPrintKot: false,
        defaultPrepTimeMinutes: 15,
        warningThresholdMinutes: 10,
        breachThresholdMinutes: 20,
        alertSoundEnabled: true,
        courseSequencingEnabled: true,
        requireExpoCheck: true
      },
      create: {
        restaurantId: r.id,
        autoGenerateKot: true,
        autoPrintKot: false,
        defaultPrepTimeMinutes: 15,
        warningThresholdMinutes: 10,
        breachThresholdMinutes: 20,
        alertSoundEnabled: true,
        courseSequencingEnabled: true,
        requireExpoCheck: true
      }
    });
  }

  // 5. Seed / Verify IAM Permissions and Staff Roles
  console.log('🛡️ Re-verifying IAM roles, staff accounts, and permission matrix...');
  await iamService.seedIamDefinitions();

  console.log('------------------------------------------------------------');
  console.log('🎉 PRISTINE SYSTEM RESET COMPLETE!');
  console.log('📊 Current Live Counts:');
  console.log('   - Restaurants:', await prisma.restaurant.count());
  console.log('   - Menu Items:', await prisma.menuItem.count());
  console.log('   - Tables:', await prisma.table.count(), '(All 100% Vacant)');
  console.log('   - Kitchen Stations:', await prisma.kitchenStation.count());
  console.log('   - Active Orders:', await prisma.order.count(), '(0 dummy orders)');
  console.log('   - KOT Tickets:', await prisma.kotTicket.count(), '(0 dummy KOTs)');
  console.log('   - Bills / Payments:', await prisma.bill.count(), '(0 dummy bills)');
  console.log('   - Service Requests:', await prisma.serviceRequest.count(), '(0 pending calls)');
  console.log('   - Cashier Shifts:', await prisma.cashierShift.count(), '(Fresh start)');
  console.log('------------------------------------------------------------');
}

resetAndCleanDatabase()
  .catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
