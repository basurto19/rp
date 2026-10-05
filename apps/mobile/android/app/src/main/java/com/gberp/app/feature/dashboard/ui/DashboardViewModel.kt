package com.gberp.app.feature.dashboard.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.audit.data.AuditRepository
import com.gberp.app.feature.audit.model.AuditLogDto
import com.gberp.app.feature.branches.data.BranchRepository
import com.gberp.app.feature.companies.data.CompanyRepository
import com.gberp.app.feature.users.data.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardKpiData(
    val totalCompanies: Int = 0,
    val totalBranches: Int = 0,
    val totalUsers: Int = 0,
    val recentAuditLogs: List<AuditLogDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val companyRepository: CompanyRepository,
    private val branchRepository: BranchRepository,
    private val userRepository: UserRepository,
    private val auditRepository: AuditRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardKpiData(isLoading = true))
    val uiState: StateFlow<DashboardKpiData> = _uiState.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            var companiesCount = 0
            var branchesCount = 0
            var usersCount = 0
            var auditList = emptyList<AuditLogDto>()
            var errorMsg: String? = null

            when (val res = companyRepository.getCompanies(1, 1)) {
                is NetworkResult.Success -> companiesCount = res.pagination?.total ?: res.data.size
                is NetworkResult.Error -> errorMsg = res.message
                else -> {}
            }

            when (val res = branchRepository.getBranches(1, 1)) {
                is NetworkResult.Success -> branchesCount = res.pagination?.total ?: res.data.size
                else -> {}
            }

            when (val res = userRepository.getUsers(1, 1)) {
                is NetworkResult.Success -> usersCount = res.pagination?.total ?: res.data.size
                else -> {}
            }

            when (val res = auditRepository.getAuditLogs(1, 5)) {
                is NetworkResult.Success -> auditList = res.data
                else -> {}
            }

            _uiState.value = DashboardKpiData(
                totalCompanies = companiesCount,
                totalBranches = branchesCount,
                totalUsers = usersCount,
                recentAuditLogs = auditList,
                isLoading = false,
                error = errorMsg
            )
        }
    }
}
