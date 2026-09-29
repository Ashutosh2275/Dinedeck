package com.dinedeck.partner.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.partner.data.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PartnerUiState(
    val isLoggedIn: Boolean = false,
    val currentUser: PartnerUser? = null,
    val currentRestaurant: PartnerRestaurant? = null,
    val currentBranch: PartnerBranch? = null,
    val assignedRoles: List<String> = emptyList(),
    val permissions: Set<String> = emptySet(),
    val scopes: List<PartnerScope> = emptyList(),
    val selectedTab: Int = 0, // 0: Tables/Floor, 1: KDS/Orders, 2: Cashier & Billing, 3: Service Calls, 4: Management
    val activeManagementSubView: String? = null, // null, "SALES", "MENU", "STAFF_IAM", "TABLES", "INVENTORY", "AUDIT", "SETTINGS"
    val selectedOrderStatusFilter: String = "ALL", // "ALL", "CONFIRMED", "PREPARING", "READY", "SERVED"
    val selectedServiceStatusFilter: String = "ALL", // "ALL", "PENDING", "ACKNOWLEDGED", "RESOLVED"
    val orders: List<PartnerOrder> = emptyList(),
    val serviceCalls: List<PartnerServiceCall> = emptyList(),
    val overview: PartnerShiftOverview? = null,
    val menuCategories: List<PartnerMenuCategory> = emptyList(),
    val tables: List<PartnerTable> = emptyList(),
    val staffList: List<PartnerStaffMember> = emptyList(),
    val auditLogs: List<PartnerAuditLog> = emptyList(),
    val isLoading: Boolean = false,
    val isWsConnected: Boolean = true,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val editingStaffMember: PartnerStaffMember? = null,
    val editingMenuItem: PartnerMenuItem? = null,

    // -------------------------------------------------------------
    // Cashier & Billing Workstation State (Web Parity)
    // -------------------------------------------------------------
    val selectedBillingPeriod: String = "TODAY", // TODAY, YESTERDAY, WEEK, MONTH
    val activeCashierTab: String = "INVOICES", // INVOICES, SETTLEMENT, HISTORY
    val billingSessions: List<PartnerTableDiningSession> = emptyList(),
    val billingKpis: PartnerBillingKpis? = null,
    val billingHistory: List<PartnerHistoricalBill> = emptyList(),
    val selectedBillingSessionId: String? = null,
    val sessionBillData: PartnerSessionBillData? = null,
    val billingPaymentMode: String = "UPI", // UPI, CASH, CARD, SPLIT
    val cashTendered: String = "",
    val cardRefNumber: String = "",
    val upiRefNumber: String = "",
    val paymentNote: String = "",
    val splitUpi: Double = 0.0,
    val splitCash: Double = 0.0,
    val splitCard: Double = 0.0,
    val discountPercent: Int = 0,
    val isBillingLoading: Boolean = false,

    // -------------------------------------------------------------
    // Dining Floor & Waiter Reassignment State (Web Parity)
    // -------------------------------------------------------------
    val tableFloorFilter: String = "ALL", // ALL, OCCUPIED, VACANT
    val reassigningTable: PartnerTable? = null,

    // -------------------------------------------------------------
    // Kitchen KDS Station Filtering & Waiter Notification (Web Parity)
    // -------------------------------------------------------------
    val selectedKdsStation: String = "ALL" // ALL, TANDOOR, CURRY, CHINESE, BAKERY, BEVERAGE
)

