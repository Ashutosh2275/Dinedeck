package com.dinedeck.app.presentation.qr

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.DiningSession
import com.dinedeck.app.domain.repository.CartRepository
import com.dinedeck.app.domain.repository.TableRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QRScannerUiState(
    val isValidating: Boolean = false,
    val validatedSession: DiningSession? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class QRScannerViewModel @Inject constructor(
    private val tableRepository: TableRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(QRScannerUiState())
    val uiState: StateFlow<QRScannerUiState> = _uiState.asStateFlow()

    fun processScannedQR(qrCodeData: String) {
        viewModelScope.launch {
            _uiState.value = QRScannerUiState(isValidating = true)
            when (val res = tableRepository.validateQR(qrCodeData)) {
                is Resource.Success -> {
                    val session = res.data!!
                    cartRepository.setTableSessionInfo(
                        restaurantId = session.restaurantId,
                        branchId = session.branchId,
                        tableId = session.tableId,
                        tableNumber = session.tableNumber,
                        sessionId = session.id
                    )
                    _uiState.value = QRScannerUiState(validatedSession = session)
                }
                is Resource.Error -> {
                    _uiState.value = QRScannerUiState(errorMessage = res.message ?: "Invalid QR code")
                }
                else -> {}
            }
        }
    }

    fun clearState() {
        _uiState.value = QRScannerUiState()
    }
}
