// Admin API Service for DINEDECK Control Center Web
import {
  AdminRestaurant,
  AdminBranch,
  AdminTable,
  AdminOrder,
  AdminBill,
  AdminPayment,
  AdminSettlement,
  AdminComplianceRecord,
  AdminUser,
  AdminAuditLog,
  PlatformOverviewData,
  SystemHealthMetrics,
  SupportTicket,
  PlatformNotification,
  FeatureFlag,
  ApprovalRequest,
  ReconciliationException,
  RestaurantRiskScore,
  DeviceHardware,
  ConfigVersion
} from '../types';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.protocol}//${window.location.hostname}:8080/api`
    : 'http://localhost:8080/api');

class AdminApiService {
  private token: string | null = localStorage.getItem('dinedeck_admin_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('dinedeck_admin_token', token);
    } else {
      localStorage.removeItem('dinedeck_admin_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; count?: number; total?: number; message?: string; error?: any }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: json.message || json.error || `HTTP error ${response.status}`,
          error: json
        };
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network connection failed'
      };
    }
  }

  // 1. Auth
  async login(email: string = 'superadmin@dinedeck.in', password: string = 'SuperAdmin@2026') {
    const res = await this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success && res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res;
  }

  // 2. Overview & Analytics
  async fetchOverview(range: string = 'all') {
    return this.request<PlatformOverviewData>(`/admin/overview?range=${range}`);
  }

  // 3. Global Platform Search
  async globalSearch(query: string) {
    return this.request<any>(`/admin/search?q=${encodeURIComponent(query)}`);
  }

  // 4. Merchants & Tenants (360 Profile)
  async fetchRestaurants(query: { status?: string; city?: string; search?: string } = {}) {
    const params = new URLSearchParams();
    if (query.status) params.append('status', query.status);
    if (query.city) params.append('city', query.city);
    if (query.search) params.append('search', query.search);
    return this.request<AdminRestaurant[]>(`/admin/restaurants?${params.toString()}`);
  }

  async fetchRestaurantDetail(id: string) {
    return this.request<AdminRestaurant>(`/admin/restaurants/${id}`);
  }

  async onboardRestaurant(data: any) {
    return this.request<any>('/admin/restaurants/onboard', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateRestaurantProfile(id: string, data: any) {
    return this.request(`/admin/restaurants/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateRestaurantStatus(id: string, status: string, reason?: string) {
    return this.request(`/admin/restaurants/${id}/lifecycle`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  }

  async updateRestaurantConfig(id: string, config: any) {
    return this.request(`/admin/restaurants/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  }

  // 5. Branches, Tables & QR Governance
  async fetchBranches(restaurantId: string) {
    return this.request<AdminBranch[]>(`/admin/restaurants/${restaurantId}/branches`);
  }

  async createBranch(restaurantId: string, data: { name: string; address?: string; phone?: string }) {
    return this.request<AdminBranch>(`/admin/restaurants/${restaurantId}/branches`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createTable(branchId: string, data: { tableNumber: string; capacity: number }) {
    return this.request<AdminTable>(`/admin/branches/${branchId}/tables`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async regenerateTableQr(tableId: string) {
    return this.request(`/admin/tables/${tableId}/regenerate-qr`, {
      method: 'POST'
    });
  }

  // 6. Menu Management
  async createCategory(restaurantId: string, data: { name: string; displayOrder?: number }) {
    return this.request(`/admin/restaurants/${restaurantId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createMenuItem(categoryId: string, data: any) {
    return this.request(`/admin/categories/${categoryId}/items`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateMenuItem(itemId: string, data: any) {
    return this.request(`/admin/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // 7. Live Operations, KDS & Orders
  async fetchLiveOperations() {
    return this.request<any>('/admin/operations/live');
  }

  async fetchOrders(query: { status?: string; restaurantId?: string; search?: string } = {}) {
    const params = new URLSearchParams();
    if (query.status) params.append('status', query.status);
    if (query.restaurantId) params.append('restaurantId', query.restaurantId);
    if (query.search) params.append('search', query.search);
    return this.request<AdminOrder[]>(`/admin/orders?${params.toString()}`);
  }

  async fetchOrderDetail(id: string) {
    return this.request<any>(`/admin/orders/${id}`);
  }

  async correctOrder(id: string, data: { status?: string; remarks: string }) {
    return this.request(`/admin/orders/${id}/correct`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // 8. Onboarding & Approvals Queue
  async fetchApprovals() {
    return this.request<{
      pendingRestaurants: ApprovalRequest[];
      pendingSettlements: ApprovalRequest[];
      refundDisputes: ApprovalRequest[];
    }>('/admin/approvals');
  }

  async reviewApproval(id: string, data: { type: string; decision: 'APPROVED' | 'REJECTED'; reason: string; targetId?: string }) {
    return this.request(`/admin/approvals/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 9. Finance, Settlements & Reconciliation
  async fetchPayments(query: { status?: string; search?: string } = {}) {
    const params = new URLSearchParams();
    if (query.status) params.append('status', query.status);
    if (query.search) params.append('search', query.search);
    return this.request<AdminPayment[]>(`/admin/payments?${params.toString()}`);
  }

  async processRefund(paymentId: string, data: { reason: string; amount?: number }) {
    return this.request(`/admin/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async fetchSettlements(restaurantId?: string) {
    const url = restaurantId ? `/admin/settlements?restaurantId=${restaurantId}` : '/admin/settlements';
    return this.request<AdminSettlement[]>(url);
  }

  async generateSettlement(restaurantId: string) {
    return this.request<AdminSettlement>('/admin/settlements/generate', {
      method: 'POST',
      body: JSON.stringify({ restaurantId })
    });
  }

  async processSettlementPayout(id: string, payoutRef?: string) {
    return this.request(`/admin/settlements/${id}/payout`, {
      method: 'POST',
      body: JSON.stringify({ payoutRef: payoutRef || `NEFT_REL_${Date.now()}` })
    });
  }

  async fetchReconciliationExceptions() {
    return this.request<{
      totalExceptions: number;
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      exceptions: ReconciliationException[];
    }>('/admin/reconciliation/exceptions');
  }

  async resolveReconciliationException(data: { exceptionId: string; action: string; notes: string }) {
    return this.request('/admin/reconciliation/resolve', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 10. Risk Assessment Engine
  async fetchRiskScores() {
    return this.request<RestaurantRiskScore[]>('/admin/risk/analysis');
  }

  // 11. Bulk Operations Engine
  async executeBulkOperation(data: {
    action: 'BULK_ACTIVATE' | 'BULK_SUSPEND' | 'BULK_SET_COMMISSION' | 'BULK_COMPLIANCE_CHECK' | 'BULK_NOTIFY';
    targetRestaurantIds: string[];
    payload?: any;
    reason: string;
  }) {
    return this.request('/admin/bulk/execute', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 12. Device Fleet & Hardware Integrations
  async fetchDeviceFleet() {
    return this.request<DeviceHardware[]>('/admin/devices');
  }

  async triggerDeviceDiagnostic(id: string, action: 'PING' | 'TEST_PRINT' | 'FORCE_LOGOUT') {
    return this.request(`/admin/devices/${id}/diagnostic`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }

  // 13. Feature Flags & Canary Rollout
  async fetchFeatureFlags() {
    return this.request<FeatureFlag[]>('/admin/feature-flags');
  }

  async updateFeatureFlag(key: string, data: { globalEnabled?: boolean; rolloutPercent?: number; tenantOverrides?: any }) {
    return this.request(`/admin/feature-flags/${key}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // 14. Configuration Versioning & Rollback
  async fetchConfigVersions(restaurantId: string) {
    return this.request<{
      restaurantId: string;
      currentConfig: any;
      versions: ConfigVersion[];
    }>(`/admin/config-versions/${restaurantId}`);
  }

  async rollbackConfigVersion(restaurantId: string, versionAuditId: string) {
    return this.request(`/admin/config-versions/${restaurantId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ versionAuditId })
    });
  }

  // 15. Compliance Records
  async fetchComplianceRecords() {
    return this.request<AdminComplianceRecord[]>('/admin/compliance');
  }

  async reviewCompliance(idOrPayload: string | { restaurantId: string; status: string; notes?: string }, status?: string, notes?: string) {
    const id = typeof idOrPayload === 'string' ? idOrPayload : idOrPayload.restaurantId;
    const st = typeof idOrPayload === 'string' ? status : idOrPayload.status;
    const nt = typeof idOrPayload === 'string' ? notes : idOrPayload.notes;
    return this.request(`/admin/compliance/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status: st, notes: nt })
    });
  }


  // 16. IAM, Staff & Permissions
  async fetchUsers() {
    return this.request<AdminUser[]>('/admin/iam/users');
  }

  async updateUserStatus(userId: string, status: string) {
    return this.request(`/admin/iam/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async createStaff(restaurantId: string, data: { name: string; email: string; phone?: string; role: string; password?: string }) {
    return this.request(`/admin/restaurants/${restaurantId}/staff`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async setStaffPermissionOverride(staffId: string, data: { permissionId?: string; resource?: string; action?: string; effect: 'ALLOW' | 'DENY'; restaurantId?: string; branchId?: string }) {
    return this.request(`/admin/staff/${staffId}/permissions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async fetchBills(query: { restaurantId?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    if (query.restaurantId) params.append('restaurantId', query.restaurantId);
    if (query.status) params.append('status', query.status);
    return this.request<AdminBill[]>(`/admin/finance/bills?${params.toString()}`);
  }

  async processSettlement(settlementId: string) {
    return this.processSettlementPayout(settlementId);
  }

  // 17. Audit Logs & System Health
  async fetchAuditLogs(query: { action?: string; resource?: string } = {}) {
    const params = new URLSearchParams();
    if (query.action) params.append('action', query.action);
    if (query.resource) params.append('resource', query.resource);
    return this.request<AdminAuditLog[]>(`/admin/security/audit-logs?${params.toString()}`);
  }

  async fetchSystemHealth() {
    return this.request<SystemHealthMetrics>('/admin/system/health');
  }

  async triggerKillswitch(action: 'PAUSE_ALL' | 'RESTORE_ALL' | 'PAUSE_RESTAURANT', restaurantId?: string, reason?: string) {
    return this.request('/admin/system/killswitch', {
      method: 'POST',
      body: JSON.stringify({ action, restaurantId, reason })
    });
  }

  // 18. Support & Incident Desk
  async fetchSupportTickets(query: { status?: string; priority?: string } = {}) {
    const params = new URLSearchParams();
    if (query.status) params.append('status', query.status);
    if (query.priority) params.append('priority', query.priority);
    return this.request<SupportTicket[]>(`/admin/support/tickets?${params.toString()}`);
  }

  async createSupportTicket(data: any) {
    return this.request('/admin/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSupportTicket(id: string, data: { status?: string; internalNotes?: string; assignee?: string }) {
    return this.request(`/admin/support/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // 19. Authoritative Exports
  async exportData(entity: 'FINANCIAL' | 'RESTAURANTS' | 'ORDERS' | 'COMPLIANCE', format: 'CSV' | 'JSON' = 'CSV') {
    window.open(`${API_BASE_URL}/admin/reports/export?entity=${entity}&format=${format}`, '_blank');
  }

  // 20. Customer Frontend CMS & Promotional Scrolls
  async fetchBanners(activeOnly: boolean = false) {
    return this.request<any[]>(`/banners?activeOnly=${activeOnly}`);
  }

  async createBanner(data: any) {
    return this.request('/banners', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBanner(id: string, data: any) {
    return this.request(`/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleBanner(id: string) {
    return this.request(`/banners/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  async deleteBanner(id: string) {
    return this.request(`/banners/${id}`, {
      method: 'DELETE'
    });
  }
}

export const adminApi = new AdminApiService();

