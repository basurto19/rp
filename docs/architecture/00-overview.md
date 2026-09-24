// docs/architecture/00-overview.md

# Arquitectura del Sistema ERP

## Visión General

El sistema ERP está construido con una **arquitectura modular por capas** que separa responsabilidades de forma estricta.

## Capas de Arquitectura

```
Usuario → React Native Web / Mobile → HTTPS → Express API → Middleware → Controller → Service → Repository → MongoDB Atlas
```

### Capa 1: Presentación
- **React Native Web** (Dashboard Web)
- **React Native** (App Móvil)
- **Kotlin Native Modules** (Solo funciones Android específicas)

### Capa 2: Transporte
- Express.js (HTTP Server)
- HTTPS obligatorio
- Rate limiting

### Capa 3: Seguridad
- CORS configurado
- Helmet.js
- JWT Authentication
- RBAC
- Tenant validation

### Capa 4: Control
- Controllers (orquestación, sin lógica de negocio)
- Validación de entrada con Zod

### Capa 5: Negocio
- Services (lógica empresarial pura)
- Reglas de negocio
- Orquestación de módulos

### Capa 6: Datos
- Repositories (acceso a MongoDB)
- Mongoose Models/Schemas
- Base de datos MongoDB Atlas

## Principios de Diseño

1. **Separación de Responsabilidades**: Cada capa tiene una única responsabilidad.
2. **Multi-Tenancy**: Todo acceso a datos incluye `tenantId` del JWT.
3. **RBAC**: La autorización ocurre en el backend, nunca en el frontend.
4. **Auditoría**: Toda operación crítica se registra.
5. **Validación**: Toda entrada se valida con Zod antes de procesar.

## Flujo de Seguridad

```
Petición → JWT → TenantId del JWT → Validación → Autorización RBAC → Servicio → MongoDB
```

El `tenantId` y `branchId` se extraen del JWT, nunca del body/query de la petición.

## Módulos del Sistema

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| Auth | Autenticación y sesiones | ✅ Fase 1 |
| Users | Gestión de usuarios | ✅ Fase 1 |
| Roles | Roles y permisos | ✅ Fase 1 |
| Companies | Empresas (multi-tenant) | ✅ Fase 1 |
| Branches | Sucursales | ✅ Fase 1 |
| Settings | Configuración del sistema | ✅ Fase 1 |
| Audit | Auditoría | ✅ Fase 1 |
| CRM | Clientes y contactos | ⏳ Fase 10 |
| Inventory | Inventario | ⏳ Fase 13 |
| Sales | Ventas | ⏳ Fase 14 |
| Purchases | Compras | ⏳ Fase 15 |
| Finance | Finanzas | ⏳ Fase 16 |
| Reports | Reportes | ⏳ Fase 17 |
| HR | Recursos Humanos | ⏳ Fase 20 |
| Production | Producción | ⏳ Fase 21 |
| AI | Inteligencia Artificial | ⏳ Fase 24 |
