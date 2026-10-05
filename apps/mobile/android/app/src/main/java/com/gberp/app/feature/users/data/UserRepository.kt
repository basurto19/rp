package com.gberp.app.feature.users.data

import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.users.model.CreateUserRequest
import com.gberp.app.feature.users.model.UserDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getUsers(page: Int = 1, limit: Int = 20, search: String? = null): NetworkResult<List<UserDto>> {
        return try {
            val response = apiService.getUsers(page, limit, search)
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                NetworkResult.Success(
                    data = body.data ?: emptyList(),
                    pagination = body.pagination
                )
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FETCH_USERS_FAILED",
                    message = response.body()?.error?.message ?: "Error al obtener usuarios"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun createUser(request: CreateUserRequest): NetworkResult<UserDto> {
        return try {
            val response = apiService.createUser(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "CREATE_USER_FAILED",
                    message = response.body()?.error?.message ?: "Error al crear usuario"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun updateUser(id: String, request: CreateUserRequest): NetworkResult<UserDto> {
        return try {
            val response = apiService.updateUser(id, request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "UPDATE_USER_FAILED",
                    message = response.body()?.error?.message ?: "Error al actualizar usuario"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun deleteUser(id: String): NetworkResult<Boolean> {
        return try {
            val response = apiService.deleteUser(id)
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(true)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "DELETE_USER_FAILED",
                    message = response.body()?.error?.message ?: "Error al eliminar usuario"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }
}
