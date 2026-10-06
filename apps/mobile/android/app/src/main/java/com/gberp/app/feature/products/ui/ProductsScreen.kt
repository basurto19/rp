package com.gberp.app.feature.products.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.products.model.ProductDto
import com.gberp.app.feature.products.model.ProductRequest

@Composable
fun ProductsScreen(
    viewModel: ProductViewModel,
    onProductClick: (String) -> Unit,
    onProfileClick: () -> Unit,
    onCustomersClick: () -> Unit,
    onSalesClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var search by remember { mutableStateOf("") }
    var isCreateOpen by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { viewModel.loadProducts() }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Productos",
                subtitle = "Catálogo e inventario",
                onProfileClick = onProfileClick
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = search,
                onValueChange = {
                    search = it
                    viewModel.loadProducts(it)
                },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Buscar por nombre, SKU o categoría") },
                singleLine = true
            )
            Button(onClick = { isCreateOpen = true }, modifier = Modifier.fillMaxWidth()) {
                Text("Nuevo producto")
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onCustomersClick, modifier = Modifier.weight(1f)) { Text("Clientes") }
                Button(onClick = onSalesClick, modifier = Modifier.weight(1f)) { Text("Ventas") }
            }
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            when {
                state.isLoading -> CircularProgressIndicator()
                state.products.isEmpty() -> Text("No hay productos para mostrar.")
                else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(state.products, key = { it.id }) { product ->
                        ProductCard(product = product, onClick = { onProductClick(product.id) })
                    }
                }
            }
        }
    }

    if (isCreateOpen) {
        ProductEditorDialog(
            product = null,
            saving = state.isSaving,
            error = state.error,
            onDismiss = { isCreateOpen = false },
            onSave = { request ->
                viewModel.createProduct(request) {
                    isCreateOpen = false
                    viewModel.loadProducts(search)
                }
            }
        )
    }
}

@Composable
private fun ProductCard(product: ProductDto, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(product.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(if (product.status == "active") "Activo" else "Inactivo")
            }
            Text("SKU: ${product.sku} · ${product.category.ifBlank { "Sin categoría" }}")
            Text("Stock: ${product.stock} ${product.unit} · Mínimo: ${product.minimumStock}")
            Text("Venta: ${"%.2f".format(product.salePrice)}")
        }
    }
}

@Composable
fun ProductEditorDialog(
    product: ProductDto?,
    saving: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onSave: (ProductRequest) -> Unit
) {
    var name by remember(product?.id) { mutableStateOf(product?.name.orEmpty()) }
    var sku by remember(product?.id) { mutableStateOf(product?.sku.orEmpty()) }
    var description by remember(product?.id) { mutableStateOf(product?.description.orEmpty()) }
    var category by remember(product?.id) { mutableStateOf(product?.category.orEmpty()) }
    var costPrice by remember(product?.id) { mutableStateOf(product?.costPrice?.toString() ?: "0") }
    var salePrice by remember(product?.id) { mutableStateOf(product?.salePrice?.toString() ?: "0") }
    var stock by remember(product?.id) { mutableStateOf(product?.stock?.toString() ?: "0") }
    var minimumStock by remember(product?.id) { mutableStateOf(product?.minimumStock?.toString() ?: "0") }
    var unit by remember(product?.id) { mutableStateOf(product?.unit ?: "unidad") }
    var validationError by remember(product?.id) { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (product == null) "Nuevo producto" else "Editar producto") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().heightIn(max = 520.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(name, { name = it }, label = { Text("Nombre") }, singleLine = true)
                OutlinedTextField(sku, { sku = it }, label = { Text("SKU / Código") }, singleLine = true)
                OutlinedTextField(category, { category = it }, label = { Text("Categoría") }, singleLine = true)
                OutlinedTextField(description, { description = it }, label = { Text("Descripción") })
                OutlinedTextField(costPrice, { costPrice = it }, label = { Text("Precio de costo") }, singleLine = true)
                OutlinedTextField(salePrice, { salePrice = it }, label = { Text("Precio de venta") }, singleLine = true)
                if (product == null) {
                    OutlinedTextField(stock, { stock = it }, label = { Text("Stock inicial") }, singleLine = true)
                }
                OutlinedTextField(minimumStock, { minimumStock = it }, label = { Text("Stock mínimo") }, singleLine = true)
                OutlinedTextField(unit, { unit = it }, label = { Text("Unidad") }, singleLine = true)
                (validationError ?: error)?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            Button(
                enabled = !saving,
                onClick = {
                    val cost = costPrice.toDoubleOrNull()
                    val sale = salePrice.toDoubleOrNull()
                    val initialStock = stock.toDoubleOrNull()
                    val minimum = minimumStock.toDoubleOrNull()
                    validationError = when {
                        name.isBlank() || sku.isBlank() -> "Nombre y SKU son obligatorios."
                        cost == null || sale == null || minimum == null ||
                            (product == null && initialStock == null) -> "Ingresa importes y existencias válidos."
                        cost < 0 || sale < 0 || minimum < 0 || (initialStock ?: 0.0) < 0 ->
                            "Los importes y existencias no pueden ser negativos."
                        unit.isBlank() -> "La unidad es obligatoria."
                        else -> null
                    }
                    if (validationError == null) {
                        onSave(
                            ProductRequest(
                                name = name.trim(),
                                description = description.trim(),
                                sku = sku.trim(),
                                category = category.trim(),
                                costPrice = cost!!,
                                salePrice = sale!!,
                                stock = if (product == null) initialStock!! else product.stock,
                                minimumStock = minimum!!,
                                unit = unit.trim(),
                                status = product?.status ?: "active"
                            )
                        )
                    }
                }
            ) {
                if (saving) CircularProgressIndicator() else Text("Guardar")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
