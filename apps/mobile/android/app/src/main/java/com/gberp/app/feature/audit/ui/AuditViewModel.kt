package com.gberp.app.feature.audit.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.audit.data.AuditRepository
import com.gberp.app.feature.audit.model.AuditLogDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuditState(
    val logs: List<AuditLogDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val page: Int = 1,
    val totalPages: Int = 1,
    val totalRecords: Int = 0,
    val selectedModule: String = "ALL"
)

@HiltViewModel
class AuditViewModel @Inject constructor(
    private val repository: AuditRepository
) : ViewModel() {

    private val _state = MutableStateFlow(AuditState(isLoading = true))
    val state: StateFlow<AuditState> = _state.asStateFlow()

    init {
        loadAuditLogs()
    }

    fun loadAuditLogs(page: Int = 1, module: String = _state.value.selectedModule) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, selectedModule = module)
            val result = if (module == "ALL") {
                repository.getAuditLogs(page)
            } else {
                repository.getAuditLogsByModule(module.lowercase(), page)
            }

            when (result) {
                is NetworkResult.Success -> {
                    val total = result.pagination?.total ?: result.data.size
                    val limit = result.pagination?.limit ?: 20
                    val totalP = if (limit > 0) (total + limit - 1) / limit else 1

                    _state.value = _state.value.copy(
                        logs = result.data,
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
}
