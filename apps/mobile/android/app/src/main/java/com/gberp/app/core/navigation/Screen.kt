package com.gberp.app.core.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object ForgotPassword : Screen("forgot_password")
    object Dashboard : Screen("dashboard")
    object Products : Screen("products")
    object Customers : Screen("customers")
    object CustomerDetail : Screen("customer-detail/{customerId}") {
        fun createRoute(customerId: String): String = "customer-detail/$customerId"
    }
    object Sales : Screen("sales")
    object SaleDetail : Screen("sale-detail/{saleId}") {
        fun createRoute(saleId: String): String = "sale-detail/$saleId"
    }
    object ProductDetail : Screen("product-detail/{productId}") {
        fun createRoute(productId: String): String = "product-detail/$productId"
    }
    object Companies : Screen("companies")
    object Branches : Screen("branches")
    object Users : Screen("users")
    object Roles : Screen("roles")
    object Settings : Screen("settings")
    object Audit : Screen("audit")
    object Profile : Screen("profile")
}
