package com.dinedeck.app.presentation.order

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.RoomService
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.domain.model.OrderStatus
import com.dinedeck.app.domain.model.ServiceRequestType

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.text.style.TextAlign

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveOrderTrackingScreen(
    onNavigateBack: () -> Unit,
    onNavigateToBill: (orderId: String) -> Unit,
    onNavigateToAddReview: (orderId: String) -> Unit,
    viewModel: OrderTrackingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val order = uiState.order
    var showWaiterModal by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            DineDeckTopHeader()
        }
    ) { padding ->
        if (order == null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Spacer(modifier = Modifier.height(24.dp))
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .background(DarkSurface, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCodeScanner,
                                contentDescription = null,
                                tint = OrangePrimary,
                                modifier = Modifier.size(36.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "No Active Table Order",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "You are connected at Table #12. Browse the live menu to place dishes with the kitchen.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(32.dp))
                        DineDeckButton(
                            text = "Scan Table QR",
                            onClick = onNavigateBack,
                            icon = { Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = TextPrimary) },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedButton(
                            onClick = onNavigateBack,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.outlinedButtonColors(containerColor = DarkSurface)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.RestaurantMenu, contentDescription = null, tint = OrangePrimary)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Browse Live Menu", color = TextPrimary, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Status Header Banner
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = OrangePrimary.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = order.orderNumber,
                                color = OrangePrimary,
                                fontWeight = FontWeight.ExtraBold,
                                style = MaterialTheme.typography.titleLarge,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = when (order.status) {
                                OrderStatus.PLACED -> "Order Sent to Kitchen 👨‍🍳"
                                OrderStatus.CONFIRMED -> "Chef Confirmed Order"
                                OrderStatus.PREPARING -> "Food is Being Prepared 🍳"
                                OrderStatus.READY -> "Order Plated & Ready!"
                                OrderStatus.SERVED -> "Served at Table #${order.tableNumber} 🎉"
                                OrderStatus.COMPLETED -> "Dining Completed"
                                OrderStatus.CANCELLED -> "Order Cancelled"
                                OrderStatus.REJECTED -> "Order Rejected by Kitchen ❌"
                            },
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Estimated Server Arrival: ~${order.estimatedDeliveryTimeMinutes} mins",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(20.dp))
                        OrderStatusTimeline(currentStatus = order.status)
                    }
                }

                // Service Request Notification Toast if sent
                if (uiState.isServiceRequested) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = VegGreen.copy(alpha = 0.15f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = VegGreen)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Staff notified! A waiter will assist Table #${order.tableNumber} shortly.",
                                color = VegGreen,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                // Quick Staff Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { showWaiterModal = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DarkSurfaceElevated)
                    ) {
                        Icon(Icons.Outlined.RoomService, contentDescription = null, tint = OrangePrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Call Waiter", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { onNavigateToBill(order.id) },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary)
                    ) {
                        Icon(Icons.Outlined.ReceiptLong, contentDescription = null, tint = TextPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("View Bill", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }

                // Ordered Items Breakdown Card
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Items in Order", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(12.dp))

                        order.items.forEach { item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "${item.quantity}x ${item.menuItemName}",
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.bodyLarge
                                    )
                                    if (!item.variantName.isNullOrEmpty()) {
                                        Text("Size: ${item.variantName}", fontSize = 12.sp, color = TextSecondary)
                                    }
                                    if (item.addonNames.isNotEmpty()) {
                                        Text("Addons: ${item.addonNames.joinToString(", ")}", fontSize = 12.sp, color = TextSecondary)
                                    }
                                }
                                Text(
                                    text = com.dinedeck.app.core.util.CurrencyFormatter.formatInr(item.totalPrice),
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                            }
                        }
                    }
                }

                // Review Action if served/completed
                if (order.status == OrderStatus.SERVED || order.status == OrderStatus.COMPLETED) {
                    DineDeckButton(
                        text = "Leave Restaurant Review",
                        onClick = { onNavigateToAddReview(order.id) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(30.dp))
            }
        }

        // Waiter Call Modal Sheet
        if (showWaiterModal) {
            ModalBottomSheet(
                onDismissRequest = { showWaiterModal = false },
                containerColor = DarkSurface
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    Text("Staff Assistance Request", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("What can our restaurant team help you with at Table #${order?.tableNumber}?", color = TextSecondary)
                    Spacer(modifier = Modifier.height(20.dp))

                    ServiceOptionItem(title = "Call Waiter to Table", icon = Icons.Default.Person, onClick = {
                        viewModel.requestWaiterService(ServiceRequestType.CALL_WAITER)
                        showWaiterModal = false
                    })
                    ServiceOptionItem(title = "Request Mineral Water", icon = Icons.Default.WaterDrop, onClick = {
                        viewModel.requestWaiterService(ServiceRequestType.WATER)
                        showWaiterModal = false
                    })
                    ServiceOptionItem(title = "Request Extra Napkins", icon = Icons.Default.CleaningServices, onClick = {
                        viewModel.requestWaiterService(ServiceRequestType.NAPKINS)
                        showWaiterModal = false
                    })
                    ServiceOptionItem(title = "Request Final Printed Bill", icon = Icons.Default.Receipt, onClick = {
                        viewModel.requestWaiterService(ServiceRequestType.BILL)
                        showWaiterModal = false
                    })

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
fun ServiceOptionItem(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = DarkSurfaceElevated,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = OrangePrimary)
            Spacer(modifier = Modifier.width(14.dp))
            Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
        }
    }
}
