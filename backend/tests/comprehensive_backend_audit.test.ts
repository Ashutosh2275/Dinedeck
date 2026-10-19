import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/config/db.js';

const BASE_URL = 'http://127.0.0.1:8080';

async function fetchJson(url: string, options: RequestInit = {}): Promise<{ status: number; data: any; durationMs: number }> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const durationMs = performance.now() - start;
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data, durationMs };
  } catch (e: any) {
    const durationMs = performance.now() - start;
    return { status: 0, data: { error: e.message }, durationMs };
  }
}

describe('DINEDECK Authoritative Backend Audit & API Verification Master Suite', () => {
  let superAdminToken = '';
  let ownerToken = '';
  let chefToken = '';
  let captainToken = '';
  let cashierToken = '';
  let customer1Token = '';
  let customer1Id = '';
  let customer2Token = '';
  let customer2Id = '';
  let otherOwnerToken = '';

  const punjabRestId = 'rest_punjab_heritage';
  const peshawariRestId = 'rest_peshawari_grill';

  beforeAll(async () => {
    // 1. Super Admin Authentication
    const saLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'superadmin@dinedeck.in', password: 'Dinedeck@2026' })
    });
    expect(saLogin.status).toBe(200);
    superAdminToken = saLogin.data?.data?.accessToken;

    // 2. Punjab Owner Authentication
    const ownerLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'owner.punjab@dinedeck.in', password: 'Dinedeck@2026' })
    });
    expect(ownerLogin.status).toBe(200);
    ownerToken = ownerLogin.data?.data?.accessToken;

    // 3. Head Chef Authentication (Vikram Rawat)
    const chefLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'chef.vikram@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    expect(chefLogin.status).toBe(200);
    chefToken = chefLogin.data?.data?.accessToken;

    // 4. Senior Captain Authentication (Rohan Malhotra)
    const captainLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'captain.bkc@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    expect(captainLogin.status).toBe(200);
    captainToken = captainLogin.data?.data?.accessToken;

    // 5. Cashier Authentication (Priya Joshi)
    const cashierLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'cashier.priya@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    expect(cashierLogin.status).toBe(200);
    cashierToken = cashierLogin.data?.data?.accessToken;

    // 6. Customer 1 Authentication (Alex Vance)
    const cust1Login = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
    });
    expect(cust1Login.status).toBe(200);
    customer1Token = cust1Login.data?.data?.accessToken;
    customer1Id = cust1Login.data?.data?.user?.id;

    // 7. Customer 2 Registration / Authentication (Priya Sharma)
    const cust2Email = `audit.diner.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@example.in`;
    const cust2Phone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const cust2Reg = await fetchJson(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: cust2Email,
        password: 'Dinedeck@2026',
        phone: cust2Phone
      })
    });
    expect(cust2Reg.status).toBe(201);
    customer2Token = cust2Reg.data?.data?.accessToken;
    customer2Id = cust2Reg.data?.data?.user?.id;

    // 8. Other Restaurant Owner (Peshawari Grill)
    const otherLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'owner.peshawari@dinedeck.in', password: 'Dinedeck@2026' })
    });
    expect(otherLogin.status).toBe(200);
    otherOwnerToken = otherLogin.data?.data?.accessToken;

    // 9. Ensure Punjab restaurant is Active for testing
    await fetchJson(`${BASE_URL}/api/admin/restaurants/${punjabRestId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ isActive: true })
    });
  });

  // =========================================================================
  // SECTION 1: PUBLIC & DISCOVERY ENDPOINTS
  // =========================================================================
  describe('1. Public & Discovery Endpoints', () => {
    it('GET /health returns 200 with db and redis health status', async () => {
      const res = await fetchJson(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('healthy');
      expect(res.data.database.engine).toBe('PostgreSQL 16');
      expect(res.data.timezone).toBe('Asia/Kolkata');
    });

    it('GET /api/restaurants returns catalog of active restaurants', async () => {
      const res = await fetchJson(`${BASE_URL}/api/restaurants`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
    });

    it('GET /api/restaurants/:id returns individual restaurant profile', async () => {
      const res = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toContain('Punjab Heritage');
      expect(res.data.data.cgstRatePercent).toBe(2.5);
      expect(res.data.data.sgstRatePercent).toBe(2.5);
    });

    it('GET /api/restaurants/:id/menu returns categorized menu with active items', async () => {
      const res = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}/menu`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.categories)).toBe(true);
      expect(res.data.categories.length).toBeGreaterThan(0);
      const firstCat = res.data.categories[0];
      expect(firstCat.items.length).toBeGreaterThan(0);
      expect(typeof firstCat.items[0].price).toBe('number');
    });

    it('GET /api/recommendations scores restaurants by location & dietary preferences', async () => {
      const res = await fetchJson(`${BASE_URL}/api/recommendations?lat=19.0760&lng=72.8777&pureVeg=false&limit=5`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data[0]).toHaveProperty('matchScorePercent');
      expect(res.data.data[0]).toHaveProperty('distanceKm');
    });

    it('GET /api/banners returns active promotional banners', async () => {
      const res = await fetchJson(`${BASE_URL}/api/banners`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('GET /api/support/articles returns searchable knowledgebase articles', async () => {
      const res = await fetchJson(`${BASE_URL}/api/support/articles?q=printer`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.count).toBeGreaterThan(0);
      expect(res.data.data[0].title).toContain('Printer');
    });
  });

  // =========================================================================
  // SECTION 2: AUTHENTICATION, IAM & SECURITY BOUNDARIES
  // =========================================================================
  describe('2. Authentication & Authorization Boundaries', () => {
    it('Protected routes reject requests missing Authorization header with 401', async () => {
      const ordersRes = await fetchJson(`${BASE_URL}/api/orders`);
      expect(ordersRes.status).toBe(401);

      const staffRes = await fetchJson(`${BASE_URL}/api/staff/overview`);
      expect(staffRes.status).toBe(401);

      const kdsRes = await fetchJson(`${BASE_URL}/api/kds/queue`);
      expect(kdsRes.status).toBe(401);

      const billingRes = await fetchJson(`${BASE_URL}/api/billing/sessions`);
      expect(billingRes.status).toBe(401);

      const adminRes = await fetchJson(`${BASE_URL}/api/admin/metrics`);
      expect(adminRes.status).toBe(401);
    });

    it('Protected routes reject invalid or malformed tokens with 401', async () => {
      const res = await fetchJson(`${BASE_URL}/api/staff/overview`, {
        headers: { Authorization: 'Bearer this.is.a.bad.token' }
      });
      expect(res.status).toBe(401);
    });

    it('Customer token cannot access Super Admin endpoints (403 Forbidden)', async () => {
      const res = await fetchJson(`${BASE_URL}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${customer1Token}` }
      });
      expect(res.status).toBe(403);
    });

    it('Customer token cannot access Restaurant Staff operations (403 Forbidden)', async () => {
      const res = await fetchJson(`${BASE_URL}/api/staff/overview?restaurantId=${punjabRestId}`, {
        headers: { Authorization: `Bearer ${customer1Token}` }
      });
      expect(res.status).toBe(403);
    });

    it('Customer token cannot modify promotional banners (403 Forbidden)', async () => {
      const res = await fetchJson(`${BASE_URL}/api/banners`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify({
          title: 'Hacked Banner',
          subtitle: 'Unauthorized modification attempt',
          imageUrl: 'https://example.com/hacked.png'
        })
      });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SECTION 3: CROSS-TENANT ISOLATION & PRIVACY LEAK PREVENTION
  // =========================================================================
  describe('3. Cross-Tenant Isolation & Customer Privacy Enforcement', () => {
    let orderByCust1Id = '';

    it('Setup: Customer 1 creates an order at Punjab Heritage', async () => {
      const menuRes = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}/menu`);
      const testItem = menuRes.data.categories[0].items[0];

      const orderRes = await fetchJson(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify({
          restaurantId: punjabRestId,
          tableNumber: 'T-14',
          items: [
            {
              menuItemId: testItem.id,
              name: testItem.name,
              quantity: 2,
              unitPrice: testItem.price
            }
          ],
          specialNotes: 'Confidential order by Customer 1'
        })
      });

      expect(orderRes.status).toBe(201);
      orderByCust1Id = orderRes.data.data.orderId;
      expect(orderByCust1Id).toBeDefined();
    });

    it('Customer 2 CANNOT view Customer 1 order by ID (403 Forbidden)', async () => {
      const res = await fetchJson(`${BASE_URL}/api/orders/${orderByCust1Id}`, {
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      expect(res.status).toBe(403);
    });

    it('Customer 2 querying GET /api/orders?restaurantId=... only sees their OWN orders', async () => {
      const res = await fetchJson(`${BASE_URL}/api/orders?restaurantId=${punjabRestId}`, {
        headers: { Authorization: `Bearer ${customer2Token}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.count).toBe(0);
    });

    it('Owner of Restaurant B (Peshawari) CANNOT access Restaurant A orders (403 Forbidden)', async () => {
      const res = await fetchJson(`${BASE_URL}/api/orders/${orderByCust1Id}`, {
        headers: { Authorization: `Bearer ${otherOwnerToken}` }
      });
      expect(res.status).toBe(403);
    });

    it('Owner of Restaurant B CANNOT patch Menu of Restaurant A (403 Forbidden)', async () => {
      const menuRes = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}/menu`);
      const punjabItem = menuRes.data.categories[0].items[0];

      const res = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}/menu/items/${punjabItem.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${otherOwnerToken}` },
        body: JSON.stringify({ price: 9999 })
      });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SECTION 4: THE GOLDEN DINE-IN CYCLE (UNMOCKED REAL-TIME LIFECYCLE)
  // =========================================================================
  describe('4. The Golden Dine-In Cycle End-to-End Execution', () => {
    let sessionToken = '';
    let sessionId = '';
    let tableNumber = '';
    let qrToken = '';
    let cycleOrderId = '';
    let cycleBillId = '';
    let item1Id = '';
    let item1Price = 0;
    let initialGrandTotal = 0;

    it('Step 1: Discover permanent QR token for Table & validate table', async () => {
      const tablesRes = await fetchJson(`${BASE_URL}/api/tables?restaurantId=${punjabRestId}`);
      expect(tablesRes.status).toBe(200);
      expect(tablesRes.data.data.length).toBeGreaterThan(0);
      const targetTable = tablesRes.data.data.find((t: any) => t.tableNumber === 'T-8') || tablesRes.data.data[0];
      tableNumber = targetTable.tableNumber;
      qrToken = targetTable.qrCodeToken;

      // Close any leftover active sessions on this table so the test starts with a clean slate
      await prisma.diningSession.updateMany({
        where: { tableId: targetTable.id, status: 'ACTIVE' },
        data: { status: 'COMPLETED' }
      });

      expect(qrToken).toBeDefined();

      const valRes = await fetchJson(`${BASE_URL}/api/tables/validate`, {
        method: 'POST',
        body: JSON.stringify({ qrToken })
      });
      expect(valRes.status).toBe(200);
      expect(valRes.data.success).toBe(true);
      expect(valRes.data.data.tableNumber).toBe(tableNumber);
      expect(valRes.data.data.assignedServer).toBeDefined();
    });

    it('Step 2: Start Customer Dining Session on Table', async () => {
      const sessRes = await fetchJson(`${BASE_URL}/api/tables/session`, {
        method: 'POST',
        body: JSON.stringify({
          qrToken,
          userId: customer1Id
        })
      });
      expect(sessRes.status).toBe(200);
      expect(sessRes.data.success).toBe(true);
      sessionId = sessRes.data.data.sessionId;
      sessionToken = sessRes.data.data.sessionToken;
      expect(sessionId).toBeDefined();
    });

    it('Step 3: Submit Customer Order with Customizations & Tax Calculation', async () => {
      const menuRes = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}/menu`);
      const cat = menuRes.data.categories[0];
      const item = cat.items[0];
      item1Id = item.id;
      item1Price = item.price;

      const placeRes = await fetchJson(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify({
          restaurantId: punjabRestId,
          sessionId,
          tableNumber,
          items: [
            {
              menuItemId: item1Id,
              name: item.name,
              quantity: 2,
              unitPrice: item1Price
            }
          ],
          specialNotes: 'Extra spicy, please speed up'
        })
      });

      expect(placeRes.status).toBe(201);
      expect(placeRes.data.success).toBe(true);
      cycleOrderId = placeRes.data.data.orderId;
      cycleBillId = placeRes.data.data.billId;
      initialGrandTotal = placeRes.data.data.totalAmount;

      // Verify exact India GST calculations (2.5% CGST + 2.5% SGST + 5.0% Service Charge)
      const subtotal = item1Price * 2;
      const expectedCgst = Number((subtotal * 0.025).toFixed(2));
      const expectedSgst = Number((subtotal * 0.025).toFixed(2));
      const expectedSc = Number((subtotal * 0.05).toFixed(2));
      const expectedTotal = Math.round(subtotal + expectedCgst + expectedSgst + expectedSc);

      expect(placeRes.data.data.subtotal).toBe(subtotal);
      expect(placeRes.data.data.cgstAmount).toBe(expectedCgst);
      expect(placeRes.data.data.sgstAmount).toBe(expectedSgst);
      expect(placeRes.data.data.serviceCharge).toBe(expectedSc);
      expect(placeRes.data.data.totalAmount).toBe(expectedTotal);
    });

    it('Step 4: Kitchen receives order in KDS and Chef Accepts Order (Auto-KOT generation)', async () => {
      const acceptRes = await fetchJson(`${BASE_URL}/api/kds/orders/${cycleOrderId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${chefToken}` },
        body: JSON.stringify({ restaurantId: punjabRestId })
      });
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.data.success).toBe(true);
      expect(acceptRes.data.data.kots.length).toBeGreaterThanOrEqual(1);
    });

    it('Step 5: Kitchen station marks items PREPARING and READY', async () => {
      const orderDetail = await fetchJson(`${BASE_URL}/api/orders/${cycleOrderId}`, {
        headers: { Authorization: `Bearer ${chefToken}` }
      });
      expect(orderDetail.status).toBe(200);
      const orderItem = orderDetail.data.data.items[0];

      const prepRes = await fetchJson(`${BASE_URL}/api/kds/items/${orderItem.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${chefToken}` },
        body: JSON.stringify({ status: 'PREPARING', restaurantId: punjabRestId })
      });
      expect(prepRes.status).toBe(200);

      const readyRes = await fetchJson(`${BASE_URL}/api/kds/items/${orderItem.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${chefToken}` },
        body: JSON.stringify({ status: 'READY', restaurantId: punjabRestId })
      });
      expect(readyRes.status).toBe(200);
    });

    it('Step 6: Expeditor passes Expo Quality Check and marks order SERVED', async () => {
      const expoRes = await fetchJson(`${BASE_URL}/api/kds/orders/${cycleOrderId}/expo-pass`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${chefToken}` },
        body: JSON.stringify({ restaurantId: punjabRestId })
      });
      expect(expoRes.status).toBe(200);
      expect(expoRes.data.data.status).toBe('READY');

      const servedRes = await fetchJson(`${BASE_URL}/api/kds/orders/${cycleOrderId}/served`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${captainToken}` },
        body: JSON.stringify({ restaurantId: punjabRestId })
      });
      expect(servedRes.status).toBe(200);
      expect(servedRes.data.data.status).toBe('SERVED');
    });

    it('Step 7: Cashier applies 10% Discount to the Bill', async () => {
      const discRes = await fetchJson(`${BASE_URL}/api/billing/bills/${cycleBillId}/discount`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({
          restaurantId: punjabRestId,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          reason: 'Happy Hours Guest Discount'
        })
      });
      expect(discRes.status).toBe(200);
      expect(discRes.data.success).toBe(true);
      expect(discRes.data.data.calculation.discountAmount).toBeGreaterThan(0);
      expect(discRes.data.data.calculation.grandTotal).toBeLessThan(initialGrandTotal);
    });

    it('Step 8: Customer initializes Sandbox Payment Intent', async () => {
      const intentRes = await fetchJson(`${BASE_URL}/api/payments/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify({
          billId: cycleBillId,
          method: 'UPI',
          idempotencyKey: `idem_pay_${cycleBillId}_${Date.now()}`
        })
      });
      expect(intentRes.status).toBe(201);
      expect(intentRes.data.success).toBe(true);
      expect(intentRes.data.data.paymentId).toBeDefined();
      expect(intentRes.data.data.transactionRef).toBeDefined();

      // Step 9: Verify Payment Verification & Atomic Settlement
      const verifyRes = await fetchJson(`${BASE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify({
          paymentId: intentRes.data.data.paymentId,
          transactionRef: intentRes.data.data.transactionRef
        })
      });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.data.success).toBe(true);
      expect(verifyRes.data.data.status).toBe('PAID');
    });

    it('Step 10: Cashier verifies settled bill status', async () => {
      const billDetail = await fetchJson(`${BASE_URL}/api/payments/bill/${cycleBillId}`, {
        headers: { Authorization: `Bearer ${cashierToken}` }
      });
      expect(billDetail.status).toBe(200);
      expect(billDetail.data.data.paymentStatus).toBe('PAID');
    });
  });

  // =========================================================================
  // SECTION 5: SUPER ADMIN CONTROL CENTER WORKFLOWS
  // =========================================================================
  describe('5. Super Admin Platform Control Workflows', () => {
    it('GET /api/admin/metrics returns consolidated multi-tenant platform KPIs', async () => {
      const res = await fetchJson(`${BASE_URL}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.totalRestaurants).toBeGreaterThan(0);
      expect(res.data.data.platformCommissionRevenue).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/admin/search finds restaurants across platform', async () => {
      const res = await fetchJson(`${BASE_URL}/api/admin/search?q=Punjab`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.restaurants.length).toBeGreaterThan(0);
    });

    it('POST /api/admin/settlements/generate generates payout ledger for restaurant', async () => {
      const res = await fetchJson(`${BASE_URL}/api/admin/settlements/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: JSON.stringify({ restaurantId: punjabRestId })
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.settlementNumber).toBeDefined();
      expect(res.data.data.netPayable).toBeDefined();
    });

    it('GET /api/admin/system/health returns detailed infrastructure diagnostics', async () => {
      const res = await fetchJson(`${BASE_URL}/api/admin/system/health`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe('HEALTHY');
      expect(res.data.data.dbLatencyMs).toBeDefined();
    });

    it('GET /api/admin/feature-flags returns platform canary toggles', async () => {
      const res = await fetchJson(`${BASE_URL}/api/admin/feature-flags`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 6: FAULT TOLERANCE, BOUNDARY & IDEMPOTENCY
  // =========================================================================
  describe('6. Fault Tolerance, Boundary & Idempotency', () => {
    it('Order placement with identical idempotencyKey returns existing order without duplication', async () => {
      const idemKey = `test_idem_${Date.now()}`;
      const menuRes = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}/menu`);
      const testItem = menuRes.data.categories[0].items[0];

      const payload = {
        restaurantId: punjabRestId,
        tableNumber: 'T-2',
        idempotencyKey: idemKey,
        items: [
          {
            menuItemId: testItem.id,
            name: testItem.name,
            quantity: 1,
            unitPrice: testItem.price
          }
        ]
      };

      const firstRes = await fetchJson(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify(payload)
      });
      expect(firstRes.status).toBe(201);
      const originalOrderId = firstRes.data.data.orderId;

      // Duplicate invocation
      const secondRes = await fetchJson(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify(payload)
      });
      expect(secondRes.status).toBe(200);
      expect(secondRes.data.message).toContain('already processed');
      expect(secondRes.data.data.id).toBe(originalOrderId);
    });

    it('Order placement with empty items array returns 400 Bad Request', async () => {
      const res = await fetchJson(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customer1Token}` },
        body: JSON.stringify({
          restaurantId: punjabRestId,
          tableNumber: 'T-2',
          items: []
        })
      });
      expect(res.status).toBe(400);
    });

    it('Requesting non-existent order returns 404 Not Found', async () => {
      const res = await fetchJson(`${BASE_URL}/api/orders/non-existent-order-id-9999`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      expect(res.status).toBe(404);
    });
  });
});
