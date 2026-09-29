package com.dinedeck.app

import com.dinedeck.app.data.remote.MockDataEngine
import com.dinedeck.app.data.repository.CartRepositoryImpl
import com.dinedeck.app.data.repository.MenuRepositoryImpl
import com.dinedeck.app.domain.model.MenuCategory
import com.dinedeck.app.domain.model.MenuItem
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class MultiRestaurantIsolationTest {

    private lateinit var mockDataEngine: MockDataEngine
    private lateinit var menuRepository: MenuRepositoryImpl
    private lateinit var cartRepository: CartRepositoryImpl

    @Before
    fun setUp() {
        mockDataEngine = MockDataEngine()
        menuRepository = MenuRepositoryImpl(mockDataEngine)
        cartRepository = CartRepositoryImpl(mockDataEngine)
    }

    @Test
    fun testMenuCategories_areIsolatedByRestaurant() = runBlocking {
        val catsRest1 = menuRepository.getCategories("rest_1").data ?: emptyList()
        assertTrue(catsRest1.isNotEmpty())
        assertTrue(catsRest1.all { it.restaurantId == "rest_1" })

        // Check categories do not leak to non-existent or other restaurants
        val catsOther = menuRepository.getCategories("rest_non_existent").data ?: emptyList()
        assertTrue(catsOther.isEmpty())
    }

    @Test
    fun testCart_clearsItemsWhenSwitchingRestaurants() = runBlocking {
        val itemRest1 = mockDataEngine.getMenuItemById("item_101")!!

        // Add item from rest_1
        cartRepository.addItem(itemRest1, null, emptyList(), 1, "", "rest_1", "The Punjab Heritage Kitchen")
        var cart = cartRepository.cartFlow.first()
        assertEquals("rest_1", cart.restaurantId)
        assertEquals(1, cart.items.size)

        // Create item for rest_2
        val itemRest2 = MenuItem(
            id = "item_201",
            restaurantId = "rest_2",
            categoryId = "cat_201",
            categoryName = "Tiffin",
            name = "Ghee Podi Idli",
            description = "Steamed rice cakes tossed in gunpowder and ghee",
            price = 140.0,
            imageUrl = "",
            isVeg = true
        )

        // Now add item from rest_2 -> cart must switch restaurant context and clear rest_1 items
        cartRepository.addItem(itemRest2, null, emptyList(), 1, "", "rest_2", "Dakshin Coastal Bistro & Tiffin")
        cart = cartRepository.cartFlow.first()

        assertEquals("rest_2", cart.restaurantId)
        assertEquals(1, cart.items.size)
        assertEquals(itemRest2.id, cart.items.first().menuItem.id)
    }
}
