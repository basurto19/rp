package com.gberp.app.core.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object ForgotPassword : Screen("forgot_password")
    object Dashboard : Screen("dashboard")
    object Companies : Screen("companies")
    object Branches : Screen("branches")
    object Users : Screen("users")
    object Roles : Screen("roles")
    object Settings : Screen("settings")
    object Audit : Screen("audit")
    object Profile : Screen("profile")
}
