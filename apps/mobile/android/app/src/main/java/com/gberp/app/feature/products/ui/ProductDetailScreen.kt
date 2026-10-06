package com.gberp.app.feature.products.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.products.model.InventoryMovementRequest

@Composable
fun ProductDetailScreen(
    productId: String,
    viewModel: ProductViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var isEditOpen by remember { mutableStateOf(false) }
    var movementType by remember { mutableStateOf("entry") }
    var isMovementOpen by remember { mutableStateOf(false) }

    LaunchedEffect(productId) {
        viewModel.loadProduct(productId)
        viewModel.loadMovements(productId)
    }

    val product = state.product
    Scaffold(
        topBar = {
            GBTopBar(
                title = "Detalle del producto",
                onBackClick = onBackClick
            )
        }
    ) { padding ->
        when {
            state.isLoading && product == null -> CircularProgressIndicator(
                modifier = Modifier.padding(padding).padding(24.dp)
            )
            product == null -> Column(modifier = Modifier.padding(padding).padding(20.dp)) {
                Text(state.error ?: "No se encontró el producto.")
                TextButton(onClick = onBackClick) { Text("Volver") }
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Text(product.name, style = androidx.compose.material3.MaterialTheme.typography.headlineSmall)
                    Text("SKU: ${product.sku}")
                    Text("Categoría: ${product.category.ifBlank { "Sin categoría" }}")
                    Text(product.description.ifBlank { "Sin descripción" })
                    Text("Precio de costo: ${"%.2f".format(product.costPrice)}")
                    Text("Precio de venta: ${"%.2f".format(product.salePrice)}")
                    Text("Stock actual: ${product.stock} ${product.unit}")
                    Text("Stock mínimo: ${product.minimumStock} ${product.unit}")
                    Text("Estado: ${if (product.status == "active") "Activo" else "Inactivo"}")
                    state.error?.let { Text(it, color = androidx.compose.material3.MaterialTheme.colorScheme.error) }
                    state.message?.let { Text(it, color = androidx.compose.material3.MaterialTheme.colorScheme.primary) }
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(onClick = { isEditOpen = true }) { Text("Editar") }
                        OutlinedButton(
                            onClick = {
                                viewModel.setProductStatus(
                                    product.id,
                                    if (product.status == "active") "inactive" else "active"
                                ) { viewModel.loadMovements(product.id) }
                            },
                            enabled = !state.isSaving
                        ) {
                            Text(if (product.status == "active") "Desactivar" else "Activar")
                        }
                    }
                    Text("Inventario", style = androidx.compose.material3.MaterialTheme.typography.titleLarge)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = {
                            movementType = "entry"
                            isMovementOpen = true
                        }, enabled = product.status == "active") { Text("Entrada") }
                        OutlinedButton(onClick = {
                            movementType = "exit"
                            isMovementOpen = true
                        }, enabled = product.status == "active") { Text("Salida") }
                    }
                    Text("Movimientos recientes", style = androidx.compose.material3.MaterialTheme.typography.titleMedium)
                }
                if (state.movements.isEmpty()) {
                    item { Text("Sin movimientos registrados.") }
                } else {
                    items(state.movements, key = { it.id }) { movement ->
                        Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                            Text(
                                "${if (movement.type == "entry") "Entrada" else "Salida"}: ${movement.quantity} · ${movement.stockBefore} → ${movement.stockAfter}"
                            )
                            Text(movement.notes.ifBlank { "Sin nota" })
                        }
                    }
                }
            }
        }
    }

    if (isEditOpen && product != null) {
        ProductEditorDialog(
            product = product,
            saving = state.isSaving,
            error = state.error,
            onDismiss = { isEditOpen = false },
            onSave = { request ->
                viewModel.updateProduct(product.id, request) {
                    isEditOpen = false
                    viewModel.loadProduct(product.id)
                }
            }
        )
    }

    if (isMovementOpen && product != null) {
        InventoryMovementDialog(
            type = movementType,
            saving = state.isSaving,
            error = state.error,
            onDismiss = { isMovementOpen = false },
            onSubmit = { quantity, notes ->
                viewModel.recordMovement(
                    product.id,
                    InventoryMovementRequest(movementType, quantity, notes)
                ) {
                    isMovementOpen = false
                    viewModel.loadMovements(product.id)
                }
            }
        )
    }
}

@Composable
private fun InventoryMovementDialog(
    type: String,
    saving: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onSubmit: (Double, String) -> Unit
) {
    var quantity by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var validationError by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (type == "entry") "Entrada de inventario" else "Salida de inventario") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(quantity, { quantity = it }, label = { Text("Cantidad") }, singleLine = true)
                OutlinedTextField(notes, { notes = it }, label = { Text("Nota") }, singleLine = true)
                (validationError ?: error)?.let {
                    Text(it, color = androidx.compose.material3.MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            Button(enabled = !saving, onClick = {
                val parsed = quantity.toDoubleOrNull()
                validationError = if (parsed == null || !parsed.isFinite() || parsed <= 0) {
                    "Ingresa una cantidad mayor que cero."
                } else if (notes.length > 500) {
                    "La nota no puede superar 500 caracteres."
                } else null
                if (validationError == null) onSubmit(parsed!!, notes.trim())
            }) {
                if (saving) CircularProgressIndicator() else Text("Registrar")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
