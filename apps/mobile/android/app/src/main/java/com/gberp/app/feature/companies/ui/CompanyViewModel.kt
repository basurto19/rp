package com.gberp.app.feature.companies.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.companies.data.CompanyRepository
import com.gberp.app.feature.companies.model.CompanyDto
import com.gberp.app.feature.companies.model.CreateCompanyRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CompanyState(
    val companies: List<CompanyDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val page: Int = 1,
    val totalPages: Int = 1,
    val totalRecords: Int = 0,
    val operationSuccess: String? = null
)

@HiltViewModel
class CompanyViewModel @Inject constructor(
    private val repository: CompanyRepository
) : ViewModel() {

    private val _state = MutableStateFlow(CompanyState(isLoading = true))
    val state: StateFlow<CompanyState> = _state.asStateFlow()

    init {
        loadCompanies()
    }

    fun loadCompanies(page: Int = 1) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.getCompanies(page)) {
                is NetworkResult.Success -> {
                    val total = result.pagination?.total ?: result.data.size
                    val limit = result.pagination?.limit ?: 20
                    val totalP = if (limit > 0) (total + limit - 1) / limit else 1

                    _state.value = CompanyState(
                        companies = result.data,
                        isLoading = false,
                        page = page,
                        totalPages = totalP,
                        totalRecords = total
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun createCompany(request: CreateCompanyRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.createCompany(request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Empresa creada exitosamente")
                    loadCompanies(_state.value.page)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun updateCompany(id: String, request: CreateCompanyRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.updateCompany(id, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Empresa actualizada exitosamente")
                    loadCompanies(_state.value.page)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun deleteCompany(id: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.deleteCompany(id)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Empresa eliminada exitosamente")
                    loadCompanies(_state.value.page)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun clearOperationSuccess() {
        _state.value = _state.value.copy(operationSuccess = null)
    }
}
