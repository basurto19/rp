// docs/requirements/00-functional.md

# Requisitos Funcionales del ERP

## Módulos Funcionales

### CORE (Fase 1 - COMPLETADO)
- [x] Autenticación segura con JWT
- [x] Gestión de usuarios con hash de contraseñas
- [x] Sistema RBAC basado en roles y permisos granulares
- [x] Multiempresa con tenantId en todas las consultas
- [x] Multisucursal con branchId
- [x] Configuración del sistema
- [x] Auditoría completa de operaciones críticas
- [x] Gestión de empresas (CRUD)
- [x] Gestión de sucursales (CRUD)
- [x] Gestión de roles (CRUD)

### CRM (Fase 10 - PENDIENTE)
- [ ] Gestión de clientes
- [ ] Gestión de contactos
- [ ] Historial de interacciones
- [ ] Seguimiento de oportunidades

### VENTAS (Fase 14 - PENDIENTE)
- [ ] Cotizaciones con flujo de aprobación
- [ ] Pedidos con validación de inventario
- [ ] Facturación
- [ ] Pagos
- [ ] Descuentos

### COMPRAS (Fase 15 - PENDIENTE)
- [ ] Proveedores
- [ ] Solicitudes de compra
- [ ] Órdenes de compra
- [ ] Recepción
- [ ] Cuentas por pagar

### INVENTARIO (Fase 13 - PENDIENTE)
- [ ] Productos y categorías
- [ ] Almacenes y existencias
- [ ] Movimientos de inventario
- [ ] Transferencias
- [ ] Ajustes
- [ ] Alertas de stock mínimo

### FINANZAS (Fase 16 - PENDIENTE)
- [ ] Ingresos y gastos
- [ ] Cuentas por cobrar
- [ ] Cuentas por pagar
- [ ] Presupuestos
- [ ] Reportes financieros

### RECURSOS HUMANOS (Fase 20 - PENDIENTE)
- [ ] Empleados
- [ ] Departamentos y puestos
- [ ] Asistencia
- [ ] Vacaciones
- [ ] Permisos

### PROYECTOS (Fase 22 - PENDIENTE)
- [ ] Gestión de proyectos
- [ ] Tareas y responsabilidades
- [ ] Horas y costos

### PRODUCCIÓN (Fase 21 - PENDIENTE)
- [ ] Órdenes de producción
- [ ] Listas de materiales (BOM)
- [ ] Costos de producción

### REPORTES (Fase 17 - PENDIENTE)
- [ ] Motor de reportes reutilizable
- [ ] Filtros por fecha, empresa, sucursal, usuario
- [ ] Exportación PDF, CSV, Excel
- [ ] Gráficas

### WORKFLOWS (Fase 18 - PENDIENTE)
- [ ] Motor de automatización configurable
- [ ] Flujos de aprobación
- [ ] Alertas automáticas

### IA (Fase 24 - PENDIENTE)
- [ ] Asistente empresarial
- [ ] Consultas en lenguaje natural
- [ ] Detección de anomalías
- [ ] Predicciones

## Requisitos No Funcionales

### Seguridad
- HTTPS obligatorio
- JWT con HS256 y refresh tokens
- Hash de contraseñas con bcrypt (12 rounds)
- RBAC en el backend
- Validación de tenantId del JWT
- Rate limiting en autenticación
- Protección contra inyección
- CORS correctamente configurado
- Helmet.js para headers de seguridad
- Secretos en variables de entorno

### Rendimiento
- Conexión pool a MongoDB Atlas
- Índices optimizados para consultas multi-tenant
- Paginación en todas las listas
- Cache donde sea aplicable

### Escalabilidad
- Arquitectura modular que permite escalar por módulo
- Base de datos MongoDB Atlas con escalado automático
- Separación de frontend/backend para escalar independientemente
- API versionada (/api/v1, /api/v2)

### Mantenibilidad
- Código tipado en TypeScript
- Tests unitarios, de integración y E2E
- Documentación de arquitectura y API
- Convenciones de nombres consistentes
- Sin código duplicado
