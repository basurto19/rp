package com.gberp.app.feature.roles.model

import kotlinx.serialization.Serializable

@Serializable
data class RoleDto(
    val id: String = "",
    val tenantId: String = "",
    val name: String,
    val description: String = "",
    val isSystem: Boolean = false,
    val permissions: List<String> = emptyList(),
    val createdAt: String? = null
)

@Serializable
data class CreateRoleRequest(
    val name: String,
    val description: String = "",
    val permissions: List<String> = emptyList()
)
