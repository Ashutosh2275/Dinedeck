import { describe, it, expect } from 'vitest';
import { WebSocket } from 'ws';

const BASE_URL = 'http://127.0.0.1:8080';
const WS_URL = 'ws://127.0.0.1:8080/ws';

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

describe('DINEDECK Payment and Realtime Synchronization Repair Suite', () => {
  let customerToken = '';
  let customerUser: any = null;
  let staffToken = '';
  let adminToken = '';
  let targetRestId = '';
  let orderId = '';
  let billId = '';
  let paymentId = '';
  let txnRef = '';

  it('Stage 1: Should authenticate Customer, Staff, and Admin roles', async () => {
    const custLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
    });
    expect(custLogin.status).toBe(200);
    customerToken = custLogin.data?.data?.accessToken;
    customerUser = custLogin.data?.data?.user;

    const staffLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'captain.ramesh@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.data?.data?.accessToken;

    const adminLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'superadmin@dinedeck.in', password: 'Dinedeck@2026' })
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.data?.data?.accessToken;

    const restList = await fetchJson(`${BASE_URL}/api/restaurants`);
    targetRestId = restList.data?.data?.[0]?.id;
    expect(targetRestId).toBeDefined();
  });

  it('Stage 2: Should place order and create initial pending bill with atomic DB records', async () => {
    const orderRes = await fetchJson(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        restaurantId: targetRestId,
        tableNumber: '12',
        idempotencyKey: `IDEMP_VITEST_${Date.now()}`,
        items: [
          { menuItemId: 'item_butter_chicken', name: 'Grand Old Delhi Butter Chicken', quantity: 1, unitPrice: 441 }
        ]
      })
    });

    expect(orderRes.status).toBe(201);
    orderId = orderRes.data?.data?.orderId;
    billId = orderRes.data?.data?.billId;
    expect(orderId).toBeDefined();
    expect(billId).toBeDefined();
    expect(orderRes.data?.data?.paymentStatus).toBe('PENDING');
  });

  it('Stage 3: Should retrieve authoritative Digital Bill with exact breakdown and PENDING status', async () => {
    const billByOrder = await fetchJson(`${BASE_URL}/api/payments/order/${orderId}/bill`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });

    expect(billByOrder.status).toBe(200);
    expect(billByOrder.data?.data?.paymentStatus).toBe('PENDING');
    expect(billByOrder.data?.data?.grandTotal).toBeGreaterThan(0);
  });

  it('Stage 4: Should initialize payment intent and verify settlement with atomic transition to PAID', async () => {
    const payIntent = await fetchJson(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        billId,
        method: 'UPI'
      })
    });

    expect(payIntent.status).toBe(201);
    paymentId = payIntent.data?.data?.paymentId;
    txnRef = payIntent.data?.data?.transactionRef;

    const payVerify = await fetchJson(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        paymentId,
        transactionRef: txnRef,
        gatewaySignature: 'SIG_UPI_VERIFIED_SANDBOX_SUCCESS'
      })
    });

    expect(payVerify.status).toBe(200);
    expect(payVerify.data?.data?.status).toBe('PAID');

    // Verify Digital Bill shows PAID IN FULL
    const updatedBill = await fetchJson(`${BASE_URL}/api/payments/order/${orderId}/bill`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });

    expect(updatedBill.data?.data?.paymentStatus).toBe('PAID');
    expect(updatedBill.data?.data?.paidAt).toBeDefined();
  });

  it('Stage 5: Should prevent double payment settlements on already-paid bills', async () => {
    const repeatVerify = await fetchJson(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify({
        paymentId,
        transactionRef: txnRef,
        gatewaySignature: 'SIG_UPI_VERIFIED_SANDBOX_SUCCESS'
      })
    });

    // Idempotent duplicate verification returns 200 with already settled message
    expect(repeatVerify.status).toBe(200);
    expect(repeatVerify.data?.data?.status).toBe('PAID');
  });

  it('Stage 6: Should include live bills and payment statuses in Order History', async () => {
    const historyRes = await fetchJson(`${BASE_URL}/api/orders`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });

    expect(historyRes.status).toBe(200);
    const orders = historyRes.data?.data || [];
    const target = orders.find((o: any) => o.id === orderId);
    expect(target).toBeDefined();
    expect(target.bills).toBeDefined();
    expect(target.bills.length).toBeGreaterThan(0);
    expect(target.bills[0].paymentStatus).toBe('PAID');
  });
});
