package com.gberp.app.core.network

import com.gberp.app.feature.audit.model.AuditLogDto
import com.gberp.app.feature.auth.model.ChangePasswordRequest
import com.gberp.app.feature.auth.model.ForgotPasswordRequest
import com.gberp.app.feature.auth.model.LoginRequest
import com.gberp.app.feature.auth.model.LoginResponseData
import com.gberp.app.feature.branches.model.BranchDto
import com.gberp.app.feature.branches.model.CreateBranchRequest
import com.gberp.app.feature.companies.model.CompanyDto
import com.gberp.app.feature.companies.model.CreateCompanyRequest
import com.gberp.app.feature.roles.model.CreateRoleRequest
import com.gberp.app.feature.roles.model.RoleDto
import com.gberp.app.feature.settings.model.SettingDto
import com.gberp.app.feature.users.model.CreateUserRequest
import com.gberp.app.feature.users.model.UserDto
import com.gberp.app.feature.products.model.InventoryMovementDto
import com.gberp.app.feature.products.model.InventoryMovementResult
import com.gberp.app.feature.products.model.InventoryMovementRequest
import com.gberp.app.feature.products.model.ProductDto
import com.gberp.app.feature.products.model.ProductRequest
import kotlinx.serialization.json.JsonElement
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Streaming

interface ApiService {

    // --- AUTH ---
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginResponseData>>

    @POST("auth/refresh")
    fun refreshTokenCall(@Body body: Map<String, String>): Call<ApiResponse<Map<String, String>>>

