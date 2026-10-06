# Estado actual

## Arquitectura

La base del proyecto es un monorepo TypeScript con `pnpm` y tres aplicaciones principales:

- `apps/api`: backend en Node.js + Express + MongoDB/Mongoose
- `apps/web`: aplicación React con sesión y catálogo de productos conectado a la API
- `apps/mobile`: aplicación Android nativa Kotlin/Jetpack Compose con cliente REST y sesión cifrada

La estructura del backend sigue un patrón modular por dominio bajo `apps/api/src/modules`, con una capa compartida en `apps/api/src/modules/shared` que incluye utilidades, validadores, repositorios, errores y respuestas. La capa de routing centraliza módulos en `apps/api/src/routes/index.ts`.

La arquitectura real observada es una monolito modular con separación funcional por dominio, pero aún no ha alcanzado una madurez de ERP completa ni un frontend conectado real a la API.

## Backend

### Estado real

El backend está parcialmente implementado y presenta una estructura clara:

- `apps/api/src/app.ts`: bootstrap de Express, helmet, cors, JSON parser, rate limiting, healthcheck y rutas
- `apps/api/src/config/env.ts`: carga de variables de entorno
- `apps/api/src/config/database.ts`: conexión a MongoDB
- `apps/api/src/middleware`: autenticación, tenant, rate limiting, errores, auditoría
- `apps/api/src/modules/*`: módulos `auth`, `companies`, `branches`, `roles`, `settings`, `users`, `audit` y `products`
- `apps/api/src/modules/shared`: repositorios, validadores, errores, respuestas, utilidades
- `apps/api/src/servers/http.ts`: inicio del servidor

### Lo que funciona

- Arranque del servidor principal
- Conexión a MongoDB a través de Mongoose
- Healthcheck `/health`
- Rutas CRUD básicas para auth, companies, branches, roles, users, settings y audit
- CRUD tenant-scoped de productos y movimientos de inventario transaccionales
- Middleware base de autenticación y validación de tenant
- Rate limiting por API
- Respuestas API con `success` / `error` estructurados
- Validación con Zod en varios controladores
- Base de repositorio para evitar duplicación

### Lo incompleto

- No existe una verdadera capa de repositorios por dominio, solo una base genérica
- No hay validación de params/query de forma consistente en todos los endpoints
- Las transacciones se usan para actualizar stock y registrar su movimiento; otras operaciones multi-entidad aún requieren revisión
- No hay registro real de auditoría persistente; el middleware encola entradas en memoria, no las guarda en base de datos
- No hay módulos completos de ventas, compras, pagos ni financiamiento
- Las pruebas locales no escriben datos en una instancia MongoDB real

## Frontend

### Estado real

La web conserva la autenticación existente y ahora incluye el flujo de productos:

- `apps/web/package.json` indica React + React Native Web + Zustand + Axios
- `apps/web/src/api/client.ts` consume la API configurada mediante `ERP_API_BASE_URL`
- usuarios autenticados pueden listar, buscar, crear, editar y desactivar productos
- el flujo web registra movimientos de inventario y muestra existencias/historial

### Observación

La web es una interfaz inicial enfocada en productos; no representa todavía una suite ERP completa.

## Mobile

El proyecto Android usa Kotlin y Jetpack Compose, no React Native ni WebView:

- Retrofit consume la misma API pública que la web
- login y refresh conservan tokens en `EncryptedSharedPreferences`
- catálogo, detalle, edición y movimientos de inventario usan las rutas de productos
- el APK no se pudo compilar en el entorno inspeccionado por falta de JDK 17 y SDK Platform 35/Build Tools 35.0.0

## Packages

### `packages/constants`

Contiene `APP_CONFIG`, `ROLES`, `MODULES`, `ACTIONS`, `ERROR_CODES`, `HTTP_STATUS`.

Diseño útil, pero algunas convenciones no se aplican de forma uniforme en la API; por ejemplo, permisos y acciones se usan parcialmente y muchas rutas no tienen mapping completo a permisos reales por recurso.

