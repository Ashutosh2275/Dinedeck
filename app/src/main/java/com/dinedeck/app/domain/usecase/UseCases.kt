package com.dinedeck.app.domain.usecase

import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.*
import com.dinedeck.app.domain.repository.*
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(emailOrPhone: String, pass: String): Resource<User> {
        if (emailOrPhone.isBlank() || pass.isBlank()) {
            return Resource.Error("Email or phone and password cannot be blank")
        }
        return authRepository.login(emailOrPhone, pass)
    }
}

class RegisterUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(name: String, phone: String, email: String, pass: String): Resource<User> {
        if (name.isBlank() || phone.isBlank() || email.isBlank() || pass.isBlank()) {
            return Resource.Error("Please fill out all 4 required fields")
        }
        return authRepository.register(name, phone, email, pass)
    }
}

class GetRestaurantsUseCase @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) {
    suspend operator fun invoke(
        query: String = "",
        cuisine: String? = null,
        minRating: Double? = null,
        onlyOpen: Boolean = false,
        vegOnly: Boolean = false
    ): Resource<List<Restaurant>> {
        return restaurantRepository.getRestaurants(query, cuisine, minRating, onlyOpen, vegOnly)
    }
}

class GetRestaurantByIdUseCase @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) {
    suspend operator fun invoke(id: String): Resource<Restaurant> {
        return restaurantRepository.getRestaurantById(id)
    }
}

class ValidateTableQRUseCase @Inject constructor(
    private val tableRepository: TableRepository
) {
    suspend operator fun invoke(qrData: String): Resource<DiningSession> {
        if (qrData.isBlank()) {
            return Resource.Error("QR code data is empty")
        }
        return tableRepository.validateQR(qrData)
    }
}

class AddToCartUseCase @Inject constructor(
    private val cartRepository: CartRepository
) {
    suspend operator fun invoke(
        menuItem: MenuItem,
        variant: MenuVariant? = null,
        addons: List<MenuAddon> = emptyList(),
        quantity: Int = 1,
        instructions: String = "",
        restaurantId: String,
        restaurantName: String
    ): Resource<Cart> {
        if (quantity <= 0) {
            return Resource.Error("Quantity must be greater than zero")
        }
        return cartRepository.addItem(menuItem, variant, addons, quantity, instructions, restaurantId, restaurantName)
    }
}

class PlaceOrderUseCase @Inject constructor(
    private val orderRepository: OrderRepository
) {
    suspend operator fun invoke(cart: Cart): Resource<Order> {
        if (cart.items.isEmpty()) {
            return Resource.Error("Cart cannot be empty when placing an order")
        }
        return orderRepository.placeOrder(cart)
    }
}

class TrackOrderUseCase @Inject constructor(
    private val orderRepository: OrderRepository
) {
    suspend operator fun invoke(orderId: String): Flow<Resource<Order>> {
        return orderRepository.trackOrder(orderId)
    }
}

class RequestServiceUseCase @Inject constructor(
    private val orderRepository: OrderRepository
) {
    suspend operator fun invoke(sessionId: String, type: ServiceRequestType): Resource<ServiceRequest> {
        return orderRepository.requestService(sessionId, type)
    }
}
