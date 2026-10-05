package com.gberp.app.feature.branches.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.branches.data.BranchRepository
import com.gberp.app.feature.branches.model.BranchDto
import com.gberp.app.feature.branches.model.CreateBranchRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BranchState(
    val branches: List<BranchDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val page: Int = 1,
    val totalPages: Int = 1,
    val totalRecords: Int = 0,
    val operationSuccess: String? = null
)

@HiltViewModel
class BranchViewModel @Inject constructor(
    private val repository: BranchRepository
) : ViewModel() {

    private val _state = MutableStateFlow(BranchState(isLoading = true))
    val state: StateFlow<BranchState> = _state.asStateFlow()

    init {
        loadBranches()
    }

    fun loadBranches(page: Int = 1) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.getBranches(page)) {
                is NetworkResult.Success -> {
                    val total = result.pagination?.total ?: result.data.size
                    val limit = result.pagination?.limit ?: 20
                    val totalP = if (limit > 0) (total + limit - 1) / limit else 1

                    _state.value = BranchState(
                        branches = result.data,
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

    fun createBranch(request: CreateBranchRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.createBranch(request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Sucursal creada exitosamente")
                    loadBranches(_state.value.page)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun updateBranch(id: String, request: CreateBranchRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.updateBranch(id, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Sucursal actualizada exitosamente")
                    loadBranches(_state.value.page)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun deleteBranch(id: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.deleteBranch(id)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Sucursal eliminada exitosamente")
                    loadBranches(_state.value.page)
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
