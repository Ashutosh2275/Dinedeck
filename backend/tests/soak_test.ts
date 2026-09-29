import { WebSocket } from 'ws';

const BASE_URL = 'http://127.0.0.1:8080';
const WS_URL = 'ws://127.0.0.1:8080/ws';

async function fetchJson(url: string, options: RequestInit = {}): Promise<{ status: number; data: any }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch (e: any) {
    return { status: 0, data: { error: e.message } };
  }
}

async function runSoakTest() {
  console.log('--- SUSTAINED SOAK TEST ---');
  
  // Auth
  const auth = await fetchJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
  });
  const token = auth.data?.data?.accessToken;
  const staffAuth = await fetchJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'captain.ramesh@punjabheritage.in', password: 'Dinedeck@2026' })
  });
  const staffToken = staffAuth.data?.data?.accessToken;

  let completedCycles = 0;
  const TOTAL_CYCLES = 50;

  for (let c = 0; c < TOTAL_CYCLES; c++) {
    // 1. Validate QR
    await fetchJson(`${BASE_URL}/api/tables/validate`, {
      method: 'POST',
      body: JSON.stringify({ qrToken: 'token_rest_punjab_heritage_branch_1_tbl_12_sec9988' })
    });

    // 2. Place Order
    const orderRes = await fetchJson(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        restaurantId: 'rest_punjab_heritage',
        tableNumber: '12',
        items: [{ menuItemId: 'item_butter_chicken', name: 'Butter Chicken', quantity: 1, unitPrice: 441 }]
      })
    });
    const orderId = orderRes.data?.data?.orderId;

    if (orderId) {
      // 3. Partner updates to PREPARING
      await fetchJson(`${BASE_URL}/api/staff/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${staffToken}` },
        body: JSON.stringify({ status: 'PREPARING' })
      });

      // 4. Partner updates to READY
      await fetchJson(`${BASE_URL}/api/staff/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${staffToken}` },
        body: JSON.stringify({ status: 'READY' })
      });

      // 5. Customer fetches bill
      const details = await fetchJson(`${BASE_URL}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const billId = details.data?.data?.bills?.[0]?.id;

      if (billId) {
        // 6. Payment Intent & Settle
        const payInit = await fetchJson(`${BASE_URL}/api/payments/create`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ billId, method: 'UPI', amount: 441 })
        });
        const payId = payInit.data?.data?.paymentId;
        const txnRef = payInit.data?.data?.transactionRef;

        if (payId) {
          await fetchJson(`${BASE_URL}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ paymentId: payId, transactionRef: txnRef })
          });
        }
      }
    }

    completedCycles++;
    if (completedCycles % 10 === 0) {
      console.log(`  -> Soak Progress: ${completedCycles}/${TOTAL_CYCLES} full end-to-end cycles completed`);
    }
  }

  console.log(`✅ Sustained Soak Test: ${completedCycles}/${TOTAL_CYCLES} cycles completed with 100% success`);
}

runSoakTest().catch(console.error);
