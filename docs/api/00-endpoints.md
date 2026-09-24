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
| POST | `/api/v1/auth/refresh` | Renovar token | No |
| POST | `/api/v1/auth/logout` | Cerrar sesión | Si |
| POST | `/api/v1/auth/logout-all` | Cerrar todas las sesiones | Si |
| POST | `/api/v1/auth/forgot-password` | Solicitar recuperación | No |
| PUT | `/api/v1/auth/change-password` | Cambiar contraseña | Si |

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
