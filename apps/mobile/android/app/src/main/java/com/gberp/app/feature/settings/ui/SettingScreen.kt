package com.gberp.app.feature.settings.ui

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBNavyPrimary
import com.gberp.app.core.theme.GBTextSecondaryLight
import com.gberp.app.core.ui.components.GBCard
import com.gberp.app.core.ui.components.GBEmptyView
import com.gberp.app.core.ui.components.GBErrorView
import com.gberp.app.core.ui.components.GBLoadingView
import com.gberp.app.core.ui.components.GBPrimaryButton
import com.gberp.app.core.ui.components.GBTextField
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.settings.model.SettingDto

@Composable
fun SettingScreen(
    viewModel: SettingViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var selectedSetting by remember { mutableStateOf<SettingDto?>(null) }

    LaunchedEffect(state.operationSuccess) {
        state.operationSuccess?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearOperationSuccess()
        }
    }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Configuración del Sistema",
                onBackClick = onBackClick
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            state.isLoading && state.settings.isEmpty() -> {
                GBLoadingView(modifier = Modifier.padding(padding))
            }
            state.error != null && state.settings.isEmpty() -> {
                GBErrorView(
                    message = state.error!!,
                    onRetry = { viewModel.loadSettings() },
                    modifier = Modifier.padding(padding)
                )
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    if (state.settings.isEmpty()) {
                        GBEmptyView(
                            title = "No hay ajustes del sistema",
                            subtitle = "Las configuraciones del tenant aparecerán aquí.",
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            items(state.settings) { setting ->
                                GBCard(modifier = Modifier.padding(bottom = 8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = setting.key,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = GBNavyPrimary
                                            )
                                            Text(
                                                text = "Valor: ${setting.value}",
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                            if (setting.description.isNotEmpty()) {
                                                Text(
                                                    text = setting.description,
                                                    style = MaterialTheme.typography.labelMedium,
                                                    color = GBTextSecondaryLight
                                                )
                                            }
                                        }

                                        IconButton(onClick = { selectedSetting = setting }) {
                                            Icon(
                                                imageVector = Icons.Default.Edit,
                                                contentDescription = "Editar Ajuste",
                                                tint = GBNavyPrimary
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
    }

    if (selectedSetting != null) {
        var value by remember { mutableStateOf(selectedSetting!!.value) }

        AlertDialog(
            onDismissRequest = { selectedSetting = null },
            title = { Text("Editar Ajuste: ${selectedSetting!!.key}") },
            text = {
                Column {
                    GBTextField(
                        value = value,
                        onValueChange = { value = it },
                        label = "Valor *"
                    )
                }
            },
            confirmButton = {
                GBPrimaryButton(
                    text = "Guardar",
                    onClick = {
                        viewModel.updateSetting(selectedSetting!!.key, value)
                        selectedSetting = null
                    },
                    modifier = Modifier.fillMaxWidth(0.4f)
                )
            },
            dismissButton = {
                TextButton(onClick = { selectedSetting = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}
