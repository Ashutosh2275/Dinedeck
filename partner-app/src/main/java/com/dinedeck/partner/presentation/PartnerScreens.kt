package com.dinedeck.partner.presentation

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.ui.res.painterResource
import com.dinedeck.partner.R
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dinedeck.partner.data.*

// Color Palette (DineDeck Brand System - Adaptive Theme)
val PartnerPrimary = Color(0xFFFBA337)
val PartnerPrimaryDark = Color(0xFFE58A13)

val PartnerBg: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.background

val PartnerSurface: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.surface

val PartnerSurfaceHighlight: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.surfaceVariant

val PartnerBorder: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.outline

val PartnerTextPrimary: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.onSurface

val PartnerTextSecondary: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.onSurfaceVariant

val PartnerSuccess = Color(0xFF10B981)
val PartnerWarning = Color(0xFFF59E0B)
val PartnerError = Color(0xFFEF4444)
val PartnerInfo = Color(0xFF3B82F6)
val PartnerPurple = Color(0xFFA855F7)
val PartnerTeal = Color(0xFF8CB3B2)

@Composable
fun PartnerAppRoot(viewModel: PartnerViewModel) {
    val uiState by viewModel.uiState.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.errorMessage, uiState.successMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissMessage()
        }
        uiState.successMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = PartnerBg
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            if (!uiState.isLoggedIn) {
                PartnerLoginScreen(viewModel = viewModel)
            } else {
                PartnerMainDashboard(viewModel = viewModel, uiState = uiState)
            }
            if (uiState.isLoading) {
                DineDeckBrandedLoader(
                    fullScreen = true,
                    label = "Loading Partner Workspace...",
                    sublabel = "Connecting to dining floor, kitchen display & billing terminal..."
                )
            }
        }
    }
}

