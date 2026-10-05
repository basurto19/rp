package com.gberp.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.gberp.app.feature.audit.ui.AuditListScreen
import com.gberp.app.feature.audit.ui.AuditViewModel
import com.gberp.app.feature.auth.ui.AuthViewModel
import com.gberp.app.feature.auth.ui.ForgotPasswordScreen
import com.gberp.app.feature.auth.ui.LoginScreen
import com.gberp.app.feature.branches.ui.BranchListScreen
import com.gberp.app.feature.branches.ui.BranchViewModel
import com.gberp.app.feature.companies.ui.CompanyListScreen
import com.gberp.app.feature.companies.ui.CompanyViewModel
import com.gberp.app.feature.dashboard.ui.DashboardScreen
import com.gberp.app.feature.dashboard.ui.DashboardViewModel
import com.gberp.app.feature.profile.ui.ProfileScreen
import com.gberp.app.feature.roles.ui.RoleListScreen
import com.gberp.app.feature.roles.ui.RoleViewModel
import com.gberp.app.feature.settings.ui.SettingScreen
import com.gberp.app.feature.settings.ui.SettingViewModel
import com.gberp.app.feature.users.ui.UserListScreen
import com.gberp.app.feature.users.ui.UserViewModel

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val startDestination = if (authViewModel.isLoggedIn()) Screen.Dashboard.route else Screen.Login.route

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onForgotPasswordClick = {
                    navController.navigate(Screen.ForgotPassword.route)
                }
            )
        }

        composable(Screen.ForgotPassword.route) {
            ForgotPasswordScreen(
                viewModel = authViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Dashboard.route) {
            val dashboardViewModel: DashboardViewModel = hiltViewModel()
            DashboardScreen(
                viewModel = dashboardViewModel,
                authViewModel = authViewModel,
                onNavigateToCompanies = { navController.navigate(Screen.Companies.route) },
                onNavigateToBranches = { navController.navigate(Screen.Branches.route) },
                onNavigateToUsers = { navController.navigate(Screen.Users.route) },
                onNavigateToAudit = { navController.navigate(Screen.Audit.route) },
                onNavigateToProfile = { navController.navigate(Screen.Profile.route) }
            )
        }

        composable(Screen.Companies.route) {
            val companyViewModel: CompanyViewModel = hiltViewModel()
            CompanyListScreen(
                viewModel = companyViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Branches.route) {
            val branchViewModel: BranchViewModel = hiltViewModel()
            BranchListScreen(
                viewModel = branchViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Users.route) {
            val userViewModel: UserViewModel = hiltViewModel()
            UserListScreen(
                viewModel = userViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Roles.route) {
            val roleViewModel: RoleViewModel = hiltViewModel()
            RoleListScreen(
                viewModel = roleViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Settings.route) {
            val settingViewModel: SettingViewModel = hiltViewModel()
            SettingScreen(
                viewModel = settingViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Audit.route) {
            val auditViewModel: AuditViewModel = hiltViewModel()
            AuditListScreen(
                viewModel = auditViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                authViewModel = authViewModel,
                onBackClick = { navController.popBackStack() },
                onLogoutSuccess = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
