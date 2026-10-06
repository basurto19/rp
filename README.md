# ERP System — Sistema ERP Modular Empresarial

## Descripción

Sistema ERP genérico, modular, multiempresa y multisucursal construido con:

- **Frontend Web:** React Native Web
- **Aplicación Móvil:** React Native
- **Backend:** Node.js + Express.js
- **Base de Datos:** MongoDB Atlas
- **Kotlin Nativo:** Solo para funciones Android específicas via Native Modules

## Estructura del Proyecto

```
ERP-SYSTEM/
├── apps/
│   ├── api/          # Backend Express + MongoDB
│   ├── web/          # React Native Web (Dashboard ERP)
│   └── mobile/       # React Native (App Móvil)
├── packages/
│   ├── shared-types/ # Tipos TypeScript compartidos
│   ├── validation/   # Esquemas de validación Zod
│   ├── constants/    # Constantes globales
│   ├── ui/           # Componentes UI reutilizables
│   └── utils/        # Utilidades compartidas
├── docs/             # Documentación técnica completa
├── tests/            # Pruebas (unit, integration, e2e)
├── scripts/          # Scripts de utilidad
├── pnpm-workspace.yaml
├── jest.config.js
├── tsconfig.base.json
└── README.md
```

## Tecnologías

| Capa            | Tecnología              |
| --------------- | ----------------------- |
| Backend         | Node.js 24 + Express.js |
| Base de Datos   | MongoDB Atlas           |
| ODM             | Mongoose                |
| Validación      | Zod                     |
| Autenticación   | JWT + bcrypt            |
| Logging         | Winston + Morgan        |
| Frontend Web    | React Native Web        |
| Frontend Mobile | React Native            |
| Testing         | Jest + Supertest        |
| Tipado          | TypeScript              |

## Instalación

### 1. Prerrequisitos

- Node.js 24.x
- pnpm 9+
- MongoDB Atlas (o MongoDB local)

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

Para MongoDB Atlas:

1. Crea un usuario de base de datos en Atlas
2. Agrega tu IP a Network Access
3. Copia la cadena `mongodb+srv://` desde Connect > Drivers
4. Pégala en `MONGODB_URI` y define `MONGODB_DB_NAME`

### 4. Ejecutar el backend

```bash
pnpm dev
```

### 5. Ejecutar pruebas

```bash
pnpm test:unit
pnpm test:integration
```

## Conexión a MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea un cluster gratuito (M0)
3. Crea un usuario de base de datos
4. En **Network Access**, agrega tu IP (o 0.0.0.0/0 para desarrollo)
5. En **Database Access**, crea un usuario con permisos de lectura/escritura
6. Ve a **Connect > Drivers** y copia la cadena de conexión
7. Reemplaza `<username>`, `<password>` y `cluster.mongodb.net` en `.env`

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/erp-system?retryWrites=true&w=majority
MONGODB_DB_NAME=erp-system
```

La conexión se valida al iniciar el servidor. Si falla, el servidor no arranca.

## Endpoints de la API

Base URL: `http://localhost:3000/api/v1`

| Módulo    | Endpoints                                                               |
| --------- | ----------------------------------------------------------------------- |
| Auth      | `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password` |
| Users     | `/users` (CRUD)                                                         |
| Companies | `/companies` (CRUD)                                                     |
| Branches  | `/branches` (CRUD)                                                      |
| Roles     | `/roles` (CRUD)                                                         |
| Settings  | `/settings` (CRUD)                                                      |
| Audit     | `/audit` (listar, filtrar por módulo)                                   |

Todos los endpoints (excepto `/auth/*` y `/health`) requieren autenticación JWT y validación de tenant.

## Cuentas y acceso administrativo

El registro público crea una cuenta `user`, que puede acceder al panel y gestionar
su propia sesión y contraseña. Los roles y permisos heredados se conservan en la
base de datos, pero no conceden acceso administrativo. La autorización también se
valida en el backend; ocultar módulos en la interfaz no sustituye esos controles.

El registro no exige verificar el correo antes de iniciar sesión: las cuentas
nuevas quedan con `emailVerified=false` y pueden utilizar las funciones normales
permitidas a `user`. Por tanto, una dirección no verificada puede quedar
registrada por alguien que no controla ese buzón hasta que exista un proceso
seguro de recuperación o disputa. Esa cuenta no demuestra propiedad del correo,
no obtiene permisos administrativos y no puede transferirse automáticamente.
La verificación voluntaria posterior sigue disponible. La recuperación de
contraseña está deshabilitada para todas las cuentas hasta contar con un flujo
seguro, vinculado al buzón verificado; por ello, un correo no verificado no puede
usarse para iniciar una recuperación ni para confirmar identidad.

El endpoint de registro está protegido por un límite de cinco solicitudes por
ventana de 15 minutos, además del límite general de API. Estos límites usan el
limitador en memoria del proceso; no constituyen un control distribuido entre
varias instancias.

La cuenta administradora principal se inicializa fuera del registro público:

1. Configura `ADMIN_EMAIL` con el correo que será propietario de la cuenta.
2. Confirma que `RESEND_API_KEY`, `EMAIL_FROM` y las variables de conexión a
   MongoDB estén configuradas.
3. Ejecuta `pnpm --filter @erp/api admin:bootstrap` desde una terminal interactiva
   en el entorno que tenga acceso a la base de datos.
4. Confirma el código enviado al correo configurado y establece una contraseña
   nueva cuando el asistente lo solicite.

Solo la cuenta verificada mediante este proceso recibe permisos administrativos
globales. El comando no muestra la contraseña ni el código de confirmación en la
terminal. Las cuentas de usuario permanecen aisladas por tenant.

## Documentación

- `docs/architecture/` — Arquitectura del sistema
- `docs/api/00-endpoints.md` — Documentación completa de endpoints
- `docs/database/00-schemas.md` — Esquemas MongoDB e índices
- `docs/requirements/00-functional.md` — Requisitos funcionales
- `docs/processes/00-business-processes.md` — Flujos de procesos empresariales

## Licencia

Propiedad del sistema ERP.
