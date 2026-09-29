package com.dinedeck.admin.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.admin.data.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ControlCenterUiState(
    val selectedTab: Int = 0, // 0: Overview, 1: Restaurants, 2: Operations, 3: Finance, 4: More
    val moreSubSection: String? = null, // "CUSTOMERS", "GROWTH", "SUPPORT", "SECURITY", "SYSTEM"
    val selectedRange: String = "all",
    val isOverviewLoading: Boolean = false,
    val overviewData: OverviewData? = null,
    val isRestaurantsLoading: Boolean = false,
    val restaurants: List<AdminRestaurant> = emptyList(),
    val searchQuery: String = "",
    val statusFilter: String = "ALL",
    val selectedRestaurant: AdminRestaurant? = null,
    val isDetailLoading: Boolean = false,
    val isLiveOpsLoading: Boolean = false,
    val liveOpsData: LiveOperationsData? = null,
    val isPaymentsLoading: Boolean = false,
    val payments: List<AdminPayment> = emptyList(),
    val isSettlementsLoading: Boolean = false,
    val settlements: List<AdminSettlement> = emptyList(),
    val isCustomersLoading: Boolean = false,
    val customers: List<AdminCustomer> = emptyList(),
    val isCouponsLoading: Boolean = false,
    val coupons: List<AdminCoupon> = emptyList(),
    val isSupportLoading: Boolean = false,
    val supportTickets: List<AdminSupportTicket> = emptyList(),
    val isAuditLoading: Boolean = false,
    val auditLogs: List<AdminAuditLog> = emptyList(),
    val isHealthLoading: Boolean = false,
    val systemHealth: SystemHealthData? = null,
    val globalSearchResult: GlobalSearchResult? = null,
    val isSearching: Boolean = false,
    val feedbackMessage: String? = null
)

class ControlCenterViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ControlCenterUiState())
    val uiState: StateFlow<ControlCenterUiState> = _uiState.asStateFlow()

    init {
        refreshAll()
    }

    fun setTab(index: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = index, moreSubSection = null, selectedRestaurant = null)
        when (index) {
            0 -> loadOverview(_uiState.value.selectedRange)
            1 -> loadRestaurants()
            2 -> loadLiveOperations()
            3 -> {
                loadPayments()
                loadSettlements()
            }
            4 -> loadSystemHealth()
        }
    }

    fun setMoreSubSection(subSection: String?) {
        _uiState.value = _uiState.value.copy(moreSubSection = subSection)
        when (subSection) {
            "CUSTOMERS" -> loadCustomers()
            "GROWTH" -> loadCoupons()
            "SUPPORT" -> loadSupportTickets()
            "SECURITY" -> loadAuditLogs()
            "SYSTEM" -> loadSystemHealth()
        }
    }

    fun refreshAll() {
        viewModelScope.launch {
            AdminApiClient.login()
            loadOverview(_uiState.value.selectedRange)
            loadRestaurants()
            loadLiveOperations()
            loadPayments()
            loadSettlements()
        }
    }

    fun loadOverview(range: String = "all") {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isOverviewLoading = true, selectedRange = range)
            val data = AdminApiClient.getOverview(range)
            _uiState.value = _uiState.value.copy(isOverviewLoading = false, overviewData = data)
        }
    }

    fun performGlobalSearch(query: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSearching = true)
            val results = AdminApiClient.search(query)
            _uiState.value = _uiState.value.copy(isSearching = false, globalSearchResult = results)
        }
    }

    fun loadRestaurants(query: String? = null, status: String? = null) {
        viewModelScope.launch {
            val q = query ?: _uiState.value.searchQuery
            val s = status ?: _uiState.value.statusFilter
            _uiState.value = _uiState.value.copy(isRestaurantsLoading = true, searchQuery = q, statusFilter = s)
            val data = AdminApiClient.getRestaurants(q, s)
            _uiState.value = _uiState.value.copy(isRestaurantsLoading = false, restaurants = data.orEmpty())
        }
    }

    fun selectRestaurant(id: String?) {
        if (id == null) {
            _uiState.value = _uiState.value.copy(selectedRestaurant = null)
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isDetailLoading = true)
            val detail = AdminApiClient.getRestaurantDetail(id)
            _uiState.value = _uiState.value.copy(isDetailLoading = false, selectedRestaurant = detail)
        }
    }

    fun onboardRestaurant(data: Map<String, Any>, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.onboardRestaurant(data)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Restaurant onboarded in PENDING_REVIEW status")
                loadRestaurants()
                loadOverview()
            }
            onDone(success)
        }
    }

    fun updateRestaurantProfile(id: String, profile: Map<String, Any>, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.updateRestaurantProfile(id, profile)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Restaurant profile saved")
                selectRestaurant(id)
                loadRestaurants()
            }
            onDone(success)
        }
    }

    fun updateRestaurantLifecycle(id: String, status: String, reason: String? = null) {
        viewModelScope.launch {
            val updated = AdminApiClient.updateRestaurantLifecycle(id, status, reason)
            if (updated != null) {
                _uiState.value = _uiState.value.copy(
                    feedbackMessage = "Restaurant status updated to $status",
                    selectedRestaurant = updated
                )
                loadRestaurants()
                loadOverview()
            }
        }
    }

    fun updateRestaurantConfig(id: String, config: Map<String, Any>) {
        viewModelScope.launch {
            val updated = AdminApiClient.updateRestaurantConfig(id, config)
            if (updated != null) {
                _uiState.value = _uiState.value.copy(
                    feedbackMessage = "Commercial and billing configuration updated",
                    selectedRestaurant = updated
                )
            }
        }
    }

    fun createBranch(restaurantId: String, name: String, address: String, phone: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.createBranch(restaurantId, name, address, phone)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Branch $name created")
                selectRestaurant(restaurantId)
            }
            onDone(success)
        }
    }

    fun updateBranch(branchId: String, name: String, address: String, phone: String, isActive: Boolean, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.updateBranch(branchId, name, address, phone, isActive)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Branch updated")
                val currentRestId = _uiState.value.selectedRestaurant?.id
                if (currentRestId != null) selectRestaurant(currentRestId)
            }
            onDone(success)
        }
    }

    fun createTable(branchId: String, tableNumber: String, capacity: Int, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.createTable(branchId, tableNumber, capacity)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Table T#$tableNumber created")
                val currentRestId = _uiState.value.selectedRestaurant?.id
                if (currentRestId != null) selectRestaurant(currentRestId)
            }
            onDone(success)
        }
    }

    fun updateTable(tableId: String, tableNumber: String, capacity: Int, isOccupied: Boolean, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.updateTable(tableId, tableNumber, capacity, isOccupied)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Table T#$tableNumber updated")
                val currentRestId = _uiState.value.selectedRestaurant?.id
                if (currentRestId != null) selectRestaurant(currentRestId)
            }
            onDone(success)
        }
    }

    fun regenerateTableQr(tableId: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.regenerateTableQr(tableId)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "New cryptographic QR code generated")
                val currentRestId = _uiState.value.selectedRestaurant?.id
                if (currentRestId != null) selectRestaurant(currentRestId)
            }
            onDone(success)
        }
    }

    fun createMenuCategory(restaurantId: String, name: String, displayOrder: Int, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.createMenuCategory(restaurantId, name, displayOrder)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Category $name added")
                selectRestaurant(restaurantId)
            }
            onDone(success)
        }
    }

    fun createMenuItem(categoryId: String, name: String, price: Double, description: String, isVeg: Boolean, isAvailable: Boolean, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.createMenuItem(categoryId, name, price, description, isVeg, isAvailable)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Item $name created (₹$price)")
                val currentRestId = _uiState.value.selectedRestaurant?.id
                if (currentRestId != null) selectRestaurant(currentRestId)
            }
            onDone(success)
        }
    }

    fun updateMenuItem(itemId: String, name: String?, price: Double?, description: String?, isVeg: Boolean?, isAvailable: Boolean?, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.updateMenuItem(itemId, name, price, description, isVeg, isAvailable)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Menu item updated")
                val currentRestId = _uiState.value.selectedRestaurant?.id
                if (currentRestId != null) selectRestaurant(currentRestId)
            }
            onDone(success)
        }
    }

    fun createStaff(restaurantId: String, name: String, email: String, phone: String, role: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.createStaff(restaurantId, name, email, phone, role)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Staff $name ($role) added")
                selectRestaurant(restaurantId)
            }
            onDone(success)
        }
    }

    fun setPermissionOverride(staffId: String, resource: String, action: String, effect: String, scope: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.setPermissionOverride(staffId, resource, action, effect, scope)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "IAM Permission override ($effect) saved")
            }
            onDone(success)
        }
    }

    fun loadLiveOperations() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLiveOpsLoading = true)
            val data = AdminApiClient.getLiveOperations()
            _uiState.value = _uiState.value.copy(isLiveOpsLoading = false, liveOpsData = data)
        }
    }

    fun loadPayments() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPaymentsLoading = true)
            val data = AdminApiClient.getPayments()
            _uiState.value = _uiState.value.copy(isPaymentsLoading = false, payments = data.orEmpty())
        }
    }

    fun refundPayment(paymentId: String, reason: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.refundPayment(paymentId, reason)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Refund executed successfully")
                loadPayments()
                loadOverview()
            }
            onDone(success)
        }
    }

    fun loadSettlements() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSettlementsLoading = true)
            val data = AdminApiClient.getSettlements()
            _uiState.value = _uiState.value.copy(isSettlementsLoading = false, settlements = data.orEmpty())
        }
    }

    fun generateSettlement(restaurantId: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val settlement = AdminApiClient.generateSettlement(restaurantId)
            if (settlement != null) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Settlement batch ${settlement.settlementNumber} generated")
                loadSettlements()
            }
            onDone(settlement != null)
        }
    }

    fun payoutSettlement(settlementId: String, payoutRef: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.processPayout(settlementId, payoutRef)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Payout marked as SETTLED ($payoutRef)")
                loadSettlements()
            }
            onDone(success)
        }
    }

    fun loadCustomers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCustomersLoading = true)
            val data = AdminApiClient.getCustomers()
            _uiState.value = _uiState.value.copy(isCustomersLoading = false, customers = data.orEmpty())
        }
    }

    fun loadCoupons() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCouponsLoading = true)
            val data = AdminApiClient.getCoupons()
            _uiState.value = _uiState.value.copy(isCouponsLoading = false, coupons = data.orEmpty())
        }
    }

    fun createCoupon(code: String, discountPercent: Double, maxDiscount: Double, minOrder: Double, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.createCoupon(code, discountPercent, maxDiscount, minOrder)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Coupon $code created")
                loadCoupons()
            }
            onDone(success)
        }
    }

    fun loadSupportTickets() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSupportLoading = true)
            val data = AdminApiClient.getSupportTickets()
            _uiState.value = _uiState.value.copy(isSupportLoading = false, supportTickets = data.orEmpty())
        }
    }

    fun createSupportTicket(title: String, description: String, category: String, priority: String, restaurantId: String?, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.createSupportTicket(title, description, category, priority, restaurantId)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Incident ticket logged")
                loadSupportTickets()
            }
            onDone(success)
        }
    }

    fun resolveSupportTicket(ticketId: String, notes: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.resolveSupportTicket(ticketId, notes)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Ticket marked as RESOLVED")
                loadSupportTickets()
            }
            onDone(success)
        }
    }

    fun loadAuditLogs() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAuditLoading = true)
            val data = AdminApiClient.getSecurityAuditLogs()
            _uiState.value = _uiState.value.copy(isAuditLoading = false, auditLogs = data.orEmpty())
        }
    }

    fun loadSystemHealth() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isHealthLoading = true)
            val data = AdminApiClient.getSystemHealth()
            _uiState.value = _uiState.value.copy(isHealthLoading = false, systemHealth = data)
        }
    }

    fun triggerKillswitch(action: String, reason: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = AdminApiClient.executeKillswitch(action, reason)
            if (success) {
                _uiState.value = _uiState.value.copy(feedbackMessage = "Killswitch $action executed")
                loadRestaurants()
                loadOverview()
            }
            onDone(success)
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(feedbackMessage = null)
    }
}
