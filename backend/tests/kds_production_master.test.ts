import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { kdsService } from '../src/modules/kds/kds.service.js';
import { KdsEngine } from '../src/modules/kds/kds.engine.js';
import { iamService } from '../src/modules/iam/iam.service.js';

describe('DINEDECK KDS Engine & Multi-Station Production Master Suite', () => {
  let testRestaurantId: string;
  let testOrderId: string;
  let testOrderItemId: string;
  let testChefUser: any;
  let testWaiterUser: any;

  beforeAll(async () => {
    // Seed IAM definitions and default stations
    await iamService.seedIamDefinitions();

    const rest = await prisma.restaurant.findFirst({
      where: { id: 'rest_punjab_heritage' },
      include: { items: true }
    });

    if (!rest) {
      throw new Error('Test restaurant rest_punjab_heritage not found');
    }
    testRestaurantId = rest.id;

    // Create / get Chef user
    testChefUser = await prisma.user.findFirst({
      where: { email: 'chef@punjabheritage.com' }
    });
    if (!testChefUser) {
      testChefUser = await prisma.user.create({
        data: {
          email: 'chef@punjabheritage.com',
          name: 'Master Chef Gurpreet',
          passwordHash: 'dummy_hash',
          role: 'CHEF'
        }
      });
    }

    // Ensure staff role exists
    await prisma.userRole.upsert({
      where: { id: `role_chef_${testChefUser.id}` },
      update: {},
      create: {
        id: `role_chef_${testChefUser.id}`,
        userId: testChefUser.id,
        roleId: 'CHEF',
        restaurantId: testRestaurantId
      }
    });

    // Create a fresh test order with multiple items from different stations
    const item1 = rest.items[0];
    const item2 = rest.items[1] || item1;

    const freshOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-KDS-${Date.now()}`,
        restaurantId: testRestaurantId,
        tableNumber: '12',
        status: 'PLACED',
        priority: 'NORMAL',
        subtotal: item1.price * 2 + item2.price,
        cgstAmount: 15,
        sgstAmount: 15,
        serviceCharge: 20,
        totalAmount: item1.price * 2 + item2.price + 50,
        specialNotes: 'No peanuts please, Nut allergy for 1 guest. Extra crispy garlic naan.',
        items: {
          create: [
            {
              menuItemId: item1.id,
              name: item1.name,
              quantity: 2,
              unitPrice: item1.price,
              totalPrice: item1.price * 2,
              stationCode: 'CURRY',
              course: 'MAIN',
              status: 'QUEUED'
            },
            {
              menuItemId: item2.id,
              name: item2.name,
              quantity: 1,
              unitPrice: item2.price,
              totalPrice: item2.price,
              stationCode: 'TANDOOR',
              course: 'STARTER',
              status: 'QUEUED'
            }
          ]
        }
      },
      include: { items: true }
    });

    testOrderId = freshOrder.id;
    testOrderItemId = freshOrder.items[0].id;
  });

  // Test 1: Dynamic ETA & SLA Calculation
  it('1. KdsEngine calculates dynamic prep timing and SLA states accurately', () => {
    const eta = KdsEngine.calculateDynamicEta({
      items: [{ quantity: 2, preparationTime: 15 }, { quantity: 1, preparationTime: 20 }],
      activeKitchenOrdersCount: 4,
      priority: 'NORMAL'
    });

    expect(eta).toBeGreaterThanOrEqual(20);

    const slaEvaluation = KdsEngine.evaluateSlaStatus({
      createdAt: new Date(Date.now() - 5 * 60000), // 5 min ago
      dynamicEtaMinutes: 20,
      warningThresholdMinutes: 10
    });

    expect(slaEvaluation.slaStatus).toBe('ON_TRACK');
    expect(slaEvaluation.elapsedMinutes).toBe(5);
  });

  // Test 2: Item Station Routing & Course Detection
  it('2. KdsEngine automatically routes items to correct stations and courses', () => {
    expect(KdsEngine.routeItemToStation('Butter Chicken Makhani')).toBe('CURRY');
    expect(KdsEngine.routeItemToStation('Tandoori Garlic Naan')).toBe('TANDOOR');
    expect(KdsEngine.routeItemToStation('Melt-in-Mouth Galouti Kebab')).toBe('GRILL');
    expect(KdsEngine.routeItemToStation('Crispy Onion Pakoda')).toBe('FRY');
    expect(KdsEngine.routeItemToStation('Irani Dum Chai')).toBe('BEVERAGE');
    expect(KdsEngine.routeItemToStation('Kesar Pista Kulfi')).toBe('DESSERT');

    expect(KdsEngine.detectCourse('Paneer Tikka Starter')).toBe('STARTER');
    expect(KdsEngine.detectCourse('Hyderabadi Dum Biryani')).toBe('MAIN');
    expect(KdsEngine.detectCourse('Gulab Jamun')).toBe('DESSERT');
  });

  // Test 3: Allergy & Dietary Alert Extraction
  it('3. KdsEngine extracts high-priority dietary & allergy alerts from customer notes', () => {
    const alerts = KdsEngine.detectDietaryAlerts('Guest has severe nut and cashew allergy. Please make mild.', ['Butter Chicken']);
    expect(alerts).toContain('NUT_ALLERGY');
    expect(alerts).toContain('MILD_SPICE');
  });

  // Test 4: Accept Order & Auto KOT Generation
  it('4. Accepting order generates authoritative multi-station KOT tickets and advances order to PREPARING', async () => {
    const res = await kdsService.acceptOrder(testOrderId, {
      id: testChefUser.id,
      name: testChefUser.name,
      role: 'CHEF'
    });

    expect(res.order.status).toBe('PREPARING');
    expect(res.kots.length).toBeGreaterThanOrEqual(1);

    const dbKots = await prisma.kotTicket.findMany({
      where: { orderId: testOrderId },
      include: { items: true }
    });

    expect(dbKots.length).toBeGreaterThan(0);
    expect(dbKots[0].kotNumber).toMatch(/^KOT-/);
  });

  // Test 5: Live KDS Queue Retrieval
  it('5. getKdsQueue returns enriched ticket cards with table context, stations, and SLA badges', async () => {
    const queue = await kdsService.getKdsQueue({
      restaurantId: testRestaurantId,
      statusFilter: 'ACTIVE'
    });

    expect(queue.tickets.length).toBeGreaterThan(0);
    const targetTicket = queue.tickets.find(t => t.id === testOrderId);
    expect(targetTicket).toBeDefined();
    expect(targetTicket?.tableNumber).toBe('12');
    expect(targetTicket?.dietaryAlerts).toContain('NUT_ALLERGY');
    expect(queue.stations.length).toBeGreaterThan(0);
  });

  // Test 6: Item-Level Status Updates & Partial vs Full Ready Gating
  it('6. Item-level status toggles work independently and gates overall order completion', async () => {
    const orderBefore = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { items: true }
    });

    // Mark first item READY
    const update1 = await kdsService.updateItemStatus(orderBefore!.items[0].id, 'READY', {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(update1.allReady).toBe(false);

    // Order should still be PREPARING since second item is not ready
    const orderMid = await prisma.order.findUnique({ where: { id: testOrderId } });
    expect(orderMid?.status).toBe('PREPARING');

    // Mark second item READY
    const update2 = await kdsService.updateItemStatus(orderBefore!.items[1].id, 'READY', {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(update2.allReady).toBe(true);

    // Order should automatically advance to READY
    const orderFinal = await prisma.order.findUnique({ where: { id: testOrderId } });
    expect(orderFinal?.status).toBe('READY');
  });

  // Test 7: Hold and Resume Operations
  it('7. Hold and Resume pause and restore cooking state with audit records', async () => {
    const held = await kdsService.holdOrder(testOrderId, 'Guest requested 15 min delay for main course', {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(held.status).toBe('ON_HOLD');
    expect(held.holdReason).toContain('15 min delay');

    const resumed = await kdsService.resumeOrder(testOrderId, {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(resumed.status).toBe('PREPARING');
    expect(resumed.holdReason).toBeNull();
  });

  // Test 8: Re-Fire Ticket Workflow
  it('8. refireOrder generates linked RE-FIRE KOT ticket with priority escalation', async () => {
    const refireKot = await kdsService.refireOrder(
      testOrderId,
      'Naan got cold on table',
      [testOrderItemId],
      { id: testChefUser.id, name: testChefUser.name }
    );

    expect(refireKot.kotNumber).toContain('-RF');
    expect(refireKot.specialNotes).toContain('RE-FIRE');

    const order = await prisma.order.findUnique({ where: { id: testOrderId } });
    expect(order?.priority).toBe('RE_FIRE');
    expect(order?.status).toBe('RE_FIRE');
  });

  // Test 9: Recall Order back to Station
  it('9. recallOrder pulls order back to preparing state with recall notes', async () => {
    const recalled = await kdsService.recallOrder(testOrderId, 'Chef garnish correction', {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(recalled.status).toBe('PREPARING');
    expect(recalled.recallReason).toBe('Chef garnish correction');
  });

  // Test 10: Expo / Pass Quality Check
  it('10. expoQualityCheck verifies pass inspection and marks order ready for pickup', async () => {
    const expoChecked = await kdsService.expoQualityCheck(testOrderId, {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(expoChecked.status).toBe('READY');
    expect(expoChecked.expoCheckedAt).toBeDefined();
  });

  // Test 11: Notify Waiter & Mark Order Served
  it('11. notifyWaiter and markOrderServed complete the table delivery lifecycle', async () => {
    const notifyRes = await kdsService.notifyWaiterForPickup(testOrderId);
    expect(notifyRes.success).toBe(true);

    const servedOrder = await kdsService.markOrderServed(testOrderId, {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(servedOrder.status).toBe('SERVED');
    expect(servedOrder.servedAt).toBeDefined();
  });

  // Test 12: Item 86 (Out-of-Stock) Sync
  it('12. toggleItem86 immediately marks menu item unavailable for ordering', async () => {
    const rest = await prisma.restaurant.findFirst({
      where: { id: testRestaurantId },
      include: { items: true }
    });
    const item = rest!.items[0];

    const disabled = await kdsService.toggleItem86(item.id, false, {
      id: testChefUser.id,
      name: testChefUser.name
    });
    expect(disabled.isAvailable).toBe(false);

    const reEnabled = await kdsService.toggleItem86(item.id, true, {
      id: testChefUser.id,
      name: testChefUser.name
    });
    expect(reEnabled.isAvailable).toBe(true);
  });

  // Test 13: KOT Reprint & Thermal Slip Generation
  it('13. reprintKot increments reprint counter and produces ESC/POS thermal slip representation', async () => {
    const kot = await prisma.kotTicket.findFirst({
      where: { restaurantId: testRestaurantId }
    });

    const res = await kdsService.reprintKot(kot!.id, 'Kitchen duplicate slip', {
      id: testChefUser.id,
      name: testChefUser.name
    });

    expect(res.kot.reprintCount).toBeGreaterThan(0);
    expect(res.thermalSlip).toContain('KITCHEN ORDER TICKET (KOT)');
    expect(res.thermalSlip).toContain('REPRINT REASON: Kitchen duplicate slip');
  });

  // Test 14: Kitchen Analytics & Bottleneck Diagnosis
  it('14. getKitchenAnalytics computes orders/hr, SLA compliance %, and station bottleneck diagnosis', async () => {
    const analytics = await kdsService.getKitchenAnalytics(testRestaurantId);

    expect(analytics.slaCompliancePercent).toBeGreaterThanOrEqual(0);
    expect(analytics.stationUtilization.length).toBeGreaterThan(0);
    expect(analytics.bottleneckDiagnosis).toBeDefined();
  });
});
