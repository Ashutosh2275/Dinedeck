package com.dinedeck.app.presentation.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.Cart
import com.dinedeck.app.domain.repository.CartRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CartUiState(
    val cart: Cart = Cart(),
    val couponCodeInput: String = "",
    val couponMessage: String? = null,
    val isCouponError: Boolean = false,
    val isLoading: Boolean = false
)

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CartUiState())
    val uiState: StateFlow<CartUiState> = _uiState.asStateFlow()

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

    fun updateQuantity(cartItemId: String, newQuantity: Int) {
        viewModelScope.launch {
            cartRepository.updateQuantity(cartItemId, newQuantity)
        }
    }

    fun removeItem(cartItemId: String) {
        viewModelScope.launch {
            cartRepository.removeItem(cartItemId)
        }
    }

    fun onCouponCodeChanged(code: String) {
        _uiState.value = _uiState.value.copy(couponCodeInput = code, couponMessage = null)
    }

    fun applyCoupon() {
        val code = _uiState.value.couponCodeInput.trim()
        if (code.isEmpty()) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val res = cartRepository.applyCoupon(code)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        couponMessage = "Coupon '${code.uppercase()}' applied successfully!",
                        isCouponError = false
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        couponMessage = res.message ?: "Invalid coupon code",
                        isCouponError = true
                    )
                }
                else -> {}
            }
        }
    }

    fun removeCoupon() {
        viewModelScope.launch {
            cartRepository.removeCoupon()
            _uiState.value = _uiState.value.copy(couponCodeInput = "", couponMessage = null)
        }
    }

    fun clearCart() {
        viewModelScope.launch {
            cartRepository.clearCart()
        }
    }
}
