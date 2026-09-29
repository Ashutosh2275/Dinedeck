import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAllRecordsToZero() {
  console.log('🧹 [RESET] Cleaning all live operational records to 0 for fresh real restaurant usage...');

  try {
    // 1. Delete all KOT ticket items and tickets
    await prisma.kotTicketItem.deleteMany({});
    await prisma.kotTicket.deleteMany({});
    console.log('✓ Cleared all Kitchen KOT tickets and items.');

    // 2. Delete all bill payments and bills
    await prisma.payment.deleteMany({});
    await prisma.bill.deleteMany({});
    console.log('✓ Cleared all customer and table bills, settlements, and payments.');

    // 3. Delete all order items, history, and orders
    await prisma.orderItem.deleteMany({});
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.order.deleteMany({});
    console.log('✓ Cleared all active and historical dining orders.');

    // 4. Delete all active dining sessions and reset tables to unoccupied
    await prisma.diningSession.deleteMany({});
    await prisma.table.updateMany({
      data: {
        isOccupied: false
      }
    });
    console.log('✓ Reset all restaurant dining tables to clean UNOCCUPIED state.');

    // 5. Delete all guest service calls and staff shift logs
    await prisma.serviceRequest.deleteMany({});
    await prisma.cashierShift.deleteMany({});
    console.log('✓ Cleared all pending service requests and cashier shift logs.');

    console.log('\n🎉 [SUCCESS] All live records have been successfully reset to 0! Clean restaurant state active.');
  } catch (err) {
    console.error('❌ Error during operational data reset:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllRecordsToZero();
