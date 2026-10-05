package com.gberp.app.core.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = GBNavyPrimary,
    onPrimary = ColorWhite,
    primaryContainer = GBNavyLight,
    secondary = GBTealAccent,
    onSecondary = ColorWhite,
    background = GBBackgroundLight,
    surface = GBCardSurfaceLight,
    onBackground = GBTextPrimaryLight,
    onSurface = GBTextPrimaryLight,
    error = GBError,
    onError = ColorWhite,
    errorContainer = GBErrorContainer
)

private val DarkColorScheme = darkColorScheme(
    primary = GBTealAccent,
    onPrimary = GBNavyDark,
    primaryContainer = GBNavyPrimary,
    secondary = GBTealAccent,
    onSecondary = GBNavyDark,
    background = GBBackgroundDark,
    surface = GBCardSurfaceDark,
    onBackground = GBTextPrimaryDark,
    onSurface = GBTextPrimaryDark,
    error = GBError,
    onError = ColorWhite,
    errorContainer = GBErrorContainer
)

private val ColorWhite = androidx.compose.ui.graphics.Color.White

@Composable
fun GBERPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = GBNavyPrimary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = GBTypography,
        shapes = GBShapes,
        content = content
    )
}
