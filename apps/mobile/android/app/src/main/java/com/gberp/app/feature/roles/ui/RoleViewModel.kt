package com.gberp.app.feature.roles.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.roles.data.RoleRepository
import com.gberp.app.feature.roles.model.CreateRoleRequest
import com.gberp.app.feature.roles.model.RoleDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RoleState(
    val roles: List<RoleDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val operationSuccess: String? = null
)

@HiltViewModel
class RoleViewModel @Inject constructor(
    private val repository: RoleRepository
) : ViewModel() {

    private val _state = MutableStateFlow(RoleState(isLoading = true))
    val state: StateFlow<RoleState> = _state.asStateFlow()

    init {
        loadRoles()
    }

    fun loadRoles() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.getRoles()) {
                is NetworkResult.Success -> {
                    _state.value = RoleState(roles = result.data, isLoading = false)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun createRole(request: CreateRoleRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.createRole(request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Rol creado exitosamente")
                    loadRoles()
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun updateRole(id: String, request: CreateRoleRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.updateRole(id, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Rol actualizado exitosamente")
                    loadRoles()
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun deleteRole(id: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.deleteRole(id)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Rol eliminado exitosamente")
                    loadRoles()
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
