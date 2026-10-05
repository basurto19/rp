package com.gberp.app.feature.settings.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.settings.data.SettingRepository
import com.gberp.app.feature.settings.model.SettingDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingState(
    val settings: List<SettingDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val operationSuccess: String? = null
)

@HiltViewModel
class SettingViewModel @Inject constructor(
    private val repository: SettingRepository
) : ViewModel() {

    private val _state = MutableStateFlow(SettingState(isLoading = true))
    val state: StateFlow<SettingState> = _state.asStateFlow()

    init {
        loadSettings()
    }

    fun loadSettings() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.getSettings()) {
                is NetworkResult.Success -> {
                    _state.value = SettingState(settings = result.data, isLoading = false)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                else -> {}
            }
        }
    }

    fun updateSetting(key: String, value: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.updateSetting(key, value)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(operationSuccess = "Configuración actualizada")
                    loadSettings()
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
