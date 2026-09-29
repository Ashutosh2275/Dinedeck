package com.dinedeck.app.data.remote

import com.dinedeck.app.core.util.ApiEnvelope
import retrofit2.http.*

data class LoginRequestDto(val email: String, val pass: String)
data class RegisterRequestDto(val name: String, val email: String, val phone: String, val pass: String)

data class RestaurantDto(
    val id: String,
    val name: String,
    val logoUrl: String,
    val coverImageUrl: String,
    val address: String,
    val phone: String,
    val rating: Double,
    val reviewCount: Int,
    val cuisines: List<String>,
    val priceRange: String,
    val openingHours: String,
    val description: String,
    val isFavorite: Boolean = false,
    val isOpen: Boolean = true,
    val hasOffers: Boolean = false,
    val offerTag: String = ""
)

data class MenuItemDto(
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
    val rating: Double = 4.5
)

data class ValidateQRRequestDto(val qrData: String)

data class PlaceOrderRequestDto(
    val restaurantId: String,
    val branchId: String,
    val tableId: String,
    val sessionId: String,
    val items: List<OrderItemDto>,
    val subtotal: Double,
    val discount: Double,
    val taxes: Double,
    val serviceCharge: Double,
    val totalAmount: Double
)

data class OrderItemDto(
    val menuItemId: String,
    val quantity: Int,
    val unitPrice: Double,
    val variantName: String? = null,
    val addonNames: List<String> = emptyList(),
    val instructions: String = ""
)

interface DineDeckApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequestDto): ApiEnvelope<RestaurantDto>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequestDto): ApiEnvelope<RestaurantDto>

    @GET("restaurants")
    suspend fun getRestaurants(
        @Query("query") query: String? = null,
        @Query("cuisine") cuisine: String? = null
    ): ApiEnvelope<List<RestaurantDto>>

    @GET("restaurants/{id}")
    suspend fun getRestaurantById(@Path("id") id: String): ApiEnvelope<RestaurantDto>

    @GET("restaurants/{id}/menu")
    suspend fun getMenuItems(
        @Path("id") restaurantId: String,
        @Query("categoryId") categoryId: String? = null
    ): ApiEnvelope<List<MenuItemDto>>

    @POST("table/validate-qr")
    suspend fun validateQR(@Body request: ValidateQRRequestDto): ApiEnvelope<RestaurantDto>

    @POST("orders")
    suspend fun placeOrder(@Body request: PlaceOrderRequestDto): ApiEnvelope<MenuItemDto>
}
