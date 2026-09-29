package com.dinedeck.admin.data

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    val success: Boolean = false,
    val message: String? = null,
    val data: T? = null,
    val count: Int? = null,
    val total: Int? = null,
    val error: Any? = null
)

data class LoginResponse(
    val user: AdminUser? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null
)

data class AdminUser(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = ""
)

data class OverviewData(
    val range: String = "all",
    val restaurants: RestaurantMetrics? = null,
    val customers: CustomerMetrics? = null,
    val operations: OperationsMetrics? = null,
    val finance: FinanceMetrics? = null
)

data class RestaurantMetrics(
    val total: Int = 0,
    val active: Int = 0,
    val pendingReview: Int = 0,
    val suspended: Int = 0,
    val branches: Int = 0
)

data class CustomerMetrics(
    val total: Int = 0,
    val staffMembers: Int = 0,
    val activeDiningSessions: Int = 0
)

data class OperationsMetrics(
    val totalOrders: Int = 0,
    val activeCookingTickets: Int = 0,
    val openServiceRequests: Int = 0,
    val openSupportTickets: Int = 0
)

data class FinanceMetrics(
    val grossOrderValue: Double = 0.0,
    val platformCommissionRevenue: Double = 0.0,
    val netRestaurantPayable: Double = 0.0,
    val totalTaxCollected: Double = 0.0,
    val totalDiscounts: Double = 0.0,
    val successfulPayments: Int = 0,
    val failedPayments: Int = 0,
    val refundsCount: Int = 0
)

data class AdminRestaurant(
    val id: String = "",
    val name: String = "",
    val slug: String = "",
    val cuisineType: String = "",
    val city: String = "",
    val state: String? = null,
    val fullAddress: String? = null,
    val phone: String? = null,
    val costForTwo: Double? = null,
    val description: String? = null,
    val rating: Double = 4.5,
    val reviewCount: Int = 0,
    val isActive: Boolean = true,
    val status: String = "ACTIVE",
    val gstin: String? = null,
    val panNumber: String? = null,
    val fssaiNumber: String? = null,
    val bankAccountNumber: String? = null,
    val bankIfsc: String? = null,
    val legalBusinessName: String? = null,
    val commissionRatePercent: Double = 15.0,
    val cgstRatePercent: Double = 2.5,
    val sgstRatePercent: Double = 2.5,
    val serviceChargePercent: Double = 5.0,
    val packagingCharge: Double = 0.0,
    val branches: List<AdminBranch>? = null,
    val categories: List<AdminMenuCategory>? = null,
    val staff: List<AdminStaffMember>? = null,
    val settlements: List<AdminSettlement>? = null,
    val supportTickets: List<AdminSupportTicket>? = null,
    val analytics: RestaurantAnalyticsSummary? = null,
    val _count: RestaurantCounts? = null
)

data class RestaurantCounts(
    val orders: Int = 0,
    val reviews: Int = 0,
    val items: Int = 0,
    val staff: Int = 0
)

data class RestaurantAnalyticsSummary(
    val totalRevenue: Double = 0.0,
    val totalTaxes: Double = 0.0,
    val commissionRate: Double = 15.0
)

data class AdminBranch(
    val id: String = "",
    val name: String = "",
    val address: String = "",
    val phone: String = "",
    val isActive: Boolean = true,
    val tables: List<AdminTable>? = null
)

data class AdminTable(
    val id: String = "",
    val tableNumber: Any? = null,
    val capacity: Int = 4,
    val qrCodeToken: String? = null,
    val isOccupied: Boolean = false
) {
    val tableNumberStr: String get() = tableNumber?.toString() ?: "1"
}

data class AdminMenuCategory(
    val id: String = "",
    val name: String = "",
    val displayOrder: Int = 0,
    val items: List<AdminMenuItem>? = null
)

data class AdminMenuItem(
    val id: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val description: String? = null,
    val isVeg: Boolean = true,
    val isAvailable: Boolean = true
)

data class AdminStaffMember(
    val id: String = "",
    val userId: String = "",
    val restaurantId: String = "",
    val branchId: String? = null,
    val role: String = "WAITER",
    val isActive: Boolean = true,
    val user: AdminUserBrief? = null
)

data class LiveOperationsData(
    val timestamp: String? = null,
    val counts: LiveOpsCounts? = null,
    val liveOrders: List<AdminOrder>? = null,
    val pendingRequests: List<AdminServiceRequest>? = null
)

