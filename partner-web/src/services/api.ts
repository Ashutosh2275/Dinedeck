// API Service for DINEDECK Partner Web
import {
  AuthData,
  Order,
  ServiceCall,
  MenuItem,
  MenuCategory,
  TableItem,
  StaffMember,
  FranchiseLocation,
  AuditLog,
  ShiftOverview,
  PermissionCategory,
  PermissionItem,
  RoleTemplateItem,
  KdsTicketCard,
  KdsStationSummary,
  KdsKitchenAnalytics,
  KitchenKdsSetting
} from '../types';



const resolveDefaultBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:8080/api`;
    }
  }
  return 'http://127.0.0.1:8080/api';
};

class ApiService {
  private baseUrl: string = resolveDefaultBaseUrl();
  private token: string | null = localStorage.getItem('dinedeck_partner_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('dinedeck_partner_token', token);
    } else {
      localStorage.removeItem('dinedeck_partner_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: json.message || json.error || `Server error (${response.status})`,
          error: json
        };
      }
      return json;
    } catch (err: any) {
      // Loopback fallback: If 127.0.0.1 or localhost fails, try alternative local loopback address
      if (this.baseUrl.includes('127.0.0.1:8080') || this.baseUrl.includes('localhost:8080')) {
        const altBaseUrl = this.baseUrl.includes('127.0.0.1:8080')
          ? this.baseUrl.replace('127.0.0.1:8080', 'localhost:8080')
          : this.baseUrl.replace('localhost:8080', '127.0.0.1:8080');

        try {
          const altResponse = await fetch(`${altBaseUrl}${endpoint}`, { ...options, headers });
          const altJson = await altResponse.json();
          this.baseUrl = altBaseUrl;
          if (!altResponse.ok) {
            return {
              success: false,
              message: altJson.message || altJson.error || `Server error (${altResponse.status})`,
              error: altJson
            };
          }
          return altJson;
        } catch {
          // Both loopback attempts failed
        }
      }

      const isNetworkError =
        err?.name === 'TypeError' ||
        err?.message === 'Failed to fetch' ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('network');

      return {
        success: false,
        message: isNetworkError
          ? 'Unable to connect to DineDeck Backend Server on port 8080. Please ensure the backend server is running.'
          : (err.message || 'Network connection failed')
      };
    }
  }

  // Auth
  async login(email: string, password: string = 'Dinedeck@2026') {
    const res = await this.request<AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success && res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res;
  }

  async fetchMe() {
    return this.request<AuthData>('/auth/me');
  }

  // Operational Overview
  async fetchOverview(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<ShiftOverview>(`/staff/overview${q}`);
  }

  // Orders / KDS
  async fetchOrders(restaurantId?: string, status?: string) {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    if (status && status !== 'ALL') params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<Order[]>(`/staff/orders${q}`);
  }

  async updateOrderStatus(orderId: string, status: string, remarks?: string) {
    return this.request<Order>(`/staff/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks })
    });
  }

  async placeOrder(data: { restaurantId: string; tableNumber: string; items: any[]; specialNotes?: string }) {
    return this.request<Order>('/staff/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Service Calls
  async fetchServiceCalls(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<ServiceCall[]>(`/staff/service-requests${q}`);
  }

  async createServiceCall(data: { restaurantId: string; tableNumber: string; type: string; notes?: string }) {
    return this.request<ServiceCall>('/staff/service-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateServiceCall(callId: string, status: 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED') {
    return this.request<ServiceCall>(`/staff/service-requests/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Menu & 86 Item Availability
  async fetchMenu(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<MenuCategory[]>(`/staff/menu${q}`);
  }

  async toggleItemAvailability(itemId: string, isAvailable: boolean) {
    return this.request<MenuItem>(`/staff/menu/items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable })
    });
  }

  async toggleItemBestseller(itemId: string, isBestseller: boolean) {
    return this.request<MenuItem>(`/staff/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isBestseller })
    });
  }

  async updateMenuItem(itemId: string, data: Partial<MenuItem> & { categoryId?: string }) {
    return this.request<MenuItem>(`/staff/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async createMenuItem(data: Partial<MenuItem> & { categoryId: string; restaurantId?: string }) {
    return this.request<MenuItem>('/staff/menu/items', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async uploadFoodItemImage(data: { imageBase64: string; restaurantId?: string; itemId?: string }) {
    return this.request<{
      imageUrl: string;
      thumbnailUrl: string;
      sizeBytes: number;
      sizeKb: number;
      format: string;
      width: number;
      height: number;
      message: string;
    }>('/upload/food-item-image', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async uploadFoodItemImageMultipart(file: File | Blob, restaurantId?: string, itemId?: string) {
    const formData = new FormData();
    formData.append('image', file);
    if (restaurantId) formData.append('restaurantId', restaurantId);
    if (itemId) formData.append('itemId', itemId);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}/upload/food-item-image`, {
      method: 'POST',
      headers,
      body: formData
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Image upload failed');
    }
    return json;
  }

  async updateItemPrice(itemId: string, data: { restaurantId: string; price: number; discountedPrice?: number | null }) {
    return this.request<MenuItem>(`/staff/menu/items/${itemId}/price`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Tables
  async fetchTables(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<TableItem[]>(`/staff/tables${q}`);
  }

  async toggleTableOccupancy(tableId: string, isOccupied: boolean) {
    return this.request<TableItem>(`/staff/tables/${tableId}/occupancy`, {
      method: 'PATCH',
      body: JSON.stringify({ isOccupied })
    });
  }

  async updateTableConfig(tableId: string, data: { floor?: string; capacity?: number; tableNumber?: string }) {
    return this.request<TableItem>(`/staff/tables/${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Staff IAM & Access Governance
  async fetchFranchises(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<FranchiseLocation[]>(`/iam/franchises${q}`);
  }

  async fetchStaff(restaurantId?: string, franchiseId?: string) {
    const params = new URLSearchParams();
    if (restaurantId) params.set('restaurantId', restaurantId);
    if (franchiseId && franchiseId !== 'ALL') params.set('branchId', franchiseId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<StaffMember[]>(`/iam/staff${q}`);
  }

  async fetchPermissions() {
    return this.request<{ categories: PermissionCategory[]; count: number; data: PermissionItem[] }>('/iam/permissions');
  }


  async fetchRoles(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<RoleTemplateItem[]>(`/iam/roles${q}`);
  }

  async updateStaffAccess(
    staffId: string,
    data: {
      restaurantId: string;
      roleId?: string;
      branchId?: string;
      floorScope?: string;
      tableScope?: string;
      stationScope?: string;
      departmentScope?: string;
      shiftScope?: string;
      permissions: string[];
      reason?: string;
    }
  ) {
    return this.request<{
      userId: string;
      roleId: string;
      addedPermissionsCount: number;
      removedPermissionsCount: number;
      retainedPermissionsCount: number;
      totalPermissionsCount: number;
    }>(`/iam/staff/${staffId}/access`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async attachStaffMember(data: {
    restaurantId: string;
    userIdOrEmail: string;
    roleId?: string;
    designation?: string;
    branchId?: string;
    floorScope?: string;
    tableScope?: string;
    stationScope?: string;
    departmentScope?: string;
    shiftScope?: string;
    permissions: string[];
    reason?: string;
  }) {
    return this.request<{
      userId: string;
      name: string;
      email: string;
      totalPermissionsCount: number;
    }>(`/iam/staff/attach`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }


  async updateStaffStatus(
    staffId: string,
    data: {
      status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
      restaurantId: string;
      reason?: string;
    }
  ) {
    return this.request<{
      userId: string;
      status: string;
      isActive: boolean;
    }>(`/iam/staff/${staffId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async assignStaffRole(staffId: string, data: { roleId: string; restaurantId?: string; branchId?: string; scopes?: any[] }) {
    return this.request(`/iam/staff/${staffId}/access`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async setStaffOverride(staffId: string, data: { permissionId: string; isGranted: boolean; restaurantId?: string }) {
    return this.request(`/iam/staff/${staffId}/overrides`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Audit Logs
  async fetchAuditLogs(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<AuditLog[]>(`/iam/audit-logs${q}`);
  }

  // ---------------------------------------------------------------------------
  // KDS PRODUCTION API ENGINE
  // ---------------------------------------------------------------------------
  async fetchKdsQueue(restaurantId?: string, params?: { stationCode?: string; status?: string; priority?: string; search?: string; dateFilter?: string }) {
    const searchParams = new URLSearchParams();
    if (restaurantId) searchParams.set('restaurantId', restaurantId);
    if (params?.stationCode) searchParams.set('stationCode', params.stationCode);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.dateFilter) searchParams.set('dateFilter', params.dateFilter);

    const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{
      tickets: KdsTicketCard[];
      stations: KdsStationSummary[];
      activeOrdersCount: number;
      preparingCount: number;
      readyCount: number;
      delayedCount: number;
      heldCount: number;
    }>(`/kds/queue${q}`);
  }

  async acceptKdsOrder(orderId: string, restaurantId?: string) {
    return this.request<{ order: any; kots: any[] }>(`/kds/orders/${orderId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId })
    });
  }

  async partialAcceptOrRejectKdsOrder(
    orderId: string,
    itemDecisions: Array<{ itemId: string; accepted: boolean; rejectReason?: string }>,
    restaurantId?: string
  ) {
    return this.request<{ order: any; kots: any[]; acceptedItems: any[]; rejectedItems: any[] }>(
      `/kds/orders/${orderId}/partial-decide`,
      {
        method: 'POST',
        body: JSON.stringify({ itemDecisions, restaurantId })
      }
    );
  }

  async undoKdsOrderAcceptance(orderId: string, restaurantId?: string) {
    return this.request<{ order: any }>(`/kds/orders/${orderId}/undo-accept`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId })
    });
  }

  async rejectKdsOrder(
    orderId: string,
    reason: string,
    restaurantId?: string,
    reasonCode?: string,
    customReason?: string
  ) {
    return this.request(`/kds/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, restaurantId, reasonCode, customReason })
    });
  }

  async updateKdsItemStatus(orderItemId: string, status: string, restaurantId?: string) {
    return this.request<{ item: any; allReady: boolean; orderUpdated: boolean }>(`/kds/items/${orderItemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, restaurantId })
    });
  }

  async holdKdsOrder(orderId: string, reason: string, restaurantId?: string) {
    return this.request(`/kds/orders/${orderId}/hold`, {
      method: 'POST',
      body: JSON.stringify({ reason, restaurantId })
    });
  }

  async resumeKdsOrder(orderId: string, restaurantId?: string) {
    return this.request(`/kds/orders/${orderId}/resume`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId })
    });
  }

  async refireKdsOrder(orderId: string, reason: string, itemIds?: string[], restaurantId?: string) {
    return this.request(`/kds/orders/${orderId}/refire`, {
      method: 'POST',
      body: JSON.stringify({ reason, itemIds, restaurantId })
    });
  }

  async recallKdsOrder(orderId: string, reason: string, restaurantId?: string) {
    return this.request(`/kds/orders/${orderId}/recall`, {
      method: 'POST',
      body: JSON.stringify({ reason, restaurantId })
    });
  }

  async expoPassKdsOrder(orderId: string, restaurantId?: string) {
    return this.request(`/kds/orders/${orderId}/expo-pass`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId })
    });
  }

  async notifyWaiterForKdsOrder(orderId: string, waiterId?: string) {
    return this.request(`/kds/orders/${orderId}/notify-waiter`, {
      method: 'POST',
      body: JSON.stringify({ waiterId })
    });
  }

  async markKdsOrderServed(orderId: string, restaurantId?: string) {
    return this.request(`/kds/orders/${orderId}/served`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId })
    });
  }

  async toggleMenuItem86(menuItemId: string, isAvailable: boolean, restaurantId?: string) {
    return this.request(`/kds/menu-items/${menuItemId}/86`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable, restaurantId })
    });
  }

  async reprintKotTicket(kotId: string, reason: string, restaurantId?: string) {
    return this.request<{ kot: any; thermalSlip: string }>(`/kds/kots/${kotId}/reprint`, {
      method: 'POST',
      body: JSON.stringify({ reason, restaurantId })
    });
  }

  async fetchKdsAnalytics(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<KdsKitchenAnalytics>(`/kds/analytics${q}`);
  }

  async fetchKdsStations(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<KdsStationSummary[]>(`/kds/stations${q}`);
  }

  async fetchKdsSettings(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<KitchenKdsSetting>(`/kds/settings${q}`);
  }

  async updateKdsSettings(restaurantId: string, data: Partial<KitchenKdsSetting>) {
    return this.request(`/kds/settings`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, restaurantId })
    });
  }

  // -----------------------------------------------------------
  // BILLING & POS WORKSTATION METHODS
  // -----------------------------------------------------------

  async fetchBillingSessions(restaurantId?: string, branchId?: string) {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    if (branchId && branchId !== 'ALL') params.append('branchId', branchId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ sessions: any[]; kpis: any }>(`/billing/sessions${q}`);
  }

  async fetchTableSessionBill(sessionId: string, restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<{ session: any; calculation: any; bill: any }>(`/billing/sessions/${sessionId}/bill${q}`);
  }

  async applyBillDiscount(billId: string, data: { discountType: string; discountValue: number; reason?: string; complimentaryReason?: string; restaurantId?: string }) {
    return this.request<{ bill: any; calculation: any }>(`/billing/bills/${billId}/discount`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async settleBill(billId: string, data: { method: string; amountPaid: number; referenceNumber?: string; note?: string; splitItems?: any[]; restaurantId?: string }) {
    return this.request<{ bill: any; payment: any; receiptText: string; calculation: any }>(`/billing/bills/${billId}/settle`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async voidBill(billId: string, reason: string, restaurantId?: string) {
    return this.request(`/billing/bills/${billId}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason, restaurantId })
    });
  }

  async reprintBillReceipt(billId: string, reason?: string, restaurantId?: string) {
    return this.request<{ bill: any; thermalSlip: string }>(`/billing/bills/${billId}/reprint`, {
      method: 'POST',
      body: JSON.stringify({ reason, restaurantId })
    });
  }

  async fetchBillingKpis(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<any>(`/billing/kpis${q}`);
  }

  async fetchBillingHistory(params: { restaurantId?: string; period?: string; search?: string; paymentMethod?: string; paymentStatus?: string }) {
    const p = new URLSearchParams();
    if (params.restaurantId) p.append('restaurantId', params.restaurantId);
    if (params.period) p.append('period', params.period);
    if (params.search) p.append('search', params.search);
    if (params.paymentMethod) p.append('paymentMethod', params.paymentMethod);
    if (params.paymentStatus) p.append('paymentStatus', params.paymentStatus);
    return this.request<any[]>(`/billing/history?${p.toString()}`);
  }

  async fetchCurrentShift(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<any>(`/billing/shifts/current${q}`);
  }

  async openCashierShift(data: { restaurantId?: string; branchId?: string; openingCash: number }) {
    return this.request<any>('/billing/shifts/open', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async recordCashMovement(data: { shiftId: string; type: 'CASH_IN' | 'CASH_OUT'; amount: number; notes: string }) {
    return this.request<any>('/billing/shifts/cash-movement', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async closeCashierShift(data: { shiftId: string; actualCash: number; notes?: string }) {
    return this.request<any>('/billing/shifts/close', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ---------------------------------------------------------------------------
  // TABLE SERVER AUTO-ALLOCATION & EXECUTIVE SURVEILLANCE
  // ---------------------------------------------------------------------------
  async fetchSurveillanceAllocations(restaurantId?: string) {
    const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return this.request<{
      restaurantId: string;
      totalTablesCount: number;
      occupiedTablesCount: number;
      readyOrdersCount: number;
      allocations: any[];
    }>(`/tables/surveillance/allocations${q}`);
  }

  async assignTableWaiter(tableId: string, data: { waiterId: string; waiterName: string; waiterRole?: string; restaurantId?: string }) {
    return this.request<{
      tableId: string;
      tableNumber: string;
      assignedServer: any;
    }>(`/tables/${tableId}/assign-waiter`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async markOrderServed(orderId: string, restaurantId?: string) {
    return this.request<{ success: boolean; data: any }>(`/kds/orders/${orderId}/served`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId })
    });
  }
}

export const api = new ApiService();



