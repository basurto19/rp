package com.gberp.app.core.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SecureSessionManager @Inject constructor(
    @ApplicationContext context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "gb_erp_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_TENANT_ID = "tenant_id"
        private const val KEY_BRANCH_ID = "branch_id"
        private const val KEY_ROLE_ID = "role_id"
    }

    fun saveSession(
        accessToken: String,
        refreshToken: String,
        userId: String,
        email: String,
        userName: String,
        tenantId: String,
        branchId: String? = null,
        roleId: String? = null
    ) {
        sharedPreferences.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USER_EMAIL, email)
            .putString(KEY_USER_NAME, userName)
            .putString(KEY_TENANT_ID, tenantId)
            .putString(KEY_BRANCH_ID, branchId)
            .putString(KEY_ROLE_ID, roleId)
            .apply()
    }

    fun updateAccessToken(accessToken: String) {
        sharedPreferences.edit().putString(KEY_ACCESS_TOKEN, accessToken).apply()
    }

    fun updateBranchId(branchId: String) {
        sharedPreferences.edit().putString(KEY_BRANCH_ID, branchId).apply()
    }

    fun getAccessToken(): String? = sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    fun getRefreshToken(): String? = sharedPreferences.getString(KEY_REFRESH_TOKEN, null)
    fun getUserId(): String? = sharedPreferences.getString(KEY_USER_ID, null)
    fun getUserEmail(): String? = sharedPreferences.getString(KEY_USER_EMAIL, null)
    fun getUserName(): String? = sharedPreferences.getString(KEY_USER_NAME, null)
    fun getTenantId(): String? = sharedPreferences.getString(KEY_TENANT_ID, null)
    fun getBranchId(): String? = sharedPreferences.getString(KEY_BRANCH_ID, null)
    fun getRoleId(): String? = sharedPreferences.getString(KEY_ROLE_ID, null)

    fun isLoggedIn(): Boolean = !getAccessToken().isNullOrEmpty()

    fun clearSession() {
        sharedPreferences.edit().clear().apply()
    }
}
