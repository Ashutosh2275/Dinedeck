package com.dinedeck.app.presentation.order

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.*
import com.dinedeck.app.domain.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrderTrackingUiState(
    val isLoading: Boolean = true,
    val order: Order? = null,
    val isServiceRequested: Boolean = false,
    val lastServiceRequestType: ServiceRequestType? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class OrderTrackingViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val orderId: String = checkNotNull(savedStateHandle["orderId"])

    private val _uiState = MutableStateFlow(OrderTrackingUiState())
    val uiState: StateFlow<OrderTrackingUiState> = _uiState.asStateFlow()

    init {
        trackOrder()
    }

    private fun trackOrder() {
        viewModelScope.launch {
            orderRepository.trackOrder(orderId).collect { res ->
                when (res) {
                    is Resource.Success -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            order = res.data
                        )
                    }
                    is Resource.Error -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = res.message
                        )
                    }
                    is Resource.Loading -> {
                        _uiState.value = _uiState.value.copy(isLoading = true)
                    }
                }
            }
        }
    }

    fun requestWaiterService(type: ServiceRequestType) {
        viewModelScope.launch {
            val session = _uiState.value.order?.sessionId ?: "sess_9001"
            when (val res = orderRepository.requestService(session, type)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isServiceRequested = true,
                        lastServiceRequestType = type
                    )
                }
                else -> {}
            }
        }
    }

    fun cancelOrder() {
        viewModelScope.launch {
            orderRepository.cancelOrder(orderId)
        }
    }
}
