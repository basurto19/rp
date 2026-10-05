package com.gberp.app.feature.companies.data

import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.companies.model.CompanyDto
import com.gberp.app.feature.companies.model.CreateCompanyRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CompanyRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getCompanies(page: Int = 1, limit: Int = 20): NetworkResult<List<CompanyDto>> {
        return try {
            val response = apiService.getCompanies(page, limit)
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                NetworkResult.Success(
                    data = body.data ?: emptyList(),
                    pagination = body.pagination
                )
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FETCH_COMPANIES_FAILED",
                    message = response.body()?.error?.message ?: "Error al obtener empresas"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun createCompany(request: CreateCompanyRequest): NetworkResult<CompanyDto> {
        return try {
            val response = apiService.createCompany(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "CREATE_COMPANY_FAILED",
                    message = response.body()?.error?.message ?: "Error al crear empresa"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun updateCompany(id: String, request: CreateCompanyRequest): NetworkResult<CompanyDto> {
        return try {
            val response = apiService.updateCompany(id, request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "UPDATE_COMPANY_FAILED",
                    message = response.body()?.error?.message ?: "Error al actualizar empresa"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun deleteCompany(id: String): NetworkResult<Boolean> {
        return try {
            val response = apiService.deleteCompany(id)
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(true)
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "DELETE_COMPANY_FAILED",
                    message = response.body()?.error?.message ?: "Error al eliminar empresa"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }
}
