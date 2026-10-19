package com.dinedeck.admin.presentation

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dinedeck.admin.R

@Composable
fun DineDeckBrandedLoader(
    modifier: Modifier = Modifier,
    label: String = "Loading Control Center...",
    sublabel: String? = "Connecting to Platform Telemetry & Governance Engine",
    fullScreen: Boolean = true,
    sizeDp: Dp = 100.dp
) {
    val infiniteTransition = rememberInfiniteTransition(label = "dinedeckArcRotation")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    val content = @Composable {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(sizeDp)
            ) {
                // Smooth continuous rotating orange arc
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val strokeWidth = 4.5.dp.toPx()
                    val diameter = size.minDimension - strokeWidth
                    val topLeft = Offset(strokeWidth / 2f, strokeWidth / 2f)
                    val arcSize = Size(diameter, diameter)

                    // Subtle background track
                    drawArc(
                        color = Color(0xFFFFA500).copy(alpha = 0.12f),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokeWidth)
                    )

                    // Rotating orange gradient arc
                    drawArc(
                        brush = Brush.sweepGradient(
                            0.0f to Color(0xFFFFA500),
                            0.7f to Color(0xFFFF5500),
                            1.0f to Color(0xFFFF5500).copy(alpha = 0.05f)
                        ),
                        startAngle = rotation,
                        sweepAngle = 260f,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                }

                // Crisp, stationary, official DineDeck emblem
                Image(
                    painter = painterResource(id = R.drawable.dinedeck_emblem),
                    contentDescription = "DineDeck Emblem",
                    modifier = Modifier.size(sizeDp * 0.52f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = label,
                color = Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )

            if (sublabel != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = sublabel,
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Normal
                )
            }
        }
    }

    if (fullScreen) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(Color(0xFF090D16)),
            contentAlignment = Alignment.Center
        ) {
            content()
        }
    } else {
        Box(
            modifier = modifier,
            contentAlignment = Alignment.Center
        ) {
            content()
        }
    }
}
