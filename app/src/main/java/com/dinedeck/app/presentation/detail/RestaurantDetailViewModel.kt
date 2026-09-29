package com.dinedeck.app.presentation.detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.session.SessionManager
import com.dinedeck.app.core.util.Resource
import com.dinedeck.app.domain.model.*
import com.dinedeck.app.domain.repository.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RestaurantDetailUiState(
    val isLoading: Boolean = true,
    val restaurant: Restaurant? = null,
    val categories: List<MenuCategory> = emptyList(),
    val selectedCategory: MenuCategory? = null,
    val menuItems: List<MenuItem> = emptyList(),
    val isVegOnly: Boolean = false,
    val searchQuery: String = "",
    val selectedMenuItemForCustomization: MenuItem? = null,
    val cart: Cart = Cart(),
    val activeTableNumber: Int = 0,
    val isTableVerified: Boolean = false,
    val showQrRequiredDialog: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class RestaurantDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val restaurantRepository: RestaurantRepository,
    private val menuRepository: MenuRepository,
    private val cartRepository: CartRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val restaurantId: String = checkNotNull(savedStateHandle["restaurantId"])

    private val _uiState = MutableStateFlow(RestaurantDetailUiState())
    val uiState: StateFlow<RestaurantDetailUiState> = _uiState.asStateFlow()

    init {
        loadRestaurantDetails()
        observeCart()
        observeTableSession()
    }

    private fun observeTableSession() {
        viewModelScope.launch {
            combine(
                sessionManager.activeSessionIdFlow,
                sessionManager.activeTableNumberFlow,
                sessionManager.activeRestaurantIdFlow
            ) { sessId, tableNum, restId ->
                val matchesRest = restId == null || restId == restaurantId || 
                    (restId == "rest_punjab_heritage" && (restaurantId == "rest_1" || restaurantId == "rest_punjab_heritage")) ||
                    (restId == "rest_1" && (restaurantId == "rest_1" || restaurantId == "rest_punjab_heritage"))
                val isVerified = !sessId.isNullOrEmpty() && tableNum > 0 && matchesRest
                _uiState.value = _uiState.value.copy(
                    activeTableNumber = if (isVerified) tableNum else 0,
                    isTableVerified = isVerified
                )
            }.collect()
        }
    }

    private fun observeCart() {
        viewModelScope.launch {
            cartRepository.cartFlow.collect { cart ->
                _uiState.value = _uiState.value.copy(cart = cart)
            }
        }
    }

    fun loadRestaurantDetails() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val restRes = restaurantRepository.getRestaurantById(restaurantId)
            val catsRes = menuRepository.getCategories(restaurantId)

            if (restRes is Resource.Success && catsRes is Resource.Success) {
                val rest = restRes.data
                val cats = catsRes.data ?: emptyList()
                val initialCat = cats.firstOrNull()

                _uiState.value = _uiState.value.copy(
                    restaurant = rest,
                    categories = cats,
                    selectedCategory = initialCat
                )
                loadMenuItems(initialCat?.id)
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = restRes.message ?: "Failed to load restaurant details"
                )
            }
        }
    }

    fun selectCategory(category: MenuCategory) {
        _uiState.value = _uiState.value.copy(selectedCategory = category)
        loadMenuItems(category.id)
    }

    fun toggleVegOnly() {
        _uiState.value = _uiState.value.copy(isVegOnly = !_uiState.value.isVegOnly)
        loadMenuItems(_uiState.value.selectedCategory?.id)
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadMenuItems(_uiState.value.selectedCategory?.id)
    }

    private fun loadMenuItems(categoryId: String?) {
        viewModelScope.launch {
            val currentState = _uiState.value
            when (val itemsRes = menuRepository.getMenuItems(restaurantId, categoryId, currentState.searchQuery)) {
                is Resource.Success -> {
                    var items = itemsRes.data ?: emptyList()
                    if (currentState.isVegOnly) {
                        items = items.filter { it.isVeg }
                    }
                    _uiState.value = _uiState.value.copy(isLoading = false, menuItems = items)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = itemsRes.message)
                }
                else -> {}
            }
        }
    }

    fun onAttemptAddToCart(item: MenuItem) {
        if (!_uiState.value.isTableVerified) {
            _uiState.value = _uiState.value.copy(showQrRequiredDialog = true)
        } else {
            openItemCustomization(item)
        }
    }

    fun dismissQrRequiredDialog() {
        _uiState.value = _uiState.value.copy(showQrRequiredDialog = false)
    }

    fun openItemCustomization(item: MenuItem) {
        _uiState.value = _uiState.value.copy(selectedMenuItemForCustomization = item)
    }

    fun dismissItemCustomization() {
        _uiState.value = _uiState.value.copy(selectedMenuItemForCustomization = null)
    }

    fun addItemToCart(
        item: MenuItem,
        variant: MenuVariant?,
        addons: List<MenuAddon>,
        quantity: Int,
        instructions: String
    ) {
        viewModelScope.launch {
            val rest = _uiState.value.restaurant
            cartRepository.addItem(
                menuItem = item,
                variant = variant,
                addons = addons,
                quantity = quantity,
                instructions = instructions,
                restaurantId = restaurantId,
                restaurantName = rest?.name ?: "DineDeck Partner"
            )
            dismissItemCustomization()
        }
    }

    fun toggleFavorite() {
        viewModelScope.launch {
            restaurantRepository.toggleFavoriteRestaurant(restaurantId)
            loadRestaurantDetails()
        }
    }
}
