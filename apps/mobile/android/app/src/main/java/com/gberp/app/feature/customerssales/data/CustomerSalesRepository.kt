package com.gberp.app.feature.customerssales.data

import android.content.Context
import com.gberp.app.core.network.ApiResponse
import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.core.network.PaginationDto
import com.gberp.app.feature.customerssales.model.CustomerDto
import com.gberp.app.feature.customerssales.model.SaleDto
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import okhttp3.ResponseBody
import retrofit2.Response
import java.io.File
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CustomerSalesRepository @Inject constructor(
    private val api: ApiService,
    private val json: Json,
    @ApplicationContext private val context: Context
) {
    suspend fun customers(page: Int, limit: Int, search: String): NetworkResult<List<CustomerDto>> =
        request({ api.getCustomers(page, limit, search.ifBlank { null }) }) { decodeList<CustomerDto>(it, "customers", "items", "results") }

    suspend fun customer(id: String): NetworkResult<CustomerDto> =
        request({ api.getCustomer(id) }) { decodeObject<CustomerDto>(it, "customer", "item") }

    suspend fun purchases(id: String, page: Int, limit: Int): NetworkResult<List<SaleDto>> =
        request({ api.getCustomerPurchases(id, page, limit) }) { decodeList<SaleDto>(it, "purchases", "sales", "items", "results") }

    suspend fun sales(
        page: Int,
        limit: Int,
        search: String,
        status: String?,
        paymentStatus: String?,
        customerId: String?,
        from: String?,
        to: String?
    ): NetworkResult<List<SaleDto>> = request({
        api.getSales(page, limit, search.ifBlank { null }, status, paymentStatus, customerId, from, to)
    }) { decodeList<SaleDto>(it, "sales", "items", "results") }

    suspend fun sale(id: String): NetworkResult<SaleDto> =
        request({ api.getSale(id) }) { decodeObject<SaleDto>(it, "sale", "item") }

    suspend fun downloadCustomerPurchases(id: String): Result<File> =
        download({ api.customerPurchasesPdf(id) }, "customer-purchases-${id.safeFilePart()}.pdf")

    suspend fun downloadSale(id: String): Result<File> =
        download({ api.salePdf(id) }, "sale-${id.safeFilePart()}.pdf")

    suspend fun downloadSalesReport(
        status: String?,
        paymentStatus: String?,
        customerId: String?,
        from: String?,
        to: String?
    ): Result<File> = download(
        { api.salesReportPdf(status, paymentStatus, customerId, from, to) },
        "sales-report.pdf"
    )

    private suspend fun <T> request(
        call: suspend () -> Response<ApiResponse<JsonElement>>,
        decode: (JsonElement) -> T
    ): NetworkResult<T> = try {
        val response = call()
        val body = response.body()
        if (!response.isSuccessful || body?.success != true || body.data == null) {
            NetworkResult.Error(
                body?.error?.code ?: "HTTP_${response.code()}",
                body?.error?.message ?: "No se pudo completar la operación.",
                response.code()
            )
        } else {
            try {
                NetworkResult.Success(decode(body.data), body.message, body.pagination)
            } catch (_: SerializationException) {
                NetworkResult.Error("INVALID_RESPONSE", "La API devolvió datos con un formato no válido.", response.code())
            } catch (_: IllegalStateException) {
                NetworkResult.Error("INVALID_RESPONSE", "La API devolvió datos con un formato no válido.", response.code())
            }
        }
    } catch (_: IOException) {
        NetworkResult.Error("NETWORK_ERROR", "No se pudo conectar con la API.")
    } catch (_: SerializationException) {
        NetworkResult.Error("INVALID_RESPONSE", "La API devolvió una respuesta no válida.")
    }

    private inline fun <reified T> decodeList(element: JsonElement, vararg collectionKeys: String): List<T> =
        json.decodeFromJsonElement(findPayload(element, collectionKeys))

    private inline fun <reified T> decodeObject(element: JsonElement, vararg objectKeys: String): T =
        json.decodeFromJsonElement(findPayload(element, objectKeys))

    private fun findPayload(element: JsonElement, keys: Array<out String>): JsonElement {
        var current = element
        repeat(4) {
            if (current !is JsonObject) return current
            val nested = keys.firstNotNullOfOrNull { key -> current[key] }
                ?: current["data"]
                ?: return current
            current = nested
        }
        return current
    }

    private suspend fun download(
        call: suspend () -> Response<ResponseBody>,
        fileName: String
    ): Result<File> {
        return try {
            val response = call()
            if (!response.isSuccessful) {
                return Result.failure(IOException("No se pudo descargar el PDF (HTTP ${response.code()})."))
            }
            val body = response.body() ?: return Result.failure(IOException("La API no devolvió el archivo PDF."))
            val contentType = body.contentType()?.subtype.orEmpty()
            if (contentType != "pdf" && contentType != "octet-stream") {
                return Result.failure(IOException("La respuesta de la API no es un PDF."))
            }
            val directory = File(context.cacheDir, "reports").apply { mkdirs() }
            val file = File(directory, fileName)
            body.byteStream().use { input ->
                file.outputStream().use { output -> input.copyTo(output) }
            }
            if (file.length() == 0L) {
                file.delete()
                Result.failure(IOException("El archivo PDF está vacío."))
            } else {
                Result.success(file)
            }
        } catch (error: IOException) {
            Result.failure(error)
        }

        private fun String.safeFilePart(): String =
            filter { it.isLetterOrDigit() || it == '-' || it == '_' }.take(80).ifBlank { "record" }
    }
}
