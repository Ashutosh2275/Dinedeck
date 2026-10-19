package com.dinedeck.partner.data

import com.google.gson.annotations.SerializedName

// 1. Auth & IAM Models
data class PartnerAuthResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("message") val message: String? = null,
    @SerializedName("data") val data: PartnerAuthData? = null,
    @SerializedName("error") val error: Any? = null
)

data class PartnerAuthData(
    @SerializedName("user") val user: PartnerUser? = null,
    @SerializedName("restaurant") val restaurant: PartnerRestaurant? = null,
    @SerializedName("branch") val branch: PartnerBranch? = null,
    @SerializedName("assignedRoles") val assignedRoles: List<String> = emptyList(),
    @SerializedName("permissions") val permissions: List<String> = emptyList(),
    @SerializedName("scopes") val scopes: List<PartnerScope> = emptyList(),
    @SerializedName("accessToken") val accessToken: String? = null,
    @SerializedName("refreshToken") val refreshToken: String? = null
)

data class PartnerUser(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "Staff Member",
    @SerializedName("email") val email: String = "",
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("role") val role: String = "RESTAURANT_STAFF",
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("restaurantId") val restaurantId: String? = null
)

data class PartnerRestaurant(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "DineDeck Restaurant",
    @SerializedName("slug") val slug: String? = null,
    @SerializedName("city") val city: String = "Mumbai",
    @SerializedName("state") val state: String = "Maharashtra",
    @SerializedName("pincode") val pincode: String? = null,
    @SerializedName("fullAddress") val fullAddress: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("rating") val rating: Double = 4.8,
    @SerializedName("logoUrl") val logoUrl: String? = null,
    @SerializedName("coverImageUrl") val coverImageUrl: String? = null,
    @SerializedName("status") val status: String = "ACTIVE",
    @SerializedName("legalBusinessName") val legalBusinessName: String? = null,
    @SerializedName("gstin") val gstin: String? = null,
    @SerializedName("fssaiNumber") val fssaiNumber: String? = null,
    @SerializedName("commissionRatePercent") val commissionRatePercent: Double = 15.0,
    @SerializedName("cgstRatePercent") val cgstRatePercent: Double = 2.5,
    @SerializedName("sgstRatePercent") val sgstRatePercent: Double = 2.5,
    @SerializedName("serviceChargePercent") val serviceChargePercent: Double = 5.0
)

data class PartnerBranch(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "Main Branch",
    @SerializedName("address") val address: String? = null,
    @SerializedName("phone") val phone: String? = null
)

data class PartnerScope(
    @SerializedName("type") val type: String = "RESTAURANT", // RESTAURANT, BRANCH, FLOOR, TABLE, DEPARTMENT, SHIFT
    @SerializedName("value") val value: String = "ALL"
)

// 2. Orders & Kitchen Queue
data class PartnerOrder(
    @SerializedName("id") val id: String = "",
    @SerializedName("orderNumber") val orderNumber: String = "",
    @SerializedName("tableNumber") val tableNumber: String? = "1",
    @SerializedName("status") val status: String = "PLACED", // PLACED, CONFIRMED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
    @SerializedName("subtotal") val subtotal: Double = 0.0,
    @SerializedName("discountAmount") val discountAmount: Double = 0.0,
    @SerializedName("cgstAmount") val cgstAmount: Double = 0.0,
    @SerializedName("sgstAmount") val sgstAmount: Double = 0.0,
    @SerializedName("serviceCharge") val serviceCharge: Double = 0.0,
    @SerializedName("totalAmount") val totalAmount: Double = 0.0,
    @SerializedName("specialNotes") val specialNotes: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("items") val items: List<PartnerOrderItem> = emptyList(),
    @SerializedName("bills") val bills: List<PartnerBillSummary> = emptyList()
) {
    val displayTable: String get() = tableNumber ?: "1"
}

