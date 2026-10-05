package com.gberp.app.feature.companies.model

import kotlinx.serialization.Serializable

@Serializable
data class CompanyDto(
    val id: String = "",
    val tenantId: String = "",
    val name: String,
    val taxId: String = "",
    val legalName: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    val status: String = "active",
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class CreateCompanyRequest(
    val name: String,
    val taxId: String = "",
    val legalName: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    val status: String = "active"
)
