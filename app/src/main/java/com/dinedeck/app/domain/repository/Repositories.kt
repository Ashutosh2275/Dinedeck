package com.dinedeck.app.domain.repository

import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.*
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(emailOrPhone: String, pass: String): Resource<User>
    suspend fun register(name: String, phone: String, email: String, pass: String): Resource<User>
    suspend fun sendPasswordResetLink(email: String): Resource<String>
    suspend fun resetPassword(email: String, newPass: String): Resource<Boolean>
    suspend fun getCurrentUser(): Flow<User?>
    suspend fun logout()
    suspend fun isAuthenticated(): Boolean
}

interface RestaurantRepository {
    suspend fun getRestaurants(
        query: String = "",
        cuisine: String? = null,
        minRating: Double? = null,
        onlyOpen: Boolean = false,
        vegOnly: Boolean = false
    ): Resource<List<Restaurant>>

    suspend fun getRestaurantById(id: String): Resource<Restaurant>
    suspend fun toggleFavoriteRestaurant(restaurantId: String): Resource<Boolean>
    suspend fun getFavoriteRestaurants(): Flow<List<Restaurant>>
}

interface MenuRepository {
    suspend fun getCategories(restaurantId: String): Resource<List<MenuCategory>>
    suspend fun getMenuItems(restaurantId: String, categoryId: String? = null, query: String = ""): Resource<List<MenuItem>>
    suspend fun getMenuItemById(itemId: String): Resource<MenuItem>
    suspend fun getRecommendedItems(restaurantId: String): Resource<List<MenuItem>>
    suspend fun getPopularItems(restaurantId: String): Resource<List<MenuItem>>
}

interface CartRepository {
    val cartFlow: Flow<Cart>
    suspend fun addItem(
        menuItem: MenuItem,
        variant: MenuVariant? = null,
        addons: List<MenuAddon> = emptyList(),
        quantity: Int = 1,
        instructions: String = "",
        restaurantId: String,
        restaurantName: String
    ): Resource<Cart>

    suspend fun updateQuantity(cartItemId: String, newQuantity: Int): Resource<Cart>
    suspend fun removeItem(cartItemId: String): Resource<Cart>
    suspend fun applyCoupon(couponCode: String): Resource<Cart>
    suspend fun removeCoupon(): Resource<Cart>
    suspend fun clearCart()
    suspend fun setTableSessionInfo(restaurantId: String, branchId: String, tableId: String, tableNumber: Int, sessionId: String)
}

interface TableRepository {
    suspend fun validateQR(qrData: String): Resource<DiningSession>
    suspend fun getActiveSession(restaurantId: String, tableId: String): Resource<DiningSession?>
    suspend fun endSession(sessionId: String): Resource<Boolean>
}

interface OrderRepository {
    val activeOrdersFlow: Flow<List<Order>>
    suspend fun placeOrder(cart: Cart): Resource<Order>
    suspend fun getOrders(): Resource<List<Order>>
    suspend fun getOrderById(orderId: String): Resource<Order>
    suspend fun trackOrder(orderId: String): Flow<Resource<Order>>
    suspend fun cancelOrder(orderId: String): Resource<Order>
    suspend fun requestService(sessionId: String, type: ServiceRequestType): Resource<ServiceRequest>
    suspend fun getServiceRequests(sessionId: String): Resource<List<ServiceRequest>>
    suspend fun getBillByOrderId(orderId: String): Resource<BillDetails>
    suspend fun payBill(billId: String, method: String, amount: Double): Resource<PaymentInfo>
    suspend fun submitReview(orderId: String, restaurantRating: Float, foodRating: Float, comment: String): Resource<Review>
}

interface OfferRepository {
    suspend fun getPromotionalBanners(): Resource<List<Offer>>
    suspend fun getOffers(restaurantId: String = ""): Resource<List<Offer>>
    suspend fun validateCoupon(code: String, subtotal: Double, restaurantId: String): Resource<Offer>
}

interface UserRepository {
    suspend fun getUserProfile(): Resource<User>
    suspend fun updateUserProfile(name: String, phone: String, avatarUrl: String): Resource<User>
    suspend fun getNotifications(): Resource<List<NotificationItem>>
    suspend fun markNotificationAsRead(id: String): Resource<Boolean>
}