data class LiveOpsCounts(
    val activeKitchenOrders: Int = 0,
    val pendingServiceCalls: Int = 0,
    val activeDiningSessions: Int = 0,
    val openIncidents: Int = 0
)

data class AdminOrder(
    val id: String = "",
    val orderNumber: Any? = null,
    val tableNumber: Any? = null,
    val status: String = "PLACED",
    val subtotal: Double = 0.0,
    val totalAmount: Double = 0.0,
    val createdAt: String? = null,
    val restaurant: AdminRestaurantBrief? = null,
    val items: List<AdminOrderItem>? = null
) {
    val orderNumberStr: String get() = orderNumber?.toString() ?: "0"
    val tableNumberStr: String get() = tableNumber?.toString() ?: "0"
}

data class AdminRestaurantBrief(
    val id: String = "",
    val name: String = "",
    val city: String? = null,
    val status: String? = null,
    val cuisineType: String? = null
)

data class AdminOrderItem(
    val id: String = "",
    val name: String = "",
    val quantity: Int = 1,
    val unitPrice: Double = 0.0,
    val totalPrice: Double = 0.0
)

data class AdminServiceRequest(
    val id: String = "",
    val tableNumber: Any? = null,
    val type: String = "WATER",
    val status: String = "PENDING",
    val notes: String? = null,
    val createdAt: String? = null,
    val restaurant: AdminRestaurantBrief? = null
) {
    val tableNumberStr: String get() = tableNumber?.toString() ?: "0"
}

data class AdminPayment(
    val id: String = "",
    val billId: String = "",
    val amount: Double = 0.0,
    val method: String = "UPI",
    val status: String = "PAID",
    val transactionRef: String? = null,
    val gatewayPaymentId: String? = null,
    val createdAt: String? = null,
    val bill: AdminBillBrief? = null
)

data class AdminBillBrief(
    val id: String = "",
    val billNumber: Any? = null,
    val grandTotal: Double = 0.0,
    val paymentStatus: String = "PAID",
    val restaurant: AdminRestaurantBrief? = null
)

data class AdminSettlement(
    val id: String = "",
    val settlementNumber: String = "",
    val restaurantId: String = "",
    val grossOrderValue: Double = 0.0,
    val dinedeckCommission: Double = 0.0,
    val taxCollected: Double = 0.0,
    val netPayable: Double = 0.0,
    val status: String = "PENDING",
    val payoutRef: String? = null,
    val createdAt: String? = null,
    val settledAt: String? = null,
    val restaurant: AdminRestaurantBrief? = null
)

data class AdminCustomer(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String? = null,
    val createdAt: String? = null,
    val _count: CustomerCounts? = null
)

data class CustomerCounts(
    val orders: Int = 0,
    val diningSessions: Int = 0,
    val reviews: Int = 0
)

data class AdminCoupon(
    val id: String = "",
    val code: String = "",
    val discountPercent: Double = 0.0,
    val maxDiscount: Double = 0.0,
    val minOrderAmount: Double = 0.0,
    val validUntil: String? = null,
    val isActive: Boolean = true,
    val restaurant: AdminRestaurantBrief? = null
)

data class AdminSupportTicket(
    val id: String = "",
    val ticketNumber: String = "",
    val title: String = "",
    val description: String = "",
    val category: String = "OPERATIONAL",
    val priority: String = "MEDIUM",
    val status: String = "OPEN",
    val assignee: String? = null,
    val internalNotes: String? = null,
    val createdAt: String? = null,
    val restaurant: AdminRestaurantBrief? = null
)

data class AdminAuditLog(
    val id: String = "",
    val actorRole: String? = null,
    val action: String = "",
    val resource: String = "",
    val resourceId: String = "",
    val scope: String? = null,
    val result: String = "SUCCESS",
    val createdAt: String? = null,
    val actor: AdminUserBrief? = null
)

data class AdminUserBrief(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String? = null,
    val role: String? = null
)

data class SystemHealthData(
    val status: String = "HEALTHY",
    val uptimeSeconds: Long = 0,
    val dbLatencyMs: Double = 0.0,
    val activeWebSocketClients: Int = 0,
    val memory: MemoryUsageData? = null
)

data class MemoryUsageData(
    val heapUsedMb: Double = 0.0,
    val heapTotalMb: Double = 0.0,
    val rssMb: Double = 0.0
)

data class GlobalSearchResult(
    val restaurants: List<AdminRestaurantBrief>? = null,
    val orders: List<AdminOrder>? = null,
    val customers: List<AdminCustomer>? = null,
    val payments: List<AdminPayment>? = null
)
