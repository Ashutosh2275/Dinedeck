package com.dinedeck.app.presentation.bill

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.core.util.CurrencyFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DigitalBillScreen(
    onNavigateBack: () -> Unit,
    viewModel: DigitalBillViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val order = uiState.order

    val restaurantName = order?.restaurantName ?: "The Punjab Heritage Kitchen"
    val tableNumber = order?.tableNumber ?: 12
    val orderNumber = order?.orderNumber ?: "DD-8942-BKC"
    val totalAmount = order?.totalAmount ?: 1105.00
    val subtotal = order?.subtotal ?: 995.50
    val cgst = order?.taxes?.div(2.0) ?: 27.25
    val sgst = order?.taxes?.div(2.0) ?: 27.25
    val serviceCharge = order?.serviceCharge ?: 55.00

    val shareReceipt: () -> Unit = {
        val receiptText = buildString {
            appendLine("========================================")
            appendLine("     ${restaurantName.uppercase()}     ")
            appendLine("       AUTHENTIC DINING & BARBEQUE      ")
            appendLine("       OFFICIAL GST RESTAURANT INVOICE  ")
            appendLine("========================================")
            appendLine("GSTIN: 27AABCT1332L1Z4   FSSAI: 11521000000123")
            appendLine("Table: #$tableNumber             Covers: 2 Persons")
            appendLine("Order: $orderNumber        Server: Captain Rajesh")
            appendLine("Date: 04 Sept 2026       Time: 01:23 AM")
            appendLine("----------------------------------------")
            appendLine("QTY  ITEM                     AMOUNT")
            appendLine("----------------------------------------")
            if (order != null && order.items.isNotEmpty()) {
                order.items.forEach { item ->
                    val name = if (item.menuItemName.length > 20) item.menuItemName.take(19) + "." else item.menuItemName.padEnd(20)
                    appendLine("${item.quantity.toString().padEnd(4)} $name ₹${item.totalPrice}")
                }
            } else {
                appendLine("1    Signature North Indian Platter  ₹450.00")
                appendLine("2    Garlic Butter Naan              ₹190.00")
                appendLine("1    Handi Dal Makhani               ₹280.00")
                appendLine("2    Spiced Masala Chaas             ₹110.00")
            }
            appendLine("----------------------------------------")
            appendLine("SUBTOTAL:                  ${CurrencyFormatter.formatInr(subtotal)}")
            appendLine("CGST (2.5%):               ${CurrencyFormatter.formatInr(cgst)}")
            appendLine("SGST (2.5%):               ${CurrencyFormatter.formatInr(sgst)}")
            appendLine("SERVICE CHARGE (5%):       ${CurrencyFormatter.formatInr(serviceCharge)}")
            appendLine("========================================")
            appendLine("GRAND TOTAL:               ${CurrencyFormatter.formatInr(totalAmount)}")
            appendLine("========================================")
            appendLine("STATUS: *** PAID IN FULL (UPI SETTLED) ***")
            appendLine("TRANSACTION REF: UPI/2026/09/88219403")
            appendLine("========================================")
            appendLine("Thank you for dining with us! Visit again.")
            appendLine("Powered by DineDeck Digital POS")
        }
        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, receiptText)
            type = "text/plain"
        }
        context.startActivity(Intent.createChooser(sendIntent, "Print / Share Dining Receipt"))
    }

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Dining Tax Invoice",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                actions = {
                    IconButton(onClick = shareReceipt) {
                        Icon(Icons.Outlined.Share, contentDescription = "Share", tint = OrangePrimary)
                    }
                },
                modifier = Modifier.statusBarsPadding(),
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 18.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(6.dp))

            // Realistic Printed Thermal Paper Receipt Container
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Header Brand
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = OrangePrimary.copy(alpha = 0.15f),
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Restaurant,
                                contentDescription = null,
                                tint = OrangePrimary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = restaurantName.uppercase(),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 17.sp,
                        textAlign = TextAlign.Center,
                        color = TextPrimary
                    )
                    Text(
                        text = "Plot 42, Bandra Kurla Complex, Mumbai • Ph: +91 98201 23456",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "GSTIN: 27AABCT1332L1Z4 • FSSAI Lic: 11521000000123",
                        fontSize = 10.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Green PAID Stamp
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = VegGreen.copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, VegGreen.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = VegGreen, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "ORIGINAL TAX INVOICE • PAID",
                                color = VegGreen,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 11.sp,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Bill Metadata Grid
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = DarkSurface,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Invoice #:", fontSize = 11.sp, color = TextSecondary)
                                Text("DD-INV-${orderNumber.takeLast(6)}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary, fontFamily = FontFamily.Monospace)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Table / Location:", fontSize = 11.sp, color = TextSecondary)
                                Text("Table #$tableNumber (AC Dining Hall)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Date & Time:", fontSize = 11.sp, color = TextSecondary)
                                Text("04 Sept 2026, 01:23 AM", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = TextPrimary)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Captain / Server:", fontSize = 11.sp, color = TextSecondary)
                                Text("Rajesh S. (POS #02)", fontSize = 11.sp, color = TextPrimary)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Itemized Table Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("ITEM DESCRIPTION", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Text("QTY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                            Text("AMOUNT", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        }
                    }

                    HorizontalDivider(color = DarkBorder, thickness = 1.dp)

                    Spacer(modifier = Modifier.height(8.dp))

                    // Dishes List
                    val dishes = if (order != null && order.items.isNotEmpty()) {
                        order.items.map { Triple(it.menuItemName, it.quantity, it.totalPrice) }
                    } else {
                        listOf(
                            Triple("Signature North Indian Platter", 1, 450.00),
                            Triple("Handi Dal Makhani", 1, 280.00),
                            Triple("Garlic Butter Naan", 2, 190.00),
                            Triple("Spiced Masala Chaas", 2, 110.00)
                        )
                    }

                    dishes.forEach { (name, qty, amt) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 5.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = name,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = TextPrimary,
                                modifier = Modifier.weight(1f)
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(22.dp)) {
                                Text(
                                    text = "$qty",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                                Text(
                                    text = CurrencyFormatter.formatInr(amt),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextPrimary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = DarkBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(8.dp))

                    // Taxes & Charges Breakdown
                    ReceiptRow(label = "Subtotal (Items)", value = CurrencyFormatter.formatInr(subtotal))
                    ReceiptRow(label = "CGST @ 2.5%", value = CurrencyFormatter.formatInr(cgst))
                    ReceiptRow(label = "SGST @ 2.5%", value = CurrencyFormatter.formatInr(sgst))
                    ReceiptRow(label = "Restaurant Service Charge (5%)", value = CurrencyFormatter.formatInr(serviceCharge))

                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = OrangePrimary.copy(alpha = 0.6f), thickness = 1.5.dp)
                    Spacer(modifier = Modifier.height(10.dp))

                    // Grand Total
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "NET AMOUNT PAID",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 14.sp,
                            color = TextPrimary
                        )
                        Text(
                            text = CurrencyFormatter.formatInr(totalAmount),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = OrangePrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Settlement & Payment Confirmation
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = DarkSurface,
                        border = androidx.compose.foundation.BorderStroke(1.dp, VegGreen.copy(alpha = 0.3f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = VegGreen, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Paid via UPI / Digital POS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("Ref: UPI/2026/09/88219403 • Auth: ICICI_SETTLED", fontSize = 10.sp, color = TextMuted, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Thank You Note
                    Text(
                        text = "Thank you for dining with us! Please visit again.",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "This is a computer generated legal tax invoice (GST Rule 46).",
                        fontSize = 9.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Action Buttons: Print / Share & Done
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = shareReceipt,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = DarkSurfaceElevated),
                    modifier = Modifier.weight(1f)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Print, contentDescription = null, tint = OrangePrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Print / Share", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }

                Button(
                    onClick = onNavigateBack,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Done", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun ReceiptRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 11.sp, color = TextSecondary)
        Text(text = value, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = TextPrimary)
    }
}
