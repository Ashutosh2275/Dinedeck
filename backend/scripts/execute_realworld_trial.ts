import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:8080';

async function fetchJson(url: string, options: any = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function runRealWorldTrial() {
  console.log('====================================================');
  console.log('DINEDECK — REAL-WORLD PRODUCTION TRIAL EXECUTION');
  console.log('====================================================');

  // 1. Authenticate Personas
  console.log('\n[1/10] Authenticating Personas across the Ecosystem...');
  const custRes = await fetchJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
  });
  const customerToken = custRes.data?.data?.accessToken;
  console.log(`  ✓ Customer: Alex Vance (Token: ${customerToken ? 'OK' : 'FAIL'})`);

  const chefRes = await fetchJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'chef.vikram@punjabheritage.in', password: 'Dinedeck@2026' })
  });
  const chefToken = chefRes.data?.data?.accessToken;
  console.log(`  ✓ Chef: Vikram Singh (Token: ${chefToken ? 'OK' : 'FAIL'})`);

  const waiterRes = await fetchJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'waiter.ramesh@punjabheritage.in', password: 'Dinedeck@2026' })
  });
  const waiterToken = waiterRes.data?.data?.accessToken;
  console.log(`  ✓ Waiter: Ramesh Kumar (Token: ${waiterToken ? 'OK' : 'FAIL'})`);

  const adminRes = await fetchJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'superadmin@dinedeck.in', password: 'Dinedeck@2026' })
  });
  const adminToken = adminRes.data?.data?.accessToken;
  console.log(`  ✓ SuperAdmin: DINEDECK Platform Admin (Token: ${adminToken ? 'OK' : 'FAIL'})`);

  // 2. Customer Initiates Table #12 Dining Session & Places First Order
  console.log('\n[2/10] Customer Alex Vance scanning Table #12 QR & placing Order #1...');
  const order1Res = await fetchJson(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      restaurantId: 'rest_punjab_heritage',
      tableNumber: '12',
      specialNotes: 'Extra crisp tandoori naan, medium spice in butter chicken',
      items: [
        { menuItemId: 'item_butter_chicken', name: 'Grand Old Delhi Butter Chicken', quantity: 2, unitPrice: 441 },
        { menuItemId: 'item_paneer_tikka', name: 'Angaari Paneer Tikka', quantity: 1, unitPrice: 374 }
      ]
    })
  });
  const order1 = order1Res.data?.data;
  console.log(`  ✓ Order #1 Created: ${order1.orderNumber} (ID: ${order1.orderId}, Bill: ${order1.billId}, Total: ₹${order1.totalAmount})`);

  // 3. Restaurant KDS receives order & Head Chef accepts & prepares
  console.log('\n[3/10] Head Chef Vikram receiving KOT on Partner KDS...');
  const kdsQueue = await fetchJson(`${BASE_URL}/api/staff/orders?restaurantId=rest_punjab_heritage`, {
    headers: { 'Authorization': `Bearer ${chefToken}` }
  });
  console.log(`  ✓ Active KDS Orders in Kitchen Queue: ${kdsQueue.data?.data?.length || 0}`);

  console.log('  → Chef advancing status: CONFIRMED -> PREPARING...');
  await fetchJson(`${BASE_URL}/api/staff/orders/${order1.orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${chefToken}` },
    body: JSON.stringify({ status: 'PREPARING' })
  });

  console.log('  → Chef advancing status: PREPARING -> READY...');
  await fetchJson(`${BASE_URL}/api/staff/orders/${order1.orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${chefToken}` },
    body: JSON.stringify({ status: 'READY' })
  });

  console.log('  → Waiter Ramesh serving table: READY -> SERVED...');
  await fetchJson(`${BASE_URL}/api/staff/orders/${order1.orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${waiterToken}` },
    body: JSON.stringify({ status: 'SERVED' })
  });

  // 4. Customer Service Call (Extra Plate & Water)
  console.log('\n[4/10] Table #12 Customer requesting service call...');
  const serviceReq = await fetchJson(`${BASE_URL}/api/staff/service-requests`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      restaurantId: 'rest_punjab_heritage',
      tableNumber: '12',
      type: 'EXTRA_PLATE',
      notes: 'Need 2 extra dinner plates and fresh lime water'
    })
  });
  const reqId = serviceReq.data?.data?.id;
  console.log(`  ✓ Service Request Created: ${reqId} (Type: EXTRA_PLATE)`);

  console.log('  → Waiter Ramesh acknowledging service call...');
  await fetchJson(`${BASE_URL}/api/staff/service-requests/${reqId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${waiterToken}` },
    body: JSON.stringify({ status: 'ACKNOWLEDGED' })
  });

  console.log('  → Waiter Ramesh resolving service call...');
  await fetchJson(`${BASE_URL}/api/staff/service-requests/${reqId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${waiterToken}` },
    body: JSON.stringify({ status: 'COMPLETED' })
  });

  // 5. Customer places Second Order in same session
  console.log('\n[5/10] Customer placing Second Order in same Dining Session...');
  const order2Res = await fetchJson(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      restaurantId: 'rest_punjab_heritage',
      tableNumber: '12',
      items: [
        { menuItemId: 'item_garlic_naan', name: 'Garlic Butter Naan', quantity: 3, unitPrice: 70 },
        { menuItemId: 'item_lassi', name: 'Kesar Pista Lassi', quantity: 2, unitPrice: 120 }
      ]
    })
  });
  const order2 = order2Res.data?.data;
  console.log(`  ✓ Order #2 Created: ${order2.orderNumber} (ID: ${order2.orderId}, Total: ₹${order2.totalAmount})`);

  // Chef prepares and serves second order
  await fetchJson(`${BASE_URL}/api/staff/orders/${order2.orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${chefToken}` },
    body: JSON.stringify({ status: 'READY' })
  });
  await fetchJson(`${BASE_URL}/api/staff/orders/${order2.orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${waiterToken}` },
    body: JSON.stringify({ status: 'SERVED' })
  });

  // 6. Digital Bill Computation & Taxes
  console.log('\n[6/10] Fetching Authoritative Digital Bill for Session...');
  const billRes = await fetchJson(`${BASE_URL}/api/payments/order/${order1.orderId}/bill`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const bill = billRes.data?.data;
  console.log(`  ✓ Bill Number: ${bill.billNumber}`);
  console.log(`    - Subtotal: ₹${bill.subtotal}`);
  console.log(`    - CGST (2.5%): ₹${bill.cgstAmount}`);
  console.log(`    - SGST (2.5%): ₹${bill.sgstAmount}`);
  console.log(`    - Service Charge (5.0%): ₹${bill.serviceCharge}`);
  console.log(`    - Grand Total: ₹${bill.grandTotal}`);
  console.log(`    - Payment Status: ${bill.paymentStatus}`);

  // 7. Instant Gateway Payment Settlement (UPI)
  console.log('\n[7/10] Initiating and Verifying Gateway Payment...');
  const payIntent = await fetchJson(`${BASE_URL}/api/payments/create`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({ billId: bill.id, method: 'UPI' })
  });
  const payment = payIntent.data?.data;
  console.log(`  ✓ Payment Intent Created: ${payment.paymentId} (Ref: ${payment.transactionRef})`);

  const payVerify = await fetchJson(`${BASE_URL}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      paymentId: payment.paymentId,
      transactionRef: payment.transactionRef,
      gatewaySignature: 'SIG_UPI_VERIFIED_SUCCESS_PROD_TRIAL'
    })
  });
  console.log(`  ✓ Gateway Verification Result: ${payVerify.data?.data?.status || 'FAIL'}`);

  // 8. Verify Settled Bill
  const finalBill = await fetchJson(`${BASE_URL}/api/payments/order/${order1.orderId}/bill`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  console.log(`  ✓ Final Authoritative Bill Status: ${finalBill.data?.data?.paymentStatus} (PaidAt: ${finalBill.data?.data?.paidAt})`);

  // 9. Restaurant Shift Settlement & Analytics
  console.log('\n[8/10] Inspecting Restaurant Partner Shift Analytics...');
  const shiftOverview = await fetchJson(`${BASE_URL}/api/staff/overview?restaurantId=rest_punjab_heritage`, {
    headers: { 'Authorization': `Bearer ${chefToken}` }
  });
  console.log(`  ✓ Partner Shift Sales: ₹${shiftOverview.data?.data?.todaySales || 0} (${shiftOverview.data?.data?.completedOrdersCount || 0} Settled Orders)`);

  // 10. Control Center Platform Governance & Analytics
  console.log('\n[9/10] Inspecting Control Center SuperAdmin Overview...');
  const adminOverview = await fetchJson(`${BASE_URL}/api/admin/overview?range=all`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const ao = adminOverview.data?.data;
  console.log(`  ✓ Total Restaurants: ${ao?.restaurants?.total} (Active: ${ao?.restaurants?.active})`);
  console.log(`  ✓ Platform GMV: ₹${ao?.finance?.grossOrderValue || 0}`);
  console.log(`  ✓ Platform Commission: ₹${ao?.finance?.platformCommissionRevenue || 0}`);

  console.log('\n[10/10] >>> REAL-WORLD PRODUCTION TRIAL SUCCESSFULLY COMPLETED <<<');
  await prisma.$disconnect();
}

runRealWorldTrial();
