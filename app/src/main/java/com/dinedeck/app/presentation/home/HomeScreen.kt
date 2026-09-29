package com.dinedeck.app.presentation.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material.icons.outlined.Search
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
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.domain.model.Offer
import com.dinedeck.app.domain.model.Restaurant

@Composable
fun HomeScreen(
    onNavigateToDiscover: (String) -> Unit,
    onNavigateToRestaurant: (String) -> Unit,
    onNavigateToQRScanner: () -> Unit,
    onNavigateToCart: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    val sampleCategories = remember {
        listOf(
            "North Indian" to Icons.Default.DinnerDining,
            "Biryani" to Icons.Default.RiceBowl,
            "South Indian" to Icons.Default.BakeryDining,
            "Mughlai" to Icons.Default.OutdoorGrill,
            "Chai & Lassi" to Icons.Default.LocalBar,
            "Desserts" to Icons.Default.Icecream
        )
    }

    var isPureVeg by remember { mutableStateOf(false) }
    var isFavorites by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            DineDeckTopHeader(
                isPureVeg = isPureVeg,
                onPureVegToggle = {
                    isPureVeg = !isPureVeg
                    onNavigateToDiscover(if (isPureVeg) "Pure Veg" else "")
                },
                isFavorites = isFavorites,
                onFavoritesToggle = {
                    isFavorites = !isFavorites
                    onNavigateToDiscover(if (isFavorites) "Favorites" else "")
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToQRScanner,
                containerColor = OrangePrimary,
                contentColor = TextPrimary,
                shape = RoundedCornerShape(16.dp),
                icon = { Icon(Icons.Outlined.QrCodeScanner, contentDescription = "Scan Table QR") },
                text = { Text("Scan Table", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            // 1. Promotional Culinary Advertisement Showcase (Matching Web)
            Spacer(modifier = Modifier.height(6.dp))
            val promoAds = remember {
                listOf(
                    PromoAdItem(
                        id = "ad_1",
                        title = "Royal Awadhi Dum Biryani Festival",
                        subtitle = "Slow-cooked saffron biryanis with tender mutton, char-grilled kebabs & burani raita.",
                        tag = "CHEF'S SPECIAL • SIGNATURE RECIPE",
                        badge = "🔥 Trending Festival",
                        imageUrl = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
                        rating = "4.9 ★ (1,400+)",
                        cta = "Explore Biryani Specials"
                    ),
                    PromoAdItem(
                        id = "ad_2",
                        title = "Smoky Tandoor & Barbeque Nights",
                        subtitle = "Fiery charcoal-grilled Angaari Paneer, Murgh Malai Tikka & artisanal garlic butter naans.",
                        tag = "WEEKEND LIVE TANDOOR",
                        badge = "✨ Live Grill Spotlight",
                        imageUrl = "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80",
                        rating = "4.85 ★ (980+)",
                        cta = "Explore Tandoori Sizzlers"
                    ),
                    PromoAdItem(
                        id = "ad_3",
                        title = "Maharaja Heritage Royal Thali Feast",
                        subtitle = "18 authentic regional dishes served hot with unlimited fragrant basmati rice & pure ghee sweets.",
                        tag = "PURE VEG • UNLIMITED",
                        badge = "👑 Heritage Dining",
                        imageUrl = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80",
                        rating = "4.92 ★ (1,250+)",
                        cta = "Discover Royal Feast"
                    )
                )
            }

            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(promoAds, key = { it.id }) { ad ->
                    PromoAdCard(ad = ad, onClick = { onNavigateToRestaurant("rest_1") })
                }
            }

            // 2. Popular Cuisines (2-Column Grid Matching Screenshot 1)
            Spacer(modifier = Modifier.height(24.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Layers,
                        contentDescription = null,
                        tint = OrangePrimary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Popular Cuisines",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = "Select category to filter",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }
            Spacer(modifier = Modifier.height(12.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Row 1
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    // All Cuisines (Active with border)
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToDiscover("All Cuisines") },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                        border = androidx.compose.foundation.BorderStroke(1.5.dp, OrangePrimary)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "🍽️", fontSize = 24.sp)
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = OrangePrimary
                                ) {
                                    Text(
                                        text = "ACTIVE",
                                        color = TextPrimary,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "All Cuisines", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                            Text(text = "Full Menu Collection", fontSize = 11.sp, color = TextSecondary)
                        }
                    }

                    // Punjab & Tandoori
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToDiscover("Punjab & Tandoori") },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "🥘", fontSize = 24.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "Punjab & Tandoori", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                            Text(text = "Butter Chicken & Naans", fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                }

                // Row 2
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Royal Thali
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToDiscover("Royal Thali") },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "🍲", fontSize = 24.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "Royal Thali", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                            Text(text = "Mewar Thali & Dal Baati", fontSize = 11.sp, color = TextSecondary)
                        }
                    }

                    // Coastal & South
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToDiscover("Coastal & South") },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "🍛", fontSize = 24.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "Coastal & South", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                            Text(text = "Ghee Roast & Curries", fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                }

                // Row 3
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Awadhi Biryani
                    Card(
                        modifier = Modifier
                            .weight(0.5f)
                            .clickable { onNavigateToDiscover("Awadhi Biryani") },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "🍗", fontSize = 24.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "Awadhi Biryani", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                            Text(text = "Dum Pukht & Kebabs", fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                    Spacer(modifier = Modifier.weight(0.5f))
                }
            }

            // 3. Search Bar & Popular Search Tags
            Spacer(modifier = Modifier.height(24.dp))
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    val popularTags = listOf("Biryani", "North Indian", "Pure Veg", "Thali", "Tandoori")
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("POPULAR: ", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextSecondary)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(popularTags) { tag ->
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = DarkSurfaceElevated,
                                    modifier = Modifier.clickable { onNavigateToDiscover(tag) }
                                ) {
                                    Text(
                                        text = tag,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextPrimary,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        onClick = { onNavigateToDiscover("") },
                        shape = RoundedCornerShape(12.dp),
                        color = DarkBackground,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Search, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Search restaurants, cuisines (e.g. Mughlai, Thali),",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Showing ", fontSize = 11.sp, color = TextSecondary)
                        Text("6", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text(" partner restaurants", fontSize = 11.sp, color = TextSecondary)
                    }
                }
            }

            // 4. Curated Premier Partner Restaurants (Matching Web)
            Spacer(modifier = Modifier.height(28.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Premier Partner Restaurants",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = { onNavigateToDiscover("") }) {
                    Text("See All", color = OrangePrimary, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (uiState.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = OrangePrimary)
                }
            } else {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    uiState.restaurants.forEach { restaurant ->
                        RestaurantCard(
                            restaurant = restaurant,
                            onClick = { onNavigateToRestaurant(restaurant.id) },
                            onFavoriteToggle = { viewModel.toggleFavorite(restaurant.id) }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
fun BannerCard(
    banner: Offer,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(280.dp)
            .height(130.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = OrangePrimary
                ) {
                    Text(
                        text = banner.code,
                        color = TextPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = banner.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = banner.expiresAt,
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp,
                    color = TextMuted
                )
            }
            Icon(
                imageVector = Icons.Default.Discount,
                contentDescription = null,
                tint = AmberAccent,
                modifier = Modifier.size(44.dp)
            )
        }
    }
}

data class PromoAdItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val tag: String,
    val badge: String,
    val imageUrl: String,
    val rating: String,
    val cta: String
)

@Composable
fun PromoAdCard(
    ad: PromoAdItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(300.dp)
            .height(170.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = ad.imageUrl,
                contentDescription = ad.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )

            // Dark Gradient Scrim
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        androidx.compose.ui.graphics.Brush.verticalGradient(
                            colors = listOf(
                                androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.4f),
                                androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.85f),
                                androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.95f)
                            )
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(14.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = OrangePrimary
                    ) {
                        Text(
                            text = ad.badge,
                            color = TextPrimary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    Text(
                        text = ad.rating,
                        color = AmberAccent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = ad.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = ad.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 11.sp,
                        color = TextSecondary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = ad.tag,
                            color = OrangePrimary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "${ad.cta} →",
                            color = TextPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
