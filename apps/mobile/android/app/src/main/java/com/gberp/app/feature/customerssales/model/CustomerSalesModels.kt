package com.gberp.app.feature.customerssales.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CustomerDto(
    @SerialName("_id") val mongoId: String? = null,
    val id: String? = null,
    val name: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val companyName: String = "",
    val businessName: String = "",
    val email: String = "",
    val phone: String = "",
    val taxId: String = "",
    val address: String = "",
    val status: String = "",
    val createdAt: String? = null
) {
    val key: String get() = mongoId ?: id.orEmpty()
    val displayName: String
        get() = name.ifBlank {
            companyName.ifBlank {
                businessName.ifBlank { listOf(firstName, lastName).filter(String::isNotBlank).joinToString(" ") }
            }
        }.ifBlank { "Cliente" }
}

@Serializable
data class SaleDto(
    @SerialName("_id") val mongoId: String? = null,
    val id: String? = null,
    val saleNumber: String = "",
    val number: String = "",
    val customerId: String = "",
    val customerName: String = "",
    val customer: CustomerDto? = null,
    val subtotal: Double? = null,
    val tax: Double? = null,
    val total: Double? = null,
    val status: String = "",
    val paymentStatus: String = "",
    val paymentMethod: String = "",
    val saleDate: String? = null,
    val createdAt: String? = null
) {
    val key: String get() = mongoId ?: id.orEmpty()
    val displayNumber: String get() = saleNumber.ifBlank { number.ifBlank { key } }
    val displayCustomer: String get() = customerName.ifBlank { customer?.displayName.orEmpty() }
    val displayDate: String get() = saleDate ?: createdAt.orEmpty()
}