### `packages/shared-types`

Define tipos compartidos para `User`, `PaginatedResult`, `ApiResponse`, `Permission`, `AuditLogEntry`, etc.

El esquema es útil, pero aún no centraliza todos los contratos del negocio ni se usa de manera consistente en controladores, servicios y frontend.

### `packages/validation`

Contiene validadores con Zod para auth, users, companies, branches, productos e inventario, además de paginación.

La validación es útil, pero aún no cubre:

- params
- query filters
- IDs de tenant y branch
- fechas, monedas, estados empresariales
- validaciones de negocio reales

### `packages/ui`

Es un placeholder de design system con nombres de componentes, no implementación real ni tokens visuales.

### `packages/utils`

Tiene utilidades básicas para IDs, fechas y sanitización.

## Base de datos

### Realidad observada

El proyecto usa MongoDB con Mongoose y está diseñado para multi-tenant.

Modelos concretos observados:

- `User`
- `Company`
- `Branch`
- `Role`
- `Setting`
- `AuditLog`
- `Token`
- `Product`
- `InventoryMovement`

### Observaciones

- Hay índices de `tenantId` y `branchId` en varios modelos
- La base de datos está pensada para multiempresa y multisucursal
- El uso de `tenantId` está dentro del modelo de datos, pero la validación de acceso está principalmente en middleware y no en repositorios ni políticas por entidad a nivel transversal
- Productos y movimientos de inventario incluyen `tenantId`; las bajas son lógicas
- Las entradas/salidas actualizan stock y registran el movimiento en una transacción
- No hay módulos completos para ventas, compras, pagos, finanzas, clientes o proveedores

## Auth

### Estado real

La autenticación está implementada con JWT + bcrypt + `User` + `Token`.

- `AuthService.login()` valida credenciales y genera access token + refresh token
- `AuthService.refreshToken()` revisa token de refresh
- `AuthService.logout()` y `logoutAll()` revocan tokens
- `AuthService.changePassword()` rota credenciales y revoca sesiones
- `authenticateToken` valida JWT y coloca datos en request
- `authenticateRefreshToken` valida refresh token

### Problemas relevantes

- El objeto JWT no incluye permisos de manera normalizada; se usa `permissions` como array de permisos
- `authenticateToken` usa `decoded.roleId` como `userRole` aunque el modelo de roles parece usar `roleId` y permisos desde `permissions`
- El middleware `authorizeRole` verifica solo la presencia de permisos del usuario en `request.userPermissions`, sin consultar la base de datos ni validar la identidad del recurso actual
- `logout` y `refresh` no validan que el usuario pertenezca al tenant actual de forma estricta en toda la ruta
- No hay `session invalidation` robusta ni `brute force` protection específico más allá del limiter
- No hay política clara de refresh rotation, device binding, revocation policy ni password reset workflow completo

## Multi-tenancy

### Estado real

La intención arquitectónica es correcta:

- `tenantId` es un campo obligatorio en los modelos principales
- `BaseRepository` filtra por `tenantId` y opcionalmente por `branchId`
- `validateTenant` comprueba que exista `Company` asociada al `tenantId`

### Problemas

- El `tenantId` se toma del JWT, pero no hay un `tenant guard` completo para todas las entidades y rutas
- `branchId` es opcional y se usa solo parcialmente
- No se valida que un usuario pueda acceder solo a su tenant en todos los servicios
- No hay comprobación explícita de propiedad de recursos en todos los módulos
- La validación actual se basa parcialmente en `tenantId` del token y un `Company` asociado, pero no en un modelo real de `Membership`, `AccessControl`, `BranchAssignment` ni permisos por entorno

## RBAC

### Estado real

La capa RBAC está parcialmente implementada:

- `MODULES` y `ACTIONS` en `packages/constants`
- middleware `authorizeRole` en `apps/api/src/middleware/tenant.ts`
- rutas protegidas con `authorizeRole([{ module, action }])`

