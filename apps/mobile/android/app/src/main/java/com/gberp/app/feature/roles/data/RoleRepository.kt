package com.gberp.app.feature.roles.data

import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.roles.model.CreateRoleRequest
import com.gberp.app.feature.roles.model.RoleDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoleRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getRoles(): NetworkResult<List<RoleDto>> {
        return try {
            val response = apiService.getRoles()
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(response.body()?.data ?: emptyList())
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FETCH_ROLES_FAILED",
                    message = response.body()?.error?.message ?: "Error al obtener roles"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun createRole(request: CreateRoleRequest): NetworkResult<RoleDto> {
        return try {
            val response = apiService.createRole(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "CREATE_ROLE_FAILED",
                    message = response.body()?.error?.message ?: "Error al crear rol"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun updateRole(id: String, request: CreateRoleRequest): NetworkResult<RoleDto> {
        return try {
            val response = apiService.updateRole(id, request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "UPDATE_ROLE_FAILED",
                    message = response.body()?.error?.message ?: "Error al actualizar rol"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun deleteRole(id: String): NetworkResult<Boolean> {
        return try {
            val response = apiService.deleteRole(id)
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(true)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "DELETE_ROLE_FAILED",
                    message = response.body()?.error?.message ?: "Error al eliminar rol"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }
}
