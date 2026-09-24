// docs/processes/00-business-processes.md

# Flujos de Procesos Empresariales

## Flujo de Ventas

```
Cliente
    ↓
Cotización (creada por vendedor)
    ↓
¿Requiere aprobación?
    ↓ Sí
Aprobación (workflow configurado)
    ↓ No / Aprobada
Pedido (creado a partir de cotización)
    ↓
Validación de inventario (verificar stock)
    ↓ ¿Hay stock?
Salida de inventario (se genera movimiento)
    ↓
Factura (generada automáticamente)
    ↓
Pago (registro de pago)
    ↓
Auditoría (registro completo)
```

Cada etapa utiliza su propio servicio:
- Cotización → `sales/quotations` Service
- Inventario → `inventory` Service  
- Facturación → `finance/invoices` Service
- Pagos → `finance/payments` Service

## Flujo de Compras

```
Necesidad identificada
    ↓
Solicitud de compra (creada por usuario)
    ↓
Aprobación (workflow configurado)
    ↓
Orden de compra (enviada a proveedor)
    ↓
Recepción (verificación física)
    ↓
Inventario (actualización de stock)
    ↓
Factura proveedor
    ↓
Cuenta por pagar
    ↓
Pago
    ↓
Auditoría
```

## Flujo de Autorización RBAC

```
Petición HTTP
    ↓
Auth Middleware → Validar JWT
    ↓
Tenant Middleware → Extraer tenantId del JWT
    ↓
Authorize Middleware → Verificar permisos (role → module → action)
    ↓
Controller → Orquestar flujo
    ↓
Service → Lógica de negocio
    ↓
Repository → Acceso a datos con tenantId filter
    ↓
MongoDB Atlas → Consulta filtrada por tenantId
    ↓
Respuesta → Formato estándar API
```

## Regla Fundamental de Segurida

**El tenantId siempre proviene del JWT, nunca del frontend.**

El flujo de validación es:
1. El JWT contiene el `tenantId` del usuario autenticado
2. El middleware extrae el `tenantId` del JWT
3. El Service filtra TODAS las consultas por `tenantId`
4. El Repository agrega `tenantId` automáticamente a cada query

Esto previene que cualquier empresa acceda a datos de otra.

## Flujo de Auditoría

```
Operación crítica realizada
    ↓
Audit Middleware captura:
    - userId (del JWT)
    - tenantId (del JWT)
    - action (CREATE/UPDATE/DELETE)
    - module (sales, inventory, etc.)
    - recordId (ID del documento afectado)
    - previousData (estado anterior)
    - newData (estado nuevo)
    - ip (IP del cliente)
    - deviceInfo (user agent)
    - timestamp (fecha/hora UTC)
    ↓
Se guarda en audit_logs
    ↓
Disponible para consultar vía API de auditoría
```