### Problemas

- El sistema usa un formato de permisos basado en un array de `{ module, actions }`, pero no hay esquema formal ni seed de permisos por rol
- `authorizeRole` valida la presencia del permiso sin revisar si el usuario pertenece al tenant correcto ni si el recurso pertenece a ese tenant
- No hay un módulo de `permissions` de primer nivel ni un administrador de permisos real
- El rol guardado en el JWT se usa como `roleId`, no como un objeto o descriptor completo
- No existe un modelo robusto de `Permission` con entidades, scopes y niveles de granularidad

## Auditoría

### Estado real

Existe un módulo `audit` y un middleware `auditMiddleware`, pero su funcionamiento real es muy básico.

- `apps/api/src/modules/audit/models/audit-log.model.ts`: modelo de log
- `apps/api/src/modules/audit/services/audit.service.ts`: acceso a logs
- `apps/api/src/middleware/audit.ts`: genera entradas y las empuja a una cola en memoria

### Problemas críticos

- La auditoría no persiste de forma fiable: solo se usa `auditQueue` in-memory y `console.info`
- No se escribe en MongoDB ni se maneja un batch real con persistencia
- No hay eventos de negocio con semántica real (`LOGIN`, `SALE`, `STOCK_ADJUSTMENT`, etc.)
- El registro actual captura casi toda la request y body, incluyendo potencialmente datos sensibles
- `sanitizeBody` borra solo algunos campos, pero no hay política clara de “never log secrets” ni tipos de riesgo de PII

## Testing

### Estado real

Hay tests de Jest configurados, pero aún son muy pequeños:

- `apps/api/tests/unit/auth.service.test.ts`
- `apps/api/tests/integration/routes.test.ts`
- `apps/api/tests/unit/company.service.test.js` (artefacto generado)
- `apps/api/tests/integration/routes.test.js` (artefacto generado)

### Problemas

- La cobertura es mínima y no cubre tenant isolation, RBAC real, roles, branches y operaciones críticas
- No hay tests de seguridad ni integración multi-tenant
- No hay tests de permisos por recurso ni acceso cruzado entre tenants
- Los archivos `.js` y `.d.ts` de tests podrían ser artefactos de compilación o transpilación y no están claramente gestionados

## Problemas encontrados

### CRITICAL

- No existe implementación real del frontend web y móvil; la app no está conectada a la API y la capa de experiencia ERP completa está ausente.
- La auditoría no persiste en base de datos ni registra eventos de negocio de forma fiable; el actual middleware solo hace cola en memoria.
- La seguridad multi-tenant y RBAC no está reforzada de manera transversal en todos los servicios y repositorios; el backend depende demasiado de la presencia de `tenantId` y permisos en el JWT.
- El sistema no incluye modelos ni flujos reales para inventario, compras, ventas, finanzas, clientes, proveedores, pagos y reportes; el ERP está incompleto funcionalmente.

### HIGH

- Las rutas de `auth` y `logout` no tienen validación y control de sesión robusto por tenant, dispositivo o refresh rotation.
- El backend no tiene una política de entrada/validación consistente para query params, params y filtros especializados.
- El módulo `settings` tiene un `delete` que usa una clave como ID, lo cual puede ser incorrecto y frágil.
- El repositorio base no encapsula políticas de tenant, branch y permisos de forma holística ni agrega restricciones a operaciones sensibles.
- El diseño de roles y permisos no incluye un sistema de seed real ni un proceso de actualización de permisos por dominio.

### MEDIUM

- Los artefactos `.js` y `.d.ts` parecen generados y no están claramente documentados como parte de la estrategia de versionado del repositorio.
- El backend define `APP_CONFIG`, `ROLES`, `MODULES` en `packages/constants`, pero no se usa de manera homogénea ni integrada con la lógica de permisos en todos los servicios.
- La validación Zod no cubre la mayoría de tipos de negocio y no tiene esquema reutilizable para IDs, moneda, cantidades, fechas ni estados ERP.
- El `auditMiddleware` registra cuerpos completos y potencias `request.body`, lo cual puede exponer información sensible.

