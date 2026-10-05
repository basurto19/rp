package com.gberp.app

import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.auth.data.AuthRepository
import com.gberp.app.feature.auth.ui.AuthUiState
import com.gberp.app.feature.auth.ui.AuthViewModel
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val authRepository: AuthRepository = mockk(relaxed = true)
    private lateinit var viewModel: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = AuthViewModel(authRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `login with empty credentials sets Error state`() {
        viewModel.login("", "")

        val state = viewModel.loginState.value
        assertTrue(state is AuthUiState.Error)
        assertEquals("Por favor ingrese correo y contraseña", (state as AuthUiState.Error).message)
    }

    @Test
    fun `login with valid credentials invokes repository and returns Success`() = runTest {
        coEvery { authRepository.login("test@gberp.com", "password123") } returns NetworkResult.Success(mockk(relaxed = true))

        viewModel.login("test@gberp.com", "password123")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.loginState.value
        assertTrue(state is AuthUiState.Success)
    }
}
