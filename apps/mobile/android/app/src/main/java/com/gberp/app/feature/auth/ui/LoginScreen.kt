package com.gberp.app.feature.auth.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gberp.app.core.theme.GBERPTheme
import com.gberp.app.core.theme.GBNavyDark
import com.gberp.app.core.theme.GBNavyPrimary
import com.gberp.app.core.theme.GBTealAccent
import com.gberp.app.core.ui.components.GBPrimaryButton
import com.gberp.app.core.ui.components.GBTextField

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: () -> Unit,
    onForgotPasswordClick: () -> Unit
) {
    val loginState by viewModel.loginState.collectAsState()
    LoginContent(
        loginState = loginState,
        onLogin = { email, pass -> viewModel.login(email, pass) },
        onLoginSuccess = {
            viewModel.resetState()
            onLoginSuccess()
        },
        onForgotPasswordClick = onForgotPasswordClick
    )
}

@Composable
fun LoginContent(
    loginState: AuthUiState,
    onLogin: (String, String) -> Unit,
    onLoginSuccess: () -> Unit,
    onForgotPasswordClick: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(loginState) {
        when (loginState) {
            is AuthUiState.Success -> {
                onLoginSuccess()
            }
            is AuthUiState.Error -> {
                snackbarHostState.showSnackbar((loginState as AuthUiState.Error).message)
            }
            else -> {}
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(GBNavyPrimary)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "GB ERP",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            )
            Text(
                text = "Sistema ERP Modular Empresarial",
                style = MaterialTheme.typography.bodyMedium.copy(color = GBTealAccent),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.large,
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Iniciar Sesión",
                        style = MaterialTheme.typography.titleLarge,
                        color = GBNavyDark
                    )
                    Spacer(modifier = Modifier.height(20.dp))

                    GBTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = "Correo Electrónico",
                        placeholder = "ejemplo@gberp.com",
                        leadingIcon = Icons.Default.Email
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    GBTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = "Contraseña",
                        leadingIcon = Icons.Default.Lock,
                        trailingIcon = if (isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                        onTrailingIconClick = { isPasswordVisible = !isPasswordVisible },
                        visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                        TextButton(onClick = onForgotPasswordClick) {
                            Text(
                                text = "¿Olvidaste tu contraseña?",
                                style = MaterialTheme.typography.labelMedium,
                                color = GBNavyPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    GBPrimaryButton(
                        text = "Ingresar",
                        onClick = { onLogin(email, password) },
                        isLoading = loginState is AuthUiState.Loading
                    )
                }
            }
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
        )
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun LoginScreenPreview() {
    GBERPTheme {
        LoginContent(
            loginState = AuthUiState.Idle,
            onLogin = { _, _ -> },
            onLoginSuccess = {},
            onForgotPasswordClick = {}
        )
    }
}
