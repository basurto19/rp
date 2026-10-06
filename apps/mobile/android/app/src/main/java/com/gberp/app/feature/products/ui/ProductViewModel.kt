package com.gberp.app.feature.products.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.products.data.ProductRepository
import com.gberp.app.feature.products.model.InventoryMovementDto
import com.gberp.app.feature.products.model.InventoryMovementRequest
import com.gberp.app.feature.products.model.ProductDto
import com.gberp.app.feature.products.model.ProductRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProductUiState(
    val products: List<ProductDto> = emptyList(),
    val product: ProductDto? = null,
    val movements: List<InventoryMovementDto> = emptyList(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

@HiltViewModel
class ProductViewModel @Inject constructor(
    private val repository: ProductRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ProductUiState())
    val state: StateFlow<ProductUiState> = _state.asStateFlow()

    fun loadProducts(search: String = "") {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.list(search)) {
                is NetworkResult.Success -> _state.value =
                    _state.value.copy(products = result.data, isLoading = false)
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isLoading = false, error = result.message)
                else -> _state.value = _state.value.copy(isLoading = false)
            }
        }
    }

    fun loadProduct(id: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.get(id)) {
                is NetworkResult.Success -> _state.value =
                    _state.value.copy(product = result.data, isLoading = false)
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isLoading = false, error = result.message)
                else -> _state.value = _state.value.copy(isLoading = false)
            }
        }
    }

    fun loadMovements(productId: String) {
        viewModelScope.launch {
            when (val result = repository.movements(productId)) {
                is NetworkResult.Success -> _state.value = _state.value.copy(movements = result.data)
                is NetworkResult.Error -> _state.value = _state.value.copy(error = result.message)
                else -> Unit
            }
        }
    }

    fun createProduct(request: ProductRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSaving = true, error = null, message = null)
            when (val result = repository.create(request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isSaving = false, message = "Producto creado.")
                    onSuccess()
                }
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isSaving = false, error = result.message)
                else -> _state.value = _state.value.copy(isSaving = false)
            }
        }
    }

    fun updateProduct(id: String, request: ProductRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSaving = true, error = null, message = null)
            when (val result = repository.update(id, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isSaving = false, product = result.data, message = "Producto actualizado.")
                    onSuccess()
                }
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isSaving = false, error = result.message)
                else -> _state.value = _state.value.copy(isSaving = false)
            }
        }
    }

    fun setProductStatus(id: String, status: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSaving = true, error = null)
            when (val result = repository.setStatus(id, status)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isSaving = false, product = result.data)
                    onSuccess()
                }
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isSaving = false, error = result.message)
                else -> _state.value = _state.value.copy(isSaving = false)
            }
        }
    }

    fun recordMovement(
        id: String,
        request: InventoryMovementRequest,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isSaving = true, error = null, message = null)
            when (val result = repository.recordMovement(id, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isSaving = false,
                        product = result.data.product,
                        message = "Movimiento registrado."
                    )
                    onSuccess()
                }
                is NetworkResult.Error -> _state.value =
                    _state.value.copy(isSaving = false, error = result.message)
                else -> _state.value = _state.value.copy(isSaving = false)
            }
        }
    }
}
