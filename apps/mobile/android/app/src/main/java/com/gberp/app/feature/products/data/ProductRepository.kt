package com.gberp.app.feature.products.data

import com.gberp.app.core.network.ApiResponse
import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.products.model.InventoryMovementDto
import com.gberp.app.feature.products.model.InventoryMovementRequest
import com.gberp.app.feature.products.model.InventoryMovementResult
import com.gberp.app.feature.products.model.ProductDto
import com.gberp.app.feature.products.model.ProductRequest
import kotlinx.serialization.SerializationException
import retrofit2.Response
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProductRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun list(search: String): NetworkResult<List<ProductDto>> =
        performRequest { apiService.getProducts(search) }

    suspend fun get(id: String): NetworkResult<ProductDto> =
        performRequest { apiService.getProduct(id) }

    suspend fun create(request: ProductRequest): NetworkResult<ProductDto> =
        performRequest { apiService.createProduct(request) }

    suspend fun update(id: String, request: ProductRequest): NetworkResult<ProductDto> =
        performRequest { apiService.updateProduct(id, request) }

    suspend fun setStatus(id: String, status: String): NetworkResult<ProductDto> =
        performRequest { apiService.updateProductStatus(id, mapOf("status" to status)) }

    suspend fun movements(id: String): NetworkResult<List<InventoryMovementDto>> =
        performRequest { apiService.getInventoryMovements(id) }

    suspend fun recordMovement(
        id: String,
        request: InventoryMovementRequest
    ): NetworkResult<InventoryMovementResult> =
        performRequest { apiService.createInventoryMovement(id, request) }

    private suspend fun <T> performRequest(
        call: suspend () -> Response<ApiResponse<T>>
    ): NetworkResult<T> = try {
        execute(call())
    } catch (_: IOException) {
        NetworkResult.Error("NETWORK_ERROR", "No se pudo conectar con la API.")
    } catch (_: SerializationException) {
        NetworkResult.Error("INVALID_RESPONSE", "La API devolvió una respuesta no válida.")
    }

    private fun <T> execute(response: Response<ApiResponse<T>>): NetworkResult<T> {
        val body = response.body()
        return if (response.isSuccessful && body?.success == true && body.data != null) {
            NetworkResult.Success(body.data, body.message, body.pagination)
        } else {
            NetworkResult.Error(
                code = body?.error?.code ?: "HTTP_${response.code()}",
                message = body?.error?.message ?: "No se pudo completar la operación.",
                statusCode = response.code()
            )
        }
    }
}