    @POST("auth/logout")
    suspend fun logout(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Boolean>>>

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<ApiResponse<Map<String, String>>>

    @PUT("auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<ApiResponse<Map<String, String>>>

    // --- PRODUCTS & INVENTORY ---
    @GET("products")
    suspend fun getProducts(@Query("search") search: String? = null): Response<ApiResponse<List<ProductDto>>>

    @GET("products/{id}")
    suspend fun getProduct(@Path("id") id: String): Response<ApiResponse<ProductDto>>

    @POST("products")
    suspend fun createProduct(@Body request: ProductRequest): Response<ApiResponse<ProductDto>>

    @PUT("products/{id}")
    suspend fun updateProduct(@Path("id") id: String, @Body request: ProductRequest): Response<ApiResponse<ProductDto>>

    @PATCH("products/{id}/status")
    suspend fun updateProductStatus(
        @Path("id") id: String,
        @Body body: Map<String, String>
    ): Response<ApiResponse<ProductDto>>

    @GET("products/{id}/inventory")
    suspend fun getInventoryMovements(@Path("id") id: String): Response<ApiResponse<List<InventoryMovementDto>>>

    @POST("products/{id}/inventory")
    suspend fun createInventoryMovement(
        @Path("id") id: String,
        @Body request: InventoryMovementRequest
    ): Response<ApiResponse<InventoryMovementResult>>

    // --- CUSTOMERS & SALES ---
    @GET("customers")
    suspend fun getCustomers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null
    ): Response<ApiResponse<JsonElement>>

    @GET("customers/{id}")
    suspend fun getCustomer(@Path("id") id: String): Response<ApiResponse<JsonElement>>

    @GET("customers/{id}/purchases")
    suspend fun getCustomerPurchases(
        @Path("id") id: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<JsonElement>>

    @GET("sales")
    suspend fun getSales(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null,
        @Query("paymentStatus") paymentStatus: String? = null,
        @Query("customerId") customerId: String? = null,
        @Query("from") from: String? = null,
        @Query("to") to: String? = null
    ): Response<ApiResponse<JsonElement>>

    @GET("sales/{id}")
    suspend fun getSale(@Path("id") id: String): Response<ApiResponse<JsonElement>>

    @Streaming
    @GET("reports/customers/{customerId}/purchases.pdf")
    suspend fun customerPurchasesPdf(@Path("customerId") customerId: String): Response<ResponseBody>

    @Streaming
    @GET("reports/sales/{saleId}.pdf")
    suspend fun salePdf(@Path("saleId") saleId: String): Response<ResponseBody>

    @Streaming
    @GET("reports/sales.pdf")
    suspend fun salesReportPdf(
        @Query("status") status: String? = null,
        @Query("paymentStatus") paymentStatus: String? = null,
        @Query("customerId") customerId: String? = null,
        @Query("from") from: String? = null,
        @Query("to") to: String? = null
    ): Response<ResponseBody>

    // --- USERS ---
    @GET("users")
    suspend fun getUsers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<UserDto>>>

    @POST("users")
    suspend fun createUser(@Body request: CreateUserRequest): Response<ApiResponse<UserDto>>

    @GET("users/{id}")
    suspend fun getUserById(@Path("id") id: String): Response<ApiResponse<UserDto>>

    @PUT("users/{id}")
    suspend fun updateUser(@Path("id") id: String, @Body request: CreateUserRequest): Response<ApiResponse<UserDto>>

    @DELETE("users/{id}")
    suspend fun deleteUser(@Path("id") id: String): Response<ApiResponse<Map<String, Boolean>>>

    // --- COMPANIES ---
    @GET("companies")
    suspend fun getCompanies(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<CompanyDto>>>

    @POST("companies")
    suspend fun createCompany(@Body request: CreateCompanyRequest): Response<ApiResponse<CompanyDto>>

    @GET("companies/{id}")
    suspend fun getCompanyById(@Path("id") id: String): Response<ApiResponse<CompanyDto>>

    @PUT("companies/{id}")
    suspend fun updateCompany(@Path("id") id: String, @Body request: CreateCompanyRequest): Response<ApiResponse<CompanyDto>>

    @DELETE("companies/{id}")
    suspend fun deleteCompany(@Path("id") id: String): Response<ApiResponse<Map<String, Boolean>>>

    // --- BRANCHES ---
    @GET("branches")
    suspend fun getBranches(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<BranchDto>>>

    @POST("branches")
    suspend fun createBranch(@Body request: CreateBranchRequest): Response<ApiResponse<BranchDto>>

    @GET("branches/{id}")
    suspend fun getBranchById(@Path("id") id: String): Response<ApiResponse<BranchDto>>

    @PUT("branches/{id}")
    suspend fun updateBranch(@Path("id") id: String, @Body request: CreateBranchRequest): Response<ApiResponse<BranchDto>>

    @DELETE("branches/{id}")
    suspend fun deleteBranch(@Path("id") id: String): Response<ApiResponse<Map<String, Boolean>>>

    // --- ROLES ---
    @GET("roles")
    suspend fun getRoles(): Response<ApiResponse<List<RoleDto>>>

    @POST("roles")
    suspend fun createRole(@Body request: CreateRoleRequest): Response<ApiResponse<RoleDto>>

    @GET("roles/{id}")
    suspend fun getRoleById(@Path("id") id: String): Response<ApiResponse<RoleDto>>

    @PUT("roles/{id}")
    suspend fun updateRole(@Path("id") id: String, @Body request: CreateRoleRequest): Response<ApiResponse<RoleDto>>

    @DELETE("roles/{id}")
    suspend fun deleteRole(@Path("id") id: String): Response<ApiResponse<Map<String, Boolean>>>

    // --- SETTINGS ---
    @GET("settings")
    suspend fun getSettings(): Response<ApiResponse<List<SettingDto>>>

    @GET("settings/{key}")
    suspend fun getSettingByKey(@Path("key") key: String): Response<ApiResponse<SettingDto>>

    @PUT("settings")
    suspend fun updateSetting(@Body request: Map<String, String>): Response<ApiResponse<SettingDto>>

    // --- AUDIT ---
    @GET("audit")
    suspend fun getAuditLogs(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<AuditLogDto>>>

    @GET("audit/module/{module}")
    suspend fun getAuditLogsByModule(
        @Path("module") module: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<AuditLogDto>>>

    // --- HEALTH ---
    @GET("health")
    suspend fun getHealth(): Response<ApiResponse<Map<String, String>>>
}
