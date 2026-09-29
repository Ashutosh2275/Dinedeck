package com.dinedeck.app.presentation.bill

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.BillDetails
import com.dinedeck.app.domain.model.Order
import com.dinedeck.app.domain.model.PaymentInfo
import com.dinedeck.app.domain.model.PaymentStatus
import com.dinedeck.app.domain.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DigitalBillUiState(
    val isLoading: Boolean = true,
    val order: Order? = null,
    val bill: BillDetails? = null,
    val isPaymentProcessing: Boolean = false,
    val paymentSuccessMessage: String? = null,
    val paymentDetails: PaymentInfo? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class DigitalBillViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val orderId: String = checkNotNull(savedStateHandle["orderId"])

    private val _uiState = MutableStateFlow(DigitalBillUiState())
    val uiState: StateFlow<DigitalBillUiState> = _uiState.asStateFlow()

    init {
        loadBill()
    }

    fun loadBill() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val orderRes = orderRepository.getOrderById(orderId)
            val billRes = orderRepository.getBillByOrderId(orderId)

            if (orderRes is Resource.Success && orderRes.data != null) {
                val order = orderRes.data
                val bill = (billRes as? Resource.Success)?.data
                val isAlreadyPaid = order.paymentStatus == PaymentStatus.SUCCESS || bill?.paymentStatus == PaymentStatus.SUCCESS

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    order = order,
                    bill = bill,
                    paymentDetails = bill?.latestPayment,
                    paymentSuccessMessage = if (isAlreadyPaid) "Payment of ${com.dinedeck.app.core.util.CurrencyFormatter.formatInr(order.totalAmount)} verified and settled!" else null
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = orderRes.message ?: "Failed to load receipt"
                )
            }
        }
    }

    fun processBillPayment(paymentMethod: String) {
        viewModelScope.launch {
            val currentOrder = _uiState.value.order ?: return@launch
            _uiState.value = _uiState.value.copy(isPaymentProcessing = true, errorMessage = null)

            val billId = _uiState.value.bill?.id ?: "bill_${currentOrder.id}"
            when (val res = orderRepository.payBill(billId, paymentMethod, currentOrder.totalAmount)) {
                is Resource.Success -> {
                    val paymentInfo = res.data
                    val updatedOrder = currentOrder.copy(paymentStatus = PaymentStatus.SUCCESS)
                    val updatedBill = _uiState.value.bill?.copy(
                        paymentStatus = PaymentStatus.SUCCESS,
                        paymentMethod = paymentMethod,
                        paidAt = paymentInfo?.paidAt ?: "Just now",
                        latestPayment = paymentInfo
                    )

                    _uiState.value = _uiState.value.copy(
                        isPaymentProcessing = false,
                        order = updatedOrder,
                        bill = updatedBill,
                        paymentDetails = paymentInfo,
                        paymentSuccessMessage = "Payment of ${com.dinedeck.app.core.util.CurrencyFormatter.formatInr(currentOrder.totalAmount)} via $paymentMethod verified!"
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isPaymentProcessing = false,
                        errorMessage = res.message ?: "Payment verification failed"
                    )
                }
                else -> {
                    _uiState.value = _uiState.value.copy(isPaymentProcessing = false)
                }
            }
        }
    }
}
