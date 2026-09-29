package com.dinedeck.app.domain.model

import java.util.UUID

enum class UserRole {
    CUSTOMER, RESTAURANT_STAFF, ADMIN
}

data class User(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val email: String,
    val phone: String = "",
    val avatarUrl: String = "",
    val role: UserRole = UserRole.CUSTOMER,
    val token: String = ""
)

data class Restaurant(
    val id: String,
    val name: String,
    val logoUrl: String,
    val coverImageUrl: String,
    val address: String,
    val phone: String,
    val rating: Double,
    val reviewCount: Int,
    val cuisines: List<String>,
    val priceRange: String, // e.g. "$$"
    val openingHours: String,
    val description: String,
    val isFavorite: Boolean = false,
    val isOpen: Boolean = true,
    val hasOffers: Boolean = false,
    val offerTag: String = ""
)

data class RestaurantBranch(
    val id: String,
    val restaurantId: String,
    val name: String,
    val address: String,
    val phone: String,
    val tableCount: Int
)

data class DiningTable(
    val id: String,
    val restaurantId: String,
    val branchId: String,
    val tableNumber: Int,
    val capacity: Int,
    val qrCodeUrl: String,
    val isOccupied: Boolean = false
)

data class MenuCategory(
    val id: String,
    val restaurantId: String,
    val name: String,
    val description: String,
    val iconName: String = "",
    val displayOrder: Int = 0
)

data class MenuVariant(
    val id: String,
    val name: String,
    val priceDelta: Double
)

data class MenuAddon(
    val id: String,
    val name: String,
    val price: Double
)

data class MenuItem(
    val id: String,
    val restaurantId: String,
    val categoryId: String,
    val categoryName: String,
    val name: String,
    val description: String,
    val price: Double,
    val discountPercentage: Double = 0.0,
    val imageUrl: String,
    val isVeg: Boolean,
    val isSpicy: Boolean = false,
    val isBestseller: Boolean = false,
    val isAvailable: Boolean = true,
    val rating: Double = 4.5,
    val allergens: List<String> = emptyList(),
    val ingredients: List<String> = emptyList(),
    val variants: List<MenuVariant> = emptyList(),
    val addons: List<MenuAddon> = emptyList()
) {
    val finalPrice: Double
        get() = if (discountPercentage > 0) price * (1 - discountPercentage / 100.0) else price
}

data class CartItem(
    val cartItemId: String = UUID.randomUUID().toString(),
    val menuItem: MenuItem,
    val selectedVariant: MenuVariant? = null,
    val selectedAddons: List<MenuAddon> = emptyList(),
    val specialInstructions: String = "",
    val quantity: Int = 1
) {
    val unitPrice: Double
        get() {
            val variantExtra = selectedVariant?.priceDelta ?: 0.0
            val addonsExtra = selectedAddons.sumOf { it.price }
            return menuItem.finalPrice + variantExtra + addonsExtra
        }

    val itemTotalPrice: Double
        get() = unitPrice * quantity
}

data class Cart(
    val restaurantId: String = "",
    val restaurantName: String = "",
    val branchId: String = "",
    val tableId: String = "",
    val tableNumber: Int = 0,
    val sessionId: String = "",
    val items: List<CartItem> = emptyList(),
    val appliedCoupon: Offer? = null,
    val taxRate: Double = 0.05, // 5% GST
    val serviceChargeRate: Double = 0.05 // 5% Service Charge
) {
    val subtotal: Double
        get() = items.sumOf { it.itemTotalPrice }

    val discountAmount: Double
        get() = 0.0

    val taxableSubtotal: Double
        get() = subtotal

    val taxes: Double
        get() = taxableSubtotal * taxRate

    val serviceCharge: Double
        get() = taxableSubtotal * serviceChargeRate

    val finalTotal: Double
        get() = taxableSubtotal + taxes + serviceCharge
}

enum class OrderStatus {
    PLACED, CONFIRMED, PREPARING, READY, SERVED, COMPLETED, CANCELLED, REJECTED
}

