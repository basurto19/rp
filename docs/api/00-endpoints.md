// docs/api/00-endpoints.md

# Documentación de API

## Base URL

```
http://localhost:3000/api/v1
```

## Formato de Respuestas

### Éxito
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginación
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": { ... }
  }
}
```

## Endpoints de Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Iniciar sesión | No |
| POST | `/api/v1/auth/register` | Crear empresa y usuario normal inicial | No |
| POST | `/api/v1/auth/refresh` | Renovar token | No |
| POST | `/api/v1/auth/logout` | Cerrar sesión | Si |
| POST | `/api/v1/auth/logout-all` | Cerrar todas las sesiones | Si |
| POST | `/api/v1/auth/forgot-password` | Solicitar recuperación | No |
| PUT | `/api/v1/auth/change-password` | Cambiar contraseña | Si |

`/auth/register` recibe `firstName`, `lastName`, `email`, `password` (mínimo 8 caracteres) y `companyName`. El alta crea un tenant aislado, su empresa, el rol estándar y el usuario. La respuesta es un mensaje de confirmación; después del registro se inicia sesión normalmente. `emailVerified` no se exige para iniciar sesión. El acceso a Productos e Inventario requiere una sesión válida y queda limitado al tenant del JWT, no depende de `ADMIN_EMAIL` ni de `isPrimaryAdmin`.

## Productos e inventario

Todas las rutas requieren `Authorization: Bearer <accessToken>` y operan exclusivamente dentro del tenant asociado al token. No requieren permisos de administrador ni aceptan un `tenantId` proporcionado por el cliente.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/products?search=<texto>` | Buscar/listar hasta 200 productos del tenant por nombre, SKU o categoría |
| POST | `/api/v1/products` | Crear producto |
| GET | `/api/v1/products/:id` | Obtener producto del tenant; `:id` es `_id` Mongo |
| PUT | `/api/v1/products/:id` | Actualizar datos del producto; el stock se modifica mediante movimientos |
| PATCH | `/api/v1/products/:id/status` | Activar o desactivar con `{ "status": "active" \| "inactive" }` |
| DELETE | `/api/v1/products/:id` | Baja lógica: marca el producto como inactivo |
| GET | `/api/v1/products/:id/inventory` | Consultar los últimos 100 movimientos del producto |
| POST | `/api/v1/products/:id/inventory` | Registrar entrada/salida y actualizar stock en una transacción |

El cuerpo de creación acepta `name`, `sku`, `description`, `category`, `costPrice`, `salePrice`, `stock` inicial, `minimumStock`, `unit` y `status`; los campos opcionales tienen valores predeterminados y precios/stock no pueden ser negativos. El SKU es único por tenant. Para movimientos se envía `{ "type": "entry" | "exit", "quantity": <número positivo>, "notes": "" }`. Las salidas se rechazan si exceden el stock y los movimientos se guardan junto con la actualización de existencias en la misma transacción de MongoDB.

## Endpoints de Usuarios

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/v1/users` | Listar usuarios | users:read |
| POST | `/api/v1/users` | Crear usuario | users:create |
| GET | `/api/v1/users/:id` | Obtener usuario | users:read |
| PUT | `/api/v1/users/:id` | Actualizar usuario | users:update |
| DELETE | `/api/v1/users/:id` | Eliminar usuario | users:delete |

## Endpoints de Empresas

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/v1/companies` | Listar empresas | companies:read |
| POST | `/api/v1/companies` | Crear empresa | companies:create |
| GET | `/api/v1/companies/:id` | Obtener empresa | companies:read |
| PUT | `/api/v1/companies/:id` | Actualizar empresa | companies:update |
| DELETE | `/api/v1/companies/:id` | Eliminar empresa | companies:delete |

