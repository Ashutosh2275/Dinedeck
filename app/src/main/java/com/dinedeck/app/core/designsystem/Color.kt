package com.dinedeck.app.core.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color

// Official DineDeck Brand Colors (Single Source of Truth)
val OrangePrimary = Color(0xFFFBA337)
val OrangeDark = Color(0xFFE58A13)
val AmberAccent = Color(0xFFFBA337)
val SageTeal = Color(0xFF8CB3B2)
val GreenSuccess = Color(0xFF10B981)
val RedDanger = Color(0xFFEF4444)

// Adaptive Dynamic Theme Colors (Seamlessly transition between Dark & Light Mode)
val DarkBackground: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.background

val DarkSurface: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.surface

val DarkSurfaceElevated: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.surfaceVariant

val DarkBorder: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.outline

val TextPrimary: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.onSurface

val TextSecondary: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.onSurfaceVariant

val TextMuted: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.outline

val VegGreen = Color(0xFF22C55E)
val NonVegRed = Color(0xFFEF4444)
