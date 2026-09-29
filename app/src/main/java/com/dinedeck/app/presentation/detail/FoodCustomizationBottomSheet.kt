package com.dinedeck.app.presentation.detail

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.core.util.CurrencyFormatter
import com.dinedeck.app.domain.model.MenuAddon
import com.dinedeck.app.domain.model.MenuItem
import com.dinedeck.app.domain.model.MenuVariant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FoodCustomizationBottomSheet(
    item: MenuItem,
    onDismiss: () -> Unit,
    onAddToCart: (variant: MenuVariant?, addons: List<MenuAddon>, quantity: Int, instructions: String) -> Unit
) {
    var selectedVariant by remember { mutableStateOf(item.variants.firstOrNull()) }
    val selectedAddons = remember { mutableStateListOf<MenuAddon>() }
    var quantity by remember { mutableStateOf(1) }
    var specialInstructions by remember { mutableStateOf("") }

    // Dynamic Price Calculation
    val unitPrice = remember(item, selectedVariant, selectedAddons.toList()) {
        val variantDelta = selectedVariant?.priceDelta ?: 0.0
        val addonsSum = selectedAddons.sumOf { it.price }
        item.finalPrice + variantDelta + addonsSum
    }
    val totalPrice = remember(unitPrice, quantity) { unitPrice * quantity }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Box(modifier = Modifier.fillMaxWidth()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    AsyncImage(
                        model = item.imageUrl,
                        contentDescription = item.name,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .background(DarkBackground.copy(alpha = 0.7f), CircleShape)
                        .size(36.dp)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = TextPrimary)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = AmberAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${item.rating}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = item.description,
                style = MaterialTheme.typography.bodyLarge,
                color = TextSecondary
            )

            // Allergens & Ingredients
            if (item.allergens.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Allergens: ", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextMuted)
                    Text(item.allergens.joinToString(", "), fontSize = 12.sp, color = RedDanger)
                }
            }

            // Variants / Size Customization
            if (item.variants.isNotEmpty()) {
                Spacer(modifier = Modifier.height(20.dp))
                Text("Select Size / Portion", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                item.variants.forEach { variant ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedVariant = variant }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = selectedVariant == variant,
                                onClick = { selectedVariant = variant },
                                colors = RadioButtonDefaults.colors(selectedColor = OrangePrimary)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(variant.name, style = MaterialTheme.typography.bodyLarge)
                        }
                        if (variant.priceDelta > 0) {
                            Text("+ ${CurrencyFormatter.formatInr(variant.priceDelta)}", style = MaterialTheme.typography.bodyMedium, color = AmberAccent)
                        }
                    }
                }
            }

            // Add-ons Customization
            if (item.addons.isNotEmpty()) {
                Spacer(modifier = Modifier.height(20.dp))
                Text("Add-ons & Extras", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                item.addons.forEach { addon ->
                    val isChecked = selectedAddons.contains(addon)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isChecked) selectedAddons.remove(addon) else selectedAddons.add(addon)
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(
                                checked = isChecked,
                                onCheckedChange = {
                                    if (it) selectedAddons.add(addon) else selectedAddons.remove(addon)
                                },
                                colors = CheckboxDefaults.colors(checkedColor = OrangePrimary)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(addon.name, style = MaterialTheme.typography.bodyLarge)
                        }
                        Text("+ ${CurrencyFormatter.formatInr(addon.price)}", style = MaterialTheme.typography.bodyMedium, color = AmberAccent)
                    }
                }
            }

            // Special Instructions
            Spacer(modifier = Modifier.height(20.dp))
            OutlinedTextField(
                value = specialInstructions,
                onValueChange = { specialInstructions = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Special Instructions") },
                placeholder = { Text("e.g. Medium spicy, Jain preparation, extra napkins", color = TextMuted) },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = OrangePrimary,
                    unfocusedBorderColor = DarkBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                )
            )

            // Quantity & Add To Cart Button
            Spacer(modifier = Modifier.height(24.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Quantity Counter
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(DarkSurfaceElevated, RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    IconButton(
                        onClick = { if (quantity > 1) quantity-- },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Decrease", tint = TextPrimary)
                    }
                    Text(
                        text = "$quantity",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )
                    IconButton(
                        onClick = { quantity++ },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Increase", tint = TextPrimary)
                    }
                }

                Spacer(modifier = Modifier.width(16.dp))

                DineDeckButton(
                    text = "Add to Cart • ${CurrencyFormatter.formatInr(totalPrice)}",
                    onClick = { onAddToCart(selectedVariant, selectedAddons, quantity, specialInstructions) },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
