package com.dinedeck.app.presentation.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.dinedeck.app.core.designsystem.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    initialQuery: String = "",
    onNavigateToRestaurant: (String) -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: DiscoverViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val availableCuisines = remember { listOf("Italian", "Japanese", "Steaks", "Asian Fusion", "Wine & Dine") }

    LaunchedEffect(initialQuery) {
        if (initialQuery.isNotEmpty()) {
            viewModel.onSearchQueryChanged(initialQuery)
        }
    }

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkBackground)
            ) {
                DineDeckTopHeader(
                    isPureVeg = uiState.vegOnly,
                    onPureVegToggle = { viewModel.toggleVegOnly() },
                    isFavorites = uiState.onlyFavorites,
                    onFavoritesToggle = { viewModel.toggleFavoritesOnly() }
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Discover Restaurants",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Search Input
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                placeholder = { Text("Search by restaurant name, cuisine or food...", color = TextMuted) },
                leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = TextSecondary) },
                trailingIcon = if (uiState.searchQuery.isNotEmpty()) {
                    {
                        IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear", tint = TextSecondary)
                        }
                    }
                } else null,
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = OrangePrimary,
                    unfocusedBorderColor = DarkBorder,
                    focusedContainerColor = DarkSurface,
                    unfocusedContainerColor = DarkSurface,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                )
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Cuisine & Status Filter Chips (Unified Alignment)
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                item {
                    CategoryChip(
                        categoryName = "● Open Now",
                        isSelected = uiState.onlyOpen,
                        onClick = { viewModel.toggleOnlyOpen() }
                    )
                }
                items(availableCuisines) { cuisine ->
                    CategoryChip(
                        categoryName = cuisine,
                        isSelected = uiState.selectedCuisine == cuisine,
                        onClick = { viewModel.setCuisineFilter(cuisine) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Results List
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = OrangePrimary)
                }
            } else if (uiState.restaurants.isEmpty()) {
                EmptyStateView(
                    title = "No Restaurants Found",
                    description = "We couldn't find any partner restaurants matching your search filters.",
                    icon = { Icon(Icons.Default.FilterList, contentDescription = null, tint = OrangePrimary, modifier = Modifier.size(36.dp)) },
                    actionButtonText = "Clear Filters",
                    onActionClick = {
                        viewModel.onSearchQueryChanged("")
                        viewModel.setCuisineFilter(null)
                    }
                )
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(uiState.restaurants, key = { it.id }) { restaurant ->
                        RestaurantCard(
                            restaurant = restaurant,
                            onClick = { onNavigateToRestaurant(restaurant.id) },
                            onFavoriteToggle = { viewModel.toggleFavorite(restaurant.id) }
                        )
                    }
                }
            }
        }
    }
}
