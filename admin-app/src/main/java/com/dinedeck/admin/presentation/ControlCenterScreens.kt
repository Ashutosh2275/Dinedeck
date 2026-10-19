package com.dinedeck.admin.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dinedeck.admin.data.*
import java.text.NumberFormat
import java.util.Locale

fun formatInr(amount: Double): String {
    return try {
        NumberFormat.getCurrencyInstance(Locale("en", "IN")).format(amount)
    } catch (e: Exception) {
        "₹${amount.toInt()}"
    }
}

val AdminCardBg: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.surface

val AdminCardVariantBg: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.surfaceVariant

val AdminTextPrimary: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.onSurface

val AdminTextSecondary: Color
    @Composable
    @ReadOnlyComposable
    get() = MaterialTheme.colorScheme.onSurfaceVariant

@Composable
fun StatusPill(status: String) {
    val (bg, fg) = when (status.uppercase()) {
        "ACTIVE", "PAID", "SETTLED", "RESOLVED", "ALLOW", "SUCCESS" -> Color(0xFF10B981).copy(alpha = 0.15f) to Color(0xFF34D399)
        "PENDING_REVIEW", "PENDING", "OPEN" -> Color(0xFFF59E0B).copy(alpha = 0.15f) to Color(0xFFFBBF24)
        "SUSPENDED", "FAILED", "REFUNDED", "PAUSED", "DENY", "DENIED" -> Color(0xFFEF4444).copy(alpha = 0.15f) to Color(0xFFF87171)
        else -> Color.White.copy(alpha = 0.1f) to Color.White
    }
    Surface(
        color = bg,
        shape = RoundedCornerShape(6.dp),
        modifier = Modifier.padding(2.dp)
    ) {
        Text(
            text = status,
            color = fg,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
        )
    }
}

