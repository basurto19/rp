package com.gberp.app.core.network

sealed class NetworkResult<out T> {
    data class Success<out T>(val data: T, val message: String? = null, val pagination: PaginationDto? = null) : NetworkResult<T>()
    data class Error(val code: String, val message: String, val statusCode: Int = 0) : NetworkResult<Nothing>()
    object Loading : NetworkResult<Nothing>()
}
