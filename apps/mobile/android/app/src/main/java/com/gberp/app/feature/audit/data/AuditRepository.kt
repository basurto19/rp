package com.gberp.app.feature.audit.data

import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.audit.model.AuditLogDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuditRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getAuditLogs(page: Int = 1, limit: Int = 20): NetworkResult<List<AuditLogDto>> {
        return try {
            val response = apiService.getAuditLogs(page, limit)
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                NetworkResult.Success(
                    data = body.data ?: emptyList(),
                    pagination = body.pagination
                )
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FETCH_AUDIT_FAILED",
                    message = response.body()?.error?.message ?: "Error al obtener logs de auditoría"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun getAuditLogsByModule(module: String, page: Int = 1, limit: Int = 20): NetworkResult<List<AuditLogDto>> {
        return try {
            val response = apiService.getAuditLogsByModule(module, page, limit)
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                NetworkResult.Success(
                    data = body.data ?: emptyList(),
                    pagination = body.pagination
                )
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FETCH_AUDIT_BY_MODULE_FAILED",
                    message = response.body()?.error?.message ?: "Error al obtener auditoría por módulo"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }
}