// ==========================================
// 1. OVERVIEW SCREEN
// ==========================================
@Composable
fun OverviewScreen(
    state: ControlCenterUiState,
    onSelectRange: (String) -> Unit,
    onNavigateSection: (Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "Platform Administration",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                // Responsive horizontal scrollable filter chips with consistent dimensions
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val ranges = listOf(
                        "today" to "Today",
                        "7d" to "7 Days",
                        "30d" to "30 Days",
                        "all" to "All Time"
                    )
                    ranges.forEach { (key, label) ->
                        val isSelected = state.selectedRange == key
                        Surface(
                            modifier = Modifier
                                .clickable { onSelectRange(key) },
                            color = if (isSelected) Color(0xFFFF6B00) else AdminCardVariantBg,
                            shape = RoundedCornerShape(20.dp),
                            border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                        ) {
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else Color(0xFF8E9BAE),
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                            )
                        }
                    }
                }
            }
        }

        if (state.isOverviewLoading) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Overview...", sublabel = null)
                }
            }
        } else {
            val d = state.overviewData
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Revenue Highlights Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = AdminCardVariantBg)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("TOTAL ORDER VALUE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                            Text(formatInr(d?.finance?.grossOrderValue ?: 0.0), fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFFF6B00))
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column {
                                    Text("DINEDECK 15% Comm.", fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                    Text(formatInr(d?.finance?.platformCommissionRevenue ?: 0.0), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                }
                                Column {
                                    Text("Amount Owed to Restaurants", fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                    Text(formatInr(d?.finance?.netRestaurantPayable ?: 0.0), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                                Column {
                                    Text("Taxes (GST)", fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                    Text(formatInr(d?.finance?.totalTaxCollected ?: 0.0), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                                }
                            }
                        }
                    }

                    // Key Pillar Metrics Grid
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Card(
                            modifier = Modifier.weight(1f).clickable { onNavigateSection(1) },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("🏪 ACTIVE RESTAURANTS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${d?.restaurants?.active ?: 0} / ${d?.restaurants?.total ?: 0}", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                                Text("${d?.restaurants?.pendingReview ?: 0} Pending Verification", fontSize = 11.sp, color = Color(0xFFF59E0B))
                            }
                        }

                        Card(
                            modifier = Modifier.weight(1f).clickable { onNavigateSection(2) },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("🍳 COOKING TODAY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${d?.operations?.activeCookingTickets ?: 0}", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFFF6B00))
                                Text("${d?.operations?.totalOrders ?: 0} Total Orders", fontSize = 11.sp, color = Color(0xFF10B981))
                            }
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Card(
                            modifier = Modifier.weight(1f).clickable { onNavigateSection(4) },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("👥 USERS & SESSIONS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${d?.customers?.activeDiningSessions ?: 0} Active", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF38BDF8))
                                Text("${d?.customers?.total ?: 0} Total Diners", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                            }
                        }

                        Card(
                            modifier = Modifier.weight(1f).clickable { onNavigateSection(3) },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("💳 PAYMENTS & REFUNDS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${d?.finance?.successfulPayments ?: 0} Paid", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981))
                                Text("${d?.finance?.refundsCount ?: 0} Refunds", fontSize = 11.sp, color = Color(0xFFEF4444))
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 2. RESTAURANTS DIRECTORY SCREEN
// ==========================================
@Composable
fun RestaurantsScreen(
    state: ControlCenterUiState,
    onSearchChange: (String) -> Unit,
    onSelectStatus: (String) -> Unit,
    onSelectRestaurant: (String) -> Unit,
    onOpenOnboard: () -> Unit
) {
    var searchInput by remember { mutableStateOf(state.searchQuery) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Search & Onboard Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = searchInput,
                onValueChange = {
                    searchInput = it
                    onSearchChange(it)
                },
                placeholder = { Text("Search name, city, GSTIN...", fontSize = 13.sp) },
                modifier = Modifier.weight(1f),
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = Color(0xFF8E9BAE)) },
                shape = RoundedCornerShape(12.dp)
            )

            Button(
                onClick = onOpenOnboard,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00)),
                shape = RoundedCornerShape(12.dp),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Onboard")
                Spacer(modifier = Modifier.width(4.dp))
                Text("Onboard", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }

        // Status Filter Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            listOf("ALL", "ACTIVE", "PENDING_REVIEW", "SUSPENDED", "PAUSED").forEach { status ->
                val isSelected = state.statusFilter == status
                Surface(
                    modifier = Modifier.clickable { onSelectStatus(status) },
                    color = if (isSelected) Color(0xFFFF6B00) else AdminCardVariantBg,
                    shape = RoundedCornerShape(16.dp),
                    border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                ) {
                    Text(
                        text = status.replace("_", " "),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) Color.White else Color(0xFF8E9BAE),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // Restaurant List
        if (state.isRestaurantsLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                DineDeckBrandedLoader(fullScreen = false, sizeDp = 80.dp, label = "Loading Restaurants...", sublabel = null)
            }
        } else if (state.restaurants.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No restaurants found matching filters.", color = Color(0xFF8E9BAE))
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(state.restaurants) { r ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectRestaurant(r.id) },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(r.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Text("${r.city} • ${r.cuisineType}", fontSize = 12.sp, color = Color(0xFF8E9BAE))
                                }
                                StatusPill(status = r.status)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("GSTIN: ${r.gstin ?: "PENDING"}", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                                Text("Comm: ${r.commissionRatePercent}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 3. RESTAURANT CONTROL CENTER & EDITING
// ==========================================
@Composable
fun RestaurantDetailScreen(
    restaurant: AdminRestaurant,
    onBack: () -> Unit,
    onUpdateLifecycle: (String, String?) -> Unit,
    onUpdateProfile: (Map<String, Any>) -> Unit,
    onCreateBranch: (String, String, String) -> Unit,
    onUpdateBranch: (String, String, String, String, Boolean) -> Unit,
    onCreateTable: (String, String, Int) -> Unit,
    onUpdateTable: (String, String, Int, Boolean) -> Unit,
    onRegenerateQr: (String) -> Unit,
    onCreateCategory: (String, Int) -> Unit,
    onCreateItem: (String, String, Double, String, Boolean, Boolean) -> Unit,
    onUpdateItem: (String, String?, Double?, String?, Boolean?, Boolean?) -> Unit,
    onCreateStaff: (String, String, String, String) -> Unit,
    onSetPermissionOverride: (String, String, String, String, String) -> Unit,
    onGenerateSettlement: (String) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var showEditProfileDialog by remember { mutableStateOf(false) }
    var showAddBranchDialog by remember { mutableStateOf(false) }
    var showAddTableBranchId by remember { mutableStateOf<String?>(null) }
    var showAddCategoryDialog by remember { mutableStateOf(false) }
    var showAddItemCategoryId by remember { mutableStateOf<String?>(null) }
    var showAddStaffDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        // Detail Header
        Surface(color = AdminCardBg, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(restaurant.name, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(restaurant.legalBusinessName ?: restaurant.slug, fontSize = 11.sp, color = Color(0xFF8E9BAE))
                    }
                    StatusPill(status = restaurant.status)
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Action Buttons
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { showEditProfileDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = AdminCardVariantBg),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(16.dp), tint = Color(0xFFFF6B00))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Edit Profile & Verification", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }

                    if (restaurant.status != "ACTIVE") {
                        Button(
                            onClick = { onUpdateLifecycle("ACTIVE", "Approved by Compliance Admin") },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Approve & Activate", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Button(
                            onClick = { onUpdateLifecycle("SUSPENDED", "Operational review required") },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Suspend Partner", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Detail Tabs
        ScrollableTabRow(
            selectedTabIndex = selectedTab,
            containerColor = AdminCardVariantBg,
            contentColor = Color(0xFFFF6B00),
            edgePadding = 16.dp
        ) {
            listOf("Overview", "Branches & Tables", "Menu Catalog", "Staff & Access", "Payouts").forEachIndexed { idx, title ->
                Tab(
                    selected = selectedTab == idx,
                    onClick = { selectedTab = idx },
                    text = { Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                )
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            when (selectedTab) {
                0 -> {
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = AdminCardBg), shape = RoundedCornerShape(12.dp)) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("RESTAURANT COMPLIANCE & VERIFICATION", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                                Text("Legal Entity: ${restaurant.legalBusinessName ?: "N/A"}", fontSize = 13.sp, color = Color.White)
                                Text("GSTIN: ${restaurant.gstin ?: "N/A"}", fontSize = 13.sp, color = Color.White)
                                Text("FSSAI License: ${restaurant.fssaiNumber ?: "N/A"}", fontSize = 13.sp, color = Color.White)
                                Text("PAN: ${restaurant.panNumber ?: "N/A"}", fontSize = 13.sp, color = Color.White)
                                Text("Bank A/C: ${restaurant.bankAccountNumber ?: "N/A"} (${restaurant.bankIfsc ?: "IFSC N/A"})", fontSize = 13.sp, color = Color.White)
                                Text("Address: ${restaurant.fullAddress ?: "N/A"}", fontSize = 13.sp, color = Color.White)
                                Text("Phone: ${restaurant.phone ?: "N/A"}", fontSize = 13.sp, color = Color.White)
                            }
                        }
                    }
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = AdminCardBg), shape = RoundedCornerShape(12.dp)) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("COMMERCIAL & BILLING CONFIGURATION", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                                Text("DINEDECK Commission: ${restaurant.commissionRatePercent}%", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                Text("CGST: ${restaurant.cgstRatePercent}% | SGST: ${restaurant.sgstRatePercent}%", fontSize = 13.sp, color = Color.White)
                                Text("Service Charge: ${restaurant.serviceChargePercent}%", fontSize = 13.sp, color = Color.White)
                                Text("Packaging Charge: ₹${restaurant.packagingCharge}", fontSize = 13.sp, color = Color.White)
                            }
                        }
                    }
                }
                1 -> {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("BRANCHES & PHYSICAL TABLES", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                            Button(
                                onClick = { showAddBranchDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00)),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Add Branch", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    val branches = restaurant.branches.orEmpty()
                    if (branches.isEmpty()) {
                        item { Text("No branches configured.", color = Color(0xFF8E9BAE)) }
                    } else {
                        items(branches) { b ->
                            Card(colors = CardDefaults.cardColors(containerColor = AdminCardBg), shape = RoundedCornerShape(12.dp)) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(b.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        Button(
                                            onClick = { showAddTableBranchId = b.id },
                                            colors = ButtonDefaults.buttonColors(containerColor = AdminCardVariantBg),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = "Add Table", modifier = Modifier.size(12.dp), tint = Color(0xFFFF6B00))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("+ Table", fontSize = 10.sp, color = Color.White)
                                        }
                                    }
                                    Text(b.address, fontSize = 12.sp, color = Color(0xFF8E9BAE))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Tables (${b.tables?.size ?: 0}):", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B00))
                                    b.tables?.forEach { t ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text("Table #${t.tableNumberStr} (Cap: ${t.capacity})", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                                Text("Token: ${t.qrCodeToken?.take(18)}...", fontSize = 9.sp, color = Color(0xFF8E9BAE))
                                            }
                                            Button(
                                                onClick = { onRegenerateQr(t.id) },
                                                colors = ButtonDefaults.buttonColors(containerColor = AdminCardVariantBg),
                                                shape = RoundedCornerShape(6.dp),
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Icon(Icons.Default.QrCode2, contentDescription = "Regen QR", modifier = Modifier.size(12.dp), tint = Color(0xFF38BDF8))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Regen QR", fontSize = 10.sp, color = Color(0xFF38BDF8))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                2 -> {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("MENU CATALOG & PRICING", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                            Button(
                                onClick = { showAddCategoryDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00)),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Add Category", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    val cats = restaurant.categories.orEmpty()
                    if (cats.isEmpty()) {
                        item { Text("No menu categories created yet.", color = Color(0xFF8E9BAE)) }
                    } else {
                        items(cats) { c ->
                            Card(colors = CardDefaults.cardColors(containerColor = AdminCardBg), shape = RoundedCornerShape(12.dp)) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(c.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B00))
                                        Button(
                                            onClick = { showAddItemCategoryId = c.id },
                                            colors = ButtonDefaults.buttonColors(containerColor = AdminCardVariantBg),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = "Add Item", modifier = Modifier.size(12.dp), tint = Color(0xFFFF6B00))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("+ Item", fontSize = 10.sp, color = Color.White)
                                        }
                                    }
                                    c.items?.forEach { item ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(if (item.isVeg) "🟢" else "🔴", fontSize = 10.sp)
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text(item.name, fontSize = 12.sp, color = Color.White)
                                            }
                                            Text(formatInr(item.price), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                3 -> {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("RESTAURANT STAFF & ACCESS PERMISSIONS", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                            Button(
                                onClick = { showAddStaffDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00)),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Add Staff", modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Add Staff", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    val staff = restaurant.staff.orEmpty()
                    if (staff.isEmpty()) {
                        item { Text("No staff assigned yet.", color = Color(0xFF8E9BAE)) }
                    } else {
                        items(staff) { s ->
                            Card(colors = CardDefaults.cardColors(containerColor = AdminCardBg), shape = RoundedCornerShape(12.dp)) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(s.user?.name ?: "Staff Member", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        StatusPill(status = s.role)
                                    }
                                    Text("Email: ${s.user?.email ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = { onSetPermissionOverride(s.userId, "orders", "refund", "DENY", "RESTAURANT:${restaurant.id}") },
                                            colors = ButtonDefaults.buttonColors(containerColor = AdminCardVariantBg),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text("Remove Refund Access", fontSize = 9.sp, color = Color(0xFFEF4444))
                                        }
                                        Button(
                                            onClick = { onSetPermissionOverride(s.userId, "menu", "update", "ALLOW", "RESTAURANT:${restaurant.id}") },
                                            colors = ButtonDefaults.buttonColors(containerColor = AdminCardVariantBg),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text("Allow Menu Access", fontSize = 9.sp, color = Color(0xFF10B981))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                4 -> {
                    item {
                        Button(
                            onClick = { onGenerateSettlement(restaurant.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("+ Create Payout Batch", fontWeight = FontWeight.Bold)
                        }
                    }
                    val sets = restaurant.settlements.orEmpty()
                    if (sets.isEmpty()) {
                        item { Text("No payouts generated yet.", color = Color(0xFF8E9BAE)) }
                    } else {
                        items(sets) { s ->
                            Card(colors = CardDefaults.cardColors(containerColor = AdminCardBg), shape = RoundedCornerShape(12.dp)) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(s.settlementNumber, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        StatusPill(status = s.status)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Net Payout: ${formatInr(s.netPayable)}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Dialog: Edit Profile & KYC
    if (showEditProfileDialog) {
        var dName by remember { mutableStateOf(restaurant.name) }
        var lName by remember { mutableStateOf(restaurant.legalBusinessName ?: "") }
        var cuisine by remember { mutableStateOf(restaurant.cuisineType) }
        var city by remember { mutableStateOf(restaurant.city) }
        var address by remember { mutableStateOf(restaurant.fullAddress ?: "") }
        var gstin by remember { mutableStateOf(restaurant.gstin ?: "") }
        var fssai by remember { mutableStateOf(restaurant.fssaiNumber ?: "") }
        var comm by remember { mutableStateOf(restaurant.commissionRatePercent.toString()) }

        AlertDialog(
            onDismissRequest = { showEditProfileDialog = false },
            title = { Text("Edit Profile & Verification", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(value = dName, onValueChange = { dName = it }, label = { Text("Display Name") })
                    OutlinedTextField(value = lName, onValueChange = { lName = it }, label = { Text("Legal Entity Name") })
                    OutlinedTextField(value = cuisine, onValueChange = { cuisine = it }, label = { Text("Cuisine Category") })
                    OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") })
                    OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Full Address") })
                    OutlinedTextField(value = gstin, onValueChange = { gstin = it }, label = { Text("GSTIN") })
                    OutlinedTextField(value = fssai, onValueChange = { fssai = it }, label = { Text("FSSAI #") })
                    OutlinedTextField(value = comm, onValueChange = { comm = it }, label = { Text("Commission %") })
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdateProfile(
                            mapOf(
                                "name" to dName,
                                "legalBusinessName" to lName,
                                "cuisineType" to cuisine,
                                "city" to city,
                                "fullAddress" to address,
                                "gstin" to gstin,
                                "fssaiNumber" to fssai,
                                "commissionRatePercent" to (comm.toDoubleOrNull() ?: 15.0)
                            )
                        )
                        showEditProfileDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00))
                ) {
                    Text("Save Changes", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditProfileDialog = false }) { Text("Cancel", color = Color(0xFF8E9BAE)) }
            },
            containerColor = AdminCardBg
        )
    }

    // Dialog: Add Branch
    if (showAddBranchDialog) {
        var bName by remember { mutableStateOf("") }
        var bAddress by remember { mutableStateOf("") }
        var bPhone by remember { mutableStateOf("+919820011223") }

        AlertDialog(
            onDismissRequest = { showAddBranchDialog = false },
            title = { Text("Create New Branch", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(value = bName, onValueChange = { bName = it }, label = { Text("Branch Name") })
                    OutlinedTextField(value = bAddress, onValueChange = { bAddress = it }, label = { Text("Branch Address") })
                    OutlinedTextField(value = bPhone, onValueChange = { bPhone = it }, label = { Text("Phone") })
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (bName.isNotBlank()) {
                            onCreateBranch(bName, bAddress, bPhone)
                            showAddBranchDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00))
                ) {
                    Text("Create Branch", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddBranchDialog = false }) { Text("Cancel", color = Color(0xFF8E9BAE)) }
            },
            containerColor = AdminCardBg
        )
    }

    // Dialog: Add Table
    if (showAddTableBranchId != null) {
        var tNum by remember { mutableStateOf("") }
        var tCap by remember { mutableStateOf("4") }

        AlertDialog(
            onDismissRequest = { showAddTableBranchId = null },
            title = { Text("Add Physical Dining Table", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(value = tNum, onValueChange = { tNum = it }, label = { Text("Table Number (e.g. 12)") })
                    OutlinedTextField(value = tCap, onValueChange = { tCap = it }, label = { Text("Seating Capacity") })
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (tNum.isNotBlank()) {
                            onCreateTable(showAddTableBranchId!!, tNum, tCap.toIntOrNull() ?: 4)
                            showAddTableBranchId = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00))
                ) {
                    Text("Add Table", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTableBranchId = null }) { Text("Cancel", color = Color(0xFF8E9BAE)) }
            },
            containerColor = AdminCardBg
        )
    }

    // Dialog: Add Category
    if (showAddCategoryDialog) {
        var cName by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddCategoryDialog = false },
            title = { Text("Add Menu Category", fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(value = cName, onValueChange = { cName = it }, label = { Text("Category Name") })
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (cName.isNotBlank()) {
                            onCreateCategory(cName, 1)
                            showAddCategoryDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00))
                ) {
                    Text("Create", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddCategoryDialog = false }) { Text("Cancel", color = Color(0xFF8E9BAE)) }
            },
            containerColor = AdminCardBg
        )
    }

    // Dialog: Add Item
    if (showAddItemCategoryId != null) {
        var iName by remember { mutableStateOf("") }
        var iPrice by remember { mutableStateOf("299") }
        var iDesc by remember { mutableStateOf("Delicious chef speciality") }
        var isVeg by remember { mutableStateOf(true) }

        AlertDialog(
            onDismissRequest = { showAddItemCategoryId = null },
            title = { Text("Create Menu Item", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(value = iName, onValueChange = { iName = it }, label = { Text("Item Name") })
                    OutlinedTextField(value = iPrice, onValueChange = { iPrice = it }, label = { Text("Price (₹)") })
                    OutlinedTextField(value = iDesc, onValueChange = { iDesc = it }, label = { Text("Description") })
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = isVeg, onCheckedChange = { isVeg = it })
                        Text("Vegetarian Item", fontSize = 12.sp, color = Color.White)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (iName.isNotBlank()) {
                            onCreateItem(showAddItemCategoryId!!, iName, iPrice.toDoubleOrNull() ?: 0.0, iDesc, isVeg, true)
                            showAddItemCategoryId = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00))
                ) {
                    Text("Create Item", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddItemCategoryId = null }) { Text("Cancel", color = Color(0xFF8E9BAE)) }
            },
            containerColor = AdminCardBg
        )
    }

    // Dialog: Add Staff
    if (showAddStaffDialog) {
        var sName by remember { mutableStateOf("") }
        var sEmail by remember { mutableStateOf("") }
        var sPhone by remember { mutableStateOf("+919820011223") }
        var sRole by remember { mutableStateOf("WAITER") }

        AlertDialog(
            onDismissRequest = { showAddStaffDialog = false },
            title = { Text("Add Restaurant Staff", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(value = sName, onValueChange = { sName = it }, label = { Text("Full Name") })
                    OutlinedTextField(value = sEmail, onValueChange = { sEmail = it }, label = { Text("Email Address") })
                    OutlinedTextField(value = sPhone, onValueChange = { sPhone = it }, label = { Text("Phone") })
                    OutlinedTextField(value = sRole, onValueChange = { sRole = it }, label = { Text("Role (WAITER, CHEF, GM)") })
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (sName.isNotBlank() && sEmail.isNotBlank()) {
                            onCreateStaff(sName, sEmail, sPhone, sRole)
                            showAddStaffDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00))
                ) {
                    Text("Add Staff", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddStaffDialog = false }) { Text("Cancel", color = Color(0xFF8E9BAE)) }
            },
            containerColor = AdminCardBg
        )
    }
}

// ==========================================
// 4. LIVE OPERATIONS SCREEN
// ==========================================
@Composable
fun OperationsScreen(
    state: ControlCenterUiState,
    onRefresh: () -> Unit
) {
    val live = state.liveOpsData

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Live Operations Telemetry", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("${live?.counts?.activeKitchenOrders ?: 0} Active Orders • ${live?.counts?.pendingServiceCalls ?: 0} Calls", fontSize = 12.sp, color = Color(0xFF8E9BAE))
                }
                IconButton(onClick = onRefresh) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color(0xFFFF6B00))
                }
            }
        }

        if (state.isLiveOpsLoading) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Live Operations...", sublabel = null)
                }
            }
        } else {
            val orders = live?.liveOrders.orEmpty()
            if (orders.isEmpty()) {
                item {
                    Text("No active kitchen tickets at this moment.", color = Color(0xFF8E9BAE))
                }
            } else {
                items(orders) { o ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Order #${o.orderNumberStr} • Table T#${o.tableNumberStr}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Text(o.restaurant?.name ?: "Restaurant", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                                }
                                StatusPill(status = o.status)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            o.items?.forEach { itm ->
                                Text("• ${itm.quantity}x ${itm.name}", fontSize = 12.sp, color = Color.White.copy(alpha = 0.9f))
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Total: ${formatInr(o.totalAmount)}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 5. FINANCE & SETTLEMENTS SCREEN
// ==========================================
@Composable
fun FinanceScreen(
    state: ControlCenterUiState,
    onRefund: (String, String) -> Unit,
    onGenerateSettlement: (String) -> Unit,
    onPayout: (String, String) -> Unit
) {
    var subTab by remember { mutableIntStateOf(0) }

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(
            selectedTabIndex = subTab,
            containerColor = AdminCardBg,
            contentColor = Color(0xFFFF6B00)
        ) {
            Tab(selected = subTab == 0, onClick = { subTab = 0 }, text = { Text("Payments & Refunds", fontWeight = FontWeight.Bold) })
            Tab(selected = subTab == 1, onClick = { subTab = 1 }, text = { Text("Restaurant Payouts & Transfers", fontWeight = FontWeight.Bold) })
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (subTab == 0) {
                val payments = state.payments
                if (state.isPaymentsLoading) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Payments...", sublabel = null)
                        }
                    }
                } else if (payments.isEmpty()) {
                    item { Text("No payments found.", color = Color(0xFF8E9BAE)) }
                } else {
                    items(payments) { p ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(p.transactionRef ?: p.id, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        Text("${p.bill?.restaurant?.name ?: "Restaurant"} • ${p.method}", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                                    }
                                    StatusPill(status = p.status)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(formatInr(p.amount), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFFF6B00))
                                    if (p.status == "PAID") {
                                        Button(
                                            onClick = { onRefund(p.id, "Customer requested refund via Control Center") },
                                            colors = ButtonDefaults.buttonColors(containerColor = AdminCardVariantBg),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Text("Refund", fontSize = 11.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                item {
                    Button(
                        onClick = {
                            val firstRest = state.restaurants.firstOrNull()?.id
                            if (firstRest != null) onGenerateSettlement(firstRest)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B00)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("+ Create Payout Batch", fontWeight = FontWeight.Bold)
                    }
                }

                val sets = state.settlements
                if (state.isSettlementsLoading) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Payouts...", sublabel = null)
                        }
                    }
                } else if (sets.isEmpty()) {
                    item { Text("No payouts generated yet.", color = Color(0xFF8E9BAE)) }
                } else {
                    items(sets) { s ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(s.settlementNumber, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    StatusPill(status = s.status)
                                }
                                Text(s.restaurant?.name ?: "Restaurant", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Net Payout: ${formatInr(s.netPayable)}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                                if (s.payoutRef != null) {
                                    Text("Ref: ${s.payoutRef}", fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 6. MORE COMMAND CENTER SCREEN
// ==========================================
@Composable
fun MoreCommandCenterScreen(
    state: ControlCenterUiState,
    onSelectSubSection: (String?) -> Unit,
    onTriggerKillswitch: (String, String) -> Unit
) {
    if (state.moreSubSection == null) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text("Command Center Pillars", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            val pillars = listOf(
                Triple("CUSTOMERS", "👥 Customer Directory", "Profiles, order history & dining sessions"),
                Triple("GROWTH", "🏷️ Coupons & Promotions", "Discount campaigns & usage limits"),
                Triple("SUPPORT", "🎫 Incident & Support Desk", "Operational support & hardware tickets"),
                Triple("SECURITY", "🛡️ Activity History", "System activity history and change records"),
                Triple("SYSTEM", "⚙️ System Health & Killswitch", "V8 heap, DB latency & emergency pause")
            )

            items(pillars) { (key, title, subtitle) ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectSubSection(key) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = AdminCardBg)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(subtitle, fontSize = 11.sp, color = Color(0xFF8E9BAE))
                        }
                        Icon(Icons.Default.ChevronRight, contentDescription = "Open", tint = Color(0xFF8E9BAE))
                    }
                }
            }
        }
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(AdminCardBg)
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { onSelectSubSection(null) }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    state.moreSubSection.replace("_", " "),
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                when (state.moreSubSection) {
                    "CUSTOMERS" -> {
                        val custs = state.customers
                        if (state.isCustomersLoading) {
                            item { Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) { DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Customers...", sublabel = null) } }
                        } else {
                            items(custs) { c ->
                                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = AdminCardBg)) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Text(c.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        Text("${c.email} • ${c.phone ?: "No phone"}", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("${c._count?.orders ?: 0} Orders • ${c._count?.diningSessions ?: 0} Sessions", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B00))
                                    }
                                }
                            }
                        }
                    }
                    "GROWTH" -> {
                        val coupons = state.coupons
                        if (state.isCouponsLoading) {
                            item { Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) { DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Offers...", sublabel = null) } }
                        } else {
                            items(coupons) { cp ->
                                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = AdminCardBg)) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(cp.code, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B00))
                                            StatusPill(status = if (cp.isActive) "ACTIVE" else "EXPIRED")
                                        }
                                        Text("${cp.discountPercent}% OFF • Max ₹${cp.maxDiscount}", fontSize = 11.sp, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                    "SUPPORT" -> {
                        val tickets = state.supportTickets
                        if (state.isSupportLoading) {
                            item { Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) { DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Support Tickets...", sublabel = null) } }
                        } else {
                            items(tickets) { tk ->
                                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = AdminCardBg)) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(tk.ticketNumber, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            StatusPill(status = tk.status)
                                        }
                                        Text(tk.title, fontSize = 12.sp, color = Color.White)
                                        Text(tk.description, fontSize = 10.sp, color = Color(0xFF8E9BAE))
                                    }
                                }
                            }
                        }
                    }
                    "SECURITY" -> {
                        val logs = state.auditLogs
                        if (state.isAuditLoading) {
                            item { Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) { DineDeckBrandedLoader(fullScreen = false, sizeDp = 72.dp, label = "Loading Audit History...", sublabel = null) } }
                        } else {
                            items(logs) { lg ->
                                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = AdminCardBg)) {
                                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(lg.action, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B00))
                                            StatusPill(status = lg.result)
                                        }
                                        Text("${lg.actorRole ?: "ADMIN"} • Target: ${lg.resource}", fontSize = 11.sp, color = Color.White)
                                        Text(lg.createdAt ?: "", fontSize = 9.sp, color = Color(0xFF8E9BAE))
                                    }
                                }
                            }
                        }
                    }
                    "SYSTEM" -> {
                        val h = state.systemHealth
                        item {
                            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = AdminCardBg)) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text("PLATFORM HEALTH TELEMETRY", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8E9BAE))
                                    Text("Status: ${h?.status ?: "HEALTHY"}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                    Text("DB Latency: ${h?.dbLatencyMs ?: 0.5} ms", fontSize = 13.sp, color = Color.White)
                                    Text("Active WebSockets: ${h?.activeWebSocketClients ?: 0}", fontSize = 13.sp, color = Color.White)
                                    Text("Heap Memory: ${h?.memory?.heapUsedMb ?: 0.0} MB", fontSize = 13.sp, color = Color.White)
                                }
                            }
                        }
                        item {
                            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF1F1215)), border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.3f))) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text("⚠️ EMERGENCY PLATFORM KILLSWITCH", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                                    Text("Instantly pause all dining session ordering across the platform or restore active state.", fontSize = 11.sp, color = Color(0xFF8E9BAE))
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Button(
                                            onClick = { onTriggerKillswitch("PAUSE_ALL", "Emergency maintenance pause") },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Text("Pause All", fontWeight = FontWeight.Bold)
                                        }
                                        Button(
                                            onClick = { onTriggerKillswitch("RESTORE_ALL", "Normal operations restored") },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Text("Restore All", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
