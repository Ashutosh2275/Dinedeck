package com.dinedeck.app.presentation.qr

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.dinedeck.app.core.designsystem.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QRScannerScreen(
    onNavigateBack: () -> Unit,
    onNavigateToMenu: (restaurantId: String) -> Unit,
    viewModel: QRScannerViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    // Auto-detect after 2 seconds simulation if not validating
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(2000)
        viewModel.processScannedQR("dinedeck://table/rest_punjab_heritage/branch_main/tbl_4/sec_token_998877")
    }

    // Trigger navigation on valid QR scan
    LaunchedEffect(uiState.validatedSession) {
        if (uiState.validatedSession != null) {
            onNavigateToMenu(uiState.validatedSession!!.restaurantId)
        }
    }

    // Infinite animation for scanning laser line
    val infiniteTransition = rememberInfiniteTransition(label = "laser")
    val laserProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laserY"
    )

    // Dimmed Backdrop Overlay (Matching Screenshot 5)
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f))
            .clickable(onClick = onNavigateBack),
        contentAlignment = Alignment.Center
    ) {
        // Centered Modal Card
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .clickable(enabled = false) { }, // Prevent clicking through
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header: Camera Icon + Title + Subtitle + Close Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = OrangePrimary.copy(alpha = 0.2f),
                            modifier = Modifier.size(42.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.PhotoCamera,
                                    contentDescription = null,
                                    tint = OrangePrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Scan QR to Browse Menu",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Point camera at your table's DineDeck QR code",
                                style = MaterialTheme.typography.bodySmall,
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                        }
                    }

                    // Circular Close (X) Button
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier
                            .background(DarkSurface, CircleShape)
                            .size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = TextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Viewfinder Box (Matching Screenshot 5)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .background(DarkBackground, RoundedCornerShape(18.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    // Corner Brackets and Laser Line
                    Canvas(modifier = Modifier.fillMaxSize().padding(24.dp)) {
                        val strokeWidth = 4.dp.toPx()
                        val cornerLength = 28.dp.toPx()
                        val cornerColor = Color(0xFFF97316) // OrangePrimary

                        // Top-Left Bracket
                        drawLine(cornerColor, Offset(0f, 0f), Offset(cornerLength, 0f), strokeWidth)
                        drawLine(cornerColor, Offset(0f, 0f), Offset(0f, cornerLength), strokeWidth)

                        // Top-Right Bracket
                        drawLine(cornerColor, Offset(size.width - cornerLength, 0f), Offset(size.width, 0f), strokeWidth)
                        drawLine(cornerColor, Offset(size.width, 0f), Offset(size.width, cornerLength), strokeWidth)

                        // Bottom-Left Bracket
                        drawLine(cornerColor, Offset(0f, size.height - cornerLength), Offset(0f, size.height), strokeWidth)
                        drawLine(cornerColor, Offset(0f, size.height), Offset(cornerLength, size.height), strokeWidth)

                        // Bottom-Right Bracket
                        drawLine(cornerColor, Offset(size.width - cornerLength, size.height), Offset(size.width, size.height), strokeWidth)
                        drawLine(cornerColor, Offset(size.width, size.height - cornerLength), Offset(size.width, size.height), strokeWidth)

                        // Laser Line
                        val laserY = size.height * laserProgress
                        drawLine(
                            brush = Brush.horizontalGradient(
                                colors = listOf(Color.Transparent, Color(0xFFFF9800), Color.Transparent)
                            ),
                            start = Offset(0f, laserY),
                            end = Offset(size.width, laserY),
                            strokeWidth = 3.dp.toPx()
                        )
                    }

                    // Bottom Pill Inside Viewfinder
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = DarkSurface.copy(alpha = 0.85f),
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 16.dp)
                    ) {
                        Text(
                            text = if (uiState.isValidating) "Connecting to Table #12..." else "Scanning table code...",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }
    }
}