## Endpoints de Sucursales

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/v1/branches` | Listar sucursales | branches:read |
| POST | `/api/v1/branches` | Crear sucursal | branches:create |
| GET | `/api/v1/branches/:id` | Obtener sucursal | branches:read |
| PUT | `/api/v1/branches/:id` | Actualizar sucursal | branches:update |
| DELETE | `/api/v1/branches/:id` | Eliminar sucursal | branches:delete |

## Endpoints de Roles

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/v1/roles` | Listar roles | roles:read |
| POST | `/api/v1/roles` | Crear rol | roles:create |
| GET | `/api/v1/roles/:id` | Obtener rol | roles:read |
| PUT | `/api/v1/roles/:id` | Actualizar rol | roles:update |
| DELETE | `/api/v1/roles/:id` | Eliminar rol | roles:delete |

## Endpoints de Configuración

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/v1/settings` | Listar configuraciones | settings:read |
| GET | `/api/v1/settings/:key` | Obtener configuración | settings:read |
| PUT | `/api/v1/settings/:key` | Actualizar configuración | settings:update |
| DELETE | `/api/v1/settings/:key` | Eliminar configuración | settings:delete |

## Endpoints de Auditoría

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/api/v1/audit` | Listar logs de auditoría | audit:read |
| GET | `/api/v1/audit/module/:module` | Logs por módulo | audit:read |

## Códigos de Error

| Código | Significado | HTTP |
|--------|-------------|------|
| VALIDATION_ERROR | Error de validación de datos | 400 |
| INVALID_CREDENTIALS | Credenciales inválidas | 401 |
| TOKEN_EXPIRED | Token expirado | 401 |
| INVALID_TOKEN | Token inválido | 401 |
| UNAUTHORIZED | No autorizado | 401 |
| FORBIDDEN | Acceso prohibido | 403 |
| RESOURCE_NOT_FOUND | Recurso no encontrado | 404 |
| DUPLICATE_RESOURCE | Recurso duplicado | 409 |
| DATABASE_ERROR | Error de base de datos | 500 |
| INTERNAL_SERVER_ERROR | Error interno del servidor | 500 |

## Contrato usado por la web

La aplicación web llama los paths relativos a `/api/v1`. Las respuestas de éxito usan `{ success: true, data, message? }`; errores usan `{ success: false, error: { code, message, details? } }`. Las listas de `users`, `companies`, `branches`, `roles`, `settings` y `audit` contienen dentro de `data` `{ data, total, page, limit, hasMore }` (por defecto página 1 y 20 registros; solo auditoría lee `page` y `limit` de query).

