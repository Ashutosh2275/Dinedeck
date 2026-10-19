package com.dinedeck.app.data.remote

import com.dinedeck.app.domain.model.*
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockDataEngine @Inject constructor() {

    private val users = mutableMapOf<String, User>()
    private val restaurants = mutableMapOf<String, Restaurant>()
    private val categories = mutableListOf<MenuCategory>()
    private val menuItems = mutableListOf<MenuItem>()
    private val favoriteRestaurantIds = mutableSetOf<String>()
    private val diningSessions = mutableMapOf<String, DiningSession>()
    private val orders = mutableMapOf<String, Order>()
    private val serviceRequests = mutableListOf<ServiceRequest>()
    private val offers = mutableListOf<Offer>()
    private val reviews = mutableListOf<Review>()
    private val notifications = mutableListOf<NotificationItem>()

    init {
        seedInitialData()
    }

    private fun seedInitialData() {
        // Default seed user
        val defaultUser = User(
            id = "user_101",
            name = "Alex Vance",
            email = "alex.vance@dinedeck.io",
            phone = "+91 98201 23456",
            avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
            role = UserRole.CUSTOMER,
            token = "jwt_token_dinedeck_alex_101"
        )
        users[defaultUser.email] = defaultUser

        // Seed 1: The Punjab Heritage Kitchen (Mumbai)
        val rest1 = Restaurant(
            id = "rest_punjab_heritage",
            name = "The Punjab Heritage Kitchen",
            logoUrl = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=80",
            coverImageUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80",
            address = "Plot 42, Bandra Kurla Complex, Bandra West, Mumbai 400050",
            phone = "+91 22 2650 1234",
            rating = 4.9,
            reviewCount = 1420,
            cuisines = listOf("North Indian", "Mughlai", "Tandoori"),
            priceRange = "₹₹₹",
            openingHours = "11:00 AM - 11:30 PM",
            description = "Authentic Amritsari Tandoor & North Indian Delicacies crafted with slow-simmered rich makhani gravy and house-churned white butter.",
            isFavorite = true,
            isOpen = true,
            hasOffers = false,
            offerTag = ""
        )

        // Seed 2: Dakshin Coastal Bistro & Tiffin (Bengaluru)
        val rest2 = Restaurant(
            id = "rest_dakshin_bistro",
            name = "Dakshin Coastal Bistro & Tiffin",
            logoUrl = "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=300&q=80",
            coverImageUrl = "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1000&q=80",
            address = "100 Feet Road, Indiranagar, Bengaluru 560038",
            phone = "+91 80 2521 9988",
            rating = 4.8,
            reviewCount = 980,
            cuisines = listOf("South Indian", "Chettinad", "Coastal"),
            priceRange = "₹₹",
            openingHours = "07:30 AM - 10:30 PM",
            description = "Finest South Indian tiffin, Chettinad curries, crispy ghee roasts, and Malabar seafood specialties.",
            isFavorite = false,
            isOpen = true,
            hasOffers = false,
            offerTag = ""
        )

        // Seed 3: Dum Pukht Royal Biryani House (Hyderabad)
        val rest3 = Restaurant(
            id = "rest_dum_pukht_biryani",
            name = "Dum Pukht Royal Biryani House",
            logoUrl = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80",
            coverImageUrl = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1000&q=80",
            address = "Road No 10, Banjara Hills, Hyderabad 500034",
            phone = "+91 40 2335 1122",
            rating = 4.9,
            reviewCount = 2310,
            cuisines = listOf("Hyderabadi", "Dum Biryani", "Mughlai"),
            priceRange = "₹₹₹",
            openingHours = "11:30 AM - 11:00 PM",
            description = "Nizami heritage handi biryanis sealed with purdah dough and slow-cooked over charcoal embers.",
            isFavorite = true,
            isOpen = true,
            hasOffers = false,
            offerTag = ""
        )

        // Seed 4: Royal Mewar Thali & Rasoi (Jaipur & Mumbai)
        val rest4 = Restaurant(
            id = "rest_thali_royal",
            name = "Royal Mewar Thali & Rasoi",
            logoUrl = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=80",
            coverImageUrl = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1000&q=80",
            address = "Heritage Chowk, Udaipur & Mumbai 400001",
            phone = "+91 22 2430 5678",
            rating = 4.8,
            reviewCount = 1120,
            cuisines = listOf("Rajasthani", "Gujarati", "Pure Veg"),
            priceRange = "₹₹",
            openingHours = "11:00 AM - 10:30 PM",
            description = "100% Pure Veg authentic Rajasthani Dal Baati Churma and unlimited royal thalis.",
            isFavorite = false,
            isOpen = true,
            hasOffers = false,
            offerTag = ""
        )

        restaurants[rest1.id] = rest1
        restaurants[rest2.id] = rest2
        restaurants[rest3.id] = rest3
        restaurants[rest4.id] = rest4
        // Support legacy IDs as aliases
        restaurants["rest_1"] = rest1
        restaurants["rest_2"] = rest2
        restaurants["rest_3"] = rest3
        restaurants["rest_4"] = rest4

        favoriteRestaurantIds.add(rest1.id)
        favoriteRestaurantIds.add(rest3.id)

        // Categories for Punjab Heritage Kitchen
        val cat1 = MenuCategory(id = "cat_1", restaurantId = "rest_1", name = "Tandoori Starters & Kebabs", description = "Clay oven roasted starters", displayOrder = 1)
        val cat2 = MenuCategory(id = "cat_2", restaurantId = "rest_1", name = "Royal Main Course", description = "Rich curries and gravies", displayOrder = 2)
        val cat3 = MenuCategory(id = "cat_3", restaurantId = "rest_1", name = "Clay Oven Breads", description = "Fresh tandoori rotis & naans", displayOrder = 3)
        val cat4 = MenuCategory(id = "cat_4", restaurantId = "rest_1", name = "Lassi & Desserts", description = "Sweet coolers and desserts", displayOrder = 4)

        categories.addAll(listOf(cat1, cat2, cat3, cat4))

        // Food Items for Restaurant 1
        menuItems.add(
            MenuItem(
                id = "item_101",
                restaurantId = "rest_1",
                categoryId = "cat_1",
                categoryName = "Tandoori Starters & Kebabs",
                name = "Angaari Paneer Tikka",
                description = "Tender cottage cheese cubes marinated in Kashmiri deghi mirch, hung curd, and roasted mustard oil, char-grilled in tandoor.",
                price = 340.0,
                discountPercentage = 12.0,
                imageUrl = "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80",
                isVeg = true,
                isBestseller = true,
                isSpicy = true,
                rating = 4.9,
                allergens = listOf("Dairy"),
                variants = listOf(
                    MenuVariant("var_1", "Regular Platter", 0.0),
                    MenuVariant("var_2", "Jumbo Sharing Platter", 180.0)
                ),
                addons = listOf(
                    MenuAddon("add_1", "Extra Mint Coriander Chutney", 30.0),
                    MenuAddon("add_2", "Extra Tandoori Garlic Dip", 50.0)
                )
            )
        )
        menuItems.add(
            MenuItem(
                id = "item_102",
                restaurantId = "rest_1",
                categoryId = "cat_1",
                categoryName = "Tandoori Starters & Kebabs",
                name = "Bhatinda Murgh Malai Tikka",
                description = "Boneless chicken supreme steeped in cardamom cream, cheddar cheese, and crushed green peppercorns.",
                price = 420.0,
                discountPercentage = 10.0,
                imageUrl = "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&q=80",
                isVeg = false,
                isBestseller = true,
                isSpicy = false,
                rating = 4.8,
                allergens = listOf("Dairy"),
                variants = listOf(
                    MenuVariant("var_3", "Standard (6 Pieces)", 0.0),
                    MenuVariant("var_4", "Full (10 Pieces)", 180.0)
                ),
                addons = listOf(
                    MenuAddon("add_3", "Extra Roomali Roti (2 pcs)", 60.0)
                )
            )
        )
        menuItems.add(
            MenuItem(
                id = "item_103",
                restaurantId = "rest_1",
                categoryId = "cat_2",
                categoryName = "Royal Main Course",
                name = "Grand Old Delhi Butter Chicken",
                description = "Tandoori smoked chicken steeped in a velvety San Marzano tomato gravy with kasuri methi and fresh cream.",
                price = 490.0,
                discountPercentage = 10.0,
                imageUrl = "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&q=80",
                isVeg = false,
                isBestseller = true,
                isSpicy = true,
                rating = 4.9,
                allergens = listOf("Dairy", "Nuts"),
                variants = listOf(
                    MenuVariant("var_5", "Boneless Handi (Serves 2)", 0.0),
                    MenuVariant("var_6", "Royal Family Handi (Serves 4)", 340.0)
                ),
                addons = listOf(
                    MenuAddon("add_4", "Extra White Butter Dollop", 40.0),
                    MenuAddon("add_5", "Butter Garlic Naan", 80.0)
                )
            )
        )
        menuItems.add(
            MenuItem(
                id = "item_104",
                restaurantId = "rest_1",
                categoryId = "cat_2",
                categoryName = "Royal Main Course",
                name = "Signature Dal Makhani 1947",
                description = "Black urad lentils and kidney beans slow-cooked overnight for 24 hours with vine-ripened tomatoes and butter.",
                price = 360.0,
                discountPercentage = 10.0,
                imageUrl = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80",
                isVeg = true,
                isBestseller = true,
                isSpicy = false,
                rating = 4.9,
                allergens = listOf("Dairy")
            )
        )
        menuItems.add(
            MenuItem(
                id = "item_105",
                restaurantId = "rest_1",
                categoryId = "cat_3",
                categoryName = "Clay Oven Breads",
                name = "Garlic Chur Chur Naan",
                description = "Crispy layered tandoori bread generously topped with chopped garlic, butter, and coriander.",
                price = 95.0,
                imageUrl = "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&q=80",
                isVeg = true,
                isBestseller = true,
                allergens = listOf("Gluten", "Dairy")
            )
        )
        menuItems.add(
            MenuItem(
                id = "item_106",
                restaurantId = "rest_1",
                categoryId = "cat_4",
                categoryName = "Lassi & Desserts",
                name = "Kesar Pista Malai Lassi",
                description = "Thick, creamy churned sweet yogurt infused with saffron strands and slivered pistachios.",
                price = 140.0,
                imageUrl = "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
                isVeg = true,
                isBestseller = true,
                allergens = listOf("Dairy", "Nuts")
            )
        )

        // Seed Offers
        offers.add(
            Offer(
                id = "off_1",
                code = "DINEDECK20",
                title = "20% Flat Discount",
                description = "Get 20% off on all dine-in food orders up to ₹200.",
                discountPercentage = 20.0,
                minOrderAmount = 300.0,
                maxDiscountAmount = 200.0,
                terms = "Valid for dine-in sessions at all partner restaurants."
            )
        )
        offers.add(
            Offer(
                id = "off_2",
                code = "WELCOME50",
                title = "₹50 Flat Welcome Bonus",
                description = "Flat ₹50 off on your first order above ₹250.",
                flatDiscount = 50.0,
                minOrderAmount = 250.0,
                terms = "Valid once per customer."
            )
        )

        // Seed Default Table Session
        val defaultSession = DiningSession(
            id = "sess_mumbai_bkc_12",
            restaurantId = "rest_1",
            restaurantName = "The Punjab Heritage Kitchen",
            branchId = "branch_bkc_1",
            tableId = "tbl_12",
            tableNumber = 12,
            customerId = "user_101",
            customerName = "Alex Vance",
            status = DiningSessionStatus.ACTIVE
        )
        diningSessions[defaultSession.id] = defaultSession

        // Seed Default Initial Order
        val initialOrder = Order(
            id = "ord_india_101",
            orderNumber = "DD-7891",
            restaurantId = "rest_1",
            restaurantName = "The Punjab Heritage Kitchen",
            restaurantLogo = rest1.logoUrl,
            branchId = "branch_bkc_1",
            tableId = "tbl_12",
            tableNumber = 12,
            sessionId = defaultSession.id,
            userId = "user_101",
            items = listOf(
                OrderItem(
                    menuItemId = "item_101",
                    menuItemName = "Angaari Paneer Tikka",
                    menuItemImage = "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80",
                    unitPrice = 299.0,
                    quantity = 2,
                    totalPrice = 598.0,
                    variantName = "Regular Platter",
                    addonNames = listOf("Extra Mint Coriander Chutney")
                ),
                OrderItem(
                    menuItemId = "item_105",
                    menuItemName = "Garlic Chur Chur Naan",
                    menuItemImage = "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&q=80",
                    unitPrice = 95.0,
                    quantity = 3,
                    totalPrice = 285.0
                )
            ),
            subtotal = 995.50,
            discount = 0.0,
            taxes = 54.50,
            serviceCharge = 55.00,
            totalAmount = 1105.00,
            status = OrderStatus.COMPLETED,
            paymentStatus = PaymentStatus.SUCCESS,
            createdAt = System.currentTimeMillis() - 1000 * 60 * 60 * 2
        )
        orders[initialOrder.id] = initialOrder

        // Seed Past Order 2 (Grand Peshawari Grill)
        val pastOrderPeshawari = Order(
            id = "ord_1002",
            orderNumber = "DD-6450",
            restaurantId = "rest_2",
            restaurantName = "Grand Peshawari Grill",
            restaurantLogo = rest2.logoUrl,
            branchId = "branch_2",
            tableId = "tbl_04",
            tableNumber = 4,
            sessionId = "sess_pesh_04",
            userId = "user_101",
            items = listOf(
                OrderItem(
                    menuItemId = "item_201",
                    menuItemName = "Signature North Indian & Mughlai Platter",
                    menuItemImage = "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
                    unitPrice = 450.0,
                    quantity = 1,
                    totalPrice = 450.0
                ),
                OrderItem(
                    menuItemId = "item_202",
                    menuItemName = "Tandoori Butter Roti",
                    menuItemImage = "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&q=80",
                    unitPrice = 45.0,
                    quantity = 2,
                    totalPrice = 90.0
                ),
                OrderItem(
                    menuItemId = "item_203",
                    menuItemName = "Jeera Tadka Buttermilk",
                    menuItemImage = "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80",
                    unitPrice = 55.0,
                    quantity = 1,
                    totalPrice = 55.0
                ),
                OrderItem(
                    menuItemId = "item_204",
                    menuItemName = "Gulab Jamun with Rabdi",
                    menuItemImage = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80",
                    unitPrice = 50.0,
                    quantity = 1,
                    totalPrice = 50.0
                )
            ),
            subtotal = 580.0,
            discount = 0.0,
            taxes = 35.0,
            serviceCharge = 30.0,
            totalAmount = 645.0,
            status = OrderStatus.COMPLETED,
            paymentStatus = PaymentStatus.SUCCESS,
            createdAt = System.currentTimeMillis() - 1000 * 60 * 60 * 24
        )
        orders[pastOrderPeshawari.id] = pastOrderPeshawari

        // Seed Notifications
        notifications.add(
            NotificationItem(
                id = "notif_1",
                title = "Order Confirmed 🍽️",
                message = "The kitchen at The Punjab Heritage Kitchen has confirmed your order #DD-7891.",
                type = "ORDER_STATUS"
            )
        )
    }

    fun login(emailOrPhone: String, pass: String): User {
        val clean = emailOrPhone.trim()
        val user = users.values.find {
            it.email.equals(clean, ignoreCase = true) || it.phone.replace(" ", "").endsWith(clean.replace(" ", "").takeLast(10))
        } ?: User(
            id = "user_${UUID.randomUUID().toString().take(6)}",
            name = if (clean.contains("@")) clean.substringBefore("@").replace(".", " ").replaceFirstChar { it.uppercase() } else "DineDeck Guest",
            email = if (clean.contains("@")) clean else "$clean@dinedeck.guest",
            phone = if (!clean.contains("@")) clean else "+91 98201 23456",
            avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
            role = UserRole.CUSTOMER,
            token = "jwt_token_dinedeck_${UUID.randomUUID()}"
        )
        users[user.email] = user
        return user
    }

    fun register(name: String, phone: String, email: String, pass: String): User {
        val user = User(
            id = "user_${UUID.randomUUID().toString().take(6)}",
            name = name.trim().ifEmpty { "DineDeck Diner" },
            email = email.trim(),
            phone = phone.trim().ifEmpty { "+91 98201 23456" },
            avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
            role = UserRole.CUSTOMER,
            token = "jwt_token_dinedeck_${UUID.randomUUID()}"
        )
        users[user.email] = user
        return user
    }

    fun sendPasswordResetLink(email: String): String {
        val resetToken = UUID.randomUUID().toString().take(8)
        return "https://dinedeck.app/reset-password?email=${email.trim()}&token=$resetToken"
    }

    fun resetPassword(email: String, newPass: String): Boolean {
        return true
    }

    fun getRestaurants(
        query: String = "",
        cuisine: String? = null,
        minRating: Double? = null,
        onlyOpen: Boolean = false,
        vegOnly: Boolean = false
    ): List<Restaurant> {
        return restaurants.values.distinctBy { it.id }.filter { r ->
            val matchesQuery = query.isBlank() || r.name.contains(query, ignoreCase = true) || r.address.contains(query, ignoreCase = true)
            val matchesCuisine = cuisine.isNullOrBlank() || r.cuisines.any { it.contains(cuisine, ignoreCase = true) }
            val matchesRating = minRating == null || r.rating >= minRating
            val matchesOpen = !onlyOpen || r.isOpen
            matchesQuery && matchesCuisine && matchesRating && matchesOpen
        }
    }

    fun resolveRestaurantId(id: String): String {
        return when (id) {
            "rest_1" -> "rest_punjab_heritage"
            "rest_2" -> "rest_dakshin_bistro"
            "rest_3" -> "rest_dum_pukht_biryani"
            "rest_4" -> "rest_thali_royal"
            "rest_5" -> "rest_kolkata_spice"
            "rest_6" -> "rest_bawarchi_kebabs"
            else -> id
        }
    }

    fun getRestaurantById(id: String): Restaurant? {
        val resolved = resolveRestaurantId(id)
        return restaurants[resolved] ?: restaurants[id]
    }

    fun toggleFavorite(restaurantId: String): Boolean {
        val resolved = resolveRestaurantId(restaurantId)
        return if (favoriteRestaurantIds.contains(resolved)) {
            favoriteRestaurantIds.remove(resolved)
            false
        } else {
            favoriteRestaurantIds.add(resolved)
            true
        }
    }

    fun getFavorites(): List<Restaurant> =
        restaurants.values.distinctBy { it.id }.filter { favoriteRestaurantIds.contains(it.id) }

    fun getCategories(restaurantId: String): List<MenuCategory> {
        val resolved = resolveRestaurantId(restaurantId)
        return categories.filter { resolveRestaurantId(it.restaurantId) == resolved }.sortedBy { it.displayOrder }
    }

    fun getMenuItems(restaurantId: String, categoryId: String?, query: String = ""): List<MenuItem> {
        val resolved = resolveRestaurantId(restaurantId)
        return menuItems.filter { item ->
            val matchesRest = resolveRestaurantId(item.restaurantId) == resolved
            val matchesCat = categoryId == null || item.categoryId == categoryId
            val matchesQuery = query.isBlank() || item.name.contains(query, ignoreCase = true) || item.description.contains(query, ignoreCase = true)
            matchesRest && matchesCat && matchesQuery
        }
    }

    fun getMenuItemById(id: String): MenuItem? = menuItems.find { it.id == id }

    fun validateCoupon(code: String, subtotal: Double, restaurantId: String = ""): Offer? {
        val off = offers.find { it.code.equals(code, ignoreCase = true) } ?: return null
        if (subtotal < off.minOrderAmount) return null
        return off
    }

    fun validateQR(qrData: String): DiningSession {
        var restId = "rest_punjab_heritage"
        var tableNum = 4

        try {
            if (qrData.contains("restaurantId=") || qrData.contains("table=")) {
                val uri = android.net.Uri.parse(qrData)
                restId = uri.getQueryParameter("restaurantId") ?: uri.getQueryParameter("r") ?: "rest_punjab_heritage"
                tableNum = uri.getQueryParameter("table")?.toIntOrNull() ?: uri.getQueryParameter("t")?.toIntOrNull() ?: 4
            } else if (qrData.contains("/")) {
                val parts = qrData.trimEnd('/').split("/")
                val tblPart = parts.find { it.startsWith("tbl_") }
                if (tblPart != null) {
                    tableNum = tblPart.removePrefix("tbl_").toIntOrNull() ?: 4
                    val tblIdx = parts.indexOf(tblPart)
                    if (tblIdx >= 2) {
                        restId = parts[tblIdx - 2]
                    }
                } else {
                    val last = parts.lastOrNull()?.toIntOrNull()
                    if (last != null) {
                        tableNum = last
                        if (parts.size >= 2) {
                            restId = parts[parts.size - 2]
                        }
                    }
                }
            } else if (qrData.contains(":")) {
                val parts = qrData.split(":")
                val last = parts.lastOrNull()?.toIntOrNull()
                if (last != null) {
                    tableNum = last
                    if (parts.size >= 2) {
                        restId = parts[parts.size - 2]
                    }
                }
            } else {
                tableNum = qrData.filter { it.isDigit() }.toIntOrNull() ?: 4
            }
        } catch (e: Exception) {
            tableNum = 4
        }

        val resolvedRestId = resolveRestaurantId(restId)
        val restaurant = restaurants[resolvedRestId] ?: restaurants["rest_punjab_heritage"] ?: restaurants.values.first()

        val session = DiningSession(
            id = "sess_${resolvedRestId}_tbl_${tableNum}_${UUID.randomUUID().toString().take(6)}",
            restaurantId = restaurant.id,
            restaurantName = restaurant.name,
            branchId = "branch_main",
            tableId = "tbl_$tableNum",
            tableNumber = tableNum,
            customerId = "user_101",
            customerName = "Alex Vance",
            status = DiningSessionStatus.ACTIVE
        )
        diningSessions[session.id] = session
        return session
    }

    fun getActiveSession(restaurantId: String, tableId: String): DiningSession? {
        val resolved = resolveRestaurantId(restaurantId)
        return diningSessions.values.find { resolveRestaurantId(it.restaurantId) == resolved && it.tableId == tableId && it.status == DiningSessionStatus.ACTIVE }
            ?: diningSessions.values.firstOrNull()
    }

    fun getOrders(): List<Order> = orders.values.toList().sortedByDescending { it.createdAt }

    fun placeOrder(order: Order): Order {
        orders[order.id] = order
        return order
    }

    fun placeOrder(cart: Cart, userId: String): Order {
        val resolvedRestId = resolveRestaurantId(cart.restaurantId).ifEmpty { "rest_punjab_heritage" }
        val rest = restaurants[resolvedRestId] ?: restaurants["rest_punjab_heritage"]
        val order = Order(
            id = "ord_${UUID.randomUUID().toString().take(8)}",
            orderNumber = "DD-${(1000..9999).random()}",
            restaurantId = resolvedRestId,
            restaurantName = cart.restaurantName.ifEmpty { rest?.name ?: "The Punjab Heritage Kitchen" },
            restaurantLogo = rest?.logoUrl ?: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=80",
            branchId = cart.branchId.ifEmpty { "branch_main" },
            tableId = cart.tableId.ifEmpty { "tbl_${if (cart.tableNumber > 0) cart.tableNumber else 4}" },
            tableNumber = if (cart.tableNumber > 0) cart.tableNumber else 4,
            sessionId = cart.sessionId.ifEmpty { "sess_${resolvedRestId}_tbl_${if (cart.tableNumber > 0) cart.tableNumber else 4}" },
            userId = userId,
            items = cart.items.map { item ->
                OrderItem(
                    menuItemId = item.menuItem.id,
                    menuItemName = item.menuItem.name,
                    menuItemImage = item.menuItem.imageUrl,
                    unitPrice = item.unitPrice,
                    quantity = item.quantity,
                    totalPrice = item.itemTotalPrice,
                    variantName = item.selectedVariant?.name,
                    addonNames = item.selectedAddons.map { it.name },
                    instructions = item.specialInstructions
                )
            },
            subtotal = cart.subtotal,
            discount = cart.discountAmount,
            taxes = cart.taxes,
            serviceCharge = cart.serviceCharge,
            totalAmount = cart.finalTotal,
            status = OrderStatus.PLACED,
            paymentStatus = PaymentStatus.PENDING,
            createdAt = System.currentTimeMillis()
        )
        orders[order.id] = order
        return order
    }

    fun cancelOrder(orderId: String): Order? {
        val o = orders[orderId] ?: return null
        val cancelled = o.copy(status = OrderStatus.CANCELLED)
        orders[orderId] = cancelled
        return cancelled
    }

    fun getOrderById(id: String): Order? = orders[id]

    fun getOrdersForUser(userId: String): List<Order> = getOrders()

    fun updateOrderStatus(orderId: String, status: OrderStatus): Order? {
        val o = orders[orderId] ?: orders.values.find { it.orderNumber.equals(orderId, ignoreCase = true) } ?: return null
        val updated = o.copy(status = status)
        orders[o.id] = updated
        return updated
    }

    fun getBillByOrderId(orderId: String): BillDetails? {
        val order = orders[orderId] ?: return null
        return BillDetails(
            id = "bill_${order.id}",
            restaurantId = order.restaurantId,
            restaurantName = order.restaurantName,
            orderId = order.id,
            orderNumber = order.orderNumber,
            tableNumber = order.tableNumber.toString(),
            billNumber = "INV-2026-${order.orderNumber.takeLast(4)}",
            subtotal = order.subtotal,
            discountAmount = order.discount,
            cgstAmount = order.taxes / 2.0,
            sgstAmount = order.taxes / 2.0,
            serviceCharge = order.serviceCharge,
            roundOffAmount = 0.0,
            grandTotal = order.totalAmount,
            paymentStatus = order.paymentStatus,
            paymentMethod = if (order.paymentStatus == PaymentStatus.SUCCESS) "UPI (dinedeck@icici)" else null,
            paidAt = if (order.paymentStatus == PaymentStatus.SUCCESS) "Just now" else null,
            latestPayment = if (order.paymentStatus == PaymentStatus.SUCCESS) {
                PaymentInfo(
                    id = "pay_${order.id}",
                    transactionRef = "PAY_INR_${order.orderNumber}_SUCCESS",
                    method = "UPI",
                    status = "PAID",
                    amount = order.totalAmount,
                    paidAt = "Just now"
                )
            } else null
        )
    }

    fun payBill(orderId: String, method: String, amount: Double): PaymentInfo? {
        val order = orders[orderId] ?: return null
        val updatedOrder = order.copy(paymentStatus = PaymentStatus.SUCCESS)
        orders[orderId] = updatedOrder
        return PaymentInfo(
            id = "pay_${order.id}",
            transactionRef = "PAY_INR_${System.currentTimeMillis()}_${(1000..9999).random()}",
            method = method,
            status = "PAID",
            amount = amount,
            paidAt = "Just now"
        )
    }

    fun requestService(sessionId: String, type: ServiceRequestType): ServiceRequest {
        val session = diningSessions[sessionId] ?: diningSessions.values.first()
        val req = ServiceRequest(
            id = "svc_${UUID.randomUUID().toString().take(8)}",
            restaurantId = session.restaurantId,
            branchId = session.branchId,
            tableId = session.tableId,
            sessionId = sessionId,
            type = type,
            status = ServiceRequestStatus.PENDING
        )
        serviceRequests.add(req)
        return req
    }

    fun createServiceRequest(request: ServiceRequest): ServiceRequest {
        serviceRequests.add(request)
        return request
    }

    fun getServiceRequests(restaurantId: String): List<ServiceRequest> =
        serviceRequests.filter { it.restaurantId == restaurantId }

    fun submitReview(
        orderId: String,
        restaurantRating: Float,
        foodRating: Float,
        comment: String
    ): Review {
        val o = orders[orderId]
        val rev = Review(
            id = "rev_${UUID.randomUUID().toString().take(8)}",
            orderId = orderId,
            restaurantId = o?.restaurantId ?: "rest_1",
            userId = "user_101",
            userName = "Alex Vance",
            userAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
            restaurantRating = restaurantRating,
            foodRating = foodRating,
            comment = comment
        )
        reviews.add(rev)
        return rev
    }

    fun createReview(review: Review): Review {
        reviews.add(review)
        return review
    }

    fun getReviewsForRestaurant(restaurantId: String): List<Review> =
        reviews.filter { it.restaurantId == restaurantId }

    fun getOffers(restaurantId: String = ""): List<Offer> = offers

    fun getOffersForRestaurant(restaurantId: String): List<Offer> = offers

    fun getNotifications(userId: String = "user_101"): List<NotificationItem> = notifications

    fun markNotificationAsRead(notificationId: String) {
        val idx = notifications.indexOfFirst { it.id == notificationId }
        if (idx != -1) {
            notifications[idx] = notifications[idx].copy(isRead = true)
        }
    }
}
