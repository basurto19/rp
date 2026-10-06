package com.gberp.app.feature.products.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProductDto(
    @SerialName("_id") val id: String,
    val name: String,
    val description: String = "",
    val sku: String,
    val category: String = "",
    val costPrice: Double = 0.0,
    val salePrice: Double = 0.0,
    val stock: Double = 0.0,
    val minimumStock: Double = 0.0,
    val unit: String = "unidad",
    val status: String = "active",
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class ProductRequest(
    val name: String,
    val description: String = "",
    val sku: String,
    val category: String = "",
    val costPrice: Double,
    val salePrice: Double,
    val stock: Double = 0.0,
    val minimumStock: Double = 0.0,
    val unit: String = "unidad",
    val status: String = "active"
)

@Serializable
data class InventoryMovementRequest(
    val type: String,
    val quantity: Double,
    val notes: String = ""
)

@Serializable
data class InventoryMovementDto(
    @SerialName("_id") val id: String,
    val type: String,
    val quantity: Double,
    val stockBefore: Double,
    val stockAfter: Double,
    val notes: String = "",
    val createdAt: String? = null
)

@Serializable
data class InventoryMovementResult(
    val product: ProductDto,
    val movement: InventoryMovementDto
)
