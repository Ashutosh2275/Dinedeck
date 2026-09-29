package com.dinedeck.partner.data

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class PartnerApiClient(
    private var baseUrl: String = "http://10.0.2.2:8080/api"
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    var authToken: String? = null

    fun setBaseUrl(url: String) {
        baseUrl = if (url.endsWith("/")) url.dropLast(1) else url
    }

    private fun newRequestBuilder(endpoint: String): Request.Builder {
        val fullUrl = if (endpoint.startsWith("http")) endpoint else "$baseUrl$endpoint"
        val builder = Request.Builder().url(fullUrl)
        authToken?.let {
            builder.addHeader("Authorization", "Bearer $it")
        }
        return builder
    }

    // 1. Auth Login
    suspend fun login(email: String, password: String): PartnerAuthResponse = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("email" to email, "password" to password))
            val request = Request.Builder()
                .url("$baseUrl/auth/login")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val authRes = gson.fromJson(bodyStr, PartnerAuthResponse::class.java)
                if (response.isSuccessful && authRes.success && authRes.data?.accessToken != null) {
                    authToken = authRes.data.accessToken
                }
                authRes ?: PartnerAuthResponse(success = false, message = "Empty response")
            }
        } catch (e: Exception) {
            PartnerAuthResponse(success = false, message = "Network connection failed: ${e.message}")
        }
    }

    // 2. Auth / Profile / Me
    suspend fun fetchMe(): PartnerAuthResponse = withContext(Dispatchers.IO) {
        try {
            val request = newRequestBuilder("/auth/me").get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                gson.fromJson(bodyStr, PartnerAuthResponse::class.java)
                    ?: PartnerAuthResponse(success = false, message = "Failed to parse context")
            }
        } catch (e: Exception) {
            PartnerAuthResponse(success = false, message = e.message)
        }
    }

    // 3. Operational Overview
    suspend fun fetchOverview(restaurantId: String?): ApiResponse<PartnerShiftOverview> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/staff/overview?restaurantId=$restaurantId" else "/staff/overview"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerShiftOverview>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 4. Orders List
    suspend fun fetchOrders(restaurantId: String?, status: String? = null): ApiResponse<List<PartnerOrder>> = withContext(Dispatchers.IO) {
        try {
            val params = mutableListOf<String>()
            if (restaurantId != null) params.add("restaurantId=$restaurantId")
            if (status != null && status != "ALL") params.add("status=$status")
            val queryString = if (params.isNotEmpty()) "?${params.joinToString("&")}" else ""

            val request = newRequestBuilder("/staff/orders$queryString").get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<List<PartnerOrder>>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 5. Update Order Status
    suspend fun updateOrderStatus(orderId: String, nextStatus: String, remarks: String? = null): ApiResponse<PartnerOrder> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("status" to nextStatus, "remarks" to remarks))
            val request = newRequestBuilder("/staff/orders/$orderId/status")
                .patch(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerOrder>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 6. Service Requests List
    suspend fun fetchServiceCalls(restaurantId: String?): ApiResponse<List<PartnerServiceCall>> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/staff/service-requests?restaurantId=$restaurantId" else "/staff/service-requests"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<List<PartnerServiceCall>>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 7. Resolve Service Request
    suspend fun resolveServiceCall(callId: String, status: String = "COMPLETED"): ApiResponse<PartnerServiceCall> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("status" to status))
            val request = newRequestBuilder("/staff/service-requests/$callId")
                .patch(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerServiceCall>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 8. Menu Catalog with Availability
    suspend fun fetchMenu(restaurantId: String?): ApiResponse<List<PartnerMenuCategory>> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/staff/menu?restaurantId=$restaurantId" else "/staff/menu"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<List<PartnerMenuCategory>>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 9. Toggle Menu Item 86 / Availability
    suspend fun toggleMenuItemAvailability(itemId: String, isAvailable: Boolean): ApiResponse<PartnerMenuItem> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("isAvailable" to isAvailable))
            val request = newRequestBuilder("/staff/menu/items/$itemId/availability")
                .patch(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerMenuItem>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 10. Update Menu Item Price
    suspend fun updateMenuItemPrice(restaurantId: String, itemId: String, price: Double, discountedPrice: Double?): ApiResponse<PartnerMenuItem> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("price" to price, "discountedPrice" to discountedPrice))
            val request = newRequestBuilder("/restaurants/$restaurantId/menu/items/$itemId")
                .patch(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerMenuItem>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 11. Tables List
    suspend fun fetchTables(restaurantId: String?): ApiResponse<List<PartnerTable>> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/staff/tables?restaurantId=$restaurantId" else "/staff/tables"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<List<PartnerTable>>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 12. Toggle Table Occupancy
    suspend fun toggleTableOccupancy(tableId: String, isOccupied: Boolean): ApiResponse<PartnerTable> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("isOccupied" to isOccupied))
            val request = newRequestBuilder("/staff/tables/$tableId/occupancy")
                .patch(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerTable>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 13. Staff List with IAM Roles & Overrides
    suspend fun fetchStaff(restaurantId: String?): ApiResponse<List<PartnerStaffMember>> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/iam/staff?restaurantId=$restaurantId" else "/iam/staff"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<List<PartnerStaffMember>>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 14. Update Staff IAM Role & Scopes
    suspend fun updateStaffRoles(
        userId: String,
        roleId: String,
        scopes: List<PartnerScope>,
        restaurantId: String?
    ): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(
                mapOf(
                    "roleId" to roleId,
                    "restaurantId" to restaurantId,
                    "scopes" to scopes.map { mapOf("scopeType" to it.type, "scopeValue" to it.value) }
                )
            )
            val request = newRequestBuilder("/iam/staff/$userId/roles")
                .put(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 14B. Update Staff Full Access (Permissions, Scopes, Confirmation)
    suspend fun updateStaffCustomAccess(
        userId: String,
        restaurantId: String?,
        roleId: String?,
        permissions: List<String>,
        branchId: String? = null,
        floorScope: String? = null,
        tableScope: String? = null,
        stationScope: String? = null,
        departmentScope: String? = null,
        shiftScope: String? = null,
        reason: String? = null
    ): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val payload = mutableMapOf<String, Any>(
                "restaurantId" to (restaurantId ?: ""),
                "permissions" to permissions
            )
            if (roleId != null) payload["roleId"] = roleId
            if (branchId != null) payload["branchId"] = branchId
            if (floorScope != null) payload["floorScope"] = floorScope
            if (tableScope != null) payload["tableScope"] = tableScope
            if (stationScope != null) payload["stationScope"] = stationScope
            if (departmentScope != null) payload["departmentScope"] = departmentScope
            if (shiftScope != null) payload["shiftScope"] = shiftScope
            if (reason != null) payload["reason"] = reason

            val jsonBody = gson.toJson(payload)
            val request = newRequestBuilder("/iam/staff/$userId/access")
                .put(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }


    // 15. Set Explicit Granular Permission Override (ALLOW / DENY)
    suspend fun updateStaffOverride(
        userId: String,
        permissionId: String,
        isGranted: Boolean,
        restaurantId: String?
    ): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(
                mapOf(
                    "permissionId" to permissionId,
                    "isGranted" to isGranted,
                    "restaurantId" to restaurantId
                )
            )
            val request = newRequestBuilder("/iam/staff/$userId/overrides")
                .put(jsonBody.toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 16. Audit Logs
    suspend fun fetchAuditLogs(restaurantId: String?): ApiResponse<List<PartnerAuditLog>> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/staff/audit-logs?restaurantId=$restaurantId" else "/staff/audit-logs"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<List<PartnerAuditLog>>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // 17. KDS Production API Engine
    suspend fun fetchKdsQueue(
        restaurantId: String?,
        stationCode: String? = null,
        status: String? = null
    ): ApiResponse<PartnerKdsQueueData> = withContext(Dispatchers.IO) {
        try {
            val params = mutableListOf<String>()
            if (restaurantId != null) params.add("restaurantId=$restaurantId")
            if (stationCode != null && stationCode != "ALL") params.add("stationCode=$stationCode")
            if (status != null && status != "ALL") params.add("status=$status")
            val query = if (params.isNotEmpty()) "?${params.joinToString("&")}" else ""

            val request = newRequestBuilder("/kds/queue$query").get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerKdsQueueData>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun acceptKdsOrder(orderId: String, restaurantId: String?): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("restaurantId" to restaurantId))
            val request = newRequestBuilder("/kds/orders/$orderId/accept")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun updateKdsItemStatus(orderItemId: String, status: String, restaurantId: String?): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("status" to status, "restaurantId" to restaurantId))
            val request = newRequestBuilder("/kds/items/$orderItemId/status")
                .patch(jsonBody.toRequestBody(jsonMediaType))
                .build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun expoPassKdsOrder(orderId: String, restaurantId: String?): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val jsonBody = gson.toJson(mapOf("restaurantId" to restaurantId))
            val request = newRequestBuilder("/kds/orders/$orderId/expo-pass")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // -------------------------------------------------------------
    // BILLING & CASHIER WORKSTATION METHODS (Web Parity)
    // -------------------------------------------------------------
    suspend fun fetchBillingSessions(restaurantId: String?): ApiResponse<PartnerBillingSessionsResponse> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/billing/sessions?restaurantId=$restaurantId" else "/billing/sessions"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerBillingSessionsResponse>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun fetchBillingKpis(restaurantId: String?): ApiResponse<PartnerBillingKpis> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/billing/kpis?restaurantId=$restaurantId" else "/billing/kpis"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerBillingKpis>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun fetchBillingHistory(restaurantId: String?, period: String): ApiResponse<List<PartnerHistoricalBill>> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/billing/history?restaurantId=$restaurantId&period=$period" else "/billing/history?period=$period"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<List<PartnerHistoricalBill>>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun fetchTableSessionBill(sessionId: String, restaurantId: String?): ApiResponse<PartnerSessionBillData> = withContext(Dispatchers.IO) {
        try {
            val endpoint = if (restaurantId != null) "/billing/sessions/$sessionId/bill?restaurantId=$restaurantId" else "/billing/sessions/$sessionId/bill"
            val request = newRequestBuilder(endpoint).get().build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<PartnerSessionBillData>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun applyBillDiscount(
        billId: String,
        discountType: String,
        discountValue: Double,
        reason: String?,
        restaurantId: String?
    ): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val payload = mutableMapOf<String, Any>(
                "discountType" to discountType,
                "discountValue" to discountValue
            )
            if (reason != null) payload["reason"] = reason
            if (restaurantId != null) payload["restaurantId"] = restaurantId

            val jsonBody = gson.toJson(payload)
            val request = newRequestBuilder("/billing/bills/$billId/discount")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun settleBill(
        billId: String,
        method: String,
        amountPaid: Double,
        referenceNumber: String? = null,
        note: String? = null,
        restaurantId: String? = null,
        splitItems: List<PartnerSplitPaymentItem>? = null
    ): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val payload = mutableMapOf<String, Any>(
                "method" to method,
                "amountPaid" to amountPaid
            )
            if (referenceNumber != null) payload["referenceNumber"] = referenceNumber
            if (note != null) payload["note"] = note
            if (restaurantId != null) payload["restaurantId"] = restaurantId
            if (splitItems != null && splitItems.isNotEmpty()) {
                payload["splitItems"] = splitItems.map {
                    mapOf("label" to it.label, "amount" to it.amount, "method" to it.method)
                }
            }

            val jsonBody = gson.toJson(payload)
            val request = newRequestBuilder("/billing/bills/$billId/settle")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    // -------------------------------------------------------------
    // KDS NOTIFY WAITER & TABLE WAITER ASSIGNMENT METHODS
    // -------------------------------------------------------------
    suspend fun notifyWaiterForKdsOrder(orderId: String, waiterId: String? = null): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val payload = mutableMapOf<String, Any>()
            if (waiterId != null) payload["waiterId"] = waiterId
            val jsonBody = gson.toJson(payload)
            val request = newRequestBuilder("/kds/orders/$orderId/notify-waiter")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }

    suspend fun assignTableWaiter(
        tableId: String,
        waiterId: String,
        waiterName: String,
        waiterRole: String = "CAPTAIN"
    ): ApiResponse<Any> = withContext(Dispatchers.IO) {
        try {
            val payload = mapOf(
                "waiterId" to waiterId,
                "waiterName" to waiterName,
                "waiterRole" to waiterRole
            )
            val jsonBody = gson.toJson(payload)
            val request = newRequestBuilder("/tables/$tableId/assign-waiter")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()
            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                gson.fromJson(bodyStr, type)
            }
        } catch (e: Exception) {
            ApiResponse(success = false, message = e.message)
        }
    }
}