| Método y path | Parámetros/cuerpo | Respuesta de datos | Permiso |
|---|---|---|---|
| `POST /auth/login` | `{ email, password }` | Sesión `{ accessToken, refreshToken, user }` | Público |
| `POST /auth/register` | `{ firstName, lastName, email, password, companyName }` | 201; mensaje de registro | Público |
| `POST /auth/refresh` | `{ refreshToken }` | `{ accessToken }` | Público, validado por refresh token |
| `POST /auth/logout` | `{ refreshToken }` | `{ success: true }` | Bearer; sesión actual |
| `POST /auth/logout-all` | sin cuerpo | `{ success: true }` | Bearer; sesión actual |
| `PUT /auth/change-password` | `{ currentPassword, newPassword, confirmPassword }` | `{ changed: true }` | Bearer; sesión actual |
| `POST /users` | `{ email, firstName, lastName, password, roleId, branchId? }` | 201; usuario sin hash/tokens | `users:create` |
| `GET /users`, `GET /users/:id` | `:id` es `_id` Mongo; listado también filtra por sucursal del token | Usuario/listado del tenant | `users:read` |
| `PUT /users/:id` | campos parciales `firstName`, `lastName`, `roleId`, `branchId`, `status` | Usuario actualizado sin hash/tokens | `users:update` |
| `DELETE /users/:id` | `:id` es `_id` Mongo | `{ deleted: true }` | `users:delete` |
| `POST /companies` | `{ name, ruc, email }` | 201; empresa | `companies:create` |
| `GET /companies`, `GET /companies/:id` | `:id` es `_id` Mongo | Empresa/listado del tenant | `companies:read` |
| `PUT /companies/:id` | subconjunto de `{ name, ruc, email }` | Empresa actualizada | `companies:update` |
| `DELETE /companies/:id` | `:id` es `_id` Mongo | `{ deleted: true }` | `companies:delete` |
| `POST /branches` | `{ branchId: UUID, name, address: { street, city, state, country, zipCode }, phone }` | 201; sucursal | `branches:create` |
| `GET /branches`, `GET /branches/:id` | `:id` es `_id` Mongo | Sucursal/listado del tenant | `branches:read` |
| `PUT /branches/:id` | campos parciales de la sucursal | Sucursal actualizada | `branches:update` |
| `DELETE /branches/:id` | `:id` es `_id` Mongo | `{ deleted: true }` | `branches:delete` |
| `POST /roles` | `{ roleId, name, description?, permissions, scope? }` | 201; rol | `roles:create` |
| `GET /roles`, `GET /roles/:id` | `:id` es `_id` Mongo | Rol/listado del tenant | `roles:read` |
| `PUT /roles/:id` | campos del rol | Rol actualizado | `roles:update` |
| `DELETE /roles/:id` | `:id` es `_id` Mongo | `{ deleted: true }`; roles `isSystem` se rechazan | `roles:delete` |
| `GET /settings`, `GET /settings/:key` | `:key` es la clave pública | Configuración/listado del tenant | `settings:read` |
| `PUT /settings/:key` | `{ value, type?, description? }`; tipo `string`, `number`, `boolean` o `json` | Configuración creada/actualizada (201) | `settings:update` |
| `DELETE /settings/:key` | `:key` es la clave pública, no `_id` | `{ deleted: true }` | `settings:delete` |
| `GET /audit?page=&limit=` | opcional; predeterminados 1 y 20 | Página `{ data, total, page, limit, hasMore }` | `audit:read` |
| `GET /audit/module/:module?page=&limit=` | `:module` y paginación opcional | Página filtrada por módulo y tenant | `audit:read` |
| `GET /products?search=` | Búsqueda opcional por nombre, SKU o categoría | Arreglo de productos del tenant (máximo 200) | Bearer + tenant |
| `POST /products` | Producto; no acepta tenant del cliente | 201; producto creado | Bearer + tenant |
| `GET /products/:id` | `:id` es `_id` Mongo | Producto del tenant | Bearer + tenant |
| `PUT /products/:id` | Campos parciales de producto, sin modificar stock | Producto actualizado | Bearer + tenant |
| `PATCH /products/:id/status` | `{ status: "active" \| "inactive" }` | Estado actualizado | Bearer + tenant |
| `DELETE /products/:id` | Baja lógica, no borra documentos ni movimientos | Producto inactivo | Bearer + tenant |
| `GET /products/:id/inventory` | `:id` es `_id` Mongo | Movimientos recientes del tenant | Bearer + tenant |
| `POST /products/:id/inventory` | `{ type: "entry" \| "exit", quantity, notes? }` | `{ product, movement }` | Bearer + tenant |

Todos los endpoints de datos pasan por `authenticateToken` y `validateTenant`; el `tenantId` se toma del JWT, nunca del formulario. Los módulos administrativos históricos aplican permisos RBAC; Productos e Inventario están disponibles para cualquier usuario autenticado del tenant. El endpoint `GET /health` no requiere token. No existe endpoint HTTP de bootstrap administrativo ni endpoint de dashboard.

Notas de implementación verificadas:
- El frontend compila `ERP_API_BASE_URL` en `apps/web` (script de build/dev basado en esbuild); en desarrollo local, si no está definida, usa `http://<host>:3000/api/v1`. En producción configúrala en el entorno de build del Static Site, sin incluir credenciales.
- El backend debe permitir el origen del Static Site mediante `CORS_ORIGIN`.
- La respuesta de usuarios excluye `passwordHash`, refresh token y expiración.
- `/settings` solo tiene GET en la ruta raíz; el `PUT` de upsert requiere `/:key`.
- El router de roles no aplica un schema Zod server-side; los formularios web validan su estructura localmente, pero el servidor sigue siendo la autoridad de autorización.
- `/auth/forgot-password` figura como público, pero su controlador necesita tenant y actualmente esa ruta no aplica `validateTenant`; la web no lo integra.
- Las operaciones CRUD contra una base Atlas real requieren credenciales de entorno y no se simulan como operaciones reales en pruebas locales.
