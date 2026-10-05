package com.gberp.app.core.network

import com.gberp.app.core.security.SecureSessionManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val sessionManager: SecureSessionManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val requestBuilder = originalRequest.newBuilder()

        sessionManager.getAccessToken()?.let { token ->
            requestBuilder.header("Authorization", "Bearer $token")
        }

        sessionManager.getTenantId()?.let { tenantId ->
            requestBuilder.header("x-tenant-id", tenantId)
        }

        sessionManager.getBranchId()?.let { branchId ->
            requestBuilder.header("x-branch-id", branchId)
        }

        return chain.proceed(requestBuilder.build())
    }
}
