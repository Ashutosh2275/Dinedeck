package com.dinedeck.app

import com.dinedeck.app.data.remote.MockDataEngine
import com.dinedeck.app.data.repository.CartRepositoryImpl
import com.dinedeck.app.domain.model.CartItem
import com.dinedeck.app.domain.model.MenuAddon
import com.dinedeck.app.domain.model.MenuItem
import com.dinedeck.app.domain.model.MenuVariant
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class CartRepositoryTest {

    private lateinit var cartRepository: CartRepositoryImpl
    private lateinit var mockDataEngine: MockDataEngine

    @Before
    fun setUp() {
        mockDataEngine = MockDataEngine()
        cartRepository = CartRepositoryImpl(mockDataEngine)
    }

    @Test
    fun testAddItem_updatesSubtotalAndTotalsCorrectly() = runBlocking {
        val menuItem = MenuItem(
            id = "test_item_1",
            restaurantId = "rest_1",
            categoryId = "cat_1",
            categoryName = "Starters",
            name = "Angaari Paneer Tikka",
            description = "Tandoori grilled paneer",
            price = 300.0,
            discountPercentage = 10.0, // final price = 270.0
            imageUrl = "",
            isVeg = true
        )

        val variant = MenuVariant("var_1", "Jumbo Platter", 50.0)
        val addon = MenuAddon("add_1", "Extra Mint Chutney", 30.0)

        // unitPrice = 270.0 + 50.0 + 30.0 = 350.0
        // total item price (qty 2) = 700.0

        cartRepository.addItem(
            menuItem = menuItem,
            variant = variant,
            addons = listOf(addon),
            quantity = 2,
            instructions = "Medium spicy",
            restaurantId = "rest_1",
            restaurantName = "The Punjab Heritage Kitchen"
        )

        val cart = cartRepository.cartFlow.first()
        assertEquals(1, cart.items.size)
        assertEquals(700.0, cart.subtotal, 0.01)

        // Tax 5% = 35.0, Service Charge 5% = 35.0 => Final Total = 770.0
        assertEquals(35.0, cart.taxes, 0.01)
        assertEquals(35.0, cart.serviceCharge, 0.01)
        assertEquals(770.0, cart.finalTotal, 0.01)
    }

    @Test
    fun testUpdateQuantity_removesItemWhenQuantityIsZero() = runBlocking {
        val menuItem = mockDataEngine.getMenuItemById("item_101")!!
        cartRepository.addItem(menuItem, null, emptyList(), 1, "", "rest_1", "The Punjab Heritage Kitchen")

        var cart = cartRepository.cartFlow.first()
        assertEquals(1, cart.items.size)

        val item = cart.items.first()
        cartRepository.updateQuantity(item.cartItemId, 0)

        cart = cartRepository.cartFlow.first()
        assertTrue(cart.items.isEmpty())
    }
}
