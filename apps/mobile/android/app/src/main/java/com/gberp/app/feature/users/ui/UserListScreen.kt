package com.gberp.app.feature.users.ui

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
import androidx.compose.material.icons.filled.Search
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
import com.gberp.app.core.ui.components.BadgeStatus
import com.gberp.app.core.ui.components.GBCard
import com.gberp.app.core.ui.components.GBEmptyView
import com.gberp.app.core.ui.components.GBErrorView
import com.gberp.app.core.ui.components.GBLoadingView
import com.gberp.app.core.ui.components.GBPaginationControl
import com.gberp.app.core.ui.components.GBPrimaryButton
import com.gberp.app.core.ui.components.GBStatusBadge
import com.gberp.app.core.ui.components.GBTextField
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.users.model.CreateUserRequest
import com.gberp.app.feature.users.model.UserDto

@Composable
fun UserListScreen(
    viewModel: UserViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var searchQuery by remember { mutableStateOf("") }
    var showDialog by remember { mutableStateOf(false) }
    var selectedUser by remember { mutableStateOf<UserDto?>(null) }
    var userToDelete by remember { mutableStateOf<UserDto?>(null) }

    LaunchedEffect(state.operationSuccess) {
        state.operationSuccess?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearOperationSuccess()
        }
    }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Gestión de Usuarios",
                onBackClick = onBackClick
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    selectedUser = null
                    showDialog = true
                },
                containerColor = GBNavyPrimary,
                contentColor = Color.White
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Nuevo Usuario")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            GBTextField(
                value = searchQuery,
                onValueChange = {
                    searchQuery = it
                    viewModel.loadUsers(1, searchQuery)
                },
                label = "Buscar por nombre o correo",
                leadingIcon = Icons.Default.Search,
                modifier = Modifier.padding(16.dp)
            )

            when {
                state.isLoading && state.users.isEmpty() -> {
                    GBLoadingView(modifier = Modifier.weight(1f))
                }
                state.error != null && state.users.isEmpty() -> {
                    GBErrorView(
                        message = state.error!!,
                        onRetry = { viewModel.loadUsers() },
                        modifier = Modifier.weight(1f)
                    )
                }
                else -> {
                    if (state.users.isEmpty()) {
                        GBEmptyView(
                            title = "No se encontraron usuarios",
                            subtitle = "Intenta con otro término de búsqueda o agrega un nuevo usuario",
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 16.dp)
                        ) {
                            items(state.users) { user ->
                                GBCard(modifier = Modifier.padding(bottom = 8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = "${user.firstName} ${user.lastName}".trim(),
                                                style = MaterialTheme.typography.titleMedium,
                                                color = GBNavyPrimary
                                            )
                                            Text(
                                                text = user.email,
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = GBTextSecondaryLight
                                            )
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            GBStatusBadge(
                                                text = user.status,
                                                status = if (user.status == "active") BadgeStatus.ACTIVE else BadgeStatus.INACTIVE
                                            )

                                            IconButton(onClick = {
                                                selectedUser = user
                                                showDialog = true
                                            }) {
                                                Icon(
                                                    imageVector = Icons.Default.Edit,
                                                    contentDescription = "Editar",
                                                    tint = GBNavyPrimary
                                                )
                                            }

                                            IconButton(onClick = { userToDelete = user }) {
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

                    GBPaginationControl(
                        currentPage = state.page,
                        totalPages = state.totalPages,
                        totalRecords = state.totalRecords,
                        onPageChange = { viewModel.loadUsers(it, searchQuery) }
                    )
                }
            }
        }
    }

    if (showDialog) {
        UserFormDialog(
            user = selectedUser,
            onDismiss = { showDialog = false },
            onSave = { req ->
                if (selectedUser == null) {
                    viewModel.createUser(req)
                } else {
                    viewModel.updateUser(selectedUser!!.id, req)
                }
                showDialog = false
            }
        )
    }

    if (userToDelete != null) {
        AlertDialog(
            onDismissRequest = { userToDelete = null },
            title = { Text("Confirmar Eliminación") },
            text = { Text("¿Deseas eliminar al usuario ${userToDelete?.email}?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteUser(userToDelete!!.id)
                    userToDelete = null
                }) {
                    Text("Eliminar", color = GBError)
                }
            },
            dismissButton = {
                TextButton(onClick = { userToDelete = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun UserFormDialog(
    user: UserDto?,
    onDismiss: () -> Unit,
    onSave: (CreateUserRequest) -> Unit
) {
    var firstName by remember { mutableStateOf(user?.firstName ?: "") }
    var lastName by remember { mutableStateOf(user?.lastName ?: "") }
    var email by remember { mutableStateOf(user?.email ?: "") }
    var password by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (user == null) "Nuevo Usuario" else "Editar Usuario") },
        text = {
            Column {
                GBTextField(value = firstName, onValueChange = { firstName = it }, label = "Nombre *")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = lastName, onValueChange = { lastName = it }, label = "Apellido *")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = email, onValueChange = { email = it }, label = "Correo Electrónico *")
                if (user == null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    GBTextField(value = password, onValueChange = { password = it }, label = "Contraseña Initial *")
                }
            }
        },
        confirmButton = {
            GBPrimaryButton(
                text = "Guardar",
                onClick = {
                    if (firstName.isNotBlank() && lastName.isNotBlank() && email.isNotBlank()) {
                        onSave(CreateUserRequest(email, firstName, lastName, password.ifEmpty { null }))
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
