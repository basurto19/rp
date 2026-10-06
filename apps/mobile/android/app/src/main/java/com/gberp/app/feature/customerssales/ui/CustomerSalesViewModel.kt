package com.gberp.app.feature.customerssales.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.core.network.PaginationDto
import com.gberp.app.feature.customerssales.data.CustomerSalesRepository
import com.gberp.app.feature.customerssales.model.CustomerDto
import com.gberp.app.feature.customerssales.model.SaleDto
import dagger.hilt.android.lifecycle.HiltViewModel
import java.io.File
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CustomerSalesUiState(
    val customers: List<CustomerDto> = emptyList(),
    val customer: CustomerDto? = null,
    val purchases: List<SaleDto> = emptyList(),
    val sales: List<SaleDto> = emptyList(),
    val sale: SaleDto? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val customerPage: Int = 1,
    val salesPage: Int = 1,
    val customersHasMore: Boolean = false,
    val salesHasMore: Boolean = false,
    val customerPagination: PaginationDto? = null,
    val salesPagination: PaginationDto? = null
)

@HiltViewModel
class CustomerSalesViewModel @Inject constructor(
    private val repository: CustomerSalesRepository
) : ViewModel() {
    private val _state = MutableStateFlow(CustomerSalesUiState())
    val state: StateFlow<CustomerSalesUiState> = _state.asStateFlow()

    private var customerSearch = ""
    private var salesSearch = ""
    private var saleStatus: String? = null

    fun loadCustomers(search: String = "", page: Int = 1) {
        customerSearch = search
        viewModelScope.launch {
            _state.value = _state.value.copy(
                isLoading = page == 1,
                isLoadingMore = page > 1,
                error = null
            )
            when (val result = repository.customers(page, PAGE_SIZE, search)) {
                is NetworkResult.Success -> {
                    val pagination = result.pagination
                    val merged = if (page == 1) result.data else _state.value.customers + result.data
                    _state.value = _state.value.copy(
                        customers = merged,
                        customerPage = page,
                        customerPagination = pagination,
                        customersHasMore = pagination?.hasMore ?: result.data.size >= PAGE_SIZE,
                        isLoading = false,
                        isLoadingMore = false
                    )
                }
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isLoading = false, isLoadingMore = false, error = result.message)
                else -> _state.value = _state.value.copy(isLoading = false, isLoadingMore = false)
            }
        }
    }

    fun loadMoreCustomers() {
        if (!_state.value.isLoadingMore && _state.value.customersHasMore) {
            loadCustomers(customerSearch, _state.value.customerPage + 1)
        }
    }

    fun loadCustomer(id: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(customer = null, purchases = emptyList(), isLoading = true, error = null)
            when (val result = repository.customer(id)) {
                is NetworkResult.Success -> _state.value = _state.value.copy(customer = result.data, isLoading = false)
                is NetworkResult.Error -> _state.value = _state.value.copy(isLoading = false, error = result.message)
                else -> _state.value = _state.value.copy(isLoading = false)
            }
        }
    }

    fun loadPurchases(id: String) {
        viewModelScope.launch {
            when (val result = repository.purchases(id, 1, HISTORY_LIMIT)) {
                is NetworkResult.Success -> _state.value = _state.value.copy(purchases = result.data)
                is NetworkResult.Error -> _state.value = _state.value.copy(error = result.message)
                else -> Unit
            }
        }
    }

    fun loadSales(
        search: String = salesSearch,
        status: String? = saleStatus,
        page: Int = 1
    ) {
        salesSearch = search
        saleStatus = status
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = page == 1, isLoadingMore = page > 1, error = null)
            when (val result = repository.sales(page, PAGE_SIZE, search, status, null, null, null, null)) {
                is NetworkResult.Success -> {
                    val pagination = result.pagination
                    _state.value = _state.value.copy(
                        sales = if (page == 1) result.data else _state.value.sales + result.data,
                        salesPage = page,
                        salesPagination = pagination,
                        salesHasMore = pagination?.hasMore ?: result.data.size >= PAGE_SIZE,
                        isLoading = false,
                        isLoadingMore = false
                    )
                }
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isLoading = false, isLoadingMore = false, error = result.message)
                else -> _state.value = _state.value.copy(isLoading = false, isLoadingMore = false)
            }
        }
    }

    fun loadMoreSales() {
        if (!_state.value.isLoadingMore && _state.value.salesHasMore) {
            loadSales(salesSearch, saleStatus, _state.value.salesPage + 1)
        }
    }

    fun loadSale(id: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(sale = null, isLoading = true, error = null)
            when (val result = repository.sale(id)) {
                is NetworkResult.Success -> _state.value = _state.value.copy(sale = result.data, isLoading = false)
                is NetworkResult.Error -> _state.value = _state.value.copy(isLoading = false, error = result.message)
                else -> _state.value = _state.value.copy(isLoading = false)
            }
        }
    }

    fun downloadCustomerPdf(id: String, onReady: (File) -> Unit) {
        download({ repository.downloadCustomerPurchases(id) }, onReady)
    }

    fun downloadSalePdf(id: String, onReady: (File) -> Unit) {
        download({ repository.downloadSale(id) }, onReady)
    }

    fun downloadSalesReport(onReady: (File) -> Unit) {
        download({
            repository.downloadSalesReport(saleStatus, null, null, null, null)
        }, onReady)
    }

    private fun download(request: suspend () -> Result<File>, onReady: (File) -> Unit) {
        viewModelScope.launch {
            _state.value = _state.value.copy(message = "Descargando PDF…", error = null)
            val result = request()
            result.onSuccess { file ->
                _state.value = _state.value.copy(message = "PDF descargado.")
                onReady(file)
            }.onFailure { failure ->
                _state.value = _state.value.copy(error = failure.message ?: "No se pudo descargar el PDF.", message = null)
            }
        }
    }

    companion object {
        private const val PAGE_SIZE = 20
        private const val HISTORY_LIMIT = 50
    }
}
