package com.gberp.app.feature.settings.data

import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.settings.model.SettingDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getSettings(): NetworkResult<List<SettingDto>> {
        return try {
            val response = apiService.getSettings()
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(response.body()?.data ?: emptyList())
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FETCH_SETTINGS_FAILED",
                    message = response.body()?.error?.message ?: "Error al obtener configuraciones"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun updateSetting(key: String, value: String): NetworkResult<SettingDto> {
        return try {
            val response = apiService.updateSetting(mapOf("key" to key, "value" to value))
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "UPDATE_SETTING_FAILED",
                    message = response.body()?.error?.message ?: "Error al actualizar configuración"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }
}
