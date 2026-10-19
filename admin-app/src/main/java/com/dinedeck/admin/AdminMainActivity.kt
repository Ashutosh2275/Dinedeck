package com.dinedeck.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.dinedeck.admin.data.AdminRestaurant
import com.dinedeck.admin.presentation.*

import androidx.compose.foundation.Image
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.res.painterResource
import com.dinedeck.admin.R

class AdminMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AdminAppTheme {
                AdminControlCenterApp()
            }
        }
    }
}

private val AdminDarkColorScheme = darkColorScheme(
    primary = Color(0xFFFF6B00),
    background = Color(0xFF080B10),
    surface = Color(0xFF0E131A),
    surfaceVariant = Color(0xFF151C26),
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF263345)
)

private val AdminLightColorScheme = lightColorScheme(
    primary = Color(0xFFFF6B00),
    background = Color(0xFFF8FAFC),
    surface = Color(0xFFFFFFFF),
    surfaceVariant = Color(0xFFF1F5F9),
    onPrimary = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFE2E8F0)
)

@Composable
fun AdminAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) AdminDarkColorScheme else AdminLightColorScheme
    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminControlCenterApp(
    viewModel: ControlCenterViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var showOnboardDialog by remember { mutableStateOf(false) }
    var showGlobalSearchDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.dinedeck_emblem),
                            contentDescription = "DineDeck Emblem",
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                "DINEDECK Control Center",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                "PLATFORM ADMIN • superadmin@dinedeck.in",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF8B5CF6)
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { showGlobalSearchDialog = true }) {
                        Icon(Icons.Default.Search, contentDescription = "Global Search", tint = Color(0xFF38BDF8))
                    }
                    IconButton(onClick = { viewModel.refreshAll() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color(0xFFFF6B00))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(
                    selected = state.selectedTab == 0 && state.selectedRestaurant == null,
                    onClick = { viewModel.setTab(0) },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Overview") },
                    label = { Text("Overview", fontSize = 10.sp) }
                )
                NavigationBarItem(
                    selected = state.selectedTab == 1 || state.selectedRestaurant != null,
                    onClick = { viewModel.setTab(1) },
                    icon = { Icon(Icons.Default.Storefront, contentDescription = "Restaurants") },
                    label = { Text("Restaurants", fontSize = 10.sp) }
                )
                NavigationBarItem(
                    selected = state.selectedTab == 2 && state.selectedRestaurant == null,
                    onClick = { viewModel.setTab(2) },
                    icon = { Icon(Icons.Default.Bolt, contentDescription = "Operations") },
                    label = { Text("Operations", fontSize = 10.sp) }
                )
                NavigationBarItem(
                    selected = state.selectedTab == 3 && state.selectedRestaurant == null,
                    onClick = { viewModel.setTab(3) },
                    icon = { Icon(Icons.Default.AccountBalance, contentDescription = "Finance") },
                    label = { Text("Finance", fontSize = 10.sp) }
                )
                NavigationBarItem(
                    selected = state.selectedTab == 4 && state.selectedRestaurant == null,
                    onClick = { viewModel.setTab(4) },
                    icon = { Icon(Icons.Default.Widgets, contentDescription = "More") },
                    label = { Text("More", fontSize = 10.sp) }
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (state.selectedRestaurant != null) {
                RestaurantDetailScreen(
                    restaurant = state.selectedRestaurant!!,
                    onBack = { viewModel.selectRestaurant(null) },
                    onUpdateLifecycle = { status, reason ->
                        viewModel.updateRestaurantLifecycle(state.selectedRestaurant!!.id, status, reason)
                    },
                    onUpdateProfile = { profile ->
                        viewModel.updateRestaurantProfile(state.selectedRestaurant!!.id, profile) {}
                    },
                    onCreateBranch = { name, address, phone ->
                        viewModel.createBranch(state.selectedRestaurant!!.id, name, address, phone) {}
                    },
                    onUpdateBranch = { branchId, name, address, phone, isActive ->
                        viewModel.updateBranch(branchId, name, address, phone, isActive) {}
                    },
                    onCreateTable = { branchId, tableNumber, capacity ->
                        viewModel.createTable(branchId, tableNumber, capacity) {}
                    },
                    onUpdateTable = { tableId, tableNumber, capacity, isOccupied ->
                        viewModel.updateTable(tableId, tableNumber, capacity, isOccupied) {}
                    },
                    onRegenerateQr = { tableId ->
                        viewModel.regenerateTableQr(tableId) {}
                    },
                    onCreateCategory = { name, displayOrder ->
                        viewModel.createMenuCategory(state.selectedRestaurant!!.id, name, displayOrder) {}
                    },
                    onCreateItem = { categoryId, name, price, desc, isVeg, isAvailable ->
                        viewModel.createMenuItem(categoryId, name, price, desc, isVeg, isAvailable) {}
                    },
                    onUpdateItem = { itemId, name, price, desc, isVeg, isAvailable ->
                        viewModel.updateMenuItem(itemId, name, price, desc, isVeg, isAvailable) {}
                    },
                    onCreateStaff = { name, email, phone, role ->
                        viewModel.createStaff(state.selectedRestaurant!!.id, name, email, phone, role) {}
                    },
                    onSetPermissionOverride = { staffId, resource, action, effect, scope ->
                        viewModel.setPermissionOverride(staffId, resource, action, effect, scope) {}
                    },
                    onGenerateSettlement = { id ->
                        viewModel.generateSettlement(id) {}
                    }
                )
            } else {
                when (state.selectedTab) {
                    0 -> OverviewScreen(
                        state = state,
                        onSelectRange = { viewModel.loadOverview(it) },
                        onNavigateSection = { viewModel.setTab(it) }
                    )
                    1 -> RestaurantsScreen(
                        state = state,
                        onSearchChange = { viewModel.loadRestaurants(query = it) },
                        onSelectStatus = { viewModel.loadRestaurants(status = it) },
                        onSelectRestaurant = { viewModel.selectRestaurant(it) },
                        onOpenOnboard = { showOnboardDialog = true }
                    )
                    2 -> OperationsScreen(
                        state = state,
                        onRefresh = { viewModel.loadLiveOperations() }
                    )
                    3 -> FinanceScreen(
                        state = state,
                        onRefund = { id, reason -> viewModel.refundPayment(id, reason) {} },
                        onGenerateSettlement = { id -> viewModel.generateSettlement(id) {} },
                        onPayout = { id, ref -> viewModel.payoutSettlement(id, ref) {} }
                    )
                    4 -> MoreCommandCenterScreen(
                        state = state,
                        onSelectSubSection = { viewModel.setMoreSubSection(it) },
                        onTriggerKillswitch = { action, reason -> viewModel.triggerKillswitch(action, reason) {} }
                    )
                }
            }
        }
    }

    if (showOnboardDialog) {
        OnboardRestaurantDialog(
            onDismiss = { showOnboardDialog = false },
            onSubmit = { data ->
                viewModel.onboardRestaurant(data) {
                    showOnboardDialog = false
                }
            }
        )
    }

    if (showGlobalSearchDialog) {
        GlobalSearchDialog(
            state = state,
            onSearch = { viewModel.performGlobalSearch(it) },
            onSelectRestaurant = {
                viewModel.selectRestaurant(it)
                showGlobalSearchDialog = false
            },
            onDismiss = { showGlobalSearchDialog = false }
        )
    }
}

