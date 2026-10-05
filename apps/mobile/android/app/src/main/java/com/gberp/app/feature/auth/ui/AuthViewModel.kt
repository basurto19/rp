package com.gberp.app.feature.auth.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val message: String) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _loginState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val loginState: StateFlow<AuthUiState> = _loginState.asStateFlow()

    private val _forgotPasswordState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val forgotPasswordState: StateFlow<AuthUiState> = _forgotPasswordState.asStateFlow()

    fun isLoggedIn(): Boolean = authRepository.isLoggedIn()
    fun getUserName(): String = authRepository.getUserName()
    fun getUserEmail(): String = authRepository.getUserEmail()

    fun login(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _loginState.value = AuthUiState.Error("Por favor ingrese correo y contraseña")
            return
        }

        viewModelScope.launch {
            _loginState.value = AuthUiState.Loading
            when (val result = authRepository.login(email.trim(), pass)) {
                is NetworkResult.Success -> {
                    _loginState.value = AuthUiState.Success("Bienvenido a GB ERP")
                }
                is NetworkResult.Error -> {
                    _loginState.value = AuthUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun forgotPassword(email: String) {
        if (email.isBlank()) {
            _forgotPasswordState.value = AuthUiState.Error("Ingrese su correo electrónico")
            return
        }

        viewModelScope.launch {
            _forgotPasswordState.value = AuthUiState.Loading
            when (val result = authRepository.forgotPassword(email.trim())) {
                is NetworkResult.Success -> {
                    _forgotPasswordState.value = AuthUiState.Success(result.data)
                }
                is NetworkResult.Error -> {
                    _forgotPasswordState.value = AuthUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun logout(onLogoutDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            _loginState.value = AuthUiState.Idle
            onLogoutDone()
        }
    }

    fun resetState() {
        _loginState.value = AuthUiState.Idle
        _forgotPasswordState.value = AuthUiState.Idle
    }
}
