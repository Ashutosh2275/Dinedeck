package com.dinedeck.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.User
import com.dinedeck.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false,
    val resetLinkSent: Boolean = false,
    val resetLinkMessage: String? = null,
    val resetLinkUrl: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(emailOrPhone: String, pass: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            when (val res = authRepository.login(emailOrPhone, pass)) {
                is Resource.Success -> {
                    _uiState.value = AuthUiState(user = res.data, isSuccess = true)
                }
                is Resource.Error -> {
                    _uiState.value = AuthUiState(errorMessage = res.message ?: "Authentication failed")
                }
                else -> {}
            }
        }
    }

    fun register(name: String, phone: String, email: String, pass: String) {
        viewModelScope.launch {
            if (name.isBlank() || phone.isBlank() || email.isBlank() || pass.isBlank()) {
                _uiState.value = AuthUiState(errorMessage = "Please fill in all 4 fields (Name, Phone, Email, Password)")
                return@launch
            }
            if (pass.length < 6) {
                _uiState.value = AuthUiState(errorMessage = "Password must be at least 6 characters")
                return@launch
            }
            _uiState.value = AuthUiState(isLoading = true)
            when (val res = authRepository.register(name, phone, email, pass)) {
                is Resource.Success -> {
                    _uiState.value = AuthUiState(user = res.data, isSuccess = true)
                }
                is Resource.Error -> {
                    _uiState.value = AuthUiState(errorMessage = res.message ?: "Registration failed")
                }
                else -> {}
            }
        }
    }

    fun sendPasswordResetLink(email: String) {
        val clean = email.trim()
        if (clean.isBlank() || !clean.contains("@")) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid email to receive reset link")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val res = authRepository.sendPasswordResetLink(clean)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        resetLinkSent = true,
                        resetLinkMessage = "Password reset link has been sent to $clean. Please check your inbox or spam folder.",
                        resetLinkUrl = res.data
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = res.message ?: "Failed to send reset link"
                    )
                }
                else -> {}
            }
        }
    }

    fun resetPassword(email: String, newPass: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val res = authRepository.resetPassword(email, newPass)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        resetLinkSent = false,
                        resetLinkMessage = "Password has been successfully updated! You can now sign in."
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = res.message ?: "Failed to reset password"
                    )
                }
                else -> {}
            }
        }
    }

    fun clearResetState() {
        _uiState.value = _uiState.value.copy(
            resetLinkSent = false,
            resetLinkMessage = null,
            resetLinkUrl = null
        )
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}
