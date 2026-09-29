package com.dinedeck.app.core.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Onboarding : Screen("onboarding")
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Discover : Screen("discover")
    object RestaurantDetail : Screen("restaurant_detail/{restaurantId}") {
        fun createRoute(restaurantId: String) = "restaurant_detail/$restaurantId"
    }
    object QRScanner : Screen("qr_scanner")
    object Cart : Screen("cart")
    object Checkout : Screen("checkout")
    object OrderTracking : Screen("order_tracking/{orderId}") {
        fun createRoute(orderId: String) = "order_tracking/$orderId"
    }
    object OrderHistory : Screen("order_history")
    object DigitalBill : Screen("digital_bill/{orderId}") {
        fun createRoute(orderId: String) = "digital_bill/$orderId"
    }
    object Favorites : Screen("favorites")
    object Profile : Screen("profile")
    object Settings : Screen("settings")
    object AddReview : Screen("add_review/{orderId}") {
        fun createRoute(orderId: String) = "add_review/$orderId"
    }
}
