package com.dinedeck.app.presentation.detail

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.graphics.Color
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.dinedeck.app.core.designsystem.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RestaurantDetailScreen(
    onNavigateBack: () -> Unit,
    onNavigateToCart: () -> Unit,
    onNavigateToQRScanner: () -> Unit = {},
    viewModel: RestaurantDetailViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val rest = uiState.restaurant

    Scaffold(
        containerColor = DarkBackground,
        bottomBar = {
            if (uiState.cart.items.isNotEmpty()) {
                Surface(
                    onClick = onNavigateToCart,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = OrangePrimary,
                    shadowElevation = 8.dp
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.ShoppingCart, contentDescription = null, tint = TextPrimary)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "${uiState.cart.items.sumOf { it.quantity }} items in cart",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = uiState.cart.restaurantName,
                                    fontSize = 11.sp,
                                    color = TextPrimary.copy(alpha = 0.8f)
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "View Cart • ${com.dinedeck.app.core.util.CurrencyFormatter.formatInr(uiState.cart.finalTotal)}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.ArrowForward, contentDescription = null, tint = TextPrimary, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (uiState.isLoading || rest == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = OrangePrimary)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // Header Image & Action Overlay
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                    ) {
                        AsyncImage(
                            model = rest.coverImageUrl,
                            contentDescription = rest.name,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )

                        // Top Navigation Buttons
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            IconButton(
                                onClick = onNavigateBack,
                                modifier = Modifier
                                    .background(DarkBackground.copy(alpha = 0.7f), CircleShape)
                                    .size(40.dp)
                            ) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                            }

                            Row {
                                IconButton(
                                    onClick = { },
                                    modifier = Modifier
                                        .background(DarkBackground.copy(alpha = 0.7f), CircleShape)
                                        .size(40.dp)
                                ) {
                                    Icon(Icons.Outlined.Share, contentDescription = "Share", tint = TextPrimary)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(
                                    onClick = { viewModel.toggleFavorite() },
                                    modifier = Modifier
                                        .background(DarkBackground.copy(alpha = 0.7f), CircleShape)
                                        .size(40.dp)
                                ) {
                                    Icon(
                                        imageVector = if (rest.isFavorite) Icons.Default.Favorite else Icons.Outlined.FavoriteBorder,
                                        contentDescription = "Favorite",
                                        tint = if (rest.isFavorite) RedDanger else TextPrimary
                                    )
                                }
                            }
                        }
                    }
                }

                // Restaurant Details Info Block
                item {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = rest.name,
                                style = MaterialTheme.typography.headlineLarge,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = AmberAccent, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("${rest.rating} (${rest.reviewCount} reviews)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("•", color = TextMuted)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(rest.cuisines.joinToString(", "), style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.LocationOn, contentDescription = null, tint = TextMuted, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(rest.address, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                onClick = {
                                    val uri = Uri.parse("geo:0,0?q=" + Uri.encode("${rest.name}, ${rest.address}"))
                                    val intent = Intent(Intent.ACTION_VIEW, uri)
                                    context.startActivity(intent)
                                },
                                shape = RoundedCornerShape(8.dp),
                                color = DarkSurface,
                                border = BorderStroke(1.dp, TextMuted.copy(alpha = 0.3f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Navigation, contentDescription = "Directions", tint = OrangePrimary, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Directions", style = MaterialTheme.typography.labelSmall, color = TextPrimary)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(rest.description, style = MaterialTheme.typography.bodyLarge, color = TextSecondary)
                    }
                }

                // Table Verification In-Dining Status Banner
                item {
                    if (uiState.isTableVerified) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = GreenSuccess.copy(alpha = 0.15f),
                            border = BorderStroke(1.dp, GreenSuccess.copy(alpha = 0.4f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(GreenSuccess, CircleShape)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Seated at Table #${uiState.activeTableNumber} (Verified by Table QR)",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = GreenSuccess
                                )
                            }
                        }
                    } else {
                        Surface(
                            onClick = onNavigateToQRScanner,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = OrangePrimary.copy(alpha = 0.12f),
                            border = BorderStroke(1.dp, OrangePrimary.copy(alpha = 0.35f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.QrCodeScanner,
                                        contentDescription = null,
                                        tint = OrangePrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = "Browsing Menu • In-Dining Only",
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary
                                        )
                                        Text(
                                            text = "Scan Table QR to unlock ordering",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextSecondary
                                        )
                                    }
                                }
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = OrangePrimary
                                ) {
                                    Text(
                                        text = "Scan QR",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }

                // Category Tabs
                item {
                    Text(
                        text = "Digital Menu",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 20.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(uiState.categories) { cat ->
                            CategoryChip(
                                categoryName = cat.name,
                                isSelected = uiState.selectedCategory?.id == cat.id,
                                onClick = { viewModel.selectCategory(cat) }
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Menu Items List
                items(uiState.menuItems, key = { it.id }) { item ->
                    val cartQty = uiState.cart.items.find { it.menuItem.id == item.id }?.quantity ?: 0
                    Box(modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp)) {
                        FoodCard(
                            item = item,
                            cartQuantity = cartQty,
                            onItemClick = { viewModel.onAttemptAddToCart(item) },
                            onAddToCartClick = { viewModel.onAttemptAddToCart(item) }
                        )
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }

        // Customization Modal Bottom Sheet
        if (uiState.selectedMenuItemForCustomization != null) {
            FoodCustomizationBottomSheet(
                item = uiState.selectedMenuItemForCustomization!!,
                onDismiss = { viewModel.dismissItemCustomization() },
                onAddToCart = { variant, addons, qty, notes ->
                    viewModel.addItemToCart(uiState.selectedMenuItemForCustomization!!, variant, addons, qty, notes)
                }
            )
        }

        // Table QR Required Dialog
        if (uiState.showQrRequiredDialog) {
            AlertDialog(
                onDismissRequest = { viewModel.dismissQrRequiredDialog() },
                icon = {
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        tint = OrangePrimary,
                        modifier = Modifier.size(36.dp)
                    )
                },
                title = {
                    Text(
                        text = "Scan Table QR to Order",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                },
                text = {
                    Text(
                        text = "DineDeck is strictly an in-restaurant smart dining platform, not a home delivery service.\n\nTo prevent orders outside the restaurant, please scan the QR code located on your dining table to assign your table number.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.dismissQrRequiredDialog()
                            onNavigateToQRScanner()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Scan Table QR", fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = { viewModel.dismissQrRequiredDialog() }
                    ) {
                        Text("Browse Only", color = TextMuted)
                    }
                },
                containerColor = DarkSurface,
                shape = RoundedCornerShape(20.dp)
            )
        }
    }
}
