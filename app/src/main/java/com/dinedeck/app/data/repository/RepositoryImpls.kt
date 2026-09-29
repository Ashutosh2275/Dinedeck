package com.dinedeck.app.data.repository

import com.dinedeck.app.core.session.SessionManager
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.data.remote.MockDataEngine
import com.dinedeck.app.domain.model.*
import com.dinedeck.app.domain.repository.*
import com.dinedeck.app.data.remote.RealtimeSyncManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine,
    private val sessionManager: SessionManager
) : AuthRepository {

    override suspend fun login(emailOrPhone: String, pass: String): Resource<User> {
        delay(400) // simulate latency
        if (emailOrPhone.isBlank() || pass.isBlank()) {
            return Resource.Error("Please enter your email/phone and password")
        }
        val user = mockDataEngine.login(emailOrPhone, pass)
        sessionManager.saveAuthSession(user.token, user)
        return Resource.Success(user)
    }

    override suspend fun register(name: String, phone: String, email: String, pass: String): Resource<User> {
        delay(500)
        if (name.isBlank() || phone.isBlank() || email.isBlank() || pass.isBlank()) {
            return Resource.Error("Please fill out all 4 registration fields")
        }
        val user = mockDataEngine.register(name, phone, email, pass)
        sessionManager.saveAuthSession(user.token, user)
        return Resource.Success(user)
    }

    override suspend fun sendPasswordResetLink(email: String): Resource<String> {
        delay(500)
        if (email.isBlank() || !email.contains("@")) {
            return Resource.Error("Please enter a valid email address to receive reset link")
        }
        val link = mockDataEngine.sendPasswordResetLink(email)
        return Resource.Success(link)
    }

    override suspend fun resetPassword(email: String, newPass: String): Resource<Boolean> {
        delay(400)
        if (newPass.length < 6) {
            return Resource.Error("New password must be at least 6 characters")
        }
        mockDataEngine.resetPassword(email, newPass)
        return Resource.Success(true)
    }

    override suspend fun getCurrentUser(): Flow<User?> = sessionManager.userFlow

    override suspend fun logout() {
        sessionManager.clearSession()
    }

    override suspend fun isAuthenticated(): Boolean {
        return sessionManager.authTokenFlow.firstOrNull()?.isNotEmpty() == true
    }
}

@Singleton
class RestaurantRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine
) : RestaurantRepository {

    override suspend fun getRestaurants(
        query: String,
        cuisine: String?,
        minRating: Double?,
        onlyOpen: Boolean,
        vegOnly: Boolean
    ): Resource<List<Restaurant>> {
        delay(300)
        val list = mockDataEngine.getRestaurants(query, cuisine, minRating, onlyOpen, vegOnly)
        return Resource.Success(list)
    }

    override suspend fun getRestaurantById(id: String): Resource<Restaurant> {
        delay(200)
        val r = mockDataEngine.getRestaurantById(id)
        return if (r != null) Resource.Success(r) else Resource.Error("Restaurant not found")
    }

    override suspend fun toggleFavoriteRestaurant(restaurantId: String): Resource<Boolean> {
        val isFav = mockDataEngine.toggleFavorite(restaurantId)
        return Resource.Success(isFav)
    }

    override suspend fun getFavoriteRestaurants(): Flow<List<Restaurant>> = flow {
        emit(mockDataEngine.getFavorites())
    }
}

@Singleton
class MenuRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine
) : MenuRepository {

    override suspend fun getCategories(restaurantId: String): Resource<List<MenuCategory>> {
        delay(250)
        val cats = mockDataEngine.getCategories(restaurantId)
        return Resource.Success(cats)
    }

    override suspend fun getMenuItems(restaurantId: String, categoryId: String?, query: String): Resource<List<MenuItem>> {
        delay(300)
        val items = mockDataEngine.getMenuItems(restaurantId, categoryId, query)
        return Resource.Success(items)
    }

    override suspend fun getMenuItemById(itemId: String): Resource<MenuItem> {
        delay(150)
        val item = mockDataEngine.getMenuItemById(itemId)
        return if (item != null) Resource.Success(item) else Resource.Error("Menu item not found")
    }

    override suspend fun getRecommendedItems(restaurantId: String): Resource<List<MenuItem>> {
        delay(200)
        val items = mockDataEngine.getMenuItems(restaurantId, null, "").filter { it.isBestseller || it.rating >= 4.8 }
        return Resource.Success(items)
    }

    override suspend fun getPopularItems(restaurantId: String): Resource<List<MenuItem>> {
        delay(200)
        val items = mockDataEngine.getMenuItems(restaurantId, null, "").sortedByDescending { it.rating }
        return Resource.Success(items)
    }
}

