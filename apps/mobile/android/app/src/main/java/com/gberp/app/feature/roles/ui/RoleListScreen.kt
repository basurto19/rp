package com.gberp.app.feature.roles.ui

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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FloatingActionButton
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBError
import com.gberp.app.core.theme.GBNavyPrimary
import com.gberp.app.core.theme.GBTextSecondaryLight
import com.gberp.app.core.ui.components.GBCard
import com.gberp.app.core.ui.components.GBEmptyView
import com.gberp.app.core.ui.components.GBErrorView
import com.gberp.app.core.ui.components.GBLoadingView
import com.gberp.app.core.ui.components.GBPrimaryButton
import com.gberp.app.core.ui.components.GBTextField
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.roles.model.CreateRoleRequest
import com.gberp.app.feature.roles.model.RoleDto

@Composable
fun RoleListScreen(
    viewModel: RoleViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showDialog by remember { mutableStateOf(false) }
    var selectedRole by remember { mutableStateOf<RoleDto?>(null) }
    var roleToDelete by remember { mutableStateOf<RoleDto?>(null) }

    LaunchedEffect(state.operationSuccess) {
        state.operationSuccess?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearOperationSuccess()
        }
    }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Roles y Permisos (RBAC)",
                onBackClick = onBackClick
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    selectedRole = null
                    showDialog = true
                },
                containerColor = GBNavyPrimary,
                contentColor = Color.White
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Nuevo Rol")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            state.isLoading && state.roles.isEmpty() -> {
                GBLoadingView(modifier = Modifier.padding(padding))
            }
            state.error != null && state.roles.isEmpty() -> {
                GBErrorView(
                    message = state.error!!,
                    onRetry = { viewModel.loadRoles() },
                    modifier = Modifier.padding(padding)
                )
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    if (state.roles.isEmpty()) {
                        GBEmptyView(
                            title = "No hay roles configurados",
                            subtitle = "Crea un rol con el botón +",
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            items(state.roles) { role ->
                                GBCard(modifier = Modifier.padding(bottom = 8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = role.name,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = GBNavyPrimary
                                            )
                                            if (role.description.isNotEmpty()) {
                                                Text(
                                                    text = role.description,
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = GBTextSecondaryLight
                                                )
                                            }
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            IconButton(onClick = {
                                                selectedRole = role
                                                showDialog = true
                                            }) {
                                                Icon(
                                                    imageVector = Icons.Default.Edit,
                                                    contentDescription = "Editar",
                                                    tint = GBNavyPrimary
                                                )
                                            }

                                            if (!role.isSystem) {
                                                IconButton(onClick = { roleToDelete = role }) {
                                                    Icon(
                                                        imageVector = Icons.Default.Delete,
                                                        contentDescription = "Eliminar",
                                                        tint = GBError
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
        }
    }

    if (showDialog) {
        RoleFormDialog(
            role = selectedRole,
            onDismiss = { showDialog = false },
            onSave = { req ->
                if (selectedRole == null) {
                    viewModel.createRole(req)
                } else {
                    viewModel.updateRole(selectedRole!!.id, req)
                }
                showDialog = false
            }
        )
    }

    if (roleToDelete != null) {
        AlertDialog(
            onDismissRequest = { roleToDelete = null },
            title = { Text("Confirmar Eliminación") },
            text = { Text("¿Deseas eliminar el rol ${roleToDelete?.name}?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteRole(roleToDelete!!.id)
                    roleToDelete = null
                }) {
                    Text("Eliminar", color = GBError)
                }
            },
            dismissButton = {
                TextButton(onClick = { roleToDelete = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun RoleFormDialog(
    role: RoleDto?,
    onDismiss: () -> Unit,
    onSave: (CreateRoleRequest) -> Unit
) {
    var name by remember { mutableStateOf(role?.name ?: "") }
    var description by remember { mutableStateOf(role?.description ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (role == null) "Nuevo Rol" else "Editar Rol") },
        text = {
            Column {
                GBTextField(value = name, onValueChange = { name = it }, label = "Nombre del Rol *")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = description, onValueChange = { description = it }, label = "Descripción")
            }
        },
        confirmButton = {
            GBPrimaryButton(
                text = "Guardar",
                onClick = {
                    if (name.isNotBlank()) {
                        onSave(CreateRoleRequest(name, description))
                    }
                },
                modifier = Modifier.fillMaxWidth(0.4f)
            )
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}
