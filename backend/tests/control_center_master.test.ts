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

describe('DINEDECK Control Center — Master Production Governance Suite', () => {
  let superAdminToken = '';
  let customerToken = '';
  let onboardedRestaurantId = '';
  let onboardedRestaurantSlug = '';
  let settlementId = '';
  let supportTicketId = '';

  beforeAll(async () => {
    // 1. Super Admin Authentication
    const adminLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'superadmin@dinedeck.in', password: 'Dinedeck@2026' })
    });
    expect(adminLogin.status).toBe(200);
    superAdminToken = adminLogin.data?.data?.accessToken;
    expect(superAdminToken).toBeDefined();

    // 2. Customer Authentication (for RBAC test)
    const custLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
    });
    expect(custLogin.status).toBe(200);
    customerToken = custLogin.data?.data?.accessToken;
  });

  it('Pillar 1: Overview Dashboard & Real Platform Metrics', async () => {
    const res = await fetchJson(`${BASE_URL}/api/admin/overview?range=all`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });

    expect(res.status).toBe(200);
    expect(res.data?.success).toBe(true);
    const d = res.data?.data;
    expect(d.restaurants.total).toBeGreaterThanOrEqual(1);
    expect(d.restaurants.active).toBeGreaterThanOrEqual(1);
    expect(d.customers.total).toBeGreaterThanOrEqual(1);
    expect(d.operations.totalOrders).toBeGreaterThanOrEqual(0);
    expect(d.finance.grossOrderValue).toBeGreaterThanOrEqual(0);
    expect(d.finance.platformCommissionRevenue).toBeGreaterThanOrEqual(0);
    expect(d.finance.netRestaurantPayable).toBeGreaterThanOrEqual(0);
  });

  it('Pillar 2: Restaurant Onboarding Workflow with Legal KYC, Branch & Initial Tables', async () => {
    const timestamp = Date.now();
    const onboardPayload = {
      name: `Grand Peshawari Grill ${timestamp}`,
      legalBusinessName: `Peshawari Hospitality Private Limited ${timestamp}`,
      cuisineType: 'North Indian & Mughlai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      fullAddress: 'Plot 42, Bandra Reclamation, Bandra West, Mumbai 400050',
      phone: '+919820011223',
      ownerName: 'Harpreet Singh Ahluwalia',
      ownerEmail: `owner.harpreet.${timestamp}@peshawari.in`,
      gstin: '27AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
      fssaiNumber: '11518001000452',
      bankAccountNumber: '912010056784321',
      bankIfsc: 'UTIB0000042',
      commissionRatePercent: 12.5,
      initialTablesCount: 8
    };

    const res = await fetchJson(`${BASE_URL}/api/admin/restaurants/onboard`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify(onboardPayload)
    });

    expect(res.status).toBe(201);
    expect(res.data?.success).toBe(true);
    const rest = res.data?.data?.restaurant;
    expect(rest.id).toBeDefined();
    expect(rest.status).toBe('PENDING_REVIEW');
    expect(rest.isActive).toBe(false);
    expect(rest.legalBusinessName).toBe(onboardPayload.legalBusinessName);
    expect(rest.gstin).toBe(onboardPayload.gstin);
    expect(res.data?.data?.tablesCreated).toBe(8);

    onboardedRestaurantId = rest.id;
    onboardedRestaurantSlug = rest.slug;
  });

  it('Pillar 3: Restaurant Lifecycle Transitions (PENDING_REVIEW -> ACTIVE -> SUSPENDED -> ACTIVE)', async () => {
    // 3a. Approve & Activate Restaurant
    const activateRes = await fetchJson(`${BASE_URL}/api/admin/restaurants/${onboardedRestaurantId}/lifecycle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'ACTIVE', reason: 'FSSAI & GSTIN verified by compliance team' })
    });
    expect(activateRes.status).toBe(200);
    expect(activateRes.data?.data?.status).toBe('ACTIVE');
    expect(activateRes.data?.data?.isActive).toBe(true);

    // 3b. Suspend Restaurant
    const suspendRes = await fetchJson(`${BASE_URL}/api/admin/restaurants/${onboardedRestaurantId}/lifecycle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'SUSPENDED', reason: 'Routine kitchen hygiene inspection pending' })
    });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.data?.data?.status).toBe('SUSPENDED');
    expect(suspendRes.data?.data?.isActive).toBe(false);

    // 3c. Restore Restaurant
    const restoreRes = await fetchJson(`${BASE_URL}/api/admin/restaurants/${onboardedRestaurantId}/lifecycle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ status: 'ACTIVE', reason: 'Hygiene audit cleared with grade A' })
    });
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.data?.data?.status).toBe('ACTIVE');
    expect(restoreRes.data?.data?.isActive).toBe(true);
  });

  it('Pillar 4: Dynamic Restaurant Configuration (GST Rates, Service Charge & Commission %)', async () => {
    const configRes = await fetchJson(`${BASE_URL}/api/admin/restaurants/${onboardedRestaurantId}/config`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        cgstRatePercent: 2.5,
        sgstRatePercent: 2.5,
        serviceChargePercent: 7.5,
        packagingCharge: 25.0,
        commissionRatePercent: 14.0
      })
    });

    expect(configRes.status).toBe(200);
    expect(configRes.data?.data?.serviceChargePercent).toBe(7.5);
    expect(configRes.data?.data?.commissionRatePercent).toBe(14.0);
    expect(configRes.data?.data?.packagingCharge).toBe(25.0);
  });

  it('Pillar 5: Branch Management (Create Branch & Inspect Tables)', async () => {
    const branchRes = await fetchJson(`${BASE_URL}/api/admin/restaurants/${onboardedRestaurantId}/branches`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        name: 'BKC Express Outlet',
        address: 'G-Block, Bandra Kurla Complex, Mumbai 400051',
        phone: '+919820099887'
      })
    });

    expect(branchRes.status).toBe(201);
    expect(branchRes.data?.data?.name).toBe('BKC Express Outlet');

    // List branches
    const listBranches = await fetchJson(`${BASE_URL}/api/admin/restaurants/${onboardedRestaurantId}/branches`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    expect(listBranches.status).toBe(200);
    expect(listBranches.data?.data?.length).toBeGreaterThanOrEqual(2);
  });

  it('Pillar 6: Live Operations Telemetry Stream', async () => {
    const opsRes = await fetchJson(`${BASE_URL}/api/admin/operations/live`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });

    expect(opsRes.status).toBe(200);
    expect(opsRes.data?.data?.counts).toBeDefined();
    expect(opsRes.data?.data?.timestamp).toBeDefined();
    expect(Array.isArray(opsRes.data?.data?.liveOrders)).toBe(true);
    expect(Array.isArray(opsRes.data?.data?.pendingRequests)).toBe(true);
  });

  it('Pillar 7: Payment Administration & Authoritative Refund Execution', async () => {
    // Ensure at least one payment exists for testing
    let paymentsRes = await fetchJson(`${BASE_URL}/api/admin/payments?limit=10`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    
    if (!paymentsRes.data?.data?.length) {
      const punjab = await prisma.restaurant.findFirst({ where: { slug: 'punjab-heritage-mumbai' } });
      const testOrder = await prisma.order.create({
        data: {
          restaurantId: punjab!.id,
          orderNumber: `ORD-TEST-${Date.now()}`,
          tableNumber: '1',
          status: 'COMPLETED',
          subtotal: 500,
          cgstAmount: 12.5,
          sgstAmount: 12.5,
          serviceCharge: 25,
          totalAmount: 550
        }
      });
      const testBill = await prisma.bill.create({
        data: {
          restaurantId: punjab!.id,
          orderId: testOrder.id,
          billNumber: `BILL-TEST-${Date.now()}`,
          subtotal: 500,
          cgstAmount: 12.5,
          sgstAmount: 12.5,
          serviceCharge: 25,
          grandTotal: 550,
          paymentStatus: 'PAID',
          paymentMethod: 'UPI'
        }
      });
      await prisma.payment.create({
        data: {
          billId: testBill.id,
          amount: 550,
          method: 'UPI',
          status: 'PAID',
          transactionRef: `TXN_TEST_${Date.now()}`
        }
      });

      paymentsRes = await fetchJson(`${BASE_URL}/api/admin/payments?limit=10`, {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
      });
    }

    expect(paymentsRes.status).toBe(200);
    expect(paymentsRes.data?.count).toBeGreaterThanOrEqual(1);

    const targetPayment = paymentsRes.data?.data?.find((p: any) => p.status === 'PAID');
    if (targetPayment) {
      // Execute refund
      const refundRes = await fetchJson(`${BASE_URL}/api/admin/payments/${targetPayment.id}/refund`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${superAdminToken}` },
        body: JSON.stringify({ reason: 'Customer disputed item presentation' })
      });
      expect(refundRes.status).toBe(200);
      expect(refundRes.data?.data?.status).toBe('REFUNDED');
    }
  });

  it('Pillar 8: DINEDECK Financial Settlements & Restaurant Payouts', async () => {
    // Generate settlement for target restaurant
    const genRes = await fetchJson(`${BASE_URL}/api/admin/settlements/generate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ restaurantId: 'rest_punjab_heritage' })
    });

    expect(genRes.status).toBe(201);
    expect(genRes.data?.data?.settlementNumber).toBeDefined();
    expect(genRes.data?.data?.dinedeckCommission).toBeGreaterThanOrEqual(0);
    expect(genRes.data?.data?.netPayable).toBeGreaterThanOrEqual(0);
    expect(genRes.data?.data?.status).toBe('PENDING');

    settlementId = genRes.data?.data?.id;

    // Execute Settlement Payout
    const payoutRes = await fetchJson(`${BASE_URL}/api/admin/settlements/${settlementId}/payout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ payoutRef: `NEFT_AXIS_IND_${Date.now()}` })
    });

    expect(payoutRes.status).toBe(200);
    expect(payoutRes.data?.data?.status).toBe('SETTLED');
    expect(payoutRes.data?.data?.settledAt).toBeDefined();
  });

  it('Pillar 9: Support & Incident Ticketing System', async () => {
    // Create Incident Ticket
    const createTicket = await fetchJson(`${BASE_URL}/api/admin/support/tickets`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        title: 'Thermal Printer Paper Jam at Table 12',
        description: 'Captain reported bill printing failed during rush hour.',
        category: 'OPERATIONAL',
        priority: 'HIGH',
        restaurantId: 'rest_punjab_heritage'
      })
    });

    expect(createTicket.status).toBe(201);
    expect(createTicket.data?.data?.ticketNumber).toBeDefined();
    expect(createTicket.data?.data?.priority).toBe('HIGH');
    expect(createTicket.data?.data?.status).toBe('OPEN');

    supportTicketId = createTicket.data?.data?.id;

    // Update Incident Ticket
    const updateTicket = await fetchJson(`${BASE_URL}/api/admin/support/tickets/${supportTicketId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        status: 'RESOLVED',
        assignee: 'Operations Specialist Ramesh',
        internalNotes: 'Roll replaced and test invoice printed successfully.'
      })
    });

    expect(updateTicket.status).toBe(200);
    expect(updateTicket.data?.data?.status).toBe('RESOLVED');
  });

  it('Pillar 10: Security Audit Ledger & Global System Health', async () => {
    // 10a. Query Security Audit Logs
    const auditRes = await fetchJson(`${BASE_URL}/api/admin/security/audit-logs`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    expect(auditRes.status).toBe(200);
    expect(auditRes.data?.count).toBeGreaterThan(0);
    const actions = auditRes.data?.data?.map((l: any) => l.action);
    expect(actions).toContain('restaurant.onboard');
    expect(actions).toContain('restaurant.lifecycle_update');

    // 10b. System Health Telemetry
    const healthRes = await fetchJson(`${BASE_URL}/api/admin/system/health`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    expect(healthRes.status).toBe(200);
    expect(healthRes.data?.data?.status).toBe('HEALTHY');
    expect(healthRes.data?.data?.dbLatencyMs).toBeLessThan(100);
    expect(healthRes.data?.data?.memory?.heapUsedMb).toBeGreaterThan(0);
  });

  it('Strict Security: Non-Admin Access Rejection (HTTP 403)', async () => {
    const custRes = await fetchJson(`${BASE_URL}/api/admin/overview`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    expect(custRes.status).toBe(403);
    expect(custRes.data?.message).toContain('Forbidden');
  });
});
