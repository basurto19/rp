package com.gberp.app.feature.branches.ui

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
import com.gberp.app.feature.branches.model.BranchDto
import com.gberp.app.feature.branches.model.CreateBranchRequest

@Composable
fun BranchListScreen(
    viewModel: BranchViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showDialog by remember { mutableStateOf(false) }
    var selectedBranch by remember { mutableStateOf<BranchDto?>(null) }
    var branchToDelete by remember { mutableStateOf<BranchDto?>(null) }

    LaunchedEffect(state.operationSuccess) {
        state.operationSuccess?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearOperationSuccess()
        }
    }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Gestión de Sucursales",
                onBackClick = onBackClick
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    selectedBranch = null
                    showDialog = true
                },
                containerColor = GBNavyPrimary,
                contentColor = Color.White
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Nueva Sucursal")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            state.isLoading && state.branches.isEmpty() -> {
                GBLoadingView(modifier = Modifier.padding(padding))
            }
            state.error != null && state.branches.isEmpty() -> {
                GBErrorView(
                    message = state.error!!,
                    onRetry = { viewModel.loadBranches() },
                    modifier = Modifier.padding(padding)
                )
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    if (state.branches.isEmpty()) {
                        GBEmptyView(
                            title = "No hay sucursales registradas",
                            subtitle = "Agrega tu primera sucursal con el botón +",
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            items(state.branches) { branch ->
                                GBCard(modifier = Modifier.padding(bottom = 8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = branch.name,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = GBNavyPrimary
                                            )
                                            if (branch.code.isNotEmpty()) {
                                                Text(
                                                    text = "Código: ${branch.code}",
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = GBTextSecondaryLight
                                                )
                                            }
                                            if (branch.address.isNotEmpty()) {
                                                Text(
                                                    text = branch.address,
                                                    style = MaterialTheme.typography.labelMedium,
                                                    color = GBTextSecondaryLight
                                                )
                                            }
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            GBStatusBadge(
                                                text = if (branch.isMain) "MATRIZ" else branch.status,
                                                status = if (branch.status == "active") BadgeStatus.ACTIVE else BadgeStatus.INACTIVE
                                            )

                                            IconButton(onClick = {
                                                selectedBranch = branch
                                                showDialog = true
                                            }) {
                                                Icon(
                                                    imageVector = Icons.Default.Edit,
                                                    contentDescription = "Editar",
                                                    tint = GBNavyPrimary
                                                )
                                            }

                                            IconButton(onClick = { branchToDelete = branch }) {
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
                        onPageChange = { viewModel.loadBranches(it) }
                    )
                }
            }
        }
    }

    if (showDialog) {
        BranchFormDialog(
            branch = selectedBranch,
            onDismiss = { showDialog = false },
            onSave = { req ->
                if (selectedBranch == null) {
                    viewModel.createBranch(req)
                } else {
                    viewModel.updateBranch(selectedBranch!!.id, req)
                }
                showDialog = false
            }
        )
    }

    if (branchToDelete != null) {
        AlertDialog(
            onDismissRequest = { branchToDelete = null },
            title = { Text("Confirmar Eliminación") },
            text = { Text("¿Deseas eliminar la sucursal ${branchToDelete?.name}?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteBranch(branchToDelete!!.id)
                    branchToDelete = null
                }) {
                    Text("Eliminar", color = GBError)
                }
            },
            dismissButton = {
                TextButton(onClick = { branchToDelete = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun BranchFormDialog(
    branch: BranchDto?,
    onDismiss: () -> Unit,
    onSave: (CreateBranchRequest) -> Unit
) {
    var name by remember { mutableStateOf(branch?.name ?: "") }
    var code by remember { mutableStateOf(branch?.code ?: "") }
    var address by remember { mutableStateOf(branch?.address ?: "") }
    var phone by remember { mutableStateOf(branch?.phone ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (branch == null) "Nueva Sucursal" else "Editar Sucursal") },
        text = {
            Column {
                GBTextField(value = name, onValueChange = { name = it }, label = "Nombre Sucursal *")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = code, onValueChange = { code = it }, label = "Código Sucursal")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = address, onValueChange = { address = it }, label = "Dirección")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = phone, onValueChange = { phone = it }, label = "Teléfono")
            }
        },
        confirmButton = {
            GBPrimaryButton(
                text = "Guardar",
                onClick = {
                    if (name.isNotBlank()) {
                        onSave(CreateBranchRequest(name, code, address, phone))
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
