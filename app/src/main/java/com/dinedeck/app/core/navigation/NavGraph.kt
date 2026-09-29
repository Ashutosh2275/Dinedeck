package com.dinedeck.app.core.navigation

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.presentation.auth.LoginScreen
import com.dinedeck.app.presentation.auth.RegisterScreen
import com.dinedeck.app.presentation.bill.DigitalBillScreen
import com.dinedeck.app.presentation.cart.CartScreen
import com.dinedeck.app.presentation.checkout.CheckoutScreen
import com.dinedeck.app.presentation.detail.RestaurantDetailScreen
import com.dinedeck.app.presentation.discover.DiscoverScreen
import com.dinedeck.app.presentation.favorites.FavoritesScreen
import com.dinedeck.app.presentation.home.HomeScreen
import com.dinedeck.app.presentation.onboarding.OnboardingScreen
import com.dinedeck.app.presentation.onboarding.SplashScreen
import com.dinedeck.app.presentation.order.ActiveOrderTrackingScreen
import com.dinedeck.app.presentation.order.OrderHistoryScreen
import com.dinedeck.app.presentation.profile.ProfileScreen
import com.dinedeck.app.presentation.profile.SettingsScreen
import com.dinedeck.app.presentation.qr.QRScannerScreen
import com.dinedeck.app.presentation.review.AddReviewDialog

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

sealed class BottomNavItem(
    val route: String,
    val title: String,
    val selectedIcon: androidx.compose.ui.graphics.vector.ImageVector,
    val unselectedIcon: androidx.compose.ui.graphics.vector.ImageVector,
    val isCenterButton: Boolean = false
) {
    object Discover : BottomNavItem(Screen.Home.route, "Discover", Icons.Filled.Explore, Icons.Outlined.Explore)
    object OrderStatus : BottomNavItem(Screen.OrderTracking.createRoute("order_1001"), "Order Status", Icons.Filled.Schedule, Icons.Outlined.Schedule)
    object ScanQR : BottomNavItem(Screen.QRScanner.route, "SCAN QR", Icons.Default.QrCodeScanner, Icons.Default.QrCodeScanner, isCenterButton = true)
    object BillPay : BottomNavItem(Screen.OrderHistory.route, "Bill & Pay", Icons.Filled.ReceiptLong, Icons.Outlined.ReceiptLong)
    object Account : BottomNavItem(Screen.Profile.route, "Account", Icons.Filled.Person, Icons.Outlined.Person)
}

