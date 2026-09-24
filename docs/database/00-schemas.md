// docs/database/00-schemas.md

# Esquemas de Base de Datos

## MongoDB Atlas

Base de datos principal del sistema ERP. Todos los esquemas incluyen `tenantId` para separación multi-tenant.

## Principios de Diseño

1. **tenantId** es obligatorio en TODAS las colecciones
2. **branchId** es opcional (aplica solo a registros de sucursal)
3. Todos los documentos tienen timestamps automáticos (`createdAt`, `updatedAt`)
4. Se utilizan índices compuestos para optimizar consultas multi-tenant

## Esquemas Principales

### companies
```typescript
{
  tenantId: String, // PRIMARY KEY
  name: String,
  ruc: String,
  email: String,
  status: 'active' | 'inactive',
  plan: 'free' | 'basic' | 'pro' | 'enterprise',
  createdAt: Date,
  updatedAt: Date
}
```
Índices: `{ tenantId: 1, status: 1 }`

### branches
```typescript
{
  tenantId: String,
  branchId: String, // Unique per tenant
  name: String,
  address: Object,
  phone: String,
  status: 'active' | 'inactive',
  createdAt: Date,
  updatedAt: Date
}
```
Índices: `{ tenantId: 1, branchId: 1 }`

### users
```typescript
{
  tenantId: String,
  branchId: String | null,
  email: String,
  passwordHash: String, // bcrypt
  firstName: String,
  lastName: String,
  roleId: String,
  status: 'active' | 'inactive' | 'locked',
  refreshToken: String | null,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```
Índices: `{ tenantId: 1, email: 1 }`, `{ branchId: 1 }`

### roles
```typescript
{
  tenantId: String,
  roleId: String,
  name: String,
  permissions: [{ module: String, actions: { create: Boolean, read: Boolean, ... } }],
  scope: 'company' | 'branch',
  isSystem: Boolean,
  createdAt: Date
}
```
Índices: `{ tenantId: 1, roleId: 1 }`

### audit_logs
```typescript
{
  tenantId: String,
  branchId: String | null,
  userId: String,
  action: String,
  module: String,
  recordId: String,
  previousData: Object | null,
  newData: Object | null,
  ip: String,
  timestamp: Date
}
```
Índices: `{ tenantId: 1, timestamp: -1 }`, `{ tenantId: 1, module: 1, action: 1 }`

## Reglas de Índices

- **NUNCA** crear índices sin analizar patrones de consulta
- Todo índice debe incluir `tenantId` como primer campo
- Los índices compuestos deben seguir el orden: `tenantId`, `branchId`, `campo`
- Actualizar índices solo con justificación documentada
