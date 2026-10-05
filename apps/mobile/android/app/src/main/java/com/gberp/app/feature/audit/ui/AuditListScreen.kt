package com.gberp.app.feature.audit.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBNavyPrimary
import com.gberp.app.core.theme.GBTextSecondaryLight
import com.gberp.app.core.ui.components.GBCard
import com.gberp.app.core.ui.components.GBEmptyView
import com.gberp.app.core.ui.components.GBErrorView
import com.gberp.app.core.ui.components.GBLoadingView
import com.gberp.app.core.ui.components.GBPaginationControl
import com.gberp.app.core.ui.components.GBTopBar

@Composable
fun AuditListScreen(
    viewModel: AuditViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Logs de Auditoría",
                onBackClick = onBackClick
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                state.isLoading && state.logs.isEmpty() -> {
                    GBLoadingView(modifier = Modifier.weight(1f))
                }
                state.error != null && state.logs.isEmpty() -> {
                    GBErrorView(
                        message = state.error!!,
                        onRetry = { viewModel.loadAuditLogs() },
                        modifier = Modifier.weight(1f)
                    )
                }
                else -> {
                    if (state.logs.isEmpty()) {
                        GBEmptyView(
                            title = "No hay registros de auditoría",
                            subtitle = "Las acciones realizadas en el sistema se registrarán aquí.",
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            items(state.logs) { log ->
                                GBCard(modifier = Modifier.padding(bottom = 8.dp)) {
                                    Column {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = "[${log.module.uppercase()}] ${log.action}",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
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
                                            text = log.description.ifEmpty { "Registro de auditoría sin descripción" },
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                        if (log.ipAddress.isNotEmpty()) {
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(
                                                text = "IP: ${log.ipAddress}",
                                                style = MaterialTheme.typography.labelMedium,
                                                color = GBTextSecondaryLight
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    GBPaginationControl(
                        currentPage = state.page,
                        totalPages = state.totalPages,
                        totalRecords = state.totalRecords,
                        onPageChange = { viewModel.loadAuditLogs(it) }
                    )
                }
            }
        }
    }
}