@Composable
fun MainAppNavigation(
    navController: NavHostController = rememberNavController()
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val bottomNavItems = listOf(
        BottomNavItem.Discover,
        BottomNavItem.OrderStatus,
        BottomNavItem.ScanQR,
        BottomNavItem.BillPay,
        BottomNavItem.Account
    )

    val showBottomBar = currentRoute in listOf(
        Screen.Home.route,
        Screen.Discover.route,
        Screen.OrderTracking.route,
        "order_tracking/{orderId}",
        Screen.OrderHistory.route,
        Screen.Profile.route
    )

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = DarkBackground,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            if (showBottomBar) {
                Surface(
                    color = DarkSurface,
                    tonalElevation = 8.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .height(72.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        bottomNavItems.forEach { item ->
                            if (item.isCenterButton) {
                                Box(
                                    modifier = Modifier
                                        .weight(1.1f)
                                        .fillMaxHeight(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center,
                                        modifier = Modifier
                                            .clickable {
                                                navController.navigate(Screen.QRScanner.route)
                                            }
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(44.dp)
                                                .background(
                                                    brush = Brush.linearGradient(
                                                        colors = listOf(OrangePrimary, AmberAccent)
                                                    ),
                                                    shape = CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.QrCodeScanner,
                                                contentDescription = "SCAN QR",
                                                tint = TextPrimary,
                                                modifier = Modifier.size(24.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(3.dp))
                                        Text(
                                            text = "SCAN QR",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = OrangePrimary,
                                            letterSpacing = 0.5.sp
                                        )
                                    }
                                }
                            } else {
                                val isSelected = currentRoute == item.route ||
                                    (item.route.startsWith("order_tracking") && currentRoute?.startsWith("order_tracking") == true)
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center,
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight()
                                        .clickable {
                                            if (currentRoute != item.route) {
                                                navController.navigate(item.route) {
                                                    popUpTo(navController.graph.findStartDestination().id) {
                                                        saveState = true
                                                    }
                                                    launchSingleTop = true
                                                    restoreState = true
                                                }
                                            }
                                        }
                                ) {
                                    if (isSelected) {
                                        Surface(
                                            shape = RoundedCornerShape(14.dp),
                                            color = OrangePrimary.copy(alpha = 0.2f),
                                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 3.dp)
                                        ) {
                                            Icon(
                                                imageVector = item.selectedIcon,
                                                contentDescription = item.title,
                                                tint = OrangePrimary,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    } else {
                                        Icon(
                                            imageVector = item.unselectedIcon,
                                            contentDescription = item.title,
                                            tint = TextSecondary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = item.title,
                                        fontSize = 10.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        color = if (isSelected) OrangePrimary else TextSecondary,
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            composable(Screen.Splash.route) {
                SplashScreen(
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Onboarding.route) {
                OnboardingScreen(
                    onNavigateToAuth = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(Screen.Onboarding.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onNavigateToRegister = {
                        navController.navigate(Screen.Register.route)
                    }
                )
            }

            composable(Screen.Register.route) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Register.route) { inclusive = true }
                        }
                    },
                    onNavigateToLogin = {
                        navController.popBackStack()
                    }
                )
            }

            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToDiscover = { query ->
                        navController.navigate(Screen.Discover.route)
                    },
                    onNavigateToRestaurant = { restaurantId ->
                        navController.navigate(Screen.RestaurantDetail.createRoute(restaurantId))
                    },
                    onNavigateToQRScanner = {
                        navController.navigate(Screen.QRScanner.route)
                    },
                    onNavigateToCart = {
                        navController.navigate(Screen.Cart.route)
                    }
                )
            }

            composable(Screen.Discover.route) {
                DiscoverScreen(
                    onNavigateToRestaurant = { restaurantId ->
                        navController.navigate(Screen.RestaurantDetail.createRoute(restaurantId))
                    },
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.RestaurantDetail.route,
                arguments = listOf(navArgument("restaurantId") { type = NavType.StringType })
            ) {
                RestaurantDetailScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToCart = { navController.navigate(Screen.Cart.route) },
                    onNavigateToQRScanner = { navController.navigate(Screen.QRScanner.route) }
                )
            }

            composable(Screen.QRScanner.route) {
                QRScannerScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToMenu = { restaurantId ->
                        navController.navigate(Screen.RestaurantDetail.createRoute(restaurantId)) {
                            popUpTo(Screen.QRScanner.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Cart.route) {
                CartScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToCheckout = { navController.navigate(Screen.Checkout.route) },
                    onNavigateToMenu = { navController.navigate(Screen.Home.route) }
                )
            }

            composable(Screen.Checkout.route) {
                CheckoutScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onOrderPlaced = { orderId ->
                        navController.navigate(Screen.OrderTracking.createRoute(orderId)) {
                            popUpTo(Screen.Cart.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(
                route = Screen.OrderTracking.route,
                arguments = listOf(navArgument("orderId") { type = NavType.StringType })
            ) { backStackEntry ->
                val orderId = backStackEntry.arguments?.getString("orderId") ?: "order_1001"
                ActiveOrderTrackingScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToBill = { id -> navController.navigate(Screen.DigitalBill.createRoute(id)) },
                    onNavigateToAddReview = { id -> navController.navigate(Screen.AddReview.createRoute(id)) }
                )
            }

            composable(Screen.OrderHistory.route) {
                OrderHistoryScreen(
                    onNavigateToOrderTracking = { orderId ->
                        navController.navigate(Screen.OrderTracking.createRoute(orderId))
                    },
                    onNavigateToBill = { orderId ->
                        navController.navigate(Screen.DigitalBill.createRoute(orderId))
                    }
                )
            }

            composable(
                route = Screen.DigitalBill.route,
                arguments = listOf(navArgument("orderId") { type = NavType.StringType })
            ) {
                DigitalBillScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.AddReview.route,
                arguments = listOf(navArgument("orderId") { type = NavType.StringType })
            ) { backStackEntry ->
                val orderId = backStackEntry.arguments?.getString("orderId") ?: "order_1001"
                AddReviewDialog(
                    orderId = orderId,
                    onDismiss = { navController.popBackStack() }
                )
            }

            composable(Screen.Favorites.route) {
                FavoritesScreen(
                    onNavigateToRestaurant = { restaurantId ->
                        navController.navigate(Screen.RestaurantDetail.createRoute(restaurantId))
                    }
                )
            }

            composable(Screen.Profile.route) {
                ProfileScreen(
                    onNavigateToOrders = { navController.navigate(Screen.OrderHistory.route) },
                    onNavigateToBill = { orderId ->
                        navController.navigate(Screen.DigitalBill.createRoute(orderId))
                    },
                    onNavigateToFavorites = { navController.navigate(Screen.Favorites.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
