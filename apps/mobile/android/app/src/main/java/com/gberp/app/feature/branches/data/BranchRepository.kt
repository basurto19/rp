package com.gberp.app.feature.branches.data

import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.branches.model.BranchDto
import com.gberp.app.feature.branches.model.CreateBranchRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BranchRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getBranches(page: Int = 1, limit: Int = 20): NetworkResult<List<BranchDto>> {
        return try {
            val response = apiService.getBranches(page, limit)
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                NetworkResult.Success(
                    data = body.data ?: emptyList(),
                    pagination = body.pagination
                )
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FETCH_BRANCHES_FAILED",
                    message = response.body()?.error?.message ?: "Error al obtener sucursales"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun createBranch(request: CreateBranchRequest): NetworkResult<BranchDto> {
        return try {
            val response = apiService.createBranch(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "CREATE_BRANCH_FAILED",
                    message = response.body()?.error?.message ?: "Error al crear sucursal"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun updateBranch(id: String, request: CreateBranchRequest): NetworkResult<BranchDto> {
        return try {
            val response = apiService.updateBranch(id, request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "UPDATE_BRANCH_FAILED",
                    message = response.body()?.error?.message ?: "Error al actualizar sucursal"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun deleteBranch(id: String): NetworkResult<Boolean> {
        return try {
            val response = apiService.deleteBranch(id)
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(true)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "DELETE_BRANCH_FAILED",
                    message = response.body()?.error?.message ?: "Error al eliminar sucursal"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }
}
