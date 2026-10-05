package com.gberp.app

import com.gberp.app.core.network.ApiResponse
import com.gberp.app.core.network.ApiService
import com.gberp.app.core.network.NetworkResult
import com.gberp.app.feature.companies.data.CompanyRepository
import com.gberp.app.feature.companies.model.CompanyDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.Response

class CompanyRepositoryTest {

    private val apiService: ApiService = mockk()
    private val repository = CompanyRepository(apiService)

    @Test
    fun `getCompanies returns Success when API responds with data`() = runTest {
        val mockCompanies = listOf(CompanyDto(id = "comp1", name = "Empresa GB 1"))
        val mockApiResponse = ApiResponse(success = true, data = mockCompanies)

        coEvery { apiService.getCompanies(1, 20) } returns Response.success(mockApiResponse)

        val result = repository.getCompanies(1, 20)

        assertTrue(result is NetworkResult.Success)
        val success = result as NetworkResult.Success
        assertEquals(1, success.data.size)
        assertEquals("Empresa GB 1", success.data.first().name)
    }
}
