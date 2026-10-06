package com.gberp.app.feature.customerssales.ui

import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import com.gberp.app.BuildConfig
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.customerssales.model.CustomerDto
import com.gberp.app.feature.customerssales.model.SaleDto
import kotlinx.coroutines.delay
import java.io.File

@Composable
fun CustomersScreen(
    viewModel: CustomerSalesViewModel,
    onCustomerClick: (String) -> Unit,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var search by remember { mutableStateOf("") }
    LaunchedEffect(search) {
        delay(300)
        viewModel.loadCustomers(search)
    }
    Scaffold(topBar = { GBTopBar(title = "Clientes", onBackClick = onBackClick) }) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Buscar clientes") },
                singleLine = true
            )
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            when {
                state.isLoading -> CircularProgressIndicator()
                state.customers.isEmpty() -> Text("No hay clientes para mostrar.")
                else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.customers, key = { it.key }) { customer ->
                        Card(modifier = Modifier.fillMaxWidth().clickable { onCustomerClick(customer.key) }) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(customer.displayName, fontWeight = FontWeight.SemiBold)
                                Text(listOf(customer.email, customer.phone).filter(String::isNotBlank).joinToString(" · "))
                                if (customer.taxId.isNotBlank()) Text("RFC / ID fiscal: ${customer.taxId}")
                            }
                        }
                    }
                    if (state.customersHasMore) {
                        item {
                            OutlinedButton(
                                onClick = viewModel::loadMoreCustomers,
                                enabled = !state.isLoadingMore,
                                modifier = Modifier.fillMaxWidth()
                            ) { Text(if (state.isLoadingMore) "Cargando…" else "Cargar más") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CustomerDetailScreen(
    customerId: String,
    viewModel: CustomerSalesViewModel,
    onSaleClick: (String) -> Unit,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    LaunchedEffect(customerId) {
        viewModel.loadCustomer(customerId)
        viewModel.loadPurchases(customerId)
    }
    Scaffold(topBar = { GBTopBar(title = "Detalle del cliente", onBackClick = onBackClick) }) { padding ->
        when {
            state.isLoading && state.customer == null -> CircularProgressIndicator(Modifier.padding(padding).padding(24.dp))
            state.customer == null -> Column(Modifier.padding(padding).padding(20.dp)) {
                Text(state.error ?: "No se encontró el cliente.")
                TextButton(onClick = onBackClick) { Text("Volver") }
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    CustomerSummary(state.customer!!)
                    state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
                    Button(
                        onClick = { viewModel.downloadCustomerPdf(customerId) { sharePdf(context, it) } },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("Descargar historial de compras PDF") }
                    Text("Historial de compras", style = MaterialTheme.typography.titleLarge)
                }
                if (state.purchases.isEmpty()) {
                    item { Text("No hay compras registradas para este cliente.") }
                } else {
                    items(state.purchases, key = { it.key }) { sale ->
                        SaleSummaryCard(sale = sale) { onSaleClick(sale.key) }
                    }
                }
            }
        }
    }
}

@Composable
fun SalesScreen(
    viewModel: CustomerSalesViewModel,
    onSaleClick: (String) -> Unit,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    var search by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    LaunchedEffect(search, status) {
        delay(300)
        viewModel.loadSales(search, status.ifBlank { null })
    }
    Scaffold(topBar = { GBTopBar(title = "Ventas", onBackClick = onBackClick) }) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Buscar ventas") },
                singleLine = true
            )
            OutlinedTextField(
                value = status,
                onValueChange = { status = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Estado (opcional)") },
                singleLine = true
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { viewModel.downloadSalesReport { sharePdf(context, it) } },
                    modifier = Modifier.weight(1f)
                ) { Text("Reporte PDF") }
                OutlinedButton(
                    onClick = { viewModel.loadSales(search, status.ifBlank { null }) },
                    modifier = Modifier.weight(1f)
                ) { Text("Actualizar") }
            }
            state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            when {
                state.isLoading -> CircularProgressIndicator()
                state.sales.isEmpty() -> Text("No hay ventas para mostrar.")
                else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.sales, key = { it.key }) { sale ->
                        SaleSummaryCard(sale = sale) { onSaleClick(sale.key) }
                    }
                    if (state.salesHasMore) {
                        item {
                            OutlinedButton(
                                onClick = viewModel::loadMoreSales,
                                enabled = !state.isLoadingMore,
                                modifier = Modifier.fillMaxWidth()
                            ) { Text(if (state.isLoadingMore) "Cargando…" else "Cargar más") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SaleDetailScreen(
    saleId: String,
    viewModel: CustomerSalesViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    LaunchedEffect(saleId) { viewModel.loadSale(saleId) }
    Scaffold(topBar = { GBTopBar(title = "Detalle de venta", onBackClick = onBackClick) }) { padding ->
        when {
            state.isLoading && state.sale == null -> CircularProgressIndicator(Modifier.padding(padding).padding(24.dp))
            state.sale == null -> Column(Modifier.padding(padding).padding(20.dp)) {
                Text(state.error ?: "No se encontró la venta.")
                TextButton(onClick = onBackClick) { Text("Volver") }
            }
            else -> Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                SaleSummaryCard(sale = state.sale!!, onClick = {})
                state.sale?.let { sale ->
                    if (sale.displayCustomer.isNotBlank()) Text("Cliente: ${sale.displayCustomer}")
                    sale.subtotal?.let { Text("Subtotal: ${"%.2f".format(it)}") }
                    sale.tax?.let { Text("Impuestos: ${"%.2f".format(it)}") }
                    sale.total?.let { Text("Total: ${"%.2f".format(it)}", fontWeight = FontWeight.SemiBold) }
                    if (sale.paymentMethod.isNotBlank()) Text("Método de pago: ${sale.paymentMethod}")
                    if (sale.status.isNotBlank()) Text("Estado: ${sale.status}")
                    if (sale.paymentStatus.isNotBlank()) Text("Pago: ${sale.paymentStatus}")
                }
                state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
                Button(
                    onClick = { viewModel.downloadSalePdf(saleId) { sharePdf(context, it) } },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Descargar venta PDF") }
            }
        }
    }
}

@Composable
private fun CustomerSummary(customer: CustomerDto) {
    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(customer.displayName, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        if (customer.email.isNotBlank()) Text(customer.email)
        if (customer.phone.isNotBlank()) Text(customer.phone)
        if (customer.taxId.isNotBlank()) Text("RFC / ID fiscal: ${customer.taxId}")
        if (customer.address.isNotBlank()) Text(customer.address)
        if (customer.status.isNotBlank()) Text("Estado: ${customer.status}")
    }
}

@Composable
private fun SaleSummaryCard(sale: SaleDto, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Venta ${sale.displayNumber}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            if (sale.displayCustomer.isNotBlank()) Text("Cliente: ${sale.displayCustomer}")
            if (sale.displayDate.isNotBlank()) Text("Fecha: ${sale.displayDate.take(10)}")
            sale.total?.let { Text("Total: ${"%.2f".format(it)}") }
            val states = listOf(sale.status, sale.paymentStatus).filter(String::isNotBlank)
            if (states.isNotEmpty()) Text(states.joinToString(" · "))
        }
    }
}

private fun sharePdf(context: Context, file: File) {
    runCatching {
        val uri = FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.fileprovider", file)
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(shareIntent, "Compartir PDF"))
    }.onFailure {
        Toast.makeText(context, "PDF descargado, pero no se pudo abrir para compartir.", Toast.LENGTH_LONG).show()
    }
}
