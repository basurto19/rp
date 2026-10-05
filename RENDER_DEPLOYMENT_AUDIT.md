# ERP Render Deployment Audit

## 1. Executive Summary

Estado: READY WITH WARNINGS

El repositorio presenta una arquitectura monorepo coherente y funcional, con API y frontend separados, trabajo con pnpm, TypeScript, Express, MongoDB/Mongoose, JWT, Zod y packages compartidos. La auditoría confirma que la instalación, la compilación y la mayoría de pruebas críticas cumplen con los requisitos básicos del proyecto.

Sin embargo, no está completamente listo como despliegue “sin intervención” en Render porque faltan:
- configuración explícita de despliegue para Render;
- render.yaml o equivalente definido para servicios separados;
- variables de entorno reales en un entorno de producción gestionado;
- separación clara de la web (static site) y la API (web service).

## 2. Arquitectura detectada

El repositorio usa un monorepo con pnpm workspaces:

- apps/api: backend Express + TypeScript + MongoDB/Mongoose
- apps/web: frontend React Native Web + esbuild
- apps/mobile: proyecto React Native / Android
- packages/constants: constantes globales
- packages/shared-types: tipos compartidos
- packages/validation: validaciones Zod
- packages/utils: utilidades reutilizables
- packages/ui: componentes compartidos

La capa API sigue un patrón modular:

Frontend
  ↓
apps/web
  ↓
API REST
  ↓
apps/api/src/routes/index.ts
  ↓
modules/{auth, users, companies, branches, roles, settings, audit}
  ↓
services -> repositories -> Mongoose models
  ↓
MongoDB

La API define un health check en /health y expone rutas protegidas bajo /api/v1.

## 3. Servicios que deben desplegarse

1. API backend
   - Servicio: Web Service en Render
   - Ruta principal: apps/api
   - Build: pnpm install --frozen-lockfile && pnpm --filter @erp/api run build
   - Start: pnpm --filter @erp/api run start
   - Health check: /health

2. Frontend web
   - Servicio: Static Site o Web Service estático
   - Ruta principal: apps/web
   - Build: pnpm install --frozen-lockfile && pnpm --filter @erp/web run build
   - Publish directory: apps/web/dist
   - Variable clave: ERP_API_BASE_URL

3. MongoDB
   - Requerido: MongoDB Atlas o un servicio externo
   - No se debe incluir una URI hardcodeada en el repositorio

## 4. Problemas críticos

No se detectaron bloqueos críticos de código en instalación, TypeScript ni tests.

Sin embargo, sí existe una condición operativa importante:
- el repo no incluye infraestructura de despliegue para Render (render.yaml o configuración equivalente), por lo que el despliegue requiere configuración manual.

## 5. Problemas importantes

- Faltan archivos de despliegue explícitos en Render.
- Se requiere definir claramente la variable ERP_API_BASE_URL para la web en producción.
- El backend usa una conexión a MongoDB y la app se inicia bloqueando si la base no está disponible.
- Hay una configuración de CORS por entorno, pero debe definirse en producción según el dominio real del frontend.

## 6. Problemas menores

- El script dev de la web mostraba URL con host undefined; se corrigió a un host válido (127.0.0.1) en apps/web/scripts/dev.mjs.
- El backend imprime salud local con localhost en logs; esto es aceptable para local, pero no debe reutilizarse como valor de producción.
- Los logs de Mongo muestran un warning de índices duplicados en algunos modelos; no bloquea el arranque, pero conviene revisarlo.

## 7. Cambios realizados

Archivo: apps/web/scripts/dev.mjs
Problema: al iniciar la web, la URL se devolvía como http://undefined:3001.
Solución: se fijó un host válido y se preservó el puerto 3001.
Razón: esto corrige la visibilidad local del frontend y evita que la app “arranque” sin una URL usable.

## 8. Variables de entorno

| Variable | Servicio | Required | Descripción |
|---|---|---:|---|
| NODE_ENV | API | Sí | Entorno: development o production |
| PORT | API | Sí | Puerto de escucha del backend |
| MONGODB_URI | API | Sí | URI de MongoDB |
| MONGODB_DB_NAME | API | Sí | Nombre de base de datos |
| JWT_SECRET | API | Sí | Secret para acceso JWT |
| JWT_REFRESH_SECRET | API | Sí | Secret para refresh token |
| JWT_EXPIRES_IN | API | No | Duración del access token |
| JWT_REFRESH_EXPIRES_IN | API | No | Duración del refresh token |
| BCRYPT_SALT_ROUNDS | API | No | Rounds de bcrypt |
| CORS_ORIGIN | API | Sí en producción | Origen permitido para CORS |
| RATE_LIMIT_MAX | API | No | Máximo de peticiones por periodo |
| RATE_LIMIT_WINDOW_MS | API | No | Ventana de rate limiting |
| ERP_API_BASE_URL | Web | Sí para producción | URL base de la API del frontend |
| API_VERSION | API | No | Versión HTTP |

No se incluye ningún valor secreto real.

## 9. Configuración Render — API

Root Directory: .
Build Command: pnpm install --frozen-lockfile && pnpm --filter @erp/api run build
Start Command: pnpm --filter @erp/api run start
Health Check: /health
Variables:
- NODE_ENV=production
- PORT=3000
- MONGODB_URI=valor de MongoDB Atlas o servicio externo
- MONGODB_DB_NAME=erp-system
- JWT_SECRET=valor secreto
- JWT_REFRESH_SECRET=valor secreto
- CORS_ORIGIN=https://tu-frontend-render.com

## 10. Configuración Render — Web

Root Directory: .
Build Command: pnpm install --frozen-lockfile && pnpm --filter @erp/web run build
Start/Publish: apps/web/dist
Variables:
- ERP_API_BASE_URL=https://tu-api-render.com/api/v1

## 11. MongoDB

La API requiere:
- MONGODB_URI
- MONGODB_DB_NAME

El código carga estos valores desde .env mediante dotenv y valida que existan al arrancar. La conexión es realizada con Mongoose y se cancela si la base no está disponible.

## 12. CORS

La API usa cors con el valor de env.corsOrigin, con un valor por defecto local:
- http://localhost:3001

En producción debe ajustarse al dominio real del frontend y no dejarse fijo en localhost ni con origen abierto.

## 13. Resultados

Install: PASS
TypeScript: PASS
Build API: PASS
Build Web: PASS
Tests: PASS
Production Start: PASS con MongoDB disponible
Health Check: PASS

## 14. Checklist previo al deploy

[ ] Dependencias correctas
[ ] TypeScript sin errores críticos
[ ] API build OK
[ ] Web build OK
[ ] Tests críticos OK
[ ] PORT dinámico
[ ] API escucha correctamente en Render
[ ] MongoDB por env
[ ] JWT secret por env
[ ] CORS configurado
[ ] Frontend API URL configurable
[ ] Health endpoint OK
[ ] Sin secretos en Git
[ ] .env.example actualizado
[ ] Production start OK
[ ] Tenant isolation revisado

## 15. Veredicto

READY WITH WARNINGS FOR RENDER

Se puede desplegar en Render con una configuración explícita de entorno y servicios separados, siempre que:
- la API esté en un Web Service con MongoDB externo;
- la web se sirva como Static Site o Web Service estático;
- las variables de entorno estén configuradas correctamente;
- se defina CORS_ORIGIN en producción;
- se configure ERP_API_BASE_URL para el frontend.

La base del repo sí está preparada para producción en términos de código y compilación, pero no está completamente cerrada como proyecto “deploy-ready” sin configuración manual de Render.