data class PartnerOrderItem(
    @SerializedName("id") val id: String? = null,
    @SerializedName("menuItemId") val menuItemId: String? = null,
    @SerializedName("name") val name: String = "Item",
    @SerializedName("variantName") val variantName: String? = null,
    @SerializedName("addonsSummary") val addonsSummary: String? = null,
    @SerializedName("quantity") val quantity: Int = 1,
    @SerializedName("unitPrice") val unitPrice: Double = 0.0,
    @SerializedName("totalPrice") val totalPrice: Double = 0.0
)

data class PartnerBillSummary(
    @SerializedName("id") val id: String = "",
    @SerializedName("billNumber") val billNumber: String = "",
    @SerializedName("paymentStatus") val paymentStatus: String = "PENDING", // PENDING, PAID
    @SerializedName("grandTotal") val grandTotal: Double = 0.0
)

// 3. Service Calls
data class PartnerServiceCall(
    @SerializedName("id") val id: String = "",
    @SerializedName("restaurantId") val restaurantId: String? = null,
    @SerializedName("tableNumber") val tableNumber: String? = null,
    @SerializedName("tableId") val tableId: String? = null,
    @SerializedName("type") val type: String? = null,
    @SerializedName("requestType") val requestType: String? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("customNote") val customNote: String? = null,
    @SerializedName("status") val status: String? = null, // PENDING, ACKNOWLEDGED, COMPLETED, CANCELLED, RESOLVED
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
) {
    val displayType: String
        get() {
            val raw = type ?: requestType ?: "CALL_WAITER"
            return when (raw.uppercase()) {
                "CALL_WAITER", "WAITER" -> "🛎️ Steward Requested"
                "WATER", "WATER_REFILL" -> "💧 Water Pitcher Refill"
                "BILL", "REQUEST_BILL" -> "🧾 Request Printed Bill"
                "CUTLERY", "EXTRA_CUTLERY" -> "🍴 Extra Cutlery & Napkins"
                "CLEAN_TABLE", "CLEANING" -> "🧹 Table Cleaning Needed"
                "EXTRA_PLATE" -> "🍽️ Extra Plates & Bowls"
                "HELP" -> "❓ Assistance Required"
                else -> "🛎️ Service Request ($raw)"
            }
        }

    val displayNotes: String
        get() = notes ?: customNote ?: "Customer requested waiter assistance at table"

    val displayTable: String
        get() = tableNumber ?: tableId ?: "1"

    val displayStatus: String
        get() = (status ?: "PENDING").uppercase()

    val isPending: Boolean
        get() = displayStatus == "PENDING"

    val isAcknowledged: Boolean
        get() = displayStatus == "ACKNOWLEDGED"

    val isResolved: Boolean
        get() = displayStatus in listOf("COMPLETED", "RESOLVED", "CANCELLED")
}

// 4. Menu & Item Availability
data class PartnerMenuCategory(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "Category",
    @SerializedName("displayOrder") val displayOrder: Int = 0,
    @SerializedName("items") val items: List<PartnerMenuItem> = emptyList()
)

data class PartnerMenuItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "Menu Item",
    @SerializedName("description") val description: String? = null,
    @SerializedName("price") val price: Double = 0.0,
    @SerializedName("discountedPrice") val discountedPrice: Double? = null,
    @SerializedName("imageUrl") val imageUrl: String? = null,
    @SerializedName("isVeg") val isVeg: Boolean = true,
    @SerializedName("isBestseller") val isBestseller: Boolean = false,
    @SerializedName("isAvailable") val isAvailable: Boolean = true,
    @SerializedName("preparationTime") val preparationTime: Int = 15
)

// 5. Shift & Operational Overview
data class PartnerShiftOverview(
    @SerializedName("restaurantId") val restaurantId: String? = null,
    @SerializedName("ordersToday") val ordersToday: Int = 0,
    @SerializedName("activeOrders") val activeOrders: Int = 0,
    @SerializedName("cookingQueue") val cookingQueue: Int = 0,
    @SerializedName("pendingServiceCalls") val pendingServiceCalls: Int = 0,
    @SerializedName("settledRevenue") val settledRevenue: Double = 0.0,
    @SerializedName("settledOrdersCount") val settledOrdersCount: Int = 0,
    @SerializedName("totalTaxes") val totalTaxes: Double = 0.0,
    @SerializedName("activeSessions") val activeSessions: Int = 0,
    @SerializedName("totalTables") val totalTables: Int = 0,
    @SerializedName("occupiedTables") val occupiedTables: Int = 0,
    @SerializedName("occupancyRatePercent") val occupancyRatePercent: Int = 0
) {
    val grossSales: Double get() = settledRevenue
    val ordersCount: Int get() = settledOrdersCount
    val taxes: Double get() = totalTaxes
}