class PartnerViewModel(
    private val apiClient: PartnerApiClient = PartnerApiClient()
) : ViewModel() {

    private val _uiState = MutableStateFlow(PartnerUiState())
    val uiState: StateFlow<PartnerUiState> = _uiState.asStateFlow()

    // Permission Checking Engine
    fun hasPermission(permission: String): Boolean {
        val state = _uiState.value
        if (state.assignedRoles.contains("SUPER_ADMIN") || state.currentUser?.role == "DINEDECK_SUPER_ADMIN") return true
        if (state.assignedRoles.contains("RESTAURANT_OWNER") || state.currentUser?.role == "RESTAURANT_OWNER") return true
        return state.permissions.contains(permission)
    }

    fun hasAnyRole(vararg roles: String): Boolean {
        val state = _uiState.value
        if (state.assignedRoles.contains("SUPER_ADMIN") || state.assignedRoles.contains("RESTAURANT_OWNER")) return true
        return roles.any { state.assignedRoles.contains(it) }
    }

    fun setTab(tabIndex: Int) {
        _uiState.update { it.copy(selectedTab = tabIndex, activeManagementSubView = null) }
        refreshCurrentTab()
    }

    fun setManagementSubView(subView: String?) {
        _uiState.update { it.copy(activeManagementSubView = subView) }
        if (subView != null) {
            when (subView) {
                "SALES" -> loadOverview()
                "MENU" -> loadMenu()
                "STAFF_IAM" -> loadStaff()
                "TABLES" -> loadTables()
                "AUDIT" -> loadAuditLogs()
            }
        }
    }

    fun setOrderStatusFilter(filter: String) {
        _uiState.update { it.copy(selectedOrderStatusFilter = filter) }
        loadOrders(filter)
    }

    fun dismissMessage() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }

    // Universal Login
    fun login(email: String, pass: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val response = apiClient.login(email, pass)
            if (response.success && response.data != null) {
                val data = response.data
                val userRole = data.user?.role ?: "STAFF"
                val userName = data.user?.name ?: "Staff Member"
                _uiState.update {
                    it.copy(
                        isLoggedIn = true,
                        currentUser = data.user,
                        currentRestaurant = data.restaurant,
                        currentBranch = data.branch,
                        assignedRoles = data.assignedRoles.ifEmpty { listOf(userRole) },
                        permissions = data.permissions.toSet(),
                        scopes = data.scopes,
                        isLoading = false,
                        successMessage = "Logged in as $userName (${data.assignedRoles.firstOrNull() ?: userRole})"
                    )
                }
                refreshAll()
            } else {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = response.message ?: "Authentication failed. Check credentials."
                    )
                }
            }
        }
    }

    fun logout() {
        apiClient.authToken = null
        _uiState.value = PartnerUiState(isLoggedIn = false)
    }

    fun refreshAll() {
        viewModelScope.launch {
            loadTables()
            loadOrders(_uiState.value.selectedOrderStatusFilter)
            loadServiceCalls()
            loadOverview()
            loadMenu()
            loadStaff()
            loadBillingSessionsAndKpis()
            loadBillingHistory(_uiState.value.selectedBillingPeriod)
        }
    }

    private fun refreshCurrentTab() {
        when (_uiState.value.selectedTab) {
            0 -> loadTables()
            1 -> loadOrders(_uiState.value.selectedOrderStatusFilter)
            2 -> {
                loadBillingSessionsAndKpis()
                loadBillingHistory(_uiState.value.selectedBillingPeriod)
            }
            3 -> loadServiceCalls()
            4 -> {
                loadOverview()
                if (_uiState.value.activeManagementSubView != null) {
                    setManagementSubView(_uiState.value.activeManagementSubView)
                }
            }
        }
    }

    // 1. Orders Operations
    fun loadOrders(filter: String = _uiState.value.selectedOrderStatusFilter) {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val statusParam = if (filter == "ALL") null else filter
            val res = apiClient.fetchOrders(restId, statusParam)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(orders = res.data) }
            }
        }
    }

    fun advanceOrderStatus(orderId: String, nextStatus: String, remarks: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val res = apiClient.updateOrderStatus(orderId, nextStatus, remarks)
            _uiState.update { it.copy(isLoading = false) }
            if (res.success) {
                _uiState.update {
                    it.copy(successMessage = "Order status updated to $nextStatus")
                }
                loadOrders()
                loadOverview()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to update order status") }
            }
        }
    }

    fun setServiceStatusFilter(filter: String) {
        _uiState.update { it.copy(selectedServiceStatusFilter = filter) }
    }

    // 2. Service Requests Operations
    fun loadServiceCalls() {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.fetchServiceCalls(restId)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(serviceCalls = res.data) }
            }
        }
    }

    fun acknowledgeServiceCall(callId: String) {
        viewModelScope.launch {
            val res = apiClient.resolveServiceCall(callId, "ACKNOWLEDGED")
            if (res.success) {
                _uiState.update { state ->
                    val updatedCalls = state.serviceCalls.map { call ->
                        if (call.id == callId) call.copy(status = "ACKNOWLEDGED") else call
                    }
                    state.copy(serviceCalls = updatedCalls, successMessage = "Service request acknowledged")
                }
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to acknowledge service call") }
            }
        }
    }

    fun resolveServiceCall(callId: String, status: String = "COMPLETED") {
        viewModelScope.launch {
            val res = apiClient.resolveServiceCall(callId, status)
            if (res.success) {
                _uiState.update { state ->
                    val updatedCalls = state.serviceCalls.map { call ->
                        if (call.id == callId) call.copy(status = status) else call
                    }
                    state.copy(
                        serviceCalls = updatedCalls,
                        successMessage = "Service request resolved ($status)"
                    )
                }
                loadOverview()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to resolve service call") }
            }
        }
    }

    // 3. Overview & Sales
    fun loadOverview() {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.fetchOverview(restId)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(overview = res.data) }
            }
        }
    }

    // 4. Menu & 86 Item Availability
    fun loadMenu() {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.fetchMenu(restId)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(menuCategories = res.data) }
            }
        }
    }

    fun toggleMenuItemAvailability(itemId: String, currentAvailable: Boolean) {
        viewModelScope.launch {
            val nextState = !currentAvailable
            val res = apiClient.toggleMenuItemAvailability(itemId, nextState)
            if (res.success) {
                _uiState.update { state ->
                    val updatedCategories = state.menuCategories.map { cat ->
                        cat.copy(items = cat.items.map { item ->
                            if (item.id == itemId) item.copy(isAvailable = nextState) else item
                        })
                    }
                    state.copy(
                        menuCategories = updatedCategories,
                        successMessage = "Item availability updated to ${if (nextState) "IN STOCK" else "OUT OF STOCK"}"
                    )
                }
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to update item availability") }
            }
        }
    }

    fun updateMenuItemPrice(itemId: String, newPrice: Double, newDiscountedPrice: Double?) {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id ?: return@launch
            _uiState.update { it.copy(isLoading = true) }
            val res = apiClient.updateMenuItemPrice(restId, itemId, newPrice, newDiscountedPrice)
            _uiState.update { it.copy(isLoading = false) }
            if (res.success) {
                _uiState.update {
                    it.copy(
                        editingMenuItem = null,
                        successMessage = "Price updated successfully"
                    )
                }
                loadMenu()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to update price") }
            }
        }
    }

    // 5. Tables & Floors (Web Parity)
    fun loadTables() {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.fetchTables(restId)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(tables = res.data) }
            }
        }
    }

    fun setTableFloorFilter(filter: String) {
        _uiState.update { it.copy(tableFloorFilter = filter) }
    }

    fun setReassigningTable(table: PartnerTable?) {
        _uiState.update { it.copy(reassigningTable = table) }
    }

    fun reassignTableWaiter(tableId: String, waiterId: String, waiterName: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val res = apiClient.assignTableWaiter(tableId, waiterId, waiterName)
            _uiState.update { it.copy(isLoading = false) }
            if (res.success) {
                _uiState.update {
                    it.copy(
                        reassigningTable = null,
                        successMessage = "Table waiter successfully updated to $waiterName"
                    )
                }
                loadTables()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to assign waiter") }
            }
        }
    }

    fun toggleTableOccupancy(tableId: String, currentOccupied: Boolean) {
        viewModelScope.launch {
            val nextState = !currentOccupied
            val res = apiClient.toggleTableOccupancy(tableId, nextState)
            if (res.success) {
                _uiState.update { state ->
                    val updatedTables = state.tables.map { t ->
                        if (t.id == tableId) t.copy(isOccupied = nextState) else t
                    }
                    state.copy(
                        tables = updatedTables,
                        successMessage = "Table status set to ${if (nextState) "OCCUPIED" else "VACANT"}"
                    )
                }
                loadOverview()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to update table status") }
            }
        }
    }

    // 6. Kitchen KDS Station & Notify Waiter (Web Parity)
    fun setSelectedKdsStation(station: String) {
        _uiState.update { it.copy(selectedKdsStation = station) }
    }

    fun notifyWaiterForKdsOrder(orderId: String, waiterId: String? = null) {
        viewModelScope.launch {
            val res = apiClient.notifyWaiterForKdsOrder(orderId, waiterId)
            if (res.success) {
                _uiState.update { it.copy(successMessage = "Waiter notified for food pickup!") }
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to notify waiter") }
            }
        }
    }

    // 7. Cashier & Billing Workstation (Web Parity)
    fun setBillingPeriod(period: String) {
        _uiState.update { it.copy(selectedBillingPeriod = period) }
        loadBillingHistory(period)
    }

    fun setCashierTab(tab: String) {
        _uiState.update { it.copy(activeCashierTab = tab) }
        if (tab == "HISTORY") {
            loadBillingHistory(_uiState.value.selectedBillingPeriod)
        }
    }

    fun selectBillingSession(sessionId: String?) {
        _uiState.update { it.copy(selectedBillingSessionId = sessionId, sessionBillData = null) }
        if (sessionId != null) {
            loadSessionBill(sessionId)
        }
    }

    fun setBillingPaymentMode(mode: String) {
        _uiState.update { it.copy(billingPaymentMode = mode) }
    }

    fun setCashTendered(amt: String) {
        _uiState.update { it.copy(cashTendered = amt) }
    }

    fun setCardRefNumber(ref: String) {
        _uiState.update { it.copy(cardRefNumber = ref) }
    }

    fun setUpiRefNumber(ref: String) {
        _uiState.update { it.copy(upiRefNumber = ref) }
    }

    fun setPaymentNote(note: String) {
        _uiState.update { it.copy(paymentNote = note) }
    }

    fun setSplitAmounts(upi: Double, cash: Double, card: Double) {
        _uiState.update { it.copy(splitUpi = upi, splitCash = cash, splitCard = card) }
    }

    fun loadBillingSessionsAndKpis() {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            _uiState.update { it.copy(isBillingLoading = true) }
            val sessRes = apiClient.fetchBillingSessions(restId)
            val kpiRes = apiClient.fetchBillingKpis(restId)
            _uiState.update {
                it.copy(
                    isBillingLoading = false,
                    billingSessions = sessRes.data?.sessions ?: emptyList(),
                    billingKpis = kpiRes.data
                )
            }
        }
    }

    fun loadBillingHistory(period: String) {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.fetchBillingHistory(restId, period)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(billingHistory = res.data) }
            }
        }
    }

    fun loadSessionBill(sessionId: String) {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            _uiState.update { it.copy(isBillingLoading = true) }
            val res = apiClient.fetchTableSessionBill(sessionId, restId)
            _uiState.update { state ->
                val calc = res.data?.calculation
                val grand = calc?.grandTotal ?: 0.0
                state.copy(
                    isBillingLoading = false,
                    sessionBillData = res.data,
                    discountPercent = calc?.discountPercentage?.toInt() ?: 0,
                    splitUpi = (grand / 2.0).toInt().toDouble(),
                    splitCash = grand - (grand / 2.0).toInt().toDouble(),
                    splitCard = 0.0
                )
            }
        }
    }

    fun applyBillDiscount(pct: Int) {
        viewModelScope.launch {
            val billId = _uiState.value.sessionBillData?.bill?.id ?: return@launch
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.applyBillDiscount(
                billId = billId,
                discountType = "PERCENTAGE",
                discountValue = pct.toDouble(),
                reason = "Manager Approval",
                restaurantId = restId
            )
            if (res.success) {
                _uiState.update { it.copy(discountPercent = pct, successMessage = "$pct% Discount Applied") }
                val sid = _uiState.value.selectedBillingSessionId
                if (sid != null) loadSessionBill(sid)
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to apply discount") }
            }
        }
    }

    fun executeFinalSettlement() {
        viewModelScope.launch {
            val state = _uiState.value
            val billId = state.sessionBillData?.bill?.id ?: return@launch
            val restId = state.currentRestaurant?.id
            val grand = state.sessionBillData?.calculation?.grandTotal ?: 0.0
            val mode = state.billingPaymentMode

            var splitItems: List<PartnerSplitPaymentItem>? = null
            if (mode == "SPLIT") {
                val list = mutableListOf<PartnerSplitPaymentItem>()
                if (state.splitUpi > 0) list.add(PartnerSplitPaymentItem("UPI Payment", state.splitUpi, "UPI"))
                if (state.splitCash > 0) list.add(PartnerSplitPaymentItem("Cash Payment", state.splitCash, "CASH"))
                if (state.splitCard > 0) list.add(PartnerSplitPaymentItem("Card Payment", state.splitCard, "CARD"))
                splitItems = list
            }

            _uiState.update { it.copy(isLoading = true) }
            val res = apiClient.settleBill(
                billId = billId,
                method = mode,
                amountPaid = grand,
                referenceNumber = if (mode == "CARD") state.cardRefNumber else if (mode == "UPI") state.upiRefNumber else null,
                note = state.paymentNote.ifBlank { null },
                restaurantId = restId,
                splitItems = splitItems
            )
            _uiState.update { it.copy(isLoading = false) }

            if (res.success) {
                _uiState.update {
                    it.copy(
                        selectedBillingSessionId = null,
                        sessionBillData = null,
                        activeCashierTab = "HISTORY",
                        successMessage = "Final Settlement of ₹${String.format("%.2f", grand)} completed! Table vacated."
                    )
                }
                loadBillingSessionsAndKpis()
                loadBillingHistory(state.selectedBillingPeriod)
                loadTables()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Settlement failed") }
            }
        }
    }

    // 8. Staff IAM & Access Control (GM Scoping)
    fun loadStaff() {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.fetchStaff(restId)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(staffList = res.data) }
            }
        }
    }

    fun openStaffEditDialog(staff: PartnerStaffMember) {
        _uiState.update { it.copy(editingStaffMember = staff) }
    }

    fun closeStaffEditDialog() {
        _uiState.update { it.copy(editingStaffMember = null) }
    }

    fun openMenuItemEditDialog(item: PartnerMenuItem) {
        _uiState.update { it.copy(editingMenuItem = item) }
    }

    fun closeMenuItemEditDialog() {
        _uiState.update { it.copy(editingMenuItem = null) }
    }

    fun updateStaffRoleAndScopes(userId: String, roleId: String, scopes: List<PartnerScope>) {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            _uiState.update { it.copy(isLoading = true) }
            val res = apiClient.updateStaffRoles(userId, roleId, scopes, restId)
            _uiState.update { it.copy(isLoading = false) }
            if (res.success) {
                _uiState.update {
                    it.copy(
                        editingStaffMember = null,
                        successMessage = "Staff role and operational scopes updated successfully"
                    )
                }
                loadStaff()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to update staff role") }
            }
        }
    }

    fun confirmAndShareStaffAccess(
        userId: String,
        roleId: String?,
        permissions: List<String>,
        branchId: String? = null,
        floorScope: String? = null,
        tableScope: String? = null,
        stationScope: String? = null,
        departmentScope: String? = null,
        shiftScope: String? = null,
        reason: String? = null
    ) {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            _uiState.update { it.copy(isLoading = true) }
            val res = apiClient.updateStaffCustomAccess(
                userId = userId,
                restaurantId = restId,
                roleId = roleId,
                permissions = permissions,
                branchId = branchId,
                floorScope = floorScope,
                tableScope = tableScope,
                stationScope = stationScope,
                departmentScope = departmentScope,
                shiftScope = shiftScope,
                reason = reason
            )
            _uiState.update { it.copy(isLoading = false) }
            if (res.success) {
                _uiState.update {
                    it.copy(
                        editingStaffMember = null,
                        successMessage = "Staff access successfully confirmed & shared"
                    )
                }
                loadStaff()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to confirm staff access") }
            }
        }
    }

    fun setStaffPermissionOverride(userId: String, permissionId: String, isGranted: Boolean) {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.updateStaffOverride(userId, permissionId, isGranted, restId)
            if (res.success) {
                _uiState.update {
                    it.copy(successMessage = "Explicit override ($permissionId = ${if (isGranted) "ALLOW" else "DENY"}) saved")
                }
                loadStaff()
            } else {
                _uiState.update { it.copy(errorMessage = res.message ?: "Failed to set permission override") }
            }
        }
    }

    // 9. Audit Logs
    fun loadAuditLogs() {
        viewModelScope.launch {
            val restId = _uiState.value.currentRestaurant?.id
            val res = apiClient.fetchAuditLogs(restId)
            if (res.success && res.data != null) {
                _uiState.update { it.copy(auditLogs = res.data) }
            }
        }
    }
}
