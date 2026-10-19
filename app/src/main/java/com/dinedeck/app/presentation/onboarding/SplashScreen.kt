package com.dinedeck.app.presentation.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.core.session.SessionManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val sessionManager: SessionManager
) : ViewModel() {

    fun checkInitialRoute(onNavigate: (String) -> Unit) {
        viewModelScope.launch {
            delay(1200) // Brand splash animation duration
            val onboardingCompleted = sessionManager.onboardingCompletedFlow.firstOrNull() ?: false
            val isAuthenticated = sessionManager.authTokenFlow.firstOrNull()?.isNotEmpty() == true

            if (!onboardingCompleted) {
                onNavigate("onboarding")
            } else if (isAuthenticated) {
                onNavigate("home")
            } else {
                onNavigate("login")
            }
        }
    }
}

@Composable
fun SplashScreen(
    onNavigate: (String) -> Unit,
    viewModel: SplashViewModel = hiltViewModel()
) {
    LaunchedEffect(Unit) {
        viewModel.checkInitialRoute(onNavigate)
    }

    DineDeckBrandedLoader(
        fullScreen = true,
        label = "Preparing Your Experience...",
        sublabel = "Dynamic Restaurant Intelligence"
    )
}