// 6. Tables & Floor Status
data class PartnerTable(
    @SerializedName("id") val id: String = "",
    @SerializedName("tableNumber") val tableNumber: String = "1",
    @SerializedName("capacity") val capacity: Int = 4,
    @SerializedName("qrCodeToken") val qrCodeToken: String? = null,
    @SerializedName("isOccupied") val isOccupied: Boolean = false,
    @SerializedName("floor") val floor: String? = "Ground Floor",
    @SerializedName("branch") val branch: PartnerBranchSummary? = null,
    @SerializedName("sessions") val sessions: List<Any>? = null
) {
    val displayTable: String get() = tableNumber
}

data class PartnerBranchSummary(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "Branch"
)

// 7. Staff IAM & Access Control
data class PartnerStaffMember(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "Staff",
    @SerializedName("email") val email: String = "",
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("designation") val designation: String = "Staff",
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("effectivePermissions") val effectivePermissions: List<String> = emptyList(),
    @SerializedName("roles") val roles: List<PartnerUserRoleInfo> = emptyList(),
    @SerializedName("overrides") val overrides: List<PartnerPermissionOverride> = emptyList()
)


data class PartnerUserRoleInfo(
    @SerializedName("roleId") val roleId: String = "STAFF",
    @SerializedName("roleName") val roleName: String? = null,
    @SerializedName("scopes") val scopes: List<PartnerScope> = emptyList()
)

data class PartnerPermissionOverride(
    @SerializedName("permissionId") val permissionId: String = "",
    @SerializedName("isGranted") val isGranted: Boolean = true
)

data class PartnerAuditLog(
    @SerializedName("id") val id: String = "",
    @SerializedName("action") val action: String = "ACTION",
    @SerializedName("resource") val resource: String = "RESOURCE",
    @SerializedName("resourceId") val resourceId: String = "",
    @SerializedName("scope") val scope: String? = null,
    @SerializedName("result") val result: String = "SUCCESS",
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("actor") val actor: PartnerUserSummary? = null
)

data class PartnerUserSummary(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("role") val role: String? = null
)

// Generic API response
data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("message") val message: String? = null,
    @SerializedName("count") val count: Int? = null,
    @SerializedName("data") val data: T? = null,
    @SerializedName("error") val error: Any? = null
)

// 8. KDS Production Engine Models
data class PartnerKdsQueueData(
    @SerializedName("tickets") val tickets: List<PartnerKdsTicketCard> = emptyList(),
    @SerializedName("stations") val stations: List<PartnerKdsStationSummary> = emptyList(),
    @SerializedName("activeOrdersCount") val activeOrdersCount: Int = 0,
    @SerializedName("preparingCount") val preparingCount: Int = 0,
    @SerializedName("readyCount") val readyCount: Int = 0,
    @SerializedName("delayedCount") val delayedCount: Int = 0,
    @SerializedName("heldCount") val heldCount: Int = 0
)

data class PartnerKdsStationSummary(
    @SerializedName("id") val id: String = "",
    @SerializedName("code") val code: String = "MAIN",
    @SerializedName("name") val name: String = "Main Kitchen",
    @SerializedName("isExpo") val isExpo: Boolean = false,
    @SerializedName("activeTicketsCount") val activeTicketsCount: Int = 0,
    @SerializedName("preparingItemsCount") val preparingItemsCount: Int = 0,
    @SerializedName("readyItemsCount") val readyItemsCount: Int = 0,
    @SerializedName("printerStatus") val printerStatus: String = "ONLINE"
)

