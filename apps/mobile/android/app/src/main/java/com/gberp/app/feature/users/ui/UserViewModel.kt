package com.gberp.app.feature.users.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.users.data.UserRepository
import com.gberp.app.feature.users.model.CreateUserRequest
import com.gberp.app.feature.users.model.UserDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UserState(
    val users: List<UserDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val page: Int = 1,
    val totalPages: Int = 1,
    val totalRecords: Int = 0,
    val searchQuery: String = "",
    val operationSuccess: String? = null
)

@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel() {

    private val _state = MutableStateFlow(UserState(isLoading = true))
    val state: StateFlow<UserState> = _state.asStateFlow()

    init {
        loadUsers()
    }

    fun loadUsers(page: Int = 1, search: String? = _state.value.searchQuery) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, searchQuery = search ?: "")
            when (val result = repository.getUsers(page, 20, search.ifEmpty { null })) {
                is NetworkResult.Success -> {
                    val total = result.pagination?.total ?: result.data.size
                    val limit = result.pagination?.limit ?: 20
                    val totalP = if (limit > 0) (total + limit - 1) / limit else 1

                    _state.value = _state.value.copy(
                        users = result.data,
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

    fun createUser(request: CreateUserRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.createUser(request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Usuario creado exitosamente")
                    loadUsers(_state.value.page)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun updateUser(id: String, request: CreateUserRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.updateUser(id, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Usuario actualizado exitosamente")
                    loadUsers(_state.value.page)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun deleteUser(id: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.deleteUser(id)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Usuario eliminado exitosamente")
                    loadUsers(_state.value.page)
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
