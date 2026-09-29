import { describe, it, expect, beforeAll, afterAll } from 'vitest';


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

describe('DINEDECK Restaurant IAM & Staff Access Master QA Suite', () => {
  let ownerToken = '';
  let waiterToken = '';
  let waiterUserId = '';
  let chefToken = '';
  let chefUserId = '';
  let customerToken = '';
  let peshawariOwnerToken = '';
  const punjabRestId = 'rest_punjab_heritage';
  const peshawariRestId = 'rest_peshawari_grill';

  beforeAll(async () => {
    // 1. Owner Login (Punjab Heritage)
    const ownerLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'owner.punjab@dinedeck.in', password: 'Dinedeck@2026' })
    });
    expect(ownerLogin.status).toBe(200);
    ownerToken = ownerLogin.data?.data?.accessToken;

    // 2. Waiter Login (Ramesh)
    const waiterLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'waiter.ramesh@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    expect(waiterLogin.status).toBe(200);
    waiterToken = waiterLogin.data?.data?.accessToken;
    waiterUserId = waiterLogin.data?.data?.user?.id;

    // 3. Chef Login (Vikram)
    const chefLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'chef.vikram@punjabheritage.in', password: 'Dinedeck@2026' })
    });
    expect(chefLogin.status).toBe(200);
    chefToken = chefLogin.data?.data?.accessToken;
    chefUserId = chefLogin.data?.data?.user?.id;

    // 4. Customer Login (Alex)
    const custLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.vance@dinedeck.io', password: 'Dinedeck@2026' })
    });
    expect(custLogin.status).toBe(200);
    customerToken = custLogin.data?.data?.accessToken;

    // 5. Tenant B Owner Login (Peshawari)
    const peshLogin = await fetchJson(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'owner.peshawari@dinedeck.in', password: 'Dinedeck@2026' })
    });
    if (peshLogin.status === 200) {
      peshawariOwnerToken = peshLogin.data?.data?.accessToken;
    }
  });

  // CASE 1: ROOT assigns WAITER role -> Verify waiter receives correct default permissions
  it('CASE 1: ROOT assigns WAITER role -> Verify waiter receives correct permissions', async () => {
    const res = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/access`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        roleId: 'WAITER',
        tableScope: '1, 2, 3, 4',
        permissions: [
          'orders.read', 'orders.create', 'orders.update', 'orders.serve',
          'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve',
          'tables.read', 'menu.read', 'billing.read', 'billing.create'
        ],
        reason: 'Reset to standard waiter baseline'
      })
    });
    expect(res.status).toBe(200);

    // Verify via /iam/me
    const meRes = await fetchJson(`${BASE_URL}/api/iam/me?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    expect(meRes.status).toBe(200);
    expect(meRes.data?.data?.permissions).toContain('orders.read');
    expect(meRes.data?.data?.permissions).toContain('service_requests.resolve');
    expect(meRes.data?.data?.permissions).not.toContain('staff.assign_role');
  });

  // CASE 2: ROOT adds one permission -> Verify it works immediately
  it('CASE 2: ROOT grants custom permission override -> Verify active immediately', async () => {
    const grantRes = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/access`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        roleId: 'WAITER',
        tableScope: '1, 2, 3, 4',
        permissions: [
          'orders.read', 'orders.create', 'orders.update', 'orders.serve',
          'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve',
          'tables.read', 'menu.read', 'billing.read', 'billing.create',
          'billing.discount' // Newly added
        ],
        reason: 'Authorized holiday discount authority'
      })
    });
    expect(grantRes.status).toBe(200);

    const meRes = await fetchJson(`${BASE_URL}/api/iam/me?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    expect(meRes.status).toBe(200);
    expect(meRes.data?.data?.permissions).toContain('billing.discount');
  });

  // CASE 3: ROOT removes permission -> Verify operation is denied
  it('CASE 3: ROOT removes permission -> Verify operation is denied', async () => {
    const revokeRes = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/access`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        roleId: 'WAITER',
        tableScope: '1, 2, 3, 4',
        permissions: [
          'orders.read', 'orders.create', 'orders.update', 'orders.serve',
          'service_requests.read',
          'tables.read', 'menu.read'
          // Removed service_requests.resolve and billing.discount
        ],
        reason: 'Revoked discount and call resolution privileges'
      })
    });
    expect(revokeRes.status).toBe(200);

    const meRes = await fetchJson(`${BASE_URL}/api/iam/me?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    expect(meRes.status).toBe(200);
    expect(meRes.data?.data?.permissions).not.toContain('billing.discount');
    expect(meRes.data?.data?.permissions).not.toContain('service_requests.resolve');
  });

  // CASE 4: ROOT restricts waiter to tables 1-4 -> Attempt table 17 operation -> Must be denied server-side
  it('CASE 4: ROOT restricts waiter to tables 1-4 -> Table 17 order denied server-side', async () => {
    // Attempt placing order on Table #17
    const orderRes = await fetchJson(`${BASE_URL}/api/staff/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${waiterToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        tableNumber: '17',
        items: [{ menuItemId: 'some-item', name: 'Butter Chicken', quantity: 1, unitPrice: 350 }]
      })
    });
    expect(orderRes.status).toBe(403);
    expect(orderRes.data?.error).toContain('Access Denied');
  });

  // CASE 5: Suspend waiter -> Verify active session loses access
  it('CASE 5: Suspend waiter -> Verify active session loses access with 403', async () => {
    const suspendRes = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        status: 'SUSPENDED',
        restaurantId: punjabRestId,
        reason: 'Temporary disciplinary freeze'
      })
    });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.data?.data?.status).toBe('SUSPENDED');

    // Attempt staff operations overview
    const opRes = await fetchJson(`${BASE_URL}/api/staff/overview?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    expect(opRes.status).toBe(403);
  });

  // CASE 6: Re-enable waiter -> Verify permitted access returns
  it('CASE 6: Re-enable waiter -> Verify permitted access returns', async () => {
    const reactivateRes = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        status: 'ACTIVE',
        restaurantId: punjabRestId,
        reason: 'Restored active duty'
      })
    });
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.data?.data?.status).toBe('ACTIVE');

    // Re-attempt operations
    const opRes = await fetchJson(`${BASE_URL}/api/staff/overview?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    expect(opRes.status).toBe(200);
  });

  // CASE 7: Attempt restaurant A access from restaurant B -> Must be denied server-side
  it('CASE 7: Tenant Isolation -> Cannot modify staff of another restaurant', async () => {
    if (peshawariOwnerToken) {
      // Owner B attempts modifying staff of Restaurant A
      const crossTenantRes = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/access`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${peshawariOwnerToken}` },
        body: JSON.stringify({
          restaurantId: punjabRestId,
          roleId: 'WAITER',
          permissions: ['orders.read']
        })
      });
      expect(crossTenantRes.status).toBe(403);
    }
  });

  // CASE 8: Attempt permission modification through direct API without authorization -> Denied
  it('CASE 8: Customer or unauthorized user attempting IAM modification -> Denied 403', async () => {
    const unauthRes = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/access`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        roleId: 'GENERAL_MANAGER',
        permissions: ['staff.assign_role']
      })
    });
    expect(unauthRes.status).toBe(403);
  });

  // CASE 9: Modify permissions -> Verify audit event
  it('CASE 9: Modify permissions -> Verify audit event is recorded', async () => {
    const auditRes = await fetchJson(`${BASE_URL}/api/iam/audit-logs?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    expect(auditRes.status).toBe(200);
    expect(auditRes.data?.data?.length).toBeGreaterThan(0);
    const actions = auditRes.data?.data?.map((a: any) => a.action);
    expect(actions).toContain('iam.staff_access_update');
  });

  // CASE 10: Refresh/reconnect after IAM change -> Verify permissions remain persistent
  it('CASE 10: Persistent permissions -> Verify state remains intact across calls', async () => {
    const meRes = await fetchJson(`${BASE_URL}/api/iam/me?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    expect(meRes.status).toBe(200);
    expect(meRes.data?.data?.role).toBe('RESTAURANT_STAFF');
  });

  // CASE 11: Two staff members have different permissions -> No permission leakage
  it('CASE 11: No permission leakage between different staff accounts', async () => {
    const waiterMe = await fetchJson(`${BASE_URL}/api/iam/me?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    const chefMe = await fetchJson(`${BASE_URL}/api/iam/me?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${chefToken}` }
    });

    expect(waiterMe.status).toBe(200);
    expect(chefMe.status).toBe(200);

    const waiterPerms = new Set(waiterMe.data?.data?.permissions || []);
    const chefPerms = new Set(chefMe.data?.data?.permissions || []);

    // Chef has kitchen preparation permissions; Waiter does not have kitchen station queue manage
    expect(chefPerms.has('kds.view') || chefPerms.has('orders.prepare')).toBe(true);
    expect(waiterPerms.has('kds.queue.manage')).toBe(false);
  });

  // CASE 12: Root User customizes permissions across multiple categories + Station/Dept/Shift scopes
  it('CASE 12: Root User customizes discrete multi-category permissions with comprehensive scopes', async () => {
    const customPerms = [
      'orders.read', 'orders.create', 'orders.serve',
      'kds.view', 'kds.orders.accept',
      'service_requests.read', 'service_requests.resolve',
      'menu.read', 'menu.availability.update',
      'tables.read', 'tables.status.update',
      'billing.read', 'billing.create', 'billing.print', 'billing.discount',
      'reports.daily', 'inventory.read', 'audit.read'
    ];

    const res = await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/access`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        roleId: 'CUSTOM',
        branchId: 'ALL',
        floorScope: 'Ground Floor',
        tableScope: '1, 2, 3, 4',
        stationScope: 'TANDOOR',
        departmentScope: 'Kitchen',
        shiftScope: 'Morning',
        permissions: customPerms,
        reason: 'Granular permissions customization by Root Owner'
      })
    });

    expect(res.status).toBe(200);
    expect(res.data?.success).toBe(true);
    expect(res.data?.data?.totalPermissionsCount).toBe(customPerms.length);
    expect(res.data?.data?.effectivePermissions).toEqual(expect.arrayContaining(customPerms));

    // Verify effective permissions for user
    const meRes = await fetchJson(`${BASE_URL}/api/iam/me?restaurantId=${punjabRestId}`, {
      headers: { Authorization: `Bearer ${waiterToken}` }
    });
    expect(meRes.status).toBe(200);
    expect(meRes.data?.data?.permissions).toEqual(expect.arrayContaining(customPerms));
  });

  // CASE 13: Provision / Attach User ID to Restaurant
  it('CASE 13: Attach provisioned user account to restaurant with initial discrete permissions', async () => {
    const res = await fetchJson(`${BASE_URL}/api/iam/staff/attach`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        userIdOrEmail: 'inventory.anita@punjabheritage.in',
        roleId: 'WAITER',
        designation: 'Floor Steward Trainee',
        tableScope: '5, 6, 7',
        permissions: ['orders.read', 'service_requests.read', 'tables.read', 'menu.read'],
        reason: 'Staff account attached with custom permissions'
      })
    });


    expect(res.status).toBe(200);
    expect(res.data?.success).toBe(true);
    expect(res.data?.data?.totalPermissionsCount).toBe(4);
  });



  afterAll(async () => {
    // Reset Waiter access to standard baseline with ALL tables for other test suites
    await fetchJson(`${BASE_URL}/api/iam/staff/${waiterUserId}/access`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        restaurantId: punjabRestId,
        roleId: 'WAITER',
        tableScope: 'ALL',
        permissions: [
          'orders.read', 'orders.create', 'orders.update', 'orders.serve',
          'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve', 'service_requests.create',
          'tables.read', 'menu.read', 'billing.read', 'billing.create', 'billing.print'
        ],
        reason: 'Restored baseline for ecosystem suite'
      })
    });
  });
});

