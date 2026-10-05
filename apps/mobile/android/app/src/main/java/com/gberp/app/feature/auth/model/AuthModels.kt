package com.gberp.app.feature.auth.model

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponseData(
    val accessToken: String,
    val refreshToken: String,
    val user: UserAuthDto
)

@Serializable
data class UserAuthDto(
    val id: String,
    val tenantId: String,
    val branchId: String? = null,
    val email: String,
    val firstName: String = "",
    val lastName: String = "",
    val roleId: String? = null,
    val status: String = "active",
    val permissions: List<String> = emptyList()
)

@Serializable
data class ForgotPasswordRequest(
    val email: String
)

@Serializable
data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)