@Singleton
class CartRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine
) : CartRepository {

    private val _cartState = MutableStateFlow(Cart())
    override val cartFlow: Flow<Cart> = _cartState.asStateFlow()

    override suspend fun addItem(
        menuItem: MenuItem,
        variant: MenuVariant?,
        addons: List<MenuAddon>,
        quantity: Int,
        instructions: String,
        restaurantId: String,
        restaurantName: String
    ): Resource<Cart> {
        val currentCart = _cartState.value

        // Clear cart if switching restaurants
        val effectiveCart = if (currentCart.restaurantId.isNotEmpty() && currentCart.restaurantId != restaurantId) {
            Cart(restaurantId = restaurantId, restaurantName = restaurantName)
        } else {
            currentCart.copy(restaurantId = restaurantId, restaurantName = restaurantName)
        }

        val newItem = CartItem(
            menuItem = menuItem,
            selectedVariant = variant,
            selectedAddons = addons,
            specialInstructions = instructions,
            quantity = quantity
        )

        val updatedItems = effectiveCart.items.toMutableList().apply { add(newItem) }
        val updatedCart = effectiveCart.copy(items = updatedItems)
        _cartState.value = updatedCart
        return Resource.Success(updatedCart)
    }

    override suspend fun updateQuantity(cartItemId: String, newQuantity: Int): Resource<Cart> {
        val currentCart = _cartState.value
        val items = currentCart.items.toMutableList()
        val index = items.indexOfFirst { it.cartItemId == cartItemId }
        if (index != -1) {
            if (newQuantity <= 0) {
                items.removeAt(index)
            } else {
                items[index] = items[index].copy(quantity = newQuantity)
            }
        }
        val updatedCart = currentCart.copy(items = items)
        _cartState.value = updatedCart
        return Resource.Success(updatedCart)
    }

    override suspend fun removeItem(cartItemId: String): Resource<Cart> {
        return updateQuantity(cartItemId, 0)
    }

    override suspend fun applyCoupon(couponCode: String): Resource<Cart> {
        val currentCart = _cartState.value
        val offer = mockDataEngine.validateCoupon(couponCode, currentCart.subtotal, currentCart.restaurantId)
            ?: return Resource.Error("Invalid or expired coupon code")

        val updatedCart = currentCart.copy(appliedCoupon = offer)
        _cartState.value = updatedCart
        return Resource.Success(updatedCart)
    }

    override suspend fun removeCoupon(): Resource<Cart> {
        val updatedCart = _cartState.value.copy(appliedCoupon = null)
        _cartState.value = updatedCart
        return Resource.Success(updatedCart)
    }

    override suspend fun clearCart() {
        _cartState.value = Cart()
    }

    override suspend fun setTableSessionInfo(
        restaurantId: String,
        branchId: String,
        tableId: String,
        tableNumber: Int,
        sessionId: String
    ) {
        val rest = mockDataEngine.getRestaurantById(restaurantId)
        _cartState.value = _cartState.value.copy(
            restaurantId = restaurantId,
            restaurantName = rest?.name ?: "DineDeck Partner",
            branchId = branchId,
            tableId = tableId,
            tableNumber = tableNumber,
            sessionId = sessionId
        )
    }
}

@Singleton
class TableRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine,
    private val sessionManager: SessionManager
) : TableRepository {

    override suspend fun validateQR(qrData: String): Resource<DiningSession> {
        delay(600)
        try {
            val session = mockDataEngine.validateQR(qrData)
            sessionManager.setActiveTableSession(session.id, session.restaurantId, session.tableNumber)
            return Resource.Success(session)
        } catch (e: Exception) {
            return Resource.Error("Invalid table QR code: ${e.message}")
        }
    }

    override suspend fun getActiveSession(restaurantId: String, tableId: String): Resource<DiningSession?> {
        delay(200)
        val s = mockDataEngine.getActiveSession(restaurantId, tableId)
        return Resource.Success(s)
    }

    override suspend fun endSession(sessionId: String): Resource<Boolean> {
        delay(300)
        sessionManager.clearSession()
        return Resource.Success(true)
    }
}

