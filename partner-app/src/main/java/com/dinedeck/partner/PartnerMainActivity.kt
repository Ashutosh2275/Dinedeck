package com.dinedeck.partner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.dinedeck.partner.presentation.PartnerAppRoot
import com.dinedeck.partner.presentation.PartnerViewModel

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.lightColorScheme

class PartnerMainActivity : ComponentActivity() {

    private val viewModel: PartnerViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PartnerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PartnerAppRoot(viewModel = viewModel)
                }
            }
        }
    }
}

private val PartnerDarkColorScheme = darkColorScheme(
    primary = Color(0xFFFF6B00),
    background = Color(0xFF0A0D12),
    surface = Color(0xFF121720),
    surfaceVariant = Color(0xFF1B222E),
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF263345)
)

private val PartnerLightColorScheme = lightColorScheme(
    primary = Color(0xFFFF6B00),
    background = Color(0xFFF8FAFC),
    surface = Color(0xFFFFFFFF),
    surfaceVariant = Color(0xFFF1F5F9),
    onPrimary = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFE2E8F0)
)

@Composable
fun PartnerTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    // Strictly Light Theme throughout the DineDeck ecosystem
    val colors = PartnerLightColorScheme
    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}
