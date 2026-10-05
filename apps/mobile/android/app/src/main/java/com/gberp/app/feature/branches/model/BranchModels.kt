package com.gberp.app.feature.branches.model

import kotlinx.serialization.Serializable

@Serializable
data class BranchDto(
    val id: String = "",
    val tenantId: String = "",
    val companyId: String = "",
    val name: String,
    val code: String = "",
    val address: String = "",
    val phone: String = "",
    val isMain: Boolean = false,
    val status: String = "active",
    val createdAt: String? = null
)

@Serializable
data class CreateBranchRequest(
    val name: String,
    val code: String = "",
    val address: String = "",
    val phone: String = "",
    val isMain: Boolean = false,
    val status: String = "active"
)