@Singleton
class OrderRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine,
    private val sessionManager: SessionManager,
    private val cartRepository: CartRepository,
    private val realtimeSyncManager: RealtimeSyncManager
) : OrderRepository {

    private val _activeOrders = MutableStateFlow<List<Order>>(emptyList())
    override val activeOrdersFlow: Flow<List<Order>> = _activeOrders.asStateFlow()

    init {
        // Sync initial orders from mock engine
        _activeOrders.value = mockDataEngine.getOrders()

        // Instant reactive WebSocket synchronization with Fastify backend & Web clients
        CoroutineScope(Dispatchers.IO).launch {
            realtimeSyncManager.realtimeEvents.collect {
                _activeOrders.value = mockDataEngine.getOrders()
            }
        }
    }

    override suspend fun placeOrder(cart: Cart): Resource<Order> {
        delay(300)
        if (cart.items.isEmpty()) {
            return Resource.Error("Cannot place an order with an empty cart")
        }
        val user = sessionManager.userFlow.firstOrNull()
        val userId = user?.id ?: "user_101"
        val order = mockDataEngine.placeOrder(cart, userId)
        cartRepository.clearCart()
        _activeOrders.value = mockDataEngine.getOrders()

        // Asynchronously sync to backend for Web / Kitchen KDS approval
        realtimeSyncManager.dispatchOrderAsync(cart, order, userId)

        return Resource.Success(order)
    }

    override suspend fun getOrders(): Resource<List<Order>> {
        delay(300)
        val list = mockDataEngine.getOrders()
        _activeOrders.value = list
        return Resource.Success(list)
    }

    override suspend fun getOrderById(orderId: String): Resource<Order> {
        delay(200)
        val order = mockDataEngine.getOrderById(orderId)
        return if (order != null) Resource.Success(order) else Resource.Error("Order not found")
    }

    override suspend fun trackOrder(orderId: String): Flow<Resource<Order>> = flow {
        emit(Resource.Loading())
        while (true) {
            val order = mockDataEngine.getOrderById(orderId)
            if (order != null) {
                emit(Resource.Success(order))
                if (order.status == OrderStatus.SERVED || order.status == OrderStatus.COMPLETED || order.status == OrderStatus.CANCELLED || order.status == OrderStatus.REJECTED) {
                    break
                }
            } else {
                emit(Resource.Error("Order not found"))
                break
            }
            delay(5000) // Poll every 5 seconds for status changes
        }
    }

    override suspend fun cancelOrder(orderId: String): Resource<Order> {
        delay(400)
        val o = mockDataEngine.cancelOrder(orderId)
        _activeOrders.value = mockDataEngine.getOrders()
        return if (o != null) Resource.Success(o) else Resource.Error("Failed to cancel order")
    }

    override suspend fun requestService(sessionId: String, type: ServiceRequestType): Resource<ServiceRequest> {
        delay(200)
        val req = mockDataEngine.requestService(sessionId, type)
        val sess = mockDataEngine.getActiveSession("", "")
        realtimeSyncManager.dispatchServiceRequest(
            sessionId = sessionId,
            type = type,
            restaurantId = sess?.restaurantId ?: "rest_punjab_heritage",
            tableNumber = sess?.tableNumber ?: 4
        )
        return Resource.Success(req)
    }

    override suspend fun getServiceRequests(sessionId: String): Resource<List<ServiceRequest>> {
        delay(200)
        return Resource.Success(emptyList())
    }

    override suspend fun getBillByOrderId(orderId: String): Resource<BillDetails> {
        delay(200)
        val bill = mockDataEngine.getBillByOrderId(orderId)
        return if (bill != null) Resource.Success(bill) else Resource.Error("Bill not found for order $orderId")
    }

    override suspend fun payBill(billId: String, method: String, amount: Double): Resource<PaymentInfo> {
        delay(600)
        val orderId = billId.removePrefix("bill_")
        val payment = mockDataEngine.payBill(orderId, method, amount)
        _activeOrders.value = mockDataEngine.getOrders()
        return if (payment != null) Resource.Success(payment) else Resource.Error("Payment settlement failed")
    }

    override suspend fun submitReview(
        orderId: String,
        restaurantRating: Float,
        foodRating: Float,
        comment: String
    ): Resource<Review> {
        delay(400)
        val rev = mockDataEngine.submitReview(orderId, restaurantRating, foodRating, comment)
        return Resource.Success(rev)
    }
}

@Singleton
class OfferRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine
) : OfferRepository {

    override suspend fun getPromotionalBanners(): Resource<List<Offer>> {
        delay(200)
        return Resource.Success(mockDataEngine.getOffers(""))
    }

    override suspend fun getOffers(restaurantId: String): Resource<List<Offer>> {
        delay(200)
        return Resource.Success(mockDataEngine.getOffers(restaurantId))
    }

    override suspend fun validateCoupon(code: String, subtotal: Double, restaurantId: String): Resource<Offer> {
        delay(300)
        val offer = mockDataEngine.validateCoupon(code, subtotal, restaurantId)
        return if (offer != null) Resource.Success(offer) else Resource.Error("Invalid coupon code or minimum order amount not met")
    }
}

@Singleton
class UserRepositoryImpl @Inject constructor(
    private val mockDataEngine: MockDataEngine,
    private val sessionManager: SessionManager
) : UserRepository {

    override suspend fun getUserProfile(): Resource<User> {
        val user = sessionManager.userFlow.firstOrNull() ?: mockDataEngine.login("alex.vance@dinedeck.io", "")
        return Resource.Success(user)
    }

    override suspend fun updateUserProfile(name: String, phone: String, avatarUrl: String): Resource<User> {
        val currentUser = sessionManager.userFlow.firstOrNull() ?: return Resource.Error("User not logged in")
        val updated = currentUser.copy(name = name, phone = phone, avatarUrl = avatarUrl.ifEmpty { currentUser.avatarUrl })
        sessionManager.saveAuthSession(currentUser.token, updated)
        return Resource.Success(updated)
    }

    override suspend fun getNotifications(): Resource<List<NotificationItem>> {
        delay(200)
        return Resource.Success(mockDataEngine.getNotifications())
    }

    override suspend fun markNotificationAsRead(id: String): Resource<Boolean> {
        return Resource.Success(true)
    }
}