### LOW

- Hay código de ejemplo o placeholder en varios puntos (`apps/web/src/index.ts`, `apps/mobile/src/index.ts`, `packages/ui/src/index.ts`) que dan la sensación de proyecto en progreso, pero sin conexión a implementaciones reales.
- El README describe un ERP completo, pero el código real aún está en una fase temprana de base modular.
- No existen varias convenciones de nomenclatura ni contratos definidos para dominio avanzado, por lo que el riesgo de desacople entre frontend y backend sigue alto.

## Riesgos

- Riesgo de seguridad por acceso cruzado entre tenants si un endpoint no valida el tenant explícitamente en cada servicio.
- Riesgo de fuga de información si los logs de auditoría capturan datos sensibles en `request.body`.
- Riesgo operacional por falta de transacciones y trazabilidad de movimientos de inventario y pagos.
- Riesgo funcional por depender de JWT con permisos embebidos y no de una fuente de verdad más robusta en la base de datos.
- Riesgo de integridad de datos por no definir un modelo de permisos y entidades empresariales reales.

## Deuda técnica

- Estructura modular correcta, pero parcialmente no proliferada en módulos empresariales reales.
- Validación y errores centralizados, pero aún inconsistentes en algunos controladores.
- Base de multi-tenancy útil, pero incompleta y no exhaustiva.
- Diseño de roles y permisos parcial.
- Frontend placeholder y sin integración real.
- Auditoría in-memory y no persistente.
- Tests de seguridad y autorización casi inexistentes.

## Funcionalidades existentes

- Autenticación JWT con login y refresh
- Gestión básica de usuarios
- Gestión básica de empresas
- Gestión básica de sucursales
- Gestión básica de roles
- Gestión básica de configuración por tenant
- Catálogo de productos y movimientos de inventario por tenant
- Auditoría base y middleware
- Rate limiting básico y seguridad HTTP
- Monorepo con packages compartidos

## Funcionalidades faltantes

- Dashboard ERP real
- Clientes, contactos y CRM
- Ventas, cotizaciones, órdenes, facturas
- Compras, proveedores, órdenes de compra, recepciones
- Finance y contabilidad
- Reportes y exportación
- APIs de negocio completas
- Permisos granulares por módulo y recurso
- Sesiones, seguridad y audit trail

## Recomendaciones

1. Mantener la base modular actual, pero consolidar el backend alrededor de un único conjunto de contratos y patrones de negocio estables.
2. Definir una política real de permisos como fuente de verdad y asignarlos por tenant/rol, no solo por JWT.
3. Reforzar la validación de tenant desde repositorios y servicios, no únicamente desde middleware.
4. Implementar auditoría persistente con entidades estructuradas y sanitización explícita de campos sensibles.
5. Priorizar la API real para inventario, ventas, compras y finanzas antes de avanzar con UI profesional.
6. Construir un diseño system con tokens reales y un shell ERP completo del lado web, antes de crear módulos de negocio visualmente terminados.
7. Añadir pruebas de seguridad y multi-tenancy como requisito de calidad para cada fase funcional.
8. Documentar claramente qué archivos `.js` y `.d.ts` generados son artefactos de compilación y si deben mantenerse versiónados.

---

## Resumen ejecutivo

El proyecto tiene una base sólida de monorepo, Express, MongoDB, Zod, JWT y una arquitectura modular por dominio. Sin embargo, aún está en una fase intermedia: la API tiene varios módulos base funcionando, pero el ERP real, el frontend integrado, el multi-tenancy fuerte, la auditoría persistente y la seguridad declarativa no están todavía a nivel profesional ni listo para producción. La siguiente prioridad no debe ser “añadir más UI”, sino consolidar seguridad, auditoría, permisos reales y el backend funcional de los módulos clave del negocio.
