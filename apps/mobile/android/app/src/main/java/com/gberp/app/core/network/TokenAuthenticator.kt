package com.gberp.app.core.network

import com.gberp.app.core.security.SecureSessionManager
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import javax.inject.Inject
import javax.inject.Provider

class TokenAuthenticator @Inject constructor(
    private val sessionManager: SecureSessionManager,
    private val apiServiceProvider: Provider<ApiService>
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.code != 401) return null

        // Prevent infinite loop if refresh fails repeatedly
        if (response.request.url.encodedPath.contains("/auth/refresh") ||
            response.request.url.encodedPath.contains("/auth/login")
        ) {
            sessionManager.clearSession()
            return null
        }

        val refreshToken = sessionManager.getRefreshToken() ?: run {
            sessionManager.clearSession()
            return null
        }

        return synchronized(this) {
            val currentAccessToken = sessionManager.getAccessToken()
            val requestToken = response.request.header("Authorization")?.replace("Bearer ", "")

            // If token was already updated by another thread, retry request with new token
            if (currentAccessToken != null && currentAccessToken != requestToken) {
                return@synchronized response.request.newBuilder()
                    .header("Authorization", "Bearer $currentAccessToken")
                    .build()
            }

            try {
                val refreshResponse = runBlocking {
                    apiServiceProvider.get().refreshTokenCall(
                        mapOf("refreshToken" to refreshToken)
                    ).execute()
                }

                if (refreshResponse.isSuccessful && refreshResponse.body()?.success == true) {
                    val newAccessToken = refreshResponse.body()?.data?.get("accessToken")
                    if (newAccessToken != null) {
                        sessionManager.updateAccessToken(newAccessToken)
                        return@synchronized response.request.newBuilder()
                            .header("Authorization", "Bearer $newAccessToken")
                            .build()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            sessionManager.clearSession()
            null
        }
    }
}