data class PartnerKdsItemDetail(
    @SerializedName("id") val id: String = "",
    @SerializedName("orderItemId") val orderItemId: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("quantity") val quantity: Int = 1,
    @SerializedName("variantName") val variantName: String? = null,
    @SerializedName("stationCode") val stationCode: String = "MAIN",
    @SerializedName("course") val course: String = "MAIN",
    @SerializedName("status") val status: String = "QUEUED",
    @SerializedName("dietaryAlerts") val dietaryAlerts: String? = null,
    @SerializedName("kitchenNotes") val kitchenNotes: String? = null,
    @SerializedName("isHeld") val isHeld: Boolean = false,
    @SerializedName("isRefire") val isRefire: Boolean = false
)

data class PartnerKdsTicketCard(
    @SerializedName("id") val id: String = "",
    @SerializedName("orderNumber") val orderNumber: String = "",
    @SerializedName("kotNumber") val kotNumber: String? = null,
    @SerializedName("restaurantId") val restaurantId: String = "",
    @SerializedName("tableNumber") val tableNumber: String = "1",
    @SerializedName("sessionId") val sessionId: String? = null,
    @SerializedName("customerName") val customerName: String? = "Guest",
    @SerializedName("status") val status: String = "PLACED",
    @SerializedName("priority") val priority: String = "NORMAL",
    @SerializedName("slaStatus") val slaStatus: String = "ON_TRACK",
    @SerializedName("createdAt") val createdAt: String = "",
    @SerializedName("elapsedMinutes") val elapsedMinutes: Int = 0,
    @SerializedName("dynamicEtaMinutes") val dynamicEtaMinutes: Int = 15,
    @SerializedName("remainingMinutes") val remainingMinutes: Int = 15,
    @SerializedName("items") val items: List<PartnerKdsItemDetail> = emptyList(),
    @SerializedName("totalItemsCount") val totalItemsCount: Int = 0,
    @SerializedName("readyItemsCount") val readyItemsCount: Int = 0,
    @SerializedName("isFullyReady") val isFullyReady: Boolean = false,
    @SerializedName("specialNotes") val specialNotes: String? = null,
    @SerializedName("dietaryAlerts") val dietaryAlerts: String? = null,
    @SerializedName("rejectionReason") val rejectionReason: String? = null,
    @SerializedName("rejectionReasonCode") val rejectionReasonCode: String? = null,
    @SerializedName("acceptanceDeadline") val acceptanceDeadline: String? = null,
    @SerializedName("rejectedAt") val rejectedAt: String? = null,
    @SerializedName("rejectedBy") val rejectedBy: String? = null,
    @SerializedName("isHeld") val isHeld: Boolean = false
)



// 9. Billing & Cashier Workstation Models
data class PartnerBillingKpis(
    @SerializedName("restaurantId") val restaurantId: String = "",
    @SerializedName("openTablesCount") val openTablesCount: Int = 0,
    @SerializedName("runningBillsCount") val runningBillsCount: Int = 0,
    @SerializedName("runningBillsTotalAmount") val runningBillsTotalAmount: Double = 0.0,
    @SerializedName("billsAwaitingPaymentCount") val billsAwaitingPaymentCount: Int = 0,
    @SerializedName("paidBillsTodayCount") val paidBillsTodayCount: Int = 0,
    @SerializedName("cashCollectedToday") val cashCollectedToday: Double = 0.0,
    @SerializedName("upiCollectedToday") val upiCollectedToday: Double = 0.0,
    @SerializedName("cardCollectedToday") val cardCollectedToday: Double = 0.0,
    @SerializedName("grossRevenueToday") val grossRevenueToday: Double = 0.0,
    @SerializedName("totalDiscountsToday") val totalDiscountsToday: Double = 0.0,
    @SerializedName("totalTaxesToday") val totalTaxesToday: Double = 0.0,
    @SerializedName("totalServiceChargeToday") val totalServiceChargeToday: Double = 0.0,
    @SerializedName("outstandingBalanceToday") val outstandingBalanceToday: Double = 0.0
)

