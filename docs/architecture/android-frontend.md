# Guía de Arquitectura y Desarrollo: Aplicación Android GB ERP

**Versión:** 1.0.0  
**Proyecto:** GB ERP — Aplicación Android Nativa  
**Ubicación en Repositorio:** `apps/mobile/android`  
**Simulador Interactivo:** [mobile-simulator.html](../ui-ux/mobile-simulator.html)  
**Stack Tecnológico:** Kotlin 2.0+ | Jetpack Compose (Material Design 3) | Hilt | Retrofit | OkHttp | Coroutines StateFlow  

---

## 📱 1. Simulador Móvil Interactivo

Para visualizar de manera rápida la interfaz y la navegación fluida de la aplicación en una pantalla móvil, puedes abrir el simulador en cualquier navegador:

👉 **[Abrir Simulador Móvil GB ERP](../ui-ux/mobile-simulator.html)**

El simulador cuenta con:
- Frame interactivo de teléfono inteligente con barra de estado y notch.
- Conmutador de pantallas para navegar por **Login, Dashboard, Empresas, Usuarios, Auditoría y Perfil**.
- Fiel reflejo del sistema de diseño **GB ERP** con los colores de marca oficial (`#022656` Azul Marino y `#0090A0` Turquesa).

---

## 2. Visión General de la Aplicación Móvil Nativa

La aplicación Android nativa de **GB ERP** ha sido construida para brindar a los usuarios una experiencia móvil moderna, segura, de alto rendimiento y alineada con la identidad visual oficial de la marca. Consume los servicios REST existentes del backend en Node.js/Express (`apps/api`) garantizando consistencia total de reglas de negocio, permisos RBAC y aislamiento multi-tenant.

---

## 3. Requisitos de Entorno y Configuración para Android Studio

Para abrir, compilar y ejecutar la aplicación de forma reproducible en Android Studio:

### 3.1 Requisitos de Software
- **Android Studio:** Ladybug (2024.2.1+) o posterior.
- **JDK:** Java Development Kit 17 o JDK 21 (configurado en *Settings > Build, Execution, Deployment > Build Tools > Gradle*).
- **Android SDK:**
  - **Compile SDK:** 35 (Android 15)
  - **Target SDK:** 35 (Android 15)
  - **Min SDK:** 26 (Android 8.0 Oreo)
- **Gradle:** 8.10 (gestionado mediante `gradle/wrapper/gradle-wrapper.properties`).
- **Kotlin:** 2.0.20+ con Compose Compiler Plugin habilitado.

### 3.2 Pasos para Abrir el Proyecto
1. Abre **Android Studio**.
2. Selecciona **Open** y navega a la carpeta: `apps/mobile/android`.
3. Deja que Android Studio sincronice el proyecto con Gradle (*Sync Project with Gradle Files*).
4. Ejecuta la aplicación en tu emulador o dispositivo Android conectado.

---

## 4. Configuración de API Base URL y Entorno de Red

La aplicación se comunica con el backend `apps/api` (`http://localhost:3000/api/v1`).

### 4.1 Desarrollo en Emulador Android
En el emulador estándar de Android Studio, la dirección `localhost` de la máquina anfitriona se mapea a la IP especial `10.0.2.2`.
- **Base URL por defecto en Debug:** `http://10.0.2.2:3000/api/v1/`

### 4.2 Desarrollo en Dispositivo Físico
Para probar en un teléfono móvil físico conectado a la misma red Wi-Fi:
1. Identifica la IP local de tu equipo (ej. `192.168.1.50`).
2. Edita la propiedad en `apps/mobile/android/gradle.properties`:
   ```properties
   DEFAULT_API_BASE_URL="http://192.168.1.50:3000/api/v1/"
   ```

---

## 5. Estructura de Arquitectura por Capas (Clean Architecture)

El código fuente está localizado en `apps/mobile/android/app/src/main/java/com/gberp/app/` y organizado por módulos y capas:

```
com.gberp.app/
├── GBERPApplication.kt               # Clase Application anotada con @HiltAndroidApp
├── MainActivity.kt                   # Activity principal con Compose Theme
├── di/                               # Módulos de Inyección de Dependencias Hilt (AppModule)
├── core/
│   ├── theme/                        # GB Theme, Tokens de Color (#022656, #0090A0), Typography, Shapes
│   ├── ui/components/                # Suite de Componentes M3 (GBButton, GBTextField, GBCard, GBTopBar, GBDataTable, GBStateViews)
│   ├── network/                      # Retrofit, ApiService, AuthInterceptor, TokenAuthenticator, NetworkResult
│   ├── security/                     # SecureSessionManager (EncryptedSharedPreferences con Android KeyStore)
│   └── navigation/                   # Navigation Compose, Screen enum, NavGraph
└── feature/
    ├── auth/                         # Login, ForgotPassword (Model, Data, UI ViewModel/Screen)
    ├── dashboard/                    # Dashboard con KPIs reales y feed de auditoría
    ├── companies/                    # CRUD de Empresas (Companies)
    ├── branches/                     # CRUD de Sucursales (Branches)
    ├── users/                        # CRUD de Usuarios
    ├── roles/                        # CRUD de Roles y RBAC
    ├── settings/                     # Configuración de Tenant
    ├── audit/                        # Logs de Auditoría
    └── profile/                      # Perfil de usuario y cambio de contraseña
```

---

## 6. Módulos Conectados a la API Real

Actualmente la aplicación Android consume y opera **100% en tiempo real** contra la API existente:

| Módulo | Endpoint Conectado | Estado en Android |
| :--- | :--- | :--- |
| **Autenticación** | `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password`, `PUT /auth/change-password` | **Completo & Seguro** |
| **Refresco de Tokens** | `POST /auth/refresh` | **Automático vía OkHttp Authenticator** |
| **Empresas** | `GET, POST, PUT, DELETE /companies` | **CRUD Completo con Paginación** |
| **Sucursales** | `GET, POST, PUT, DELETE /branches` | **CRUD Completo con Paginación** |
| **Usuarios** | `GET, POST, PUT, DELETE /users` | **CRUD Completo con Búsqueda y Paginación** |
| **Roles / RBAC** | `GET, POST, PUT, DELETE /roles` | **CRUD Completo** |
| **Configuración** | `GET, PUT /settings` | **Visualización y Edición por Key** |
| **Auditoría** | `GET /audit`, `GET /audit/module/:module` | **Visualización y Filtro de Logs** |
| **Dashboard Móvil** | Métricas consolidadas de entidades reales | **KPIs Reales y Feed Reciente** |

---

## 7. Seguridad y Almacenamiento Cifrado

1. **Tokens JWT:** Se almacenan de forma segura usando `EncryptedSharedPreferences` cifrado con AES-256 a través del Android KeyStore en `SecureSessionManager`.
2. **Sin Credenciales en Código:** No existen contraseñas ni tokens estáticos en el código fuente.
3. **Renovación Transparente de Token:** Si el `accessToken` expira (HTTP 401), el `TokenAuthenticator` de OkHttp intercepta la respuesta de forma sincrónica, solicita un nuevo `accessToken` usando el `refreshToken` guardado y reintenta la solicitud original sin interrumpir la experiencia del usuario.

---

## 8. Ejecución de Pruebas Unitarias

Para ejecutar la suite de pruebas unitarias de la aplicación Android:

### Desde la Línea de Comandos (en `apps/mobile/android`):
```bash
./gradlew test
```

### Pruebas Incluidas:
- `AuthViewModelTest.kt`: Pruebas de flujo de autenticación, validaciones y estados de UI.
- `CompanyRepositoryTest.kt`: Pruebas de integración de repositorio con respuestas de API.
- `NetworkResultTest.kt`: Pruebas de manejo de respuestas y errores HTTP.

---

## 9. Instrucciones para Despliegue y Release Build

Para generar el APK de producción optimizado con R8 / Proguard:
```bash
./gradlew assembleRelease
```
El archivo ejecutable se generará en:
`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
