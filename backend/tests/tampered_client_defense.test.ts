import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/config/db.js';

const BASE_URL = 'http://127.0.0.1:8080';

async function fetchJson(url: string, options: RequestInit = {}): Promise<{ status: number; data: any; headers: Headers }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data, headers: res.headers };
  } catch (e: any) {
    return { status: 0, data: { error: e.message }, headers: new Headers() };
  }
}

describe('DINEDECK Tampered Client Defense & Server Boundary Master Suite', () => {
  let customerToken = '';
  let customerId = '';
  let punjabRestId = 'rest_punjab_heritage';
  let butterChickenItem: any = null;

  beforeAll(async () => {
    // 1. Authenticate Customer (Alex Vance)
    const custLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
    });
    expect(custLogin.status).toBe(200);
    customerToken = custLogin.data?.data?.accessToken;
    customerId = custLogin.data?.data?.user?.id;

    // 2. Fetch authoritative menu item (Butter Chicken)
    butterChickenItem = await prisma.menuItem.findFirst({
      where: { restaurantId: punjabRestId, name: { contains: 'Butter Chicken' } }
    });
    if (!butterChickenItem) {
      butterChickenItem = await prisma.menuItem.findFirst({
        where: { restaurantId: punjabRestId }
      });
    }
    expect(butterChickenItem).toBeDefined();
  });

  describe('1. Server-Authoritative Price Enforcement (Anti-Tampering)', () => {
    it('Reject client price tampering: customer sending unitPrice: 1 is charged authoritative DB price', async () => {
      const realPrice = butterChickenItem.discountedPrice || butterChickenItem.price;

      // Tampered client attempts to set unitPrice: 1
      const tamperedRes = await fetchJson(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          restaurantId: punjabRestId,
          tableNumber: 'T-1',
          items: [
            {
              menuItemId: butterChickenItem.id,
              name: butterChickenItem.name,
              quantity: 2,
              unitPrice: 1 // Malicious tampered price
            }
          ]
        })
      });

      expect(tamperedRes.status).toBe(201);
      const expectedSubtotal = realPrice * 2;
      expect(tamperedRes.data.data.subtotal).toBe(expectedSubtotal);
      expect(tamperedRes.data.data.subtotal).not.toBe(2); // Never allows 2 * 1 = 2
    });
  });

  describe('2. Payment Intent Server Bounds Enforcement (Anti-Tampering)', () => {
    let testBillId = '';

    beforeAll(async () => {
      // Create order to get a test bill
      const orderRes = await fetchJson(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          restaurantId: punjabRestId,
          tableNumber: 'T-1',
          items: [
            {
              menuItemId: butterChickenItem.id,
              name: butterChickenItem.name,
              quantity: 1,
              unitPrice: butterChickenItem.price
            }
          ]
        })
      });
      testBillId = orderRes.data.data.billId;
    });

    it('Reject invalid payment amount <= 0 with 400 Bad Request', async () => {
      const res = await fetchJson(`${BASE_URL}/api/payments/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          billId: testBillId,
          method: 'UPI',
          amount: -50 // Negative amount tampering
        })
      });
      expect(res.status).toBe(400);
      expect(res.data.message).toContain('Invalid payment amount');
    });

    it('Reject payment amount exceeding remaining bill balance with 400 Bad Request', async () => {
      const res = await fetchJson(`${BASE_URL}/api/payments/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          billId: testBillId,
          method: 'UPI',
          amount: 9999999 // Exceeds balance tampering
        })
      });
      expect(res.status).toBe(400);
      expect(res.data.message).toContain('exceeds remaining bill balance');
    });

    it('Reject forged transaction reference verification with 400 or 500 error', async () => {
      const intentRes = await fetchJson(`${BASE_URL}/api/payments/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          billId: testBillId,
          method: 'UPI'
        })
      });
      expect(intentRes.status).toBe(201);

      // Verify with forged transactionRef
      const fakeVerify = await fetchJson(`${BASE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          paymentId: intentRes.data.data.paymentId,
          transactionRef: 'forged_bogus_ref_attempt_12345'
        })
      });
      expect(fakeVerify.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('3. Role Escalation & Direct API Defacement Defense', () => {
    it('Customer direct call to Super Admin metrics is rejected with 403 Forbidden', async () => {
      const res = await fetchJson(`${BASE_URL}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      expect(res.status).toBe(403);
    });

    it('Customer direct call to modify restaurant menu is rejected with 403 Forbidden', async () => {
      const res = await fetchJson(`${BASE_URL}/api/restaurants/${punjabRestId}/menu/items/${butterChickenItem.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ price: 0 })
      });
      expect(res.status).toBe(403);
    });

    it('Customer direct call to apply billing discount is rejected with 403 Forbidden', async () => {
      const bill = await prisma.bill.findFirst({ where: { restaurantId: punjabRestId } });
      if (bill) {
        const res = await fetchJson(`${BASE_URL}/api/billing/bills/${bill.id}/discount`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${customerToken}` },
          body: JSON.stringify({
            restaurantId: punjabRestId,
            discountType: 'PERCENTAGE',
            discountValue: 100
          })
        });
        expect(res.status).toBe(403);
      }
    });
  });

  describe('4. HTTP Production Security Headers Enforcement', () => {
    it('Backend emits nosniff, SAMEORIGIN, and XSS protection headers on API responses', async () => {
      const res = await fetchJson(`${BASE_URL}/health`);
      expect(res.status).toBe(200);

      const contentTypeOptions = res.headers.get('x-content-type-options');
      const frameOptions = res.headers.get('x-frame-options');
      const xssProtection = res.headers.get('x-xss-protection');
      const referrerPolicy = res.headers.get('referrer-policy');

      expect(contentTypeOptions).toBe('nosniff');
      expect(frameOptions).toBe('SAMEORIGIN');
      expect(xssProtection).toBe('1; mode=block');
      expect(referrerPolicy).toBe('strict-origin-when-cross-origin');
    });
  });
});
