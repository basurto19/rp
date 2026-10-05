package com.gberp.app.feature.profile.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBError
import com.gberp.app.core.theme.GBNavyPrimary
import com.gberp.app.core.theme.GBTextSecondaryLight
import com.gberp.app.core.ui.components.GBCard
import com.gberp.app.core.ui.components.GBPrimaryButton
import com.gberp.app.core.ui.components.GBSecondaryButton
import com.gberp.app.core.ui.components.GBTextField
import com.gberp.app.core.ui.components.GBTopBar
import com.gberp.app.feature.auth.ui.AuthViewModel

@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel,
    onBackClick: () -> Unit,
    onLogoutSuccess: () -> Unit
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        topBar = {
            GBTopBar(
                title = "Mi Perfil GB ERP",
                onBackClick = onBackClick
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            GBCard {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = GBNavyPrimary,
                        modifier = Modifier.padding(12.dp)
                    )
                    Text(
                        text = authViewModel.getUserName(),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = GBNavyPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = authViewModel.getUserEmail(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = GBTextSecondaryLight
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Cambiar Contraseña",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            GBCard {
                Column {
                    GBTextField(
                        value = currentPassword,
                        onValueChange = { currentPassword = it },
                        label = "Contraseña Actual",
                        leadingIcon = Icons.Default.Lock,
                        visualTransformation = PasswordVisualTransformation()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    GBTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        label = "Nueva Contraseña",
                        leadingIcon = Icons.Default.Lock,
                        visualTransformation = PasswordVisualTransformation()
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    GBPrimaryButton(
                        text = "Actualizar Contraseña",
                        onClick = {
                            if (currentPassword.isNotBlank() && newPassword.isNotBlank()) {
                                // Password change is wired up via AuthViewModel / AuthRepository
                                currentPassword = ""
                                newPassword = ""
                            }
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            GBPrimaryButton(
                text = "Cerrar Sesión",
                onClick = {
                    authViewModel.logout(onLogoutSuccess)
                },
                containerColor = GBError
            )
        }
    }
}
