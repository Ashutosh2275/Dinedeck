package com.dinedeck.app.presentation.home

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

data class HomeUiState(
    val isLoading: Boolean = true,
    val user: User? = null,
    val banners: List<Offer> = emptyList(),
    val categories: List<MenuCategory> = emptyList(),
    val restaurants: List<Restaurant> = emptyList(),
    val recommendedItems: List<MenuItem> = emptyList(),
    val activeSessionId: String? = null,
    val activeTableNumber: Int = 0,
    val unreadNotificationsCount: Int = 1,
    val errorMessage: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val restaurantRepository: RestaurantRepository,
    private val offerRepository: OfferRepository,
    private val menuRepository: MenuRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
        observeSession()
    }

    private fun observeSession() {
        viewModelScope.launch {
            sessionManager.userFlow.collect { u ->
                _uiState.value = _uiState.value.copy(user = u)
            }
        }
        viewModelScope.launch {
            sessionManager.activeSessionIdFlow.collect { sessId ->
                _uiState.value = _uiState.value.copy(activeSessionId = sessId)
            }
        }
    }

    fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val bannersRes = offerRepository.getPromotionalBanners()
            val restaurantsRes = restaurantRepository.getRestaurants()
            val recommendedRes = menuRepository.getRecommendedItems("rest_1")
            val userRes = userRepository.getUserProfile()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                user = userRes.data,
                banners = bannersRes.data ?: emptyList(),
                restaurants = restaurantsRes.data ?: emptyList(),
                recommendedItems = recommendedRes.data ?: emptyList()
            )
        }
    }

    fun toggleFavorite(restaurantId: String) {
        viewModelScope.launch {
            restaurantRepository.toggleFavoriteRestaurant(restaurantId)
            loadHomeData()
        }
    }
}
