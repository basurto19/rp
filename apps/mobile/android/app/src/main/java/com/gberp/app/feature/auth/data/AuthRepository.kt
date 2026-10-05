package com.gberp.app.feature.auth.data

import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.core.security.SecureSessionManager
import com.gberp.app.feature.auth.model.ChangePasswordRequest
import com.gberp.app.feature.auth.model.ForgotPasswordRequest
import com.gberp.app.feature.auth.model.LoginRequest
import com.gberp.app.feature.auth.model.LoginResponseData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val sessionManager: SecureSessionManager
) {

    suspend fun login(email: String, password: String): NetworkResult<LoginResponseData> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && body.success && body.data != null) {
                    val data = body.data
                    sessionManager.saveSession(
                        accessToken = data.accessToken,
                        refreshToken = data.refreshToken,
                        userId = data.user.id,
                        email = data.user.email,
                        userName = "${data.user.firstName} ${data.user.lastName}".trim(),
                        tenantId = data.user.tenantId,
                        branchId = data.user.branchId,
                        roleId = data.user.roleId
                    )
                    NetworkResult.Success(data, body.message)
                } else {
                    NetworkResult.Error(
                        code = body?.error?.code ?: "LOGIN_FAILED",
                        message = body?.error?.message ?: "Error al iniciar sesión"
                    )
                }
            } else {
                NetworkResult.Error(
                    code = "HTTP_${response.code()}",
                    message = "Error en el servidor (${response.code()})"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error(
                code = "NETWORK_ERROR",
                message = e.localizedMessage ?: "Error de conexión con el servidor"
            )
        }
    }

    suspend fun logout(): NetworkResult<Boolean> {
        return try {
            val refreshToken = sessionManager.getRefreshToken() ?: ""
            apiService.logout(mapOf("refreshToken" to refreshToken))
            sessionManager.clearSession()
            NetworkResult.Success(true, "Sesión cerrada correctamente")
        } catch (e: Exception) {
            sessionManager.clearSession()
            NetworkResult.Success(true)
        }
    }

    suspend fun forgotPassword(email: String): NetworkResult<String> {
        return try {
            val response = apiService.forgotPassword(ForgotPasswordRequest(email))
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(
                    data = response.body()?.message ?: "Instrucciones enviadas",
                    message = response.body()?.message
                )
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "FORGOT_PASSWORD_FAILED",
                    message = response.body()?.error?.message ?: "No se pudo procesar la solicitud"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    suspend fun changePassword(current: String, newPass: String): NetworkResult<String> {
        return try {
            val response = apiService.changePassword(ChangePasswordRequest(current, newPass))
            if (response.isSuccessful && response.body()?.success == true) {
                NetworkResult.Success(
                    data = response.body()?.message ?: "Contraseña actualizada exitosamente",
                    message = response.body()?.message
                )
            } else {
                NetworkResult.Error(
                    code = response.body()?.error?.code ?: "CHANGE_PASSWORD_FAILED",
                    message = response.body()?.error?.message ?: "No se pudo cambiar la contraseña"
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error("NETWORK_ERROR", e.localizedMessage ?: "Error de red")
        }
    }

    fun isLoggedIn(): Boolean = sessionManager.isLoggedIn()
    fun getUserName(): String = sessionManager.getUserName() ?: "Usuario"
    fun getUserEmail(): String = sessionManager.getUserEmail() ?: ""
    fun getTenantId(): String = sessionManager.getTenantId() ?: ""
    fun getBranchId(): String? = sessionManager.getBranchId()
}
