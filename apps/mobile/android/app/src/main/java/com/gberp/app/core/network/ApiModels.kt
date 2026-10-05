package com.gberp.app.core.network

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val pagination: PaginationDto? = null,
    val error: ApiErrorDto? = null
)

@Serializable
data class ApiErrorDto(
    val code: String = "UNKNOWN_ERROR",
    val message: String = "Error inesperado del servidor",
    val details: kotlinx.serialization.json.JsonObject? = null
)

@Serializable
data class PaginationDto(
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
    val hasMore: Boolean = false
)
