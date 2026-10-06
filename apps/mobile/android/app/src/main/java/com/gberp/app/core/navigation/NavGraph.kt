package com.gberp.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.gberp.app.feature.audit.ui.AuditListScreen
import com.gberp.app.feature.audit.ui.AuditViewModel
import com.gberp.app.feature.auth.ui.AuthViewModel
import com.gberp.app.feature.auth.ui.ForgotPasswordScreen
import com.gberp.app.feature.auth.ui.LoginScreen
import com.gberp.app.feature.branches.ui.BranchListScreen
import com.gberp.app.feature.branches.ui.BranchViewModel
import com.gberp.app.feature.companies.ui.CompanyListScreen
import com.gberp.app.feature.companies.ui.CompanyViewModel
import com.gberp.app.feature.customerssales.ui.CustomerDetailScreen
import com.gberp.app.feature.customerssales.ui.CustomerSalesViewModel
import com.gberp.app.feature.customerssales.ui.CustomersScreen
import com.gberp.app.feature.customerssales.ui.SaleDetailScreen
import com.gberp.app.feature.customerssales.ui.SalesScreen
import com.gberp.app.feature.dashboard.ui.DashboardScreen
import com.gberp.app.feature.dashboard.ui.DashboardViewModel
import com.gberp.app.feature.profile.ui.ProfileScreen
import com.gberp.app.feature.products.ui.ProductDetailScreen
import com.gberp.app.feature.products.ui.ProductViewModel
import com.gberp.app.feature.products.ui.ProductsScreen
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
    val startDestination = if (authViewModel.isLoggedIn()) Screen.Products.route else Screen.Login.route

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Products.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onForgotPasswordClick = {
                    navController.navigate(Screen.ForgotPassword.route)
                }
            )
        }

        composable(Screen.Products.route) {
            val productViewModel: ProductViewModel = hiltViewModel()
            ProductsScreen(
                viewModel = productViewModel,
                onProductClick = { productId ->
                    navController.navigate(Screen.ProductDetail.createRoute(productId))
                },
                onProfileClick = { navController.navigate(Screen.Profile.route) },
                onCustomersClick = { navController.navigate(Screen.Customers.route) },
                onSalesClick = { navController.navigate(Screen.Sales.route) }
            )
        }

        composable(Screen.Customers.route) {
            val viewModel: CustomerSalesViewModel = hiltViewModel()
            CustomersScreen(
                viewModel = viewModel,
                onCustomerClick = { navController.navigate(Screen.CustomerDetail.createRoute(it)) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.CustomerDetail.route,
            arguments = listOf(navArgument("customerId") { type = NavType.StringType })
        ) { backStackEntry ->
            val viewModel: CustomerSalesViewModel = hiltViewModel()
            CustomerDetailScreen(
                customerId = backStackEntry.arguments?.getString("customerId").orEmpty(),
                viewModel = viewModel,
                onSaleClick = { navController.navigate(Screen.SaleDetail.createRoute(it)) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Sales.route) {
            val viewModel: CustomerSalesViewModel = hiltViewModel()
            SalesScreen(
                viewModel = viewModel,
                onSaleClick = { navController.navigate(Screen.SaleDetail.createRoute(it)) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.SaleDetail.route,
            arguments = listOf(navArgument("saleId") { type = NavType.StringType })
        ) { backStackEntry ->
            val viewModel: CustomerSalesViewModel = hiltViewModel()
            SaleDetailScreen(
                saleId = backStackEntry.arguments?.getString("saleId").orEmpty(),
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.ProductDetail.route,
            arguments = listOf(navArgument("productId") { type = NavType.StringType })
        ) { backStackEntry ->
            val productViewModel: ProductViewModel = hiltViewModel()
            ProductDetailScreen(
                productId = backStackEntry.arguments?.getString("productId").orEmpty(),
                viewModel = productViewModel,
                onBackClick = { navController.popBackStack() }
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
