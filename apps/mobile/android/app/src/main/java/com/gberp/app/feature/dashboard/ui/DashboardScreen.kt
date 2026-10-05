package com.gberp.app.feature.dashboard.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBNavyPrimary
import com.gberp.app.core.theme.GBTealAccent
import com.gberp.app.core.theme.GBTextSecondaryLight
import com.gberp.app.core.ui.components.GBCard
import com.gberp.app.core.ui.components.GBErrorView
import com.gberp.app.core.ui.components.GBLoadingView
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.auth.ui.AuthViewModel

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    authViewModel: AuthViewModel,
    onNavigateToCompanies: () -> Unit,
    onNavigateToBranches: () -> Unit,
    onNavigateToUsers: () -> Unit,
    onNavigateToAudit: () -> Unit,
    onNavigateToProfile: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            GBTopBar(
                title = "GB ERP Dashboard",
                subtitle = authViewModel.getUserName(),
                onProfileClick = onNavigateToProfile
            )
        }
    ) { padding ->
        when {
            state.isLoading -> {
                GBLoadingView(modifier = Modifier.padding(padding))
            }
            state.error != null -> {
                GBErrorView(
                    message = state.error!!,
                    onRetry = { viewModel.loadDashboardData() },
                    modifier = Modifier.padding(padding)
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp)
                ) {
                    item {
                        Text(
                            text = "Métricas Principales",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Empresas",
                                value = state.totalCompanies.toString(),
                                icon = Icons.Default.Business,
                                color = GBNavyPrimary,
                                modifier = Modifier.weight(1f),
                                onClick = onNavigateToCompanies
                            )
                            KpiCard(
                                title = "Sucursales",
                                value = state.totalBranches.toString(),
                                icon = Icons.Default.Store,
                                color = GBTealAccent,
                                modifier = Modifier.weight(1f),
                                onClick = onNavigateToBranches
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            KpiCard(
                                title = "Usuarios",
                                value = state.totalUsers.toString(),
                                icon = Icons.Default.People,
                                color = GBNavyPrimary,
                                modifier = Modifier.weight(1f),
                                onClick = onNavigateToUsers
                            )
                            KpiCard(
                                title = "Auditoría",
                                value = "Logs",
                                icon = Icons.Default.History,
                                color = GBTealAccent,
                                modifier = Modifier.weight(1f),
                                onClick = onNavigateToAudit
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Text(
                            text = "Actividad Reciente del Sistema",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    if (state.recentAuditLogs.isEmpty()) {
                        item {
                            Text(
                                text = "No hay registros de auditoría recientes.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = GBTextSecondaryLight
                            )
                        }
                    } else {
                        items(state.recentAuditLogs) { log ->
                            GBCard(modifier = Modifier.padding(bottom = 8.dp)) {
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "[${log.module.uppercase()}] ${log.action}",
                                            style = MaterialTheme.typography.titleMedium,
                                            color = GBNavyPrimary
                                        )
                                        Text(
                                            text = log.createdAt?.take(10) ?: "",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = GBTextSecondaryLight
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = log.description.ifEmpty { "Acción en el módulo ${log.module}" },
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KpiCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    GBCard(
        onClick = onClick,
        modifier = modifier
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.padding(end = 12.dp)
            )
            Column {
                Text(
                    text = value,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = color
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = GBTextSecondaryLight
                )
            }
        }
    }
}
