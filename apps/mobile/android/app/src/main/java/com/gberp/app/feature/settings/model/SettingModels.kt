package com.gberp.app.feature.settings.model

import kotlinx.serialization.Serializable

@Serializable
data class SettingDto(
    val id: String = "",
    val tenantId: String = "",
    val key: String,
    val value: String,
    val description: String = "",
    val isSystem: Boolean = false,
    val updatedAt: String? = null
)
