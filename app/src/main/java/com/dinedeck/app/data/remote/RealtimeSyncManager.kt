package com.dinedeck.app.data.remote

import android.util.Log
import com.dinedeck.app.core.session.SessionManager
import com.dinedeck.app.domain.model.Cart
import com.dinedeck.app.domain.model.Order
import com.dinedeck.app.domain.model.OrderStatus
import com.dinedeck.app.domain.model.ServiceRequestType
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

data class RealtimeEvent(
    val eventType: String,
    val orderId: String? = null,
    val status: String? = null,
    val tableNumber: String? = null,
    val remarks: String? = null,
    val rawPayload: JsonObject? = null
)

@Singleton
class RealtimeSyncManager @Inject constructor(
    private val gson: Gson,
    private val mockDataEngine: MockDataEngine,
    private val sessionManager: SessionManager
) {
    private val TAG = "RealtimeSyncManager"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    // Android Emulator host loopback
    private val HOST = "10.0.2.2"
    private val PORT = 8080
    private val WS_URL = "ws://$HOST:$PORT/ws"
    private val API_BASE_URL = "http://$HOST:$PORT/api"

    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .pingInterval(15, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isConnected = false

    private val _realtimeEvents = MutableSharedFlow<RealtimeEvent>(extraBufferCapacity = 64)
    val realtimeEvents: SharedFlow<RealtimeEvent> = _realtimeEvents.asSharedFlow()

    init {
        startWebSocketConnection()
    }

    private fun startWebSocketConnection() {
        scope.launch {
            while (true) {
                try {
                    connectWebSocket()
                } catch (e: Exception) {
                    Log.w(TAG, "WebSocket connection attempt error: ${e.message}")
                }
                delay(5000)
            }
        }
    }

    private fun connectWebSocket() {
        if (isConnected) return

        val request = Request.Builder()
            .url(WS_URL)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                Log.i(TAG, "⚡ Realtime WebSocket connected to DineDeck backend at $WS_URL")
            }

            override fun onMessage(ws: WebSocket, text: String) {
                handleIncomingMessage(text)
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
                Log.i(TAG, "WebSocket closed: $code $reason")
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                Log.w(TAG, "WebSocket failure: ${t.message}")
            }
        })
    }

    private fun handleIncomingMessage(text: String) {
        try {
            val json = gson.fromJson(text, JsonObject::class.java)
            val eventType = json.get("eventType")?.asString ?: json.get("type")?.asString ?: "UNKNOWN"
            val payload = json.getAsJsonObject("payload") ?: json.getAsJsonObject("data")

            val orderId = payload?.get("orderId")?.asString ?: payload?.get("id")?.asString
            val statusStr = payload?.get("status")?.asString
            val tableNum = payload?.get("tableNumber")?.asString
            val remarks = payload?.get("remarks")?.asString ?: payload?.get("reason")?.asString

            Log.i(TAG, "📥 Realtime message received: $eventType, orderId=$orderId, status=$statusStr")

            if (orderId != null && statusStr != null) {
                val mappedStatus = when (statusStr.uppercase()) {
                    "CONFIRMED" -> OrderStatus.CONFIRMED
                    "PREPARING", "ACCEPTED" -> OrderStatus.PREPARING
                    "READY" -> OrderStatus.READY
                    "SERVED" -> OrderStatus.SERVED
                    "COMPLETED" -> OrderStatus.COMPLETED
                    "REJECTED" -> OrderStatus.REJECTED
                    "CANCELLED" -> OrderStatus.CANCELLED
                    else -> null
                }

                if (mappedStatus != null) {
                    mockDataEngine.updateOrderStatus(orderId, mappedStatus)
                }
            }

            scope.launch {
                _realtimeEvents.emit(
                    RealtimeEvent(
                        eventType = eventType,
                        orderId = orderId,
                        status = statusStr,
                        tableNumber = tableNum,
                        remarks = remarks,
                        rawPayload = payload
                    )
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing incoming WebSocket message: ${e.message}")
        }
    }

    /**
     * Dispatch order to Fastify backend asynchronously with immediate sub-second broadcast
     */
    fun dispatchOrderAsync(cart: Cart, localOrder: Order, userId: String) {
        scope.launch {
            try {
                val jsonBody = JsonObject().apply {
                    addProperty("restaurantId", cart.restaurantId)
                    addProperty("tableNumber", cart.tableNumber.toString())
                    addProperty("sessionId", cart.sessionId)
                    addProperty("specialNotes", "Mobile App Table ${cart.tableNumber}")
                    val itemsArray = com.google.gson.JsonArray()
                    cart.items.forEach { item ->
                        val itemObj = JsonObject().apply {
                            addProperty("menuItemId", item.menuItem.id)
                            addProperty("name", item.menuItem.name)
                            addProperty("quantity", item.quantity)
                            addProperty("unitPrice", item.unitPrice)
                            if (item.selectedVariant != null) {
                                addProperty("variantName", item.selectedVariant.name)
                            }
                        }
                        itemsArray.add(itemObj)
                    }
                    add("items", itemsArray)
                }

                val mediaType = "application/json; charset=utf-8".toMediaType()
                val requestBody = jsonBody.toString().toRequestBody(mediaType)

                val request = Request.Builder()
                    .url("$API_BASE_URL/orders")
                    .addHeader("Content-Type", "application/json")
                    .post(requestBody)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.i(TAG, "✅ Order successfully synced to backend: ${localOrder.orderNumber}")
                } else {
                    Log.w(TAG, "Backend returned HTTP ${response.code} for order sync")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Offline/Local fallback for order sync: ${e.message}")
            }
        }
    }

    /**
     * Dispatch waiter service request to backend
     */
    fun dispatchServiceRequest(sessionId: String, type: ServiceRequestType, restaurantId: String, tableNumber: Int) {
        scope.launch {
            try {
                val jsonBody = JsonObject().apply {
                    addProperty("restaurantId", restaurantId)
                    addProperty("tableNumber", tableNumber.toString())
                    addProperty("requestType", type.name)
                }

                val mediaType = "application/json; charset=utf-8".toMediaType()
                val requestBody = jsonBody.toString().toRequestBody(mediaType)

                val request = Request.Builder()
                    .url("$API_BASE_URL/service-requests")
                    .addHeader("Content-Type", "application/json")
                    .post(requestBody)
                    .build()

                val response = client.newCall(request).execute()
                Log.i(TAG, "Service request synced: ${response.code}")
            } catch (e: Exception) {
                Log.w(TAG, "Service request local fallback: ${e.message}")
            }
        }
    }
}
