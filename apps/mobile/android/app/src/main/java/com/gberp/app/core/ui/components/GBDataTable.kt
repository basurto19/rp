package com.gberp.app.core.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ChevronLeft
import androidx.compose.material.icons.automirrored.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBTextSecondaryLight

@Composable
fun GBPaginationControl(
    currentPage: Int,
    totalPages: Int,
    totalRecords: Int,
    onPageChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Total: $totalRecords registros",
            style = MaterialTheme.typography.bodyMedium,
            color = GBTextSecondaryLight
        )

        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                onClick = { if (currentPage > 1) onPageChange(currentPage - 1) },
                enabled = currentPage > 1
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ChevronLeft,
                    contentDescription = "Página anterior"
                )
            }

            Text(
                text = "Pág $currentPage / ${if (totalPages == 0) 1 else totalPages}",
                style = MaterialTheme.typography.labelMedium
            )

            IconButton(
                onClick = { if (currentPage < totalPages) onPageChange(currentPage + 1) },
                enabled = currentPage < totalPages
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ChevronRight,
                    contentDescription = "Página siguiente"
                )
            }
        }
    }
}
