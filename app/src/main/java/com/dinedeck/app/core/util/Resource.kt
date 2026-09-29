package com.dinedeck.app.core.util

sealed class Resource<T>(
    val data: T? = null,
    val message: String? = null,
    val errorCode: String? = null
) {
    class Success<T>(data: T) : Resource<T>(data)
    class Error<T>(message: String, data: T? = null, errorCode: String? = null) : Resource<T>(data, message, errorCode)
    class Loading<T>(data: T? = null) : Resource<T>(data)
}

data class ApiEnvelope<T>(
    val success: Boolean,
    val message: String,
    val code: String? = null,
    val data: T? = null
)
