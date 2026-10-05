package com.gberp.app.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.gberp.app.core.theme.GBError
import com.gberp.app.core.theme.GBErrorContainer
import com.gberp.app.core.theme.GBInfo
import com.gberp.app.core.theme.GBInfoContainer
import com.gberp.app.core.theme.GBSuccess
import com.gberp.app.core.theme.GBSuccessContainer
import com.gberp.app.core.theme.GBWarning
import com.gberp.app.core.theme.GBWarningContainer

enum class BadgeStatus {
    ACTIVE,
    INACTIVE,
    PENDING,
    ERROR,
    INFO
}

@Composable
fun GBStatusBadge(
    text: String,
    status: BadgeStatus,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, textColor) = when (status) {
        BadgeStatus.ACTIVE -> GBSuccessContainer to GBSuccess
        BadgeStatus.INACTIVE -> GBErrorContainer to GBError
        BadgeStatus.PENDING -> GBWarningContainer to GBWarning
        BadgeStatus.ERROR -> GBErrorContainer to GBError
        BadgeStatus.INFO -> GBInfoContainer to GBInfo
    }

    Box(
        modifier = modifier
            .background(color = backgroundColor, shape = RoundedCornerShape(12.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text.uppercase(),
            color = textColor,
            style = MaterialTheme.typography.labelMedium
        )
    }
}
