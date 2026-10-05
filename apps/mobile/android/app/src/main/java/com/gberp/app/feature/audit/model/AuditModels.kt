package com.gberp.app.feature.audit.model

import kotlinx.serialization.Serializable

@Serializable
data class AuditLogDto(
    val id: String = "",
    val tenantId: String = "",
    val userId: String = "",
    val userName: String = "",
    val module: String = "",
    val action: String = "",
    val description: String = "",
    val ipAddress: String = "",
    val userAgent: String = "",
    val createdAt: String? = null
)
