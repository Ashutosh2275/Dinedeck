package com.dinedeck.app

import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.data.remote.MockDataEngine
import com.dinedeck.app.data.repository.*
import com.dinedeck.app.domain.model.Cart
import com.dinedeck.app.domain.usecase.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock

class UseCasesTest {

    private lateinit var mockDataEngine: MockDataEngine
    private lateinit var authRepository: AuthRepositoryImpl
    private lateinit var restaurantRepository: RestaurantRepositoryImpl
    private lateinit var tableRepository: TableRepositoryImpl
    private lateinit var cartRepository: CartRepositoryImpl
    private lateinit var orderRepository: OrderRepositoryImpl

    private lateinit var loginUseCase: LoginUseCase
    private lateinit var getRestaurantsUseCase: GetRestaurantsUseCase
    private lateinit var validateTableQRUseCase: ValidateTableQRUseCase
    private lateinit var addToCartUseCase: AddToCartUseCase
    private lateinit var placeOrderUseCase: PlaceOrderUseCase

    @Before
    fun setUp() {
        mockDataEngine = MockDataEngine()
        val sessionManager = mock<com.dinedeck.app.core.session.SessionManager>()
        authRepository = AuthRepositoryImpl(mockDataEngine, sessionManager)
        restaurantRepository = RestaurantRepositoryImpl(mockDataEngine)
        tableRepository = TableRepositoryImpl(mockDataEngine, sessionManager)
        cartRepository = CartRepositoryImpl(mockDataEngine)
        orderRepository = OrderRepositoryImpl(mockDataEngine, sessionManager, cartRepository)

        loginUseCase = LoginUseCase(authRepository)
        getRestaurantsUseCase = GetRestaurantsUseCase(restaurantRepository)
        validateTableQRUseCase = ValidateTableQRUseCase(tableRepository)
        addToCartUseCase = AddToCartUseCase(cartRepository)
        placeOrderUseCase = PlaceOrderUseCase(orderRepository)
    }

    @Test
    fun testLoginUseCase_validatesInput() = runBlocking {
        val blankRes = loginUseCase("", "")
        assertTrue(blankRes is Resource.Error)
        assertEquals("Email and password cannot be blank", blankRes.message)

        val validRes = loginUseCase("alex.vance@dinedeck.io", "Pass123")
        assertTrue(validRes is Resource.Success)
        assertNotNull(validRes.data)
    }

    @Test
    fun testValidateTableQRUseCase_parsesAndCreatesSession() = runBlocking {
        val res = validateTableQRUseCase("dinedeck://table/rest_1/branch_1/tbl_12/token_sec99")
        assertTrue(res is Resource.Success)
        val session = res.data!!
        assertEquals("rest_1", session.restaurantId)
        assertEquals(12, session.tableNumber)
    }

    @Test
    fun testPlaceOrderUseCase_failsOnEmptyCart() = runBlocking {
        val emptyCart = Cart()
        val res = placeOrderUseCase(emptyCart)
        assertTrue(res is Resource.Error)
        assertEquals("Cart cannot be empty when placing an order", res.message)
    }
}