enum class PaymentStatus {
    PENDING, INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED
}

data class PaymentInfo(
    val id: String,
    val transactionRef: String,
    val method: String,
    val status: String,
    val amount: Double,
    val paidAt: String? = null
)

data class BillDetails(
    val id: String,
    val restaurantId: String,
    val restaurantName: String,
    val orderId: String,
    val orderNumber: String,
    val tableNumber: String,
    val billNumber: String,
    val subtotal: Double,
    val discountAmount: Double = 0.0,
    val cgstAmount: Double = 0.0,
    val sgstAmount: Double = 0.0,
    val serviceCharge: Double = 0.0,
    val roundOffAmount: Double = 0.0,
    val grandTotal: Double,
    val paymentStatus: PaymentStatus = PaymentStatus.PENDING,
    val paymentMethod: String? = null,
    val paidAt: String? = null,
    val latestPayment: PaymentInfo? = null
)

data class OrderItem(
    val id: String = UUID.randomUUID().toString(),
    val menuItemId: String,
    val menuItemName: String,
    val menuItemImage: String,
    val unitPrice: Double,
    val quantity: Int,
    val totalPrice: Double,
    val variantName: String? = null,
    val addonNames: List<String> = emptyList(),
    val instructions: String = ""
)

data class Order(
    val id: String,
    val orderNumber: String,
    val restaurantId: String,
    val restaurantName: String,
    val restaurantLogo: String,
    val branchId: String,
    val tableId: String,
    val tableNumber: Int,
    val sessionId: String,
    val userId: String,
    val items: List<OrderItem>,
    val subtotal: Double,
    val discount: Double,
    val taxes: Double,
    val serviceCharge: Double,
    val totalAmount: Double,
    val status: OrderStatus = OrderStatus.PLACED,
    val paymentStatus: PaymentStatus = PaymentStatus.PENDING,
    val createdAt: Long = System.currentTimeMillis(),
    val estimatedDeliveryTimeMinutes: Int = 20
)

enum class DiningSessionStatus {
    ACTIVE, COMPLETED, CANCELLED
}

data class DiningSession(
    val id: String,
    val restaurantId: String,
    val restaurantName: String,
    val branchId: String,
    val tableId: String,
    val tableNumber: Int,
    val customerId: String,
    val customerName: String,
    val startedAt: Long = System.currentTimeMillis(),
    val status: DiningSessionStatus = DiningSessionStatus.ACTIVE
)

enum class ServiceRequestType {
    CALL_WAITER, WATER, BILL, NAPKINS, GENERAL
}

enum class ServiceRequestStatus {
    PENDING, ACKNOWLEDGED, COMPLETED, CANCELLED
}

data class ServiceRequest(
    val id: String,
    val restaurantId: String,
    val branchId: String,
    val tableId: String,
    val sessionId: String,
    val type: ServiceRequestType,
    val status: ServiceRequestStatus = ServiceRequestStatus.PENDING,
    val createdAt: Long = System.currentTimeMillis()
)

data class Offer(
    val id: String,
    val code: String,
    val title: String,
    val description: String,
    val discountPercentage: Double = 0.0,
    val flatDiscount: Double = 0.0,
    val minOrderAmount: Double = 0.0,
    val maxDiscountAmount: Double = 0.0,
    val expiresAt: String = "",
    val restaurantId: String = "",
    val terms: String = ""
)

data class Review(
    val id: String,
    val orderId: String,
    val restaurantId: String,
    val userId: String,
    val userName: String,
    val userAvatar: String = "",
    val restaurantRating: Float,
    val foodRating: Float,
    val comment: String,
    val createdAt: Long = System.currentTimeMillis()
)

data class NotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val type: String, // ORDER_STATUS, OFFER, SERVICE_REQUEST, SYSTEM
    val createdAt: Long = System.currentTimeMillis(),
    val isRead: Boolean = false
)