data class PartnerTableDiningSession(
    @SerializedName("sessionId") val sessionId: String = "",
    @SerializedName("sessionToken") val sessionToken: String = "",
    @SerializedName("tableId") val tableId: String = "",
    @SerializedName("tableNumber") val tableNumber: String = "",
    @SerializedName("capacity") val capacity: Int = 2,
    @SerializedName("branchId") val branchId: String = "",
    @SerializedName("branchName") val branchName: String? = null,
    @SerializedName("restaurantId") val restaurantId: String = "",
    @SerializedName("guestName") val guestName: String? = null,
    @SerializedName("guestPhone") val guestPhone: String? = null,
    @SerializedName("startedAt") val startedAt: String = "",
    @SerializedName("durationMinutes") val durationMinutes: Int = 0,
    @SerializedName("status") val status: String = "ACTIVE",
    @SerializedName("totalOrdersCount") val totalOrdersCount: Int = 0,
    @SerializedName("runningGrandTotal") val runningGrandTotal: Double = 0.0,
    @SerializedName("billId") val billId: String? = null,
    @SerializedName("billNumber") val billNumber: String? = null,
    @SerializedName("serverName") val serverName: String? = "Ramesh Kumar"
)

data class PartnerBillingSessionsResponse(
    @SerializedName("sessions") val sessions: List<PartnerTableDiningSession> = emptyList()
)

data class PartnerBillItem(
    @SerializedName("name") val name: String = "",
    @SerializedName("quantity") val quantity: Int = 1,
    @SerializedName("unitPrice") val unitPrice: Double = 0.0,
    @SerializedName("totalPrice") val totalPrice: Double = 0.0,
    @SerializedName("variantName") val variantName: String? = null,
    @SerializedName("specialNotes") val specialNotes: String? = null
)

data class PartnerBillCalculation(
    @SerializedName("subtotal") val subtotal: Double = 0.0,
    @SerializedName("discountPercentage") val discountPercentage: Double = 0.0,
    @SerializedName("discountAmount") val discountAmount: Double = 0.0,
    @SerializedName("taxableAmount") val taxableAmount: Double = 0.0,
    @SerializedName("cgstAmount") val cgstAmount: Double = 0.0,
    @SerializedName("sgstAmount") val sgstAmount: Double = 0.0,
    @SerializedName("serviceChargeAmount") val serviceChargeAmount: Double = 0.0,
    @SerializedName("roundOffAmount") val roundOffAmount: Double = 0.0,
    @SerializedName("grandTotal") val grandTotal: Double = 0.0,
    @SerializedName("items") val items: List<PartnerBillItem> = emptyList()
)

data class PartnerSessionBillData(
    @SerializedName("session") val session: PartnerTableDiningSession? = null,
    @SerializedName("calculation") val calculation: PartnerBillCalculation? = null,
    @SerializedName("bill") val bill: PartnerBillSummary? = null
)

data class PartnerHistoricalPayment(
    @SerializedName("id") val id: String = "",
    @SerializedName("method") val method: String = "UPI",
    @SerializedName("amount") val amount: Double = 0.0,
    @SerializedName("referenceNumber") val referenceNumber: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class PartnerHistoricalBill(
    @SerializedName("billId") val billId: String = "",
    @SerializedName("billNumber") val billNumber: String? = null,
    @SerializedName("tableNumber") val tableNumber: String = "",
    @SerializedName("guestName") val guestName: String? = null,
    @SerializedName("guestPhone") val guestPhone: String? = null,
    @SerializedName("grandTotal") val grandTotal: Double = 0.0,
    @SerializedName("paymentMethod") val paymentMethod: String? = "UPI",
    @SerializedName("paymentStatus") val paymentStatus: String = "PAID",
    @SerializedName("settledAt") val settledAt: String? = null,
    @SerializedName("paidAt") val paidAt: String? = null,
    @SerializedName("createdAt") val createdAt: String = "",
    @SerializedName("settledBy") val settledBy: String? = null,
    @SerializedName("payments") val payments: List<PartnerHistoricalPayment> = emptyList()
)

data class PartnerSplitPaymentItem(
    val label: String,
    val amount: Double,
    val method: String
)
