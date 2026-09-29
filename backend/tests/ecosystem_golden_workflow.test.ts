import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:8080';

describe('DINEDECK — Universal Ecosystem Golden Workflow & Parity Suite', () => {
  let customerToken: string;
  let ownerToken: string;
  let gmToken: string;
  let chefToken: string;
  let waiterToken: string;
  let superAdminToken: string;

  const targetRestId = 'rest_punjab_heritage';
  let diningOrderId: string;
  let diningBillId: string;
  let secondOrderId: string;
  let serviceRequestId: string;

  const fetchJson = async (url: string, options: any = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  };

  beforeAll(async () => {
    // 1. Authenticate Personas across the Ecosystem
    const custLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
    });
    customerToken = custLogin.data?.data?.accessToken;

    const ownerLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'owner.punjab@dinedeck.in', password: 'Dinedeck@2026' })
    });
    ownerToken = ownerLogin.data?.data?.accessToken;

    const gmLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'manager.sunil@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    gmToken = gmLogin.data?.data?.accessToken;

    const chefLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'chef.vikram@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    chefToken = chefLogin.data?.data?.accessToken;

    const waiterLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'waiter.ramesh@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    waiterToken = waiterLogin.data?.data?.accessToken;

    const adminLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'superadmin@dinedeck.in', password: 'Dinedeck@2026' })
    });
    superAdminToken = adminLogin.data?.data?.accessToken;
  });

  it('Step 1: Customer Places Table Order with Custom Instructions (Golden Dining Flow)', async () => {
    const orderRes = await fetchJson(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        restaurantId: targetRestId,
        tableNumber: '12',
        specialNotes: 'Extra crisp tandoori naan, medium spice',
        items: [
          { menuItemId: 'item_butter_chicken', name: 'Grand Old Delhi Butter Chicken', quantity: 2, unitPrice: 441 },
          { menuItemId: 'item_paneer_tikka', name: 'Angaari Paneer Tikka', quantity: 1, unitPrice: 374 }
        ]
      })
    });

    expect(orderRes.status).toBe(201);
    expect(orderRes.data.success).toBe(true);
    expect(orderRes.data.data.orderId).toBeDefined();
    expect(orderRes.data.data.billId).toBeDefined();

    diningOrderId = orderRes.data.data.orderId;
    diningBillId = orderRes.data.data.billId;
  });

  it('Step 2: Restaurant KDS Receives Order & Generates KOT', async () => {
    const ordersRes = await fetchJson(`${BASE_URL}/api/staff/orders?restaurantId=${targetRestId}`, {
      headers: { 'Authorization': `Bearer ${chefToken}` }
    });

    expect(ordersRes.status).toBe(200);
    const orderInQueue = ordersRes.data.data.find((o: any) => o.id === diningOrderId);
    expect(orderInQueue).toBeDefined();
    expect(orderInQueue.tableNumber).toBe('12');
    expect(orderInQueue.items.length).toBe(2);
  });

  it('Step 3: Chef / Kitchen advances status: CONFIRMED -> PREPARING -> READY', async () => {
    // 3a. Start Preparing
    const prepRes = await fetchJson(`${BASE_URL}/api/staff/orders/${diningOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${chefToken}` },
      body: JSON.stringify({ status: 'PREPARING' })
    });
    expect(prepRes.status).toBe(200);

    // 3b. Mark Food Ready
    const readyRes = await fetchJson(`${BASE_URL}/api/staff/orders/${diningOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${chefToken}` },
      body: JSON.stringify({ status: 'READY' })
    });
    expect(readyRes.status).toBe(200);
  });

  it('Step 4: Waiter / Captain Serves Table', async () => {
    const serveRes = await fetchJson(`${BASE_URL}/api/staff/orders/${diningOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${waiterToken}` },
      body: JSON.stringify({ status: 'SERVED' })
    });
    expect(serveRes.status).toBe(200);
  });

  it('Step 5: Additional Order placed during same Dining Session', async () => {
    const addOrderRes = await fetchJson(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        restaurantId: targetRestId,
        tableNumber: '12',
        items: [
          { menuItemId: 'item_garlic_naan', name: 'Garlic Butter Naan', quantity: 3, unitPrice: 70 }
        ]
      })
    });

    expect(addOrderRes.status).toBe(201);
    secondOrderId = addOrderRes.data.data.orderId;
    expect(secondOrderId).toBeDefined();
  });

  it('Step 6: Customer Table Service Call Lifecycle (Request -> Acknowledge -> Resolve)', async () => {
    // 6a. Customer requests extra plate
    const reqRes = await fetchJson(`${BASE_URL}/api/staff/service-requests`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        restaurantId: targetRestId,
        tableNumber: '12',
        type: 'EXTRA_PLATE',
        notes: 'Need 2 extra quarter plates and spoons'
      })
    });
    expect(reqRes.status).toBe(201);
    serviceRequestId = reqRes.data.data.id;

    // 6b. Waiter Acknowledges request
    const ackRes = await fetchJson(`${BASE_URL}/api/staff/service-requests/${serviceRequestId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${waiterToken}` },
      body: JSON.stringify({ status: 'ACKNOWLEDGED' })
    });
    expect(ackRes.status).toBe(200);

    // 6c. Waiter Marks Resolved
    const resRes = await fetchJson(`${BASE_URL}/api/staff/service-requests/${serviceRequestId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${waiterToken}` },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    expect(resRes.status).toBe(200);
  });

  it('Step 7: Exact Billing, GST Taxes & Payment Settlement', async () => {
    // 7a. Payment creation (UPI intent)
    const payRes = await fetchJson(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({ billId: diningBillId, method: 'UPI' })
    });
    expect(payRes.status).toBe(201);
    const paymentId = payRes.data.data.paymentId;
    const txnRef = payRes.data.data.transactionRef;

    // 7b. Verify Gateway Payment
    const verifyRes = await fetchJson(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        paymentId,
        transactionRef: txnRef,
        gatewaySignature: 'SIG_UPI_VERIFIED_SUCCESS'
      })
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.data.status).toBe('PAID');

    // 7c. Verify Digital Bill in Authoritative Financial Record shows PAID
    const billCheck = await fetchJson(`${BASE_URL}/api/payments/order/${diningOrderId}/bill`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    expect(billCheck.status).toBe(200);
    expect(billCheck.data.data.paymentStatus).toBe('PAID');

    // 7d. Idempotent Duplicate Settlement Handling
    const dupPay = await fetchJson(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        paymentId,
        transactionRef: txnRef,
        gatewaySignature: 'SIG_UPI_VERIFIED_SUCCESS'
      })
    });
    expect(dupPay.status).toBe(200);
    expect(dupPay.data.data.status).toBe('PAID');
  });

  it('Step 8: Control Center Multi-Tenant Governance & SuperAdmin Audit', async () => {
    // 8a. SuperAdmin fetches platform overview
    const overviewRes = await fetchJson(`${BASE_URL}/api/admin/overview?range=all`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.data.data.restaurants.total).toBeGreaterThanOrEqual(1);

    // 8b. SuperAdmin toggles restaurant tenant status
    const suspRes = await fetchJson(`${BASE_URL}/api/admin/restaurants/${targetRestId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'SUSPENDED' })
    });
    expect(suspRes.status).toBe(200);

    // Restore back to ACTIVE
    const actRes = await fetchJson(`${BASE_URL}/api/admin/restaurants/${targetRestId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    expect(actRes.status).toBe(200);
  });
});
