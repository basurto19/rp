package com.gberp.app

import com.gberp.app.core.network.NetworkResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkResultTest {

    @Test
    fun `NetworkResult Success contains correct data and pagination`() {
        val data = listOf("Company 1", "Company 2")
        val result = NetworkResult.Success(data = data, message = "Success Message")

        assertTrue(result is NetworkResult.Success)
        assertEquals("Success Message", (result as NetworkResult.Success).message)
        assertEquals(2, result.data.size)
    }

    @Test
    fun `NetworkResult Error holds code and error message`() {
        val result = NetworkResult.Error(code = "INVALID_CREDENTIALS", message = "Credenciales inválidas", statusCode = 401)

        assertTrue(result is NetworkResult.Error)
        val error = result as NetworkResult.Error
        assertEquals("INVALID_CREDENTIALS", error.code)
        assertEquals("Credenciales inválidas", error.message)
        assertEquals(401, error.statusCode)
    }
}
