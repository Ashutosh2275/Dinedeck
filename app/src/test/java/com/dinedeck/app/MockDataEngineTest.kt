package com.dinedeck.app

import com.dinedeck.app.data.remote.MockDataEngine
import com.dinedeck.app.domain.model.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class MockDataEngineTest {

    private lateinit var mockDataEngine: MockDataEngine

    @Before
    fun setUp() {
        mockDataEngine = MockDataEngine()
    }

    @Test
    fun testGetRestaurants_returnsNonEmptyList() {
        val restaurants = mockDataEngine.getRestaurants("", null, null, false, false)
        assertTrue(restaurants.isNotEmpty())
        assertEquals(4, restaurants.size)
    }

    @Test
    fun testValidateQR_createsActiveDiningSession() {
        val session = mockDataEngine.validateQR("dinedeck://table/rest_1/branch_1/tbl_12/token_123")
        assertNotNull(session)
        assertEquals("rest_punjab_heritage", session.restaurantId)
        assertEquals(12, session.tableNumber)
        assertEquals(DiningSessionStatus.ACTIVE, session.status)
    }

    @Test
    fun testCouponValidation_appliesDiscountWhenMinOrderMet() {
        val validCoupon = mockDataEngine.validateCoupon("DINEDECK20", 500.0, "rest_1")
        assertNotNull(validCoupon)
        assertEquals(20.0, validCoupon?.discountPercentage ?: 0.0, 0.01)

        val invalidCoupon = mockDataEngine.validateCoupon("DINEDECK20", 100.0, "rest_1")
        assertNull(invalidCoupon)
    }

    @Test
    fun testOrderPlacement_generatesValidOrderNumber() {
        val menuItem = mockDataEngine.getMenuItemById("item_101")!!
        val cartItem = CartItem(menuItem = menuItem, quantity = 2)
        val cart = Cart(
            restaurantId = "rest_1",
            restaurantName = "The Punjab Heritage Kitchen",
            tableNumber = 12,
            items = listOf(cartItem)
        )

        val order = mockDataEngine.placeOrder(cart, "user_101")
        assertNotNull(order)
        assertTrue(order.orderNumber.startsWith("DD-"))
        assertEquals(OrderStatus.PLACED, order.status)
        assertEquals(2, order.items.first().quantity)
    }
}
