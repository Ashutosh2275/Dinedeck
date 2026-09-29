package com.dinedeck.admin.data

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object AdminApiClient {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    var baseUrl = "http://10.0.2.2:8080/api"
    var token: String? = null

    suspend fun login(email: String = "superadmin@dinedeck.in", password: String = "Dinedeck@2026"): Boolean = withContext(Dispatchers.IO) {
        try {
            val bodyJson = gson.toJson(mapOf("email" to email, "password" to password))
            val request = Request.Builder()
                .url("$baseUrl/auth/login")
                .post(bodyJson.toRequestBody(jsonMediaType))
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val respStr = response.body?.string() ?: return@withContext false
                val type = object : TypeToken<ApiResponse<LoginResponse>>() {}.type
                val parsed: ApiResponse<LoginResponse> = gson.fromJson(respStr, type)
                token = parsed.data?.accessToken
                return@withContext token != null
            }
            false
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private suspend fun <T> executeGet(endpoint: String, typeToken: java.lang.reflect.Type): T? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val request = Request.Builder()
                .url("$baseUrl/$endpoint")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val parsed: ApiResponse<T> = gson.fromJson(respStr, typeToken)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private suspend fun <T> executePost(endpoint: String, body: Any, typeToken: java.lang.reflect.Type): T? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val bodyJson = gson.toJson(body)
            val request = Request.Builder()
                .url("$baseUrl/$endpoint")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .post(bodyJson.toRequestBody(jsonMediaType))
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val parsed: ApiResponse<T> = gson.fromJson(respStr, typeToken)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private suspend fun <T> executePatch(endpoint: String, body: Any, typeToken: java.lang.reflect.Type): T? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val bodyJson = gson.toJson(body)
            val request = Request.Builder()
                .url("$baseUrl/$endpoint")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .patch(bodyJson.toRequestBody(jsonMediaType))
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val parsed: ApiResponse<T> = gson.fromJson(respStr, typeToken)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private suspend fun <T> executePut(endpoint: String, body: Any, typeToken: java.lang.reflect.Type): T? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val bodyJson = gson.toJson(body)
            val request = Request.Builder()
                .url("$baseUrl/$endpoint")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .put(bodyJson.toRequestBody(jsonMediaType))
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val parsed: ApiResponse<T> = gson.fromJson(respStr, typeToken)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // 1. Overview
    suspend fun getOverview(range: String = "all"): OverviewData? {
        val type = object : TypeToken<ApiResponse<OverviewData>>() {}.type
        return executeGet("admin/overview?range=$range", type)
    }

    // 2. Global Search
    suspend fun search(query: String): GlobalSearchResult? {
        val type = object : TypeToken<ApiResponse<GlobalSearchResult>>() {}.type
        return executeGet("admin/search?q=$query", type)
    }

    // 3. Restaurants
    suspend fun getRestaurants(search: String? = null, status: String? = null, city: String? = null): List<AdminRestaurant>? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val queryParams = mutableListOf<String>()
            if (!search.isNullOrBlank()) queryParams.add("search=$search")
            if (!status.isNullOrBlank() && status != "ALL") queryParams.add("status=$status")
            if (!city.isNullOrBlank()) queryParams.add("city=$city")
            val qs = if (queryParams.isNotEmpty()) "?" + queryParams.joinToString("&") else ""

            val request = Request.Builder()
                .url("$baseUrl/admin/restaurants$qs")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val type = object : TypeToken<ApiResponse<List<AdminRestaurant>>>() {}.type
            val parsed: ApiResponse<List<AdminRestaurant>> = gson.fromJson(respStr, type)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun getRestaurantDetail(id: String): AdminRestaurant? {
        val type = object : TypeToken<ApiResponse<AdminRestaurant>>() {}.type
        return executeGet("admin/restaurants/$id", type)
    }

    suspend fun onboardRestaurant(data: Map<String, Any>): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/restaurants/onboard", data, type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun updateRestaurantProfile(id: String, profile: Map<String, Any>): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePut<Any>("admin/restaurants/$id/profile", profile, type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun updateRestaurantLifecycle(id: String, status: String, reason: String? = null): AdminRestaurant? {
        val type = object : TypeToken<ApiResponse<AdminRestaurant>>() {}.type
        return executePatch("admin/restaurants/$id/lifecycle", mapOf("status" to status, "reason" to reason), type)
    }

    suspend fun updateRestaurantConfig(id: String, config: Map<String, Any>): AdminRestaurant? {
        val type = object : TypeToken<ApiResponse<AdminRestaurant>>() {}.type
        return executePut("admin/restaurants/$id/config", config, type)
    }

    // 4. Branches & Tables
    suspend fun createBranch(restaurantId: String, name: String, address: String, phone: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/restaurants/$restaurantId/branches", mapOf("name" to name, "address" to address, "phone" to phone), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun updateBranch(branchId: String, name: String, address: String, phone: String, isActive: Boolean): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePatch<Any>("admin/branches/$branchId", mapOf("name" to name, "address" to address, "phone" to phone, "isActive" to isActive), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun createTable(branchId: String, tableNumber: String, capacity: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/branches/$branchId/tables", mapOf("tableNumber" to tableNumber, "capacity" to capacity), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun updateTable(tableId: String, tableNumber: String, capacity: Int, isOccupied: Boolean): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePatch<Any>("admin/tables/$tableId", mapOf("tableNumber" to tableNumber, "capacity" to capacity, "isOccupied" to isOccupied), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun regenerateTableQr(tableId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/tables/$tableId/regenerate-qr", emptyMap<String, Any>(), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    // 5. Menu Management
    suspend fun createMenuCategory(restaurantId: String, name: String, displayOrder: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/restaurants/$restaurantId/categories", mapOf("name" to name, "displayOrder" to displayOrder), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun createMenuItem(categoryId: String, name: String, price: Double, description: String, isVeg: Boolean, isAvailable: Boolean): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/categories/$categoryId/items", mapOf("name" to name, "price" to price, "description" to description, "isVeg" to isVeg, "isAvailable" to isAvailable), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun updateMenuItem(itemId: String, name: String?, price: Double?, description: String?, isVeg: Boolean?, isAvailable: Boolean?): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val body = mutableMapOf<String, Any>()
            if (name != null) body["name"] = name
            if (price != null) body["price"] = price
            if (description != null) body["description"] = description
            if (isVeg != null) body["isVeg"] = isVeg
            if (isAvailable != null) body["isAvailable"] = isAvailable
            val result = executePatch<Any>("admin/items/$itemId", body, type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    // 6. Staff & IAM Scoping
    suspend fun createStaff(restaurantId: String, name: String, email: String, phone: String, role: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/restaurants/$restaurantId/staff", mapOf("name" to name, "email" to email, "phone" to phone, "role" to role), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun setPermissionOverride(staffId: String, resource: String, action: String, effect: String, scope: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val result = executePost<Any>("admin/staff/$staffId/permissions", mapOf("resource" to resource, "action" to action, "effect" to effect, "scope" to scope), type)
            result != null
        } catch (e: Exception) {
            false
        }
    }

    // 7. Live Operations
    suspend fun getLiveOperations(): LiveOperationsData? {
        val type = object : TypeToken<ApiResponse<LiveOperationsData>>() {}.type
        return executeGet("admin/operations/live", type)
    }

    // 8. Payments & Refunds
    suspend fun getPayments(): List<AdminPayment>? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val request = Request.Builder()
                .url("$baseUrl/admin/payments?limit=50")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val type = object : TypeToken<ApiResponse<List<AdminPayment>>>() {}.type
            val parsed: ApiResponse<List<AdminPayment>> = gson.fromJson(respStr, type)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun refundPayment(paymentId: String, reason: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val res = executePost<Any>("admin/payments/$paymentId/refund", mapOf("reason" to reason), type)
            res != null
        } catch (e: Exception) {
            false
        }
    }

    // 9. Settlements
    suspend fun getSettlements(): List<AdminSettlement>? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val request = Request.Builder()
                .url("$baseUrl/admin/settlements")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val type = object : TypeToken<ApiResponse<List<AdminSettlement>>>() {}.type
            val parsed: ApiResponse<List<AdminSettlement>> = gson.fromJson(respStr, type)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun generateSettlement(restaurantId: String): AdminSettlement? {
        val type = object : TypeToken<ApiResponse<AdminSettlement>>() {}.type
        return executePost("admin/settlements/generate", mapOf("restaurantId" to restaurantId), type)
    }

    suspend fun processPayout(settlementId: String, payoutRef: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val res = executePost<Any>("admin/settlements/$settlementId/payout", mapOf("payoutRef" to payoutRef), type)
            res != null
        } catch (e: Exception) {
            false
        }
    }

    // 10. Customers
    suspend fun getCustomers(): List<AdminCustomer>? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val request = Request.Builder()
                .url("$baseUrl/admin/customers")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val type = object : TypeToken<ApiResponse<List<AdminCustomer>>>() {}.type
            val parsed: ApiResponse<List<AdminCustomer>> = gson.fromJson(respStr, type)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // 11. Coupons
    suspend fun getCoupons(): List<AdminCoupon>? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val request = Request.Builder()
                .url("$baseUrl/admin/coupons")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val type = object : TypeToken<ApiResponse<List<AdminCoupon>>>() {}.type
            val parsed: ApiResponse<List<AdminCoupon>> = gson.fromJson(respStr, type)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun createCoupon(code: String, discountPercent: Double, maxDiscount: Double, minOrder: Double): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val res = executePost<Any>(
                "admin/coupons",
                mapOf(
                    "code" to code,
                    "discountPercent" to discountPercent,
                    "maxDiscount" to maxDiscount,
                    "minOrderAmount" to minOrder
                ),
                type
            )
            res != null
        } catch (e: Exception) {
            false
        }
    }

    // 12. Support & Incidents
    suspend fun getSupportTickets(): List<AdminSupportTicket>? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val request = Request.Builder()
                .url("$baseUrl/admin/support/tickets")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val type = object : TypeToken<ApiResponse<List<AdminSupportTicket>>>() {}.type
            val parsed: ApiResponse<List<AdminSupportTicket>> = gson.fromJson(respStr, type)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun createSupportTicket(title: String, description: String, category: String, priority: String, restaurantId: String?): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val res = executePost<Any>(
                "admin/support/tickets",
                mapOf(
                    "title" to title,
                    "description" to description,
                    "category" to category,
                    "priority" to priority,
                    "restaurantId" to restaurantId
                ),
                type
            )
            res != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun resolveSupportTicket(ticketId: String, notes: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val res = executePatch<Any>("admin/support/tickets/$ticketId", mapOf("status" to "RESOLVED", "internalNotes" to notes), type)
            res != null
        } catch (e: Exception) {
            false
        }
    }

    // 13. Security Audit
    suspend fun getSecurityAuditLogs(): List<AdminAuditLog>? = withContext(Dispatchers.IO) {
        try {
            if (token == null) login()
            val request = Request.Builder()
                .url("$baseUrl/admin/security/audit-logs")
                .header("Authorization", "Bearer ${token.orEmpty()}")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: return@withContext null
            val type = object : TypeToken<ApiResponse<List<AdminAuditLog>>>() {}.type
            val parsed: ApiResponse<List<AdminAuditLog>> = gson.fromJson(respStr, type)
            parsed.data
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // 14. System Health & Killswitch
    suspend fun getSystemHealth(): SystemHealthData? {
        val type = object : TypeToken<ApiResponse<SystemHealthData>>() {}.type
        return executeGet("admin/system/health", type)
    }

    suspend fun executeKillswitch(action: String, reason: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val type = object : TypeToken<ApiResponse<Any>>() {}.type
            val res = executePost<Any>("admin/system/killswitch", mapOf("action" to action, "reason" to reason), type)
            res != null
        } catch (e: Exception) {
            false
        }
    }
}
