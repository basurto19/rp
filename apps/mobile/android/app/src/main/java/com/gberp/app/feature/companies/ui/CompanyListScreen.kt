package com.gberp.app.feature.companies.ui

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
import com.gberp.app.feature.companies.model.CompanyDto
import com.gberp.app.feature.companies.model.CreateCompanyRequest

@Composable
fun CompanyListScreen(
    viewModel: CompanyViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showDialog by remember { mutableStateOf(false) }
    var selectedCompany by remember { mutableStateOf<CompanyDto?>(null) }
    var companyToDelete by remember { mutableStateOf<CompanyDto?>(null) }

    LaunchedEffect(state.operationSuccess) {
        state.operationSuccess?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearOperationSuccess()
        }
    }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Gestión de Empresas",
                onBackClick = onBackClick
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    selectedCompany = null
                    showDialog = true
                },
                containerColor = GBNavyPrimary,
                contentColor = Color.White
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Nueva Empresa")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            state.isLoading && state.companies.isEmpty() -> {
                GBLoadingView(modifier = Modifier.padding(padding))
            }
            state.error != null && state.companies.isEmpty() -> {
                GBErrorView(
                    message = state.error!!,
                    onRetry = { viewModel.loadCompanies() },
                    modifier = Modifier.padding(padding)
                )
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    if (state.companies.isEmpty()) {
                        GBEmptyView(
                            title = "No hay empresas registradas",
                            subtitle = "Agrega tu primera empresa con el botón +",
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            items(state.companies) { company ->
                                GBCard(modifier = Modifier.padding(bottom = 8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = company.name,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = GBNavyPrimary
                                            )
                                            if (company.taxId.isNotEmpty()) {
                                                Text(
                                                    text = "RUC / RFC: ${company.taxId}",
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = GBTextSecondaryLight
                                                )
                                            }
                                            if (company.email.isNotEmpty()) {
                                                Text(
                                                    text = company.email,
                                                    style = MaterialTheme.typography.labelMedium,
                                                    color = GBTextSecondaryLight
                                                )
                                            }
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            GBStatusBadge(
                                                text = company.status,
                                                status = if (company.status == "active") BadgeStatus.ACTIVE else BadgeStatus.INACTIVE
                                            )

                                            IconButton(onClick = {
                                                selectedCompany = company
                                                showDialog = true
                                            }) {
                                                Icon(
                                                    imageVector = Icons.Default.Edit,
                                                    contentDescription = "Editar",
                                                    tint = GBNavyPrimary
                                                )
                                            }

                                            IconButton(onClick = { companyToDelete = company }) {
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
                        onPageChange = { viewModel.loadCompanies(it) }
                    )
                }
            }
        }
    }

    if (showDialog) {
        CompanyFormDialog(
            company = selectedCompany,
            onDismiss = { showDialog = false },
            onSave = { req ->
                if (selectedCompany == null) {
                    viewModel.createCompany(req)
                } else {
                    viewModel.updateCompany(selectedCompany!!.id, req)
                }
                showDialog = false
            }
        )
    }

    if (companyToDelete != null) {
        AlertDialog(
            onDismissRequest = { companyToDelete = null },
            title = { Text("Confirmar Eliminación") },
            text = { Text("¿Deseas eliminar la empresa ${companyToDelete?.name}?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteCompany(companyToDelete!!.id)
                    companyToDelete = null
                }) {
                    Text("Eliminar", color = GBError)
                }
            },
            dismissButton = {
                TextButton(onClick = { companyToDelete = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun CompanyFormDialog(
    company: CompanyDto?,
    onDismiss: () -> Unit,
    onSave: (CreateCompanyRequest) -> Unit
) {
    var name by remember { mutableStateOf(company?.name ?: "") }
    var taxId by remember { mutableStateOf(company?.taxId ?: "") }
    var legalName by remember { mutableStateOf(company?.legalName ?: "") }
    var address by remember { mutableStateOf(company?.address ?: "") }
    var phone by remember { mutableStateOf(company?.phone ?: "") }
    var email by remember { mutableStateOf(company?.email ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (company == null) "Nueva Empresa" else "Editar Empresa") },
        text = {
            Column {
                GBTextField(value = name, onValueChange = { name = it }, label = "Nombre Empresa *")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = taxId, onValueChange = { taxId = it }, label = "RUC / Tax ID")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = legalName, onValueChange = { legalName = it }, label = "Razón Social")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = email, onValueChange = { email = it }, label = "Correo Electrónico")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = phone, onValueChange = { phone = it }, label = "Teléfono")
                Spacer(modifier = Modifier.height(8.dp))
                GBTextField(value = address, onValueChange = { address = it }, label = "Dirección")
            }
        },
        confirmButton = {
            GBPrimaryButton(
                text = "Guardar",
                onClick = {
                    if (name.isNotBlank()) {
                        onSave(CreateCompanyRequest(name, taxId, legalName, address, phone, email))
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
