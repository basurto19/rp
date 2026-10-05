package com.gberp.app.feature.users.model

import kotlinx.serialization.Serializable

@Serializable
data class UserDto(
    val id: String = "",
    val tenantId: String = "",
    val branchId: String? = null,
    val email: String,
    val firstName: String,
    val lastName: String,
    val roleId: String? = null,
    val status: String = "active",
    val permissions: List<String> = emptyList(),
    val lastLoginAt: String? = null,
    val createdAt: String? = null
)

@Serializable
data class CreateUserRequest(
    val email: String,
    val firstName: String,
    val lastName: String,
    val password: String? = null,
    val roleId: String? = null,
    val branchId: String? = null,
    val status: String = "active"
)