// -------------------------------------------------------------
// 1. UNIVERSAL MULTI-TENANT LOGIN SCREEN
// -------------------------------------------------------------
@Composable
fun PartnerLoginScreen(viewModel: PartnerViewModel) {
    var email by remember { mutableStateOf(if (com.dinedeck.partner.BuildConfig.DEBUG) "owner.punjab@dinedeck.in" else "") }
    var password by remember { mutableStateOf(if (com.dinedeck.partner.BuildConfig.DEBUG) "Dinedeck@2026" else "") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Official App Branding Emblem
        Surface(
            color = Color(0xFF0B1120),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, PartnerPrimary.copy(alpha = 0.4f)),
            modifier = Modifier.size(76.dp)
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(12.dp)) {
                Image(
                    painter = painterResource(id = R.drawable.dinedeck_emblem),
                    contentDescription = "DineDeck Emblem",
                    modifier = Modifier.size(52.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))
        Text(
            "DINEDECK PARTNER",
            fontSize = 22.sp,
            fontWeight = FontWeight.Black,
            color = Color.White,
            letterSpacing = 1.sp
        )
        Text(
            "Restaurant & Kitchen Workspace",
            fontSize = 12.sp,
            color = Color(0xFF9CA3AF),
            fontWeight = FontWeight.Medium
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Credentials Card
        Card(
            colors = CardDefaults.cardColors(containerColor = PartnerSurface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(
                    "Sign In to Workstation",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = PartnerPrimary) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = PartnerPrimary,
                        unfocusedBorderColor = PartnerBorder,
                        focusedContainerColor = PartnerBg,
                        unfocusedContainerColor = PartnerBg
                    )
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = PartnerPrimary) },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = PartnerPrimary,
                        unfocusedBorderColor = PartnerBorder,
                        focusedContainerColor = PartnerBg,
                        unfocusedContainerColor = PartnerBg
                    )
                )

                Button(
                    onClick = { viewModel.login(email.trim(), password) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PartnerPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White)
                }
            }
        }

        if (com.dinedeck.partner.BuildConfig.DEBUG) {
            Spacer(modifier = Modifier.height(20.dp))

            // Quick Role Personas (Debug Mode Only)
            Text(
                "1-Click Role Login (Debug Sandbox)",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF9CA3AF)
            )
            Spacer(modifier = Modifier.height(10.dp))

            val personas = listOf(
                Triple("👑 Owner (Punjab Heritage)", "owner.punjab@dinedeck.in", PartnerPrimary),
                Triple("👔 General Manager", "manager.sunil@punjabheritage.in", PartnerInfo),
                Triple("👨‍🍳 Head Chef (Kitchen Display)", "chef.vikram@punjabheritage.in", PartnerSuccess),
                Triple("🛎️ Floor Waiter / Captain", "waiter.ramesh@punjabheritage.in", PartnerWarning),
                Triple("🧾 Cashier & Billing", "cashier.priya@punjabheritage.in", PartnerPurple),
                Triple("🏢 Restaurant 2 Owner (Peshawari)", "owner.peshawari@dinedeck.in", PartnerTeal)
            )

            Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                personas.forEach { (title, pEmail, color) ->
                    Surface(
                        color = color.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.3f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                email = pEmail
                                password = "Dinedeck@2026"
                                viewModel.login(pEmail, "Dinedeck@2026")
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(pEmail, fontSize = 11.sp, color = color)
                            }
                            Icon(Icons.Default.ArrowForward, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}

fun formatRoleName(role: String?): String {
    if (role.isNullOrBlank()) return "Staff Member"
    return when (role.uppercase()) {
        "RESTAURANT_OWNER", "OWNER" -> "Restaurant Owner"
        "GENERAL_MANAGER", "MANAGER" -> "General Manager"
        "BRANCH_MANAGER" -> "Branch Manager"
        "ASSISTANT_MANAGER" -> "Assistant Manager"
        "HEAD_CHEF" -> "Head Chef"
        "KITCHEN_MANAGER" -> "Kitchen Manager"
        "CHEF" -> "Chef"
        "KITCHEN_STAFF" -> "Kitchen Staff"
        "CAPTAIN", "HEAD_WAITER" -> "Captain"
        "WAITER", "STEWARD" -> "Steward / Waiter"
        "CASHIER" -> "Cashier"
        "CHIEF_ACCOUNTANT", "ACCOUNTANT" -> "Accountant"
        "INVENTORY_MANAGER" -> "Inventory Manager"
        "SUPER_ADMIN", "DINEDECK_SUPER_ADMIN" -> "Super Admin"
        "STAFF", "RESTAURANT_STAFF" -> "Staff Member"
        "CUSTOMER" -> "Customer"
        else -> role.split("_", "-")
            .joinToString(" ") { it.lowercase().replaceFirstChar { char -> char.uppercase() } }
    }
}

// -------------------------------------------------------------
// 2. MAIN DASHBOARD WITH TOP BAR & 5 PRIMARY WORKSTATION TABS
// -------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PartnerMainDashboard(
    viewModel: PartnerViewModel,
    uiState: PartnerUiState
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            color = Color(0xFF0B1120),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, PartnerPrimary.copy(alpha = 0.35f)),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(5.dp)) {
                                Image(
                                    painter = painterResource(id = R.drawable.dinedeck_emblem),
                                    contentDescription = "DineDeck Emblem",
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                uiState.currentRestaurant?.name ?: "DINEDECK Partner",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                maxLines = 1,
                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                val roleName = uiState.assignedRoles.firstOrNull() ?: uiState.currentUser?.role ?: "STAFF"
                                Surface(
                                    color = PartnerPrimary.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(4.dp),
                                    border = androidx.compose.foundation.BorderStroke(0.5.dp, PartnerPrimary.copy(alpha = 0.3f))
                                ) {
                                    Text(
                                        formatRoleName(roleName),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = PartnerPrimary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    "• ${uiState.currentBranch?.name ?: "Main Branch"}",
                                    fontSize = 11.sp,
                                    color = Color(0xFF9CA3AF),
                                    maxLines = 1,
                                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                },
                actions = {
                    // Refresh Button
                    IconButton(onClick = { viewModel.refreshAll() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White)
                    }

                    // Logout & Switch User
                    IconButton(onClick = { viewModel.logout() }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Logout", tint = Color(0xFF9CA3AF))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = PartnerSurface)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = PartnerSurface) {
                // Tab 0: Dining Floor & Tables
                NavigationBarItem(
                    selected = uiState.selectedTab == 0,
                    onClick = { viewModel.setTab(0) },
                    icon = { Icon(Icons.Default.TableBar, contentDescription = "Tables") },
                    label = { Text("Tables", fontSize = 11.sp) }
                )

                // Tab 1: Kitchen Display
                NavigationBarItem(
                    selected = uiState.selectedTab == 1,
                    onClick = { viewModel.setTab(1) },
                    icon = {
                        BadgedBox(badge = {
                            val count = uiState.orders.count { it.status in listOf("CONFIRMED", "PREPARING") }
                            if (count > 0) {
                                Badge(containerColor = PartnerPrimary) { Text("$count") }
                            }
                        }) {
                            Icon(Icons.Default.RestaurantMenu, contentDescription = "Kitchen")
                        }
                    },
                    label = { Text("Kitchen", fontSize = 11.sp) }
                )

                // Tab 2: Cashier & Billing Workstation
                NavigationBarItem(
                    selected = uiState.selectedTab == 2,
                    onClick = { viewModel.setTab(2) },
                    icon = { Icon(Icons.Default.Receipt, contentDescription = "Billing") },
                    label = { Text("Cashier", fontSize = 11.sp) }
                )

                // Tab 3: Service Calls
                NavigationBarItem(
                    selected = uiState.selectedTab == 3,
                    onClick = { viewModel.setTab(3) },
                    icon = {
                        BadgedBox(badge = {
                            if (uiState.serviceCalls.isNotEmpty()) {
                                Badge(containerColor = PartnerError) { Text("${uiState.serviceCalls.size}") }
                            }
                        }) {
                            Icon(Icons.Default.NotificationsActive, contentDescription = "Calls")
                        }
                    },
                    label = { Text("Calls", fontSize = 11.sp) }
                )

                // Tab 4: Management
                NavigationBarItem(
                    selected = uiState.selectedTab == 4,
                    onClick = { viewModel.setTab(4) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Management") },
                    label = { Text("Manage", fontSize = 11.sp) }
                )
            }
        },
        containerColor = PartnerBg
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (uiState.selectedTab) {
                0 -> DiningFloorTablesView(viewModel = viewModel, uiState = uiState)
                1 -> KitchenOrdersView(viewModel = viewModel, uiState = uiState)
                2 -> CashierBillingView(viewModel = viewModel, uiState = uiState)
                3 -> ServiceCallsView(viewModel = viewModel, uiState = uiState)
                4 -> MenuAndSalesView(viewModel = viewModel, uiState = uiState)
            }

            // Waiter Reassignment Dialog
            uiState.reassigningTable?.let { tbl ->
                WaiterReassignmentDialog(
                    table = tbl,
                    onDismiss = { viewModel.setReassigningTable(null) },
                    onReassign = { waiterId, waiterName ->
                        viewModel.reassignTableWaiter(tbl.id, waiterId, waiterName)
                    }
                )
            }

            // Staff Edit Dialog
            uiState.editingStaffMember?.let { staffMember ->
                StaffIamDialog(
                    staff = staffMember,
                    onDismiss = { viewModel.closeStaffEditDialog() },
                    onConfirmAndShareAccess = { roleId, perms, tableScope, stationScope, reason ->
                        viewModel.confirmAndShareStaffAccess(
                            userId = staffMember.id,
                            roleId = roleId,
                            permissions = perms,
                            tableScope = tableScope,
                            stationScope = stationScope,
                            reason = reason
                        )
                    }
                )
            }

            // Menu Item Price Dialog
            uiState.editingMenuItem?.let { menuItem ->
                MenuItemEditDialog(
                    item = menuItem,
                    onDismiss = { viewModel.closeMenuItemEditDialog() },
                    onSave = { newPrice, newDiscountedPrice ->
                        viewModel.updateMenuItemPrice(menuItem.id, newPrice, newDiscountedPrice)
                    }
                )
            }
        }
    }
}

// -------------------------------------------------------------
// 3. DINING FLOOR & TABLES WORKSTATION (Web Parity)
// -------------------------------------------------------------
@Composable
fun DiningFloorTablesView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    val filteredTables = remember(uiState.tables, uiState.tableFloorFilter) {
        when (uiState.tableFloorFilter) {
            "OCCUPIED" -> uiState.tables.filter { it.isOccupied }
            "VACANT" -> uiState.tables.filter { !it.isOccupied }
            else -> uiState.tables
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Floor Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "Dining Floor & Tables",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    "Live table occupancy, assigned floor captains, and inline server reassignments.",
                    fontSize = 12.sp,
                    color = Color(0xFF9CA3AF)
                )

                // Consolidated Filter Chips (All, Occupied, Vacant)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val filters = listOf(
                        "ALL" to "All Tables (${uiState.tables.size})",
                        "OCCUPIED" to "Occupied (${uiState.tables.count { it.isOccupied }})",
                        "VACANT" to "Vacant (${uiState.tables.count { !it.isOccupied }})"
                    )
                    filters.forEach { (key, label) ->
                        val isSelected = uiState.tableFloorFilter == key
                        Surface(
                            color = if (isSelected) PartnerPrimary else PartnerSurface,
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) PartnerPrimary else PartnerBorder
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { viewModel.setTableFloorFilter(key) }
                        ) {
                            Text(
                                label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else Color(0xFF9CA3AF),
                                modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            }
        }

        // Table Grid / List
        items(filteredTables) { table ->
            Card(
                colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (table.isOccupied) PartnerWarning.copy(alpha = 0.5f) else PartnerBorder
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                color = if (table.isOccupied) PartnerWarning.copy(alpha = 0.2f) else PartnerSuccess.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        table.tableNumber.replace(Regex("[^0-9]"), "").ifEmpty { table.tableNumber },
                                        fontWeight = FontWeight.Black,
                                        fontSize = 14.sp,
                                        color = if (table.isOccupied) PartnerWarning else PartnerSuccess
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Table ${table.tableNumber}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text("${table.floor ?: "Ground Floor"} • Capacity: ${table.capacity} guests", fontSize = 11.sp, color = Color(0xFF9CA3AF))
                            }
                        }

                        Surface(
                            color = if (table.isOccupied) PartnerWarning.copy(alpha = 0.15f) else PartnerSuccess.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                if (table.isOccupied) "OCCUPIED" else "VACANT",
                                color = if (table.isOccupied) PartnerWarning else PartnerSuccess,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    // Assigned Waiter Row & Actions
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(PartnerBg, RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🛎️ Server: ", fontSize = 11.sp, color = Color(0xFF9CA3AF))
                            Text(
                                "Ramesh Kumar (Captain)",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = PartnerPrimary
                            )
                        }

                        Text(
                            "Reassign",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = PartnerInfo,
                            modifier = Modifier
                                .clickable { viewModel.setReassigningTable(table) }
                                .padding(4.dp)
                        )
                    }

                    // Occupancy Toggle Action
                    Button(
                        onClick = { viewModel.toggleTableOccupancy(table.id, table.isOccupied) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (table.isOccupied) Color(0xFF374151) else PartnerPrimary
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().height(36.dp)
                    ) {
                        Text(
                            if (table.isOccupied) "Mark Vacant" else "Mark Occupied",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

// Dialog: Inline Waiter Reassignment
@Composable
fun WaiterReassignmentDialog(
    table: PartnerTable,
    onDismiss: () -> Unit,
    onReassign: (String, String) -> Unit
) {
    val servers = listOf(
        "usr-waiter-1" to "Ramesh Kumar (Floor Captain)",
        "usr-waiter-2" to "Suresh Sharma (Server)",
        "usr-waiter-3" to "Amit Verma (Steward)"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Reassign Waiter — Table ${table.tableNumber}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Select an active floor captain for Table ${table.tableNumber}:", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                servers.forEach { (wId, wName) ->
                    Surface(
                        color = PartnerSurfaceHighlight,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onReassign(wId, wName.substringBefore(" (")) }
                    ) {
                        Text(wName, fontSize = 13.sp, color = Color.White, modifier = Modifier.padding(12.dp))
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel", color = Color(0xFF9CA3AF)) }
        },
        containerColor = PartnerSurface
    )
}

// -------------------------------------------------------------
// 4. KITCHEN KDS PRODUCTION WORKSTATION (Web Parity)
// -------------------------------------------------------------
@Composable
fun KitchenOrdersView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    val filteredOrders = remember(uiState.orders, uiState.selectedKdsStation) {
        if (uiState.selectedKdsStation == "ALL") {
            uiState.orders
        } else {
            uiState.orders.filter { order ->
                order.items.any { (it.name.contains(uiState.selectedKdsStation, ignoreCase = true)) }
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Station Filter Bar
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "Kitchen Display & Orders",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                // Station Horizontal Scroll Chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val stations = listOf("ALL", "TANDOOR", "CURRY", "CHINESE", "BAKERY", "BEVERAGE")
                    stations.forEach { station ->
                        val isSelected = uiState.selectedKdsStation == station
                        Surface(
                            color = if (isSelected) PartnerPrimary else PartnerSurface,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) PartnerPrimary else PartnerBorder),
                            modifier = Modifier.clickable { viewModel.setSelectedKdsStation(station) }
                        ) {
                            Text(
                                if (station == "ALL") "All Stations" else station,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else Color(0xFF9CA3AF),
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }
        }

        // Chronological KOT Cards
        items(filteredOrders) { order ->
            Card(
                colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    when (order.status) {
                        "READY" -> PartnerSuccess
                        "PREPARING" -> PartnerWarning
                        else -> PartnerBorder
                    }
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "Table ${order.displayTable}",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("#${order.orderNumber}", fontSize = 11.sp, color = Color(0xFF9CA3AF))
                        }

                        Surface(
                            color = when (order.status) {
                                "READY" -> PartnerSuccess.copy(alpha = 0.2f)
                                "PREPARING" -> PartnerWarning.copy(alpha = 0.2f)
                                else -> PartnerPrimary.copy(alpha = 0.2f)
                            },
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                order.status,
                                color = when (order.status) {
                                    "READY" -> PartnerSuccess
                                    "PREPARING" -> PartnerWarning
                                    else -> PartnerPrimary
                                },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    // Itemized details
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        order.items.forEach { item ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("${item.quantity}x ${item.name}", fontSize = 12.sp, color = Color.White)
                                Text("₹${item.totalPrice.toInt()}", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                            }
                        }
                    }

                    // KDS Action Buttons (Advance Status + Notify Waiter)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (order.status == "PLACED" || order.status == "CONFIRMED") {
                            Button(
                                onClick = { viewModel.advanceOrderStatus(order.id, "PREPARING") },
                                colors = ButtonDefaults.buttonColors(containerColor = PartnerWarning),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f).height(36.dp)
                            ) {
                                Text("Start Preparing", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        } else if (order.status == "PREPARING") {
                            Button(
                                onClick = { viewModel.advanceOrderStatus(order.id, "READY") },
                                colors = ButtonDefaults.buttonColors(containerColor = PartnerSuccess),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f).height(36.dp)
                            ) {
                                Text("Mark Ready", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Notify Waiter Button (Direct Web Parity)
                        Button(
                            onClick = { viewModel.notifyWaiterForKdsOrder(order.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = PartnerSurfaceHighlight),
                            border = androidx.compose.foundation.BorderStroke(1.dp, PartnerPrimary.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f).height(36.dp)
                        ) {
                            Text("🔔 Notify Waiter", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PartnerPrimary)
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// 5. CASHIER & BILLING WORKSTATION (Web Parity)
// -------------------------------------------------------------
@Composable
fun CashierBillingView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Top Date Filter Selector & Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "Cashier & Billing Workstation",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                // Date Period Chips (Today, Yesterday, This Week, This Month)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val periods = listOf(
                        "TODAY" to "Today",
                        "YESTERDAY" to "Yesterday",
                        "WEEK" to "This Week",
                        "MONTH" to "This Month"
                    )
                    periods.forEach { (key, label) ->
                        val isSelected = uiState.selectedBillingPeriod == key
                        Surface(
                            color = if (isSelected) PartnerPrimary else PartnerSurface,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) PartnerPrimary else PartnerBorder),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { viewModel.setBillingPeriod(key) }
                        ) {
                            Text(
                                label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else Color(0xFF9CA3AF),
                                modifier = Modifier.padding(vertical = 8.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            }
        }

        // 2. Top 4 Collection Summary KPI Boxes (UPI, Cash, Cards, Net Settled)
        item {
            val upiTotal = uiState.billingHistory.flatMap { it.payments }.filter { it.method == "UPI" }.sumOf { it.amount }
                .let { if (it > 0 || uiState.billingKpis == null) it else uiState.billingKpis.upiCollectedToday }
            val cashTotal = uiState.billingHistory.flatMap { it.payments }.filter { it.method == "CASH" }.sumOf { it.amount }
                .let { if (it > 0 || uiState.billingKpis == null) it else uiState.billingKpis.cashCollectedToday }
            val cardTotal = uiState.billingHistory.flatMap { it.payments }.filter { it.method == "CARD" }.sumOf { it.amount }
                .let { if (it > 0 || uiState.billingKpis == null) it else uiState.billingKpis.cardCollectedToday }
            val netTotal = uiState.billingHistory.sumOf { it.grandTotal }
                .let { if (it > 0 || uiState.billingKpis == null) it else uiState.billingKpis.grossRevenueToday }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    KpiCard(
                        title = "UPI Collections",
                        amount = upiTotal,
                        color = PartnerPurple,
                        icon = Icons.Default.QrCode,
                        modifier = Modifier.weight(1f)
                    )
                    KpiCard(
                        title = "Cash Collections",
                        amount = cashTotal,
                        color = PartnerSuccess,
                        icon = Icons.Default.AttachMoney,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    KpiCard(
                        title = "Card Collections",
                        amount = cardTotal,
                        color = PartnerInfo,
                        icon = Icons.Default.CreditCard,
                        modifier = Modifier.weight(1f)
                    )
                    KpiCard(
                        title = "Net Total Settled",
                        amount = netTotal,
                        color = PartnerPrimary,
                        icon = Icons.Default.Receipt,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // 3. Workstation 3 Navigation Tabs (Invoices & Bills, Settlement & Pay, Settlement History)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                val tabs = listOf(
                    "INVOICES" to "Invoices (${uiState.billingSessions.size})",
                    "SETTLEMENT" to "Collect Payment",
                    "HISTORY" to "History (${uiState.billingHistory.size})"
                )
                tabs.forEach { (key, label) ->
                    val isSelected = uiState.activeCashierTab == key
                    Surface(
                        color = if (isSelected) PartnerPrimary else PartnerSurface,
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) PartnerPrimary else PartnerBorder),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { viewModel.setCashierTab(key) }
                    ) {
                        Text(
                            label,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else Color(0xFF9CA3AF),
                            modifier = Modifier.padding(vertical = 10.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        }

        // 4. Tab Sub-Contents
        when (uiState.activeCashierTab) {
            "INVOICES" -> {
                if (uiState.billingSessions.isEmpty()) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                            Text("No active running tables or invoices.", color = Color(0xFF9CA3AF), fontSize = 13.sp)
                        }
                    }
                } else {
                    items(uiState.billingSessions) { sess ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Table ${sess.tableNumber}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Text(
                                        "₹${String.format("%.2f", sess.runningGrandTotal)}",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Black,
                                        color = PartnerPrimary
                                    )
                                }
                                Text("Guest: ${sess.guestName ?: "Walk-in"} • Server: ${sess.serverName}", fontSize = 11.sp, color = Color(0xFF9CA3AF))

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = {
                                            viewModel.selectBillingSession(sess.sessionId)
                                            viewModel.setCashierTab("SETTLEMENT")
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = PartnerPrimary),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f).height(36.dp)
                                    ) {
                                        Text("Settle Bill", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "SETTLEMENT" -> {
                item {
                    val calc = uiState.sessionBillData?.calculation
                    val grand = calc?.grandTotal ?: 0.0

                    if (uiState.sessionBillData == null) {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(30.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("No Table Selected", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("Choose a table from the Invoices tab to collect payment.", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                        }
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            // Bill Breakdown Card
                            Card(
                                colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("Invoice Breakdown", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    calc?.items?.forEach { itm ->
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("${itm.quantity}x ${itm.name}", fontSize = 12.sp, color = Color.White)
                                            Text("₹${itm.totalPrice.toInt()}", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                                        }
                                    }

                                    HorizontalDivider(color = PartnerBorder, modifier = Modifier.padding(vertical = 4.dp))
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Subtotal", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                                        Text("₹${calc?.subtotal?.toInt() ?: 0}", fontSize = 12.sp, color = Color.White)
                                    }
                                    if ((calc?.discountAmount ?: 0.0) > 0) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Discount", fontSize = 12.sp, color = PartnerSuccess)
                                            Text("-₹${calc?.discountAmount?.toInt()}", fontSize = 12.sp, color = PartnerSuccess)
                                        }
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("GST (5%)", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                                        Text("₹${((calc?.cgstAmount ?: 0.0) + (calc?.sgstAmount ?: 0.0)).toInt()}", fontSize = 12.sp, color = Color.White)
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Grand Total", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        Text("₹${String.format("%.2f", grand)}", fontSize = 16.sp, fontWeight = FontWeight.Black, color = PartnerPrimary)
                                    }
                                }
                            }

                            // Payment Mode Selector
                            Card(
                                colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text("Payment Mode", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)

                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        listOf("UPI" to "UPI", "CASH" to "Cash", "CARD" to "Card", "SPLIT" to "Split").forEach { (m, lbl) ->
                                            val isSel = uiState.billingPaymentMode == m
                                            Surface(
                                                color = if (isSel) PartnerPrimary else PartnerSurfaceHighlight,
                                                shape = RoundedCornerShape(8.dp),
                                                modifier = Modifier.weight(1f).clickable { viewModel.setBillingPaymentMode(m) }
                                            ) {
                                                Text(lbl, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (isSel) Color.White else Color(0xFF9CA3AF), modifier = Modifier.padding(vertical = 8.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                                            }
                                        }
                                    }

                                    // Dynamic Sub-Form
                                    when (uiState.billingPaymentMode) {
                                        "CASH" -> {
                                            OutlinedTextField(
                                                value = uiState.cashTendered,
                                                onValueChange = { viewModel.setCashTendered(it) },
                                                label = { Text("Cash Received (₹)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.fillMaxWidth(),
                                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                                            )
                                            val tendered = uiState.cashTendered.toDoubleOrNull() ?: 0.0
                                            if (tendered > grand) {
                                                Text(
                                                    "Return Change: ₹${String.format("%.2f", tendered - grand)}",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = PartnerSuccess
                                                )
                                            }
                                        }
                                        "CARD" -> {
                                            OutlinedTextField(
                                                value = uiState.cardRefNumber,
                                                onValueChange = { viewModel.setCardRefNumber(it) },
                                                label = { Text("POS Terminal Approval Code / Last 4") },
                                                modifier = Modifier.fillMaxWidth(),
                                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                                            )
                                        }
                                        "UPI" -> {
                                            OutlinedTextField(
                                                value = uiState.upiRefNumber,
                                                onValueChange = { viewModel.setUpiRefNumber(it) },
                                                label = { Text("UPI UTR / Reference (Optional)") },
                                                modifier = Modifier.fillMaxWidth(),
                                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                                            )
                                        }
                                        "SPLIT" -> {
                                            val allocated = uiState.splitUpi + uiState.splitCash + uiState.splitCard
                                            val remaining = maxOf(0.0, grand - allocated)
                                            Text("Split Allocation:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                                Text("UPI: ₹${uiState.splitUpi.toInt()}", fontSize = 11.sp, color = PartnerPurple)
                                                Text("Cash: ₹${uiState.splitCash.toInt()}", fontSize = 11.sp, color = PartnerSuccess)
                                                Text("Card: ₹${uiState.splitCard.toInt()}", fontSize = 11.sp, color = PartnerInfo)
                                            }
                                            Text(
                                                if (remaining > 0) "Left to settle: ₹${String.format("%.2f", remaining)}" else "✓ 100% Allocated",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (remaining > 0) PartnerWarning else PartnerSuccess
                                            )
                                        }
                                    }

                                    // Complete Settlement Action
                                    Button(
                                        onClick = { viewModel.executeFinalSettlement() },
                                        colors = ButtonDefaults.buttonColors(containerColor = PartnerPrimary),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth().height(46.dp)
                                    ) {
                                        Text("Complete Payment (₹${String.format("%.2f", grand)})", fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "HISTORY" -> {
                if (uiState.billingHistory.isEmpty()) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                            Text("No settled invoices for this period.", color = Color(0xFF9CA3AF), fontSize = 13.sp)
                        }
                    }
                } else {
                    items(uiState.billingHistory) { hist ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(hist.billNumber ?: ("#" + hist.billId.take(8)), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Text("₹${String.format("%.2f", hist.grandTotal)}", fontSize = 15.sp, fontWeight = FontWeight.Black, color = PartnerPrimary)
                                }
                                Text("Table ${hist.tableNumber} • Guest: ${hist.guestName ?: "Guest"} • Mode: ${hist.paymentMethod}", fontSize = 11.sp, color = Color(0xFF9CA3AF))
                                if (hist.payments.size > 1) {
                                    Text(
                                        "Split: " + hist.payments.joinToString(" + ") { "${it.method}: ₹${it.amount.toInt()}" },
                                        fontSize = 11.sp,
                                        color = PartnerPurple,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KpiCard(
    title: String,
    amount: Double,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PartnerSurface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.3f)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color)
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
            }
            Text("₹${String.format("%,.2f", amount)}", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
        }
    }
}

// -------------------------------------------------------------
// 6. SERVICE CALLS WORKSTATION (Web Parity)
// -------------------------------------------------------------
@Composable
fun ServiceCallsView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    val filteredCalls = remember(uiState.serviceCalls, uiState.selectedServiceStatusFilter) {
        if (uiState.selectedServiceStatusFilter == "ALL") uiState.serviceCalls
        else uiState.serviceCalls.filter { it.status == uiState.selectedServiceStatusFilter }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("Customer Service Calls", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        items(filteredCalls) { call ->
            Card(
                colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Table ${call.displayTable}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Surface(
                            color = if (call.isPending) PartnerError.copy(alpha = 0.2f) else PartnerSuccess.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                call.status ?: "PENDING",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (call.isPending) PartnerError else PartnerSuccess,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(call.displayType, fontSize = 13.sp, color = Color.White)

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (call.isPending) {
                            Button(
                                onClick = { viewModel.acknowledgeServiceCall(call.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = PartnerWarning),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f).height(36.dp)
                            ) {
                                Text("Acknowledge", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Button(
                            onClick = { viewModel.resolveServiceCall(call.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = PartnerSuccess),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f).height(36.dp)
                        ) {
                            Text("Resolve", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// 7. MANAGEMENT WORKSTATION & SUB-VIEWS (Web Parity)
// -------------------------------------------------------------
@Composable
fun MenuAndSalesView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    if (uiState.activeManagementSubView != null) {
        when (uiState.activeManagementSubView) {
            "MENU" -> ManagementMenuView(viewModel = viewModel, uiState = uiState)
            "STAFF_IAM" -> ManagementStaffIamView(viewModel = viewModel, uiState = uiState)
            "AUDIT" -> ManagementAuditView(viewModel = viewModel, uiState = uiState)
            "SALES" -> ManagementSalesView(viewModel = viewModel, uiState = uiState)
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text("Restaurant Administration", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            val items = listOf(
                Triple("Staff & Access", "Manage staff permissions, branch access, and roles", "STAFF_IAM"),
                Triple("Menu Management & 86", "Toggle live stock availability and update prices", "MENU"),
                Triple("Shift Sales & Reports", "Financial metrics, payment breakdowns, and taxes", "SALES"),
                Triple("Activity History", "Review staff and system activity records", "AUDIT")
            )

            items(items) { (title, desc, subKey) ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().clickable { viewModel.setManagementSubView(subKey) }
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(desc, fontSize = 11.sp, color = Color(0xFF9CA3AF))
                        }
                        Icon(Icons.Default.ArrowForward, contentDescription = null, tint = PartnerPrimary)
                    }
                }
            }
        }
    }
}

@Composable
fun ManagementMenuView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { viewModel.setManagementSubView(null) }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text("Menu Management & 86", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
        }

        uiState.menuCategories.forEach { cat ->
            item {
                Text(cat.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PartnerPrimary)
            }
            items(cat.items) { itm ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(itm.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("₹${itm.price.toInt()}", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                        }
                        Switch(
                            checked = itm.isAvailable,
                            onCheckedChange = { viewModel.toggleMenuItemAvailability(itm.id, itm.isAvailable) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ManagementStaffIamView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    val isGm = uiState.assignedRoles.contains("GENERAL_MANAGER")

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { viewModel.setManagementSubView(null) }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Column {
                    Text("Staff & Access Permissions", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    if (isGm) {
                        Text("Branch Isolated: ${uiState.currentBranch?.name ?: "Your Branch"} Staff Only", fontSize = 11.sp, color = PartnerInfo)
                    }
                }
            }
        }

        items(uiState.staffList) { stf ->
            Card(
                colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth().clickable { viewModel.openStaffEditDialog(stf) }
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(stf.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("${stf.designation} • ${stf.email}", fontSize = 11.sp, color = Color(0xFF9CA3AF))
                    }
                    Icon(Icons.Default.Edit, contentDescription = null, tint = PartnerPrimary, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@Composable
fun ManagementSalesView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { viewModel.setManagementSubView(null) }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text("Shift Sales & Financial Reports", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
        }

        item {
            val ov = uiState.overview
            Card(colors = CardDefaults.cardColors(containerColor = PartnerSurface), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Gross Shift Revenue", color = Color(0xFF9CA3AF), fontSize = 12.sp)
                    Text("₹${String.format("%,.2f", ov?.grossSales ?: 0.0)}", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
                    HorizontalDivider(color = PartnerBorder)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total Orders: ${ov?.ordersCount ?: 0}", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                        Text("Taxes: ₹${ov?.taxes?.toInt() ?: 0}", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                    }
                }
            }
        }
    }
}

@Composable
fun ManagementAuditView(viewModel: PartnerViewModel, uiState: PartnerUiState) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { viewModel.setManagementSubView(null) }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text("Security Audit Logs", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
        }

        items(uiState.auditLogs) { log ->
            Card(
                colors = CardDefaults.cardColors(containerColor = PartnerSurface),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(log.action, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(log.result, fontSize = 10.sp, color = if (log.result == "SUCCESS") PartnerSuccess else PartnerError)
                    }
                    Text("Actor: ${log.actor?.name ?: "System"} (${log.actor?.role ?: "SYS"})", fontSize = 11.sp, color = Color(0xFF9CA3AF))
                }
            }
        }
    }
}

@Composable
fun StaffIamDialog(
    staff: PartnerStaffMember,
    onDismiss: () -> Unit,
    onConfirmAndShareAccess: (String?, List<String>, String?, String?, String?) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Access — ${staff.name}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Email: ${staff.email}", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                Text("Designation: ${staff.designation}", fontSize = 12.sp, color = Color.White)
                Text("Current Roles: " + staff.roles.joinToString { it.roleId }, fontSize = 11.sp, color = PartnerPrimary)
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirmAndShareAccess("WAITER", listOf("orders.read", "tables.read"), null, null, "Manager Approval") },
                colors = ButtonDefaults.buttonColors(containerColor = PartnerPrimary)
            ) {
                Text("Save Access")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Close", color = Color(0xFF9CA3AF)) }
        },
        containerColor = PartnerSurface
    )
}

@Composable
fun MenuItemEditDialog(
    item: PartnerMenuItem,
    onDismiss: () -> Unit,
    onSave: (Double, Double?) -> Unit
) {
    var priceText by remember { mutableStateOf("${item.price.toInt()}") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Price — ${item.name}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White) },
        text = {
            OutlinedTextField(
                value = priceText,
                onValueChange = { priceText = it },
                label = { Text("Base Price (₹)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    val p = priceText.toDoubleOrNull() ?: item.price
                    onSave(p, null)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PartnerPrimary)
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel", color = Color(0xFF9CA3AF)) }
        },
        containerColor = PartnerSurface
    )
}
