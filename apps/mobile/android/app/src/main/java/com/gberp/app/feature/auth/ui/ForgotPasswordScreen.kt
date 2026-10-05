package com.gberp.app.feature.auth.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBTextSecondaryLight
import com.gberp.app.core.ui.components.GBPrimaryButton
import com.gberp.app.core.ui.components.GBTextField
import com.gberp.app.core.ui.components.GBTopBar

@Composable
fun ForgotPasswordScreen(
    viewModel: AuthViewModel,
    onBackClick: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    val forgotState by viewModel.forgotPasswordState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(forgotState) {
        when (forgotState) {
            is AuthUiState.Success -> {
                snackbarHostState.showSnackbar((forgotState as AuthUiState.Success).message)
            }
            is AuthUiState.Error -> {
                snackbarHostState.showSnackbar((forgotState as AuthUiState.Error).message)
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Recuperar Contraseña",
                onBackClick = onBackClick
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            Text(
                text = "Ingresa tu correo registrado para recibir las instrucciones de recuperación.",
                style = MaterialTheme.typography.bodyMedium,
                color = GBTextSecondaryLight
            )

            Spacer(modifier = Modifier.height(24.dp))

            GBTextField(
                value = email,
                onValueChange = { email = it },
                label = "Correo Electrónico",
                placeholder = "ejemplo@gberp.com",
                leadingIcon = Icons.Default.Email
            )

            Spacer(modifier = Modifier.height(24.dp))

            GBPrimaryButton(
                text = "Enviar Instrucciones",
                onClick = { viewModel.forgotPassword(email) },
                isLoading = forgotState is AuthUiState.Loading
            )
        }
    }
}
