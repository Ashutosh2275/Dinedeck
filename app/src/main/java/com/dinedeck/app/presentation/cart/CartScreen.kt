package com.dinedeck.app.presentation.cart

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Discount
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.core.util.CurrencyFormatter
import com.dinedeck.app.domain.model.CartItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    onNavigateBack: () -> Unit,
    onNavigateToCheckout: () -> Unit,
    onNavigateToMenu: () -> Unit,
    viewModel: CartViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cart = uiState.cart

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            TopAppBar(
                title = { Text("Your Dining Cart", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                actions = {
                    if (cart.items.isNotEmpty()) {
                        IconButton(onClick = { viewModel.clearCart() }) {
                            Icon(Icons.Outlined.Delete, contentDescription = "Clear Cart", tint = RedDanger)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        bottomBar = {
            if (cart.items.isNotEmpty()) {
                Surface(
                    color = DarkSurface,
                    shadowElevation = 12.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Total Amount", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                                Text(
                                    text = CurrencyFormatter.formatInr(cart.finalTotal),
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                            }
                            DineDeckButton(
                                text = "Proceed to Checkout",
                                onClick = onNavigateToCheckout,
                                modifier = Modifier.widthIn(min = 180.dp)
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (cart.items.isEmpty()) {
            EmptyStateView(
                title = "Your Cart is Empty",
                description = "Browse the digital menu and customize delicious food items to add them to your table cart.",
                icon = { Icon(Icons.Outlined.ShoppingCart, contentDescription = null, tint = OrangePrimary, modifier = Modifier.size(40.dp)) },
                actionButtonText = "Browse Menu",
                onActionClick = onNavigateToMenu,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(4.dp))
                    // Table Context Banner
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = OrangePrimary.copy(alpha = 0.12f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Restaurant, contentDescription = null, tint = OrangePrimary)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(cart.restaurantName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("Dining at Table #${cart.tableNumber}", fontSize = 13.sp, color = TextSecondary)
                            }
                        }
                    }
                }

                // Cart Items List
                items(cart.items, key = { "${it.menuItem.id}_${it.selectedVariant?.id}_${it.selectedAddons.map { a -> a.id }}" }) { item ->
                    CartItemRow(
                        item = item,
                        onIncrease = { viewModel.updateQuantity(item.cartItemId, item.quantity + 1) },
                        onDecrease = { viewModel.updateQuantity(item.cartItemId, item.quantity - 1) },
                        onRemove = { viewModel.removeItem(item.cartItemId) }
                    )
                }

                // Bill Summary
                item {
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Bill Summary", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(12.dp))

                            BillRow(label = "Item Subtotal", amount = cart.subtotal)
                            BillRow(label = "CGST (2.5%)", amount = cart.taxes / 2.0)
                            BillRow(label = "SGST (2.5%)", amount = cart.taxes / 2.0)
                            BillRow(label = "Service Charge (5%)", amount = cart.serviceCharge)

                            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = DarkBorder)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("To Pay", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                                Text(CurrencyFormatter.formatInr(cart.finalTotal), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge, color = OrangePrimary)
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(30.dp))
                }
            }
        }
    }
}

@Composable
fun CartItemRow(
    item: CartItem,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit,
    onRemove: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurface)
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = item.menuItem.imageUrl,
                contentDescription = item.menuItem.name,
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(10.dp)),
                contentScale = ContentScale.Crop
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(item.menuItem.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                if (item.selectedVariant != null) {
                    Text("Size: ${item.selectedVariant.name}", fontSize = 12.sp, color = TextSecondary)
                }
                if (item.selectedAddons.isNotEmpty()) {
                    Text("Extras: ${item.selectedAddons.joinToString { it.name }}", fontSize = 12.sp, color = TextSecondary)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(CurrencyFormatter.formatInr(item.itemTotalPrice), fontWeight = FontWeight.Bold, color = OrangePrimary)
            }

            // Counter
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .background(DarkSurfaceElevated, RoundedCornerShape(10.dp))
                    .padding(horizontal = 4.dp, vertical = 2.dp)
            ) {
                IconButton(onClick = onDecrease, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Remove, contentDescription = null, tint = TextPrimary, modifier = Modifier.size(14.dp))
                }
                Text("${item.quantity}", fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp))
                IconButton(onClick = onIncrease, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = TextPrimary, modifier = Modifier.size(14.dp))
                }
            }
        }
    }
}

@Composable
fun BillRow(label: String, amount: Double, isDiscount: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        val formatted = CurrencyFormatter.formatInr(kotlin.math.abs(amount))
        Text(
            text = (if (isDiscount) "-" else "") + formatted,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = if (isDiscount) VegGreen else TextPrimary
        )
    }
}
