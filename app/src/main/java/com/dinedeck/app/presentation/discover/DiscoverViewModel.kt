package com.dinedeck.app.presentation.discover

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.Restaurant
import com.dinedeck.app.domain.repository.RestaurantRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DiscoverUiState(
    val searchQuery: String = "",
    val selectedCuisine: String? = null,
    val minRating: Double? = null,
    val onlyOpen: Boolean = false,
    val vegOnly: Boolean = false,
    val onlyFavorites: Boolean = false,
    val sortBy: String = "RECOMMENDED", // "RECOMMENDED", "RATING", "DISTANCE"
    val isLoading: Boolean = false,
    val restaurants: List<Restaurant> = emptyList(),
    val errorMessage: String? = null
)

@HiltViewModel
class DiscoverViewModel @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DiscoverUiState())
    val uiState: StateFlow<DiscoverUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        performSearch()
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300) // Debounce search
            performSearch()
        }
    }

    fun setCuisineFilter(cuisine: String?) {
        _uiState.value = _uiState.value.copy(selectedCuisine = if (_uiState.value.selectedCuisine == cuisine) null else cuisine)
        performSearch()
    }

    fun toggleOnlyOpen() {
        _uiState.value = _uiState.value.copy(onlyOpen = !_uiState.value.onlyOpen)
        performSearch()
    }

    fun toggleVegOnly() {
        _uiState.value = _uiState.value.copy(vegOnly = !_uiState.value.vegOnly)
        performSearch()
    }

    fun toggleFavoritesOnly() {
        _uiState.value = _uiState.value.copy(onlyFavorites = !_uiState.value.onlyFavorites)
        performSearch()
    }

    fun setSortBy(sortOption: String) {
        _uiState.value = _uiState.value.copy(sortBy = sortOption)
        performSearch()
    }

    fun performSearch() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val currentState = _uiState.value
            when (val res = restaurantRepository.getRestaurants(
                query = currentState.searchQuery,
                cuisine = currentState.selectedCuisine,
                minRating = currentState.minRating,
                onlyOpen = currentState.onlyOpen,
                vegOnly = currentState.vegOnly
            )) {
                is Resource.Success -> {
                    var list = res.data ?: emptyList()
                    if (currentState.onlyFavorites) {
                        list = list.filter { it.isFavorite }
                    }
                    list = when (currentState.sortBy) {
                        "RATING" -> list.sortedByDescending { it.rating }
                        "REVIEWS" -> list.sortedByDescending { it.reviewCount }
                        else -> list
                    }
                    _uiState.value = _uiState.value.copy(isLoading = false, restaurants = list)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> {}
            }
        }
    }

    fun toggleFavorite(restaurantId: String) {
        viewModelScope.launch {
            restaurantRepository.toggleFavoriteRestaurant(restaurantId)
            performSearch()
        }
    }
}
