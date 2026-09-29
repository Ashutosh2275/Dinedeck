package com.dinedeck.app.presentation.checkout

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.Cart
import com.dinedeck.app.domain.model.Order
import com.dinedeck.app.domain.repository.CartRepository
import com.dinedeck.app.domain.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CheckoutUiState(
    val cart: Cart = Cart(),
    val selectedPaymentMethod: String = "UPI", // "UPI", "CARD", "NET_BANKING", "CASH"
    val isPlacingOrder: Boolean = false,
    val createdOrder: Order? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val cartRepository: CartRepository,
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CheckoutUiState())
    val uiState: StateFlow<CheckoutUiState> = _uiState.asStateFlow()

    init {
        observeCart()
    }

    private fun observeCart() {
        viewModelScope.launch {
            cartRepository.cartFlow.collect { cart ->
                _uiState.value = _uiState.value.copy(cart = cart)
            }
        }
    }

    fun selectPaymentMethod(method: String) {
        _uiState.value = _uiState.value.copy(selectedPaymentMethod = method)
    }

    fun placeOrder() {
        val cart = _uiState.value.cart
        if (cart.tableNumber <= 0) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Please scan your table QR code inside the restaurant. In-restaurant table scan is required to place an order."
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPlacingOrder = true, errorMessage = null)

            when (val res = orderRepository.placeOrder(cart)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isPlacingOrder = false,
                        createdOrder = res.data
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isPlacingOrder = false,
                        errorMessage = res.message ?: "Failed to place order"
                    )
                }
                else -> {}
            }
        }
    }
}