@Composable
fun GlobalSearchDialog(
    state: ControlCenterUiState,
    onSearch: (String) -> Unit,
    onSelectRestaurant: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var query by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Global Platform Search", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
        text = {
            Column(modifier = Modifier.fillMaxWidth().height(360.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = query,
                    onValueChange = {
                        query = it
                        onSearch(it)
                    },
                    placeholder = { Text("Search merchant, order, user, payment...", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = Color(0xFF8E9BAE)) }
                )

                if (state.isSearching) {
                    Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFFFF6B00))
                    }
                } else {
                    val res = state.globalSearchResult
                    LazyColumn(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        res?.restaurants?.let { rests ->
                            if (rests.isNotEmpty()) {
                                item { Text("RESTAURANTS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE)) }
                                items(rests) { r ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth().clickable { onSelectRestaurant(r.id) },
                                        shape = RoundedCornerShape(8.dp),
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF151C26))
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Text(r.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            Text("${r.city} • ${r.cuisineType}", fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                        }
                                    }
                                }
                            }
                        }

                        res?.orders?.let { ords ->
                            if (ords.isNotEmpty()) {
                                item { Text("ORDERS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE)) }
                                items(ords) { o ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF151C26))
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Text("Order #${o.orderNumberStr} • Table T#${o.tableNumberStr}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            Text("${o.restaurant?.name ?: "Restaurant"} • Total: ${formatInr(o.totalAmount)}", fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                        }
                                    }
                                }
                            }
                        }

                        res?.customers?.let { custs ->
                            if (custs.isNotEmpty()) {
                                item { Text("CUSTOMERS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE)) }
                                items(custs) { c ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF151C26))
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Text(c.name, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            Text("${c.email} • ${c.phone ?: "No phone"}", fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF151C26))) {
                Text("Close", color = Color.White)
            }
        },
        containerColor = Color(0xFF0E131A)
    )
}

@Composable
fun OnboardRestaurantDialog(
    onDismiss: () -> Unit,
    onSubmit: (Map<String, Any>) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var legalName by remember { mutableStateOf("") }
    var cuisine by remember { mutableStateOf("North Indian & Mughlai") }
    var city by remember { mutableStateOf("Mumbai") }
    var address by remember { mutableStateOf("Plot 42, Bandra Reclamation, Bandra West, Mumbai") }
    var gstin by remember { mutableStateOf("27AABCU9603R1ZM") }
    var fssai by remember { mutableStateOf("11518001000452") }
    var commPercent by remember { mutableStateOf("15.0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Onboard Partner Restaurant (Full KYC)", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Display Name") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = legalName, onValueChange = { legalName = it }, label = { Text("Legal Entity Name") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = cuisine, onValueChange = { cuisine = it }, label = { Text("Cuisine Category") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Full Address") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = gstin, onValueChange = { gstin = it }, label = { Text("GSTIN (15 Digits)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = fssai, onValueChange = { fssai = it }, label = { Text("FSSAI License #") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = commPercent, onValueChange = { commPercent = it }, label = { Text("Platform Commission %") }, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && legalName.isNotBlank()) {
                        onSubmit(
                            mapOf(
                                "name" to name,
                                "legalBusinessName" to legalName,
                                "cuisineType" to cuisine,
                                "city" to city,
                                "fullAddress" to address,
                                "pincode" to "400050",
                                "phone" to "+919820011223",
                                "ownerName" to "Restaurant Owner",
                                "ownerEmail" to "owner.${System.currentTimeMillis()}@dinedeck.in",
                                "gstin" to gstin,
                                "fssaiNumber" to fssai,
                                "commissionRatePercent" to (commPercent.toDoubleOrNull() ?: 15.0),
                                "initialTablesCount" to 10
                            )
                        )
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00))
            ) {
                Text("Submit KYC & Onboard", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color(0xFF8E9BAE))
            }
        },
        containerColor = Color(0xFF0E131A)
    )
}
