# Apta Digital: plan de mejora UI/UX

## Estado del diagnóstico

Inspección realizada sobre el estado del workspace el 2026-09-28 y actualizada tras incorporar los activos de marca y referencia. Este documento distingue hechos observados, problemas detectados y recomendaciones. El logo JPEG y la referencia PNG están en las rutas de assets documentadas abajo.

## 1. Resumen de la arquitectura frontend actual

**Hechos comprobados**

- El repositorio es un monorepo pnpm con TypeScript y aplicaciones en `apps/`.
- `apps/web/package.json` declara React 18, React Native Web, Zustand y Axios.
- `apps/web/src/index.ts` inicia React Native Web con `AppRegistry` y renderiza `src/App.tsx`.
- La web ya incluye login y auto-registro conectados a la API, sesión de pestaña en `sessionStorage`, navegación condicionada por permisos y listados de lectura para recursos reales.
- `apps/web/public/index.html` es la entrada; `src/styles.css` centraliza tokens de marca y layouts responsive. No hay router SPA: la selección de vista se conserva en estado local.
- `apps/web` tiene scripts reales de desarrollo, build y typecheck basados en esbuild ya disponible en el workspace; no se agregó framework ni dependencia.
- `packages/ui/src/index.ts` solo enumera nombres de componentes como strings; no es un design system implementado.
- La API Express está en `apps/api`, usa MongoDB/Mongoose y monta rutas bajo `/api/v1`.

**Problema detectado**

El frontend cubre acceso/auto-registro y consulta, pero todavía no es un ERP administrativo completo: faltan formularios CRUD, paginación y flujos de módulos no implementados en la API.

**Recomendación**

Mantener React Native Web y los scripts existentes; completar módulos por fases sin presentar endpoints ausentes como funcionalidad. No crear una marca tipográfica sustituta.

## 2. Tecnologías detectadas

**Hechos comprobados**

- Workspace: pnpm 9, TypeScript 5.6.
- Web declarada: React 18.2, React Native Web 0.19, Zustand 4.5 y Axios 1.6.
- Backend: Node.js, Express 4 y Mongoose 8; validación con Zod.
- No se detectaron librerías de routing, formularios, iconos o CSS declaradas para web.
- El propietario proporcionó una imagen del logo GB azul marino/turquesa y una referencia de ERP predominantemente negra, blanca y gris en la conversación.
- Esbuild se reutiliza desde las dependencias actuales del workspace; no se instaló ningún paquete nuevo.

**Recomendación**

Reutilizar las dependencias existentes al definir el arranque web. No instalar paquetes hasta confirmar que los componentes actuales y React Native Web no cubren una necesidad concreta.

## 3. Pantallas y módulos existentes

**Hechos comprobados**

- Hay una pantalla de login y un dashboard en `apps/web/src/App.tsx`; los listados disponibles consultan la API.
- La API registra módulos de auth, users, companies, branches, roles, settings y audit.
- Las rutas de users, companies, branches, roles, settings y audit existen en el backend; la mayoría requieren autenticación, tenant y permisos.
- Las constantes y los requisitos mencionan otros dominios (clientes, inventario, ventas, compras, finanzas, RR. HH., reportes y más), pero sus rutas/modelos no están registrados en la API observada y los requisitos los marcan pendientes.

**Problema detectado**

No debe inferirse disponibilidad de pantallas desde `MODULES` o documentos de requisitos; crear navegación para dominios sin API supondría inventar funcionalidad.

## 4. Componentes reutilizables disponibles

**Hechos comprobados**

- `apps/web/src/App.tsx` contiene wrappers web semánticos para campos, botones, textos e imágenes y vistas para dashboard/listados.
- `packages/ui` expone únicamente una lista declarativa de nombres: Button, Input, Select, Modal, Table, Card, Badge, Pagination y otros.
- Hay formularios de login, tablas de lectura, búsqueda y estados de carga/error/vacío; aún no existen formularios administrativos CRUD ni modales compartidos.

**Recomendación**

Extraer a `packages/ui` controles que se reutilicen en más de un módulo al implementar formularios y acciones; evitar duplicar estilos y preservar accesibilidad.

## 5. Estado actual de los estilos

**Hechos comprobados**

- `apps/web/src/styles.css` define tokens y estilos globales responsive basados en el logo y la referencia.
- El logo mostrado usa azul marino y turquesa. La referencia visual usa principalmente negro, blanco y grises.
- El propietario confirma que deben usarse los colores del logo para la referencia visual; esta instrucción resuelve la discrepancia con la paleta rosa inicial.
- El logo original JPEG y la referencia PNG ya están disponibles localmente como `apps/web/public/assets/brand/apta-digital-logo.jpg` y `docs/ui-ux/assets/erp-reference.png`.

**Problemas detectados**

- Los archivos originales ya pueden mostrarse en el preview. El azul marino representativo muestreado es `#022656`; el turquesa representativo es aproximadamente `#0090A0` porque el logo contiene degradados JPEG, no un único tono plano.
- Recrear el logo o sustituirlo por texto incumpliría los requisitos de marca.

**Recomendación**

Usar `#022656` como azul marino y `#0090A0` como turquesa representativo, más la imagen de referencia para composición/densidad con negros, blancos y grises neutrales. Los activos están en `apps/web/public/assets/brand/apta-digital-logo.jpg` y `docs/ui-ux/assets/erp-reference.png`; la captura de referencia es documentación, no contenido de la app. Validar contraste antes de promover estos tonos a tokens definitivos de la interfaz.

## 6. Problemas visuales y de usabilidad

**Problemas detectados**

- La aplicación todavía no ofrece operaciones de creación, edición y borrado en tablas; los listados son de lectura.
- No hay navegación URL de módulos ni paginación/interacción con los controles de paginación de API.
- La sesión se guarda en `sessionStorage`; hay renovación automática al recibir 401, pero no refresh rotation.
- Logout sigue llamando a una ruta que no instala el middleware de autenticación; se limpia la sesión local, pero no se certifica la revocación del token en backend.
- Auto-registro es público, crea una organización nueva y entrega rol administrador. Está limitado por `authLimiter`, pero no hay verificación de correo ni CAPTCHA.

**Hechos relacionados con autenticación**

- La API ofrece `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/logout-all`, `POST /api/v1/auth/forgot-password` y `PUT /api/v1/auth/change-password`.
- El auto-registro crea en una transacción MongoDB una empresa/tenant, un rol `admin` con permisos CRUD solo para módulos registrados y el usuario inicial; retorna access/refresh tokens y usuario.
- El login devuelve access token, refresh token y usuario saneado.
- La web usa el access token para peticiones y limita el menú a permisos `read` incluidos en el usuario autenticado.
- El refresh valida que el token no esté vacío y el servicio verifica su firma JWT. La app renueva el access token y reintenta la consulta una vez.
- El handler de recuperación devuelve un token de restablecimiento; no se verificó un flujo de correo o pantalla para completar el restablecimiento.
- La ruta de logout está declarada sin middleware de autenticación; la web intenta llamar al endpoint y siempre elimina la sesión de pestaña, pero no se afirma que el token se revoque en backend.

## 7. Riesgos de regresión

- La sesión en `sessionStorage` es accesible a scripts de la página; requiere una futura evaluación de CSP/mitigación XSS y una estrategia de cookies httpOnly si la arquitectura la permite.
- El endpoint público crea empresas nuevas; producción requerirá decidir verificación de correo/abuso además del rate limit actual.
- El endpoint logout actual puede no revocar el token por no recibir un `userId` autenticado.
- Mostrar módulos por constantes en vez de permisos y rutas reales daría acceso visual engañoso; la autorización efectiva debe seguir en backend.
- Integrar endpoints sin comprobar respuestas, paginación y permisos reales puede romper contratos o exponer operaciones no autorizadas.
- La documentación de API no prueba por sí sola que todas las rutas funcionen en una instancia conectada a MongoDB.
- El archivo preexistente sin seguimiento `docs/architecture/current-state.md` se dejó intacto.

## 8. Archivos que conviene modificar

**Recomendación, condicionada a la Fase 0 de producto/plataforma**

- `apps/web/package.json`, `tsconfig.json`, `scripts/build.mjs` y `public/index.html`: arranque/build/typecheck de web.
- `apps/web/src/index.ts`, `App.tsx` y `styles.css`: bootstrap, auth, navegación de lectura y estilos.
- `packages/ui/src/index.ts`: implementar controles compartidos cuando los formularios CRUD existan.
- Mantener las nuevas garantías transaccionales del alta; revisar middleware/logout, refresh rotation y políticas de verificación antes de endurecer despliegue.

No se recomienda modificar `apps/api`, modelos, configuración de MongoDB ni archivos `.env` para mejorar presentación.

## 9. Archivos nuevos propuestos

**Recomendación**

- Activos oficiales de marca en una ubicación acordada dentro de la app web.
- Formularios CRUD y confirmaciones en los módulos cuya API los respalda.
- Navegación con URL, filtros/paginación y pruebas frontend una vez que exista runner.

Este plan es el único archivo nuevo creado por el diagnóstico.

## 10. Plan de implementación por fases

| Fase | Alcance | Estado |
|---|---|---|
| 0. Diagnóstico | Inventariar repo, contratos, estado web, marca y pruebas; documentar hechos y riesgos. | Completado; logo JPEG y referencia PNG localizados y verificados. |
| 0A. Habilitación | Preparar assets y arranque web dentro del workspace. | Completado; `esbuild` reutilizado, sin instalar dependencias. |
| 1. Sistema visual | Definir tokens accesibles de color, tipografía, espaciado, radios, elevación, controles y breakpoints. | Colores representativos muestreados y aplicados al preview; validar contraste y paleta completa durante el diseño del sistema. |
| 2. Componentes | Implementar controles reutilizables con estados, teclado, accesibilidad y variantes requeridas por las pantallas reales. | Wrappers de login/listado disponibles localmente; falta extraer controles CRUD compartidos a `packages/ui`. |
| 3. Login y registro | Conectar login y alta a la API, conservando validaciones, errores y sesión. Recuperación solo si se completa el flujo existente. | Login y auto-registro empresa/admin conectados; contraseña mínima 8, confirmación, rate limit API, sesión inmediata y refresh automático implementados. |
| 4. Shell y navegación | Header/sidebar responsive; exponer solo módulos reales y acciones según permisos del usuario. | Shell implementado; módulos visibles según permisos de lectura, sin router URL todavía. |
| 5. Dashboard | Presentar únicamente indicadores con fuente/API real; estados vacíos y errores sin cifras ficticias. | Panel conectado al contexto de sesión; sin cifras operativas inventadas porque no hay endpoint de resumen. |
| 6. Listados | Empezar por users, companies, branches, roles, settings o audit según permisos y contratos comprobados; conservar CRUD y paginación. | Lectura, búsqueda, carga/error/vacío implementadas para rutas registradas; paginación y CRUD pendientes. |
| 7. Formularios y modales | Unificar validación, foco, errores, procesamiento y confirmaciones sin alterar reglas de negocio. | Login/registro implementados; formularios CRUD administrativos y confirmaciones pendientes. |
| 8. Otros módulos | Incorporar únicamente dominios con API y requisitos implementados; CRM, inventario, ventas y otros figuran pendientes. | Pendiente; no crear pantallas ficticias. |
| 9. Calidad final | Responsive, accesibilidad, pruebas de flujos, regresión API, build y comparación visual en navegadores/tamaños disponibles. | Build/typecheck web y browser smoke verificados; login/API real, viewport móvil estrecho y suite estable pendientes. |

## 11. Pruebas necesarias

**Comandos disponibles**

- `pnpm --filter @erp/api run build`
- `pnpm --filter @erp/api run test:unit`
- `pnpm --filter @erp/api run test:integration`
- `pnpm --filter @erp/api run lint`
- `pnpm --filter @erp/web run dev` (servidor local en `http://localhost:3001`)
- `pnpm --filter @erp/web run build`
- `pnpm --filter @erp/web run typecheck`
- `pnpm --filter @erp/api exec tsc -p tsconfig.json --noEmit --rootDir ../..` (typecheck del código API evitando su `rootDir` preexistente)
- `pnpm build` y `pnpm test` son scripts del workspace, pero varios paquetes no declaran esos scripts.

**Para las futuras fases de UI**

- Login con Mongo/API real aún no probado porque no se usaron credenciales ni se verificó una instancia de datos activa.
- Refresh/logout backend requiere resolver los contratos descritos antes de certificar la revocación/renovación.
- Pruebas de CRUD para cada recurso y autorización por acción pendientes.
- Pruebas de visibilidad por permisos y CRUD para cada recurso integrado, incluidas confirmaciones destructivas.
- Verificación manual o automatizada en escritorio, tablet y ventana estrecha; foco por teclado, labels y contraste.
- Build y typecheck de web pasaron; smoke test HTTP de index/JS/CSS devolvió 200; browser confirmó logo cargado, encabezado accesible, formulario required/email/password y sin overflow al viewport de 488px disponible.
- Typecheck API con el rootDir corregido por CLI y validaciones runtime de registro/refresh pasaron; browser confirmó creación de cuenta en UI, campos obligatorios y que una confirmación de contraseña incorrecta no envía petición.
- MongoDB Atlas conectó correctamente al iniciar API; `/health` devolvió 200 y `/api/v1/auth/register` rechazó `{}` con 400 `VALIDATION_ERROR`, sin escribir datos. Se corrigió el alias runtime `@erp/validation` para cargar `src/index.ts` y evitar el JavaScript generado obsoleto.
- `pnpm build` compiló web y paquetes, pero API falló con TS6059 porque `apps/api/tsconfig.json` incluye `packages/ui/src/index.ts` fuera de `rootDir`.
- `pnpm test` falló al resolver `jest.config.js` desde `apps/api`; usando el config embebido directamente, las suites fallaron por globals/tipos Jest, tipado JWT y mocks existentes. No se modificó backend ni configuración de pruebas.
- No se creó una cuenta ni se probó login con credenciales reales, para evitar escrituras de prueba en la base configurada.

## 12. Criterios de aceptación

- Cada color de marca está derivado del logo oficial y mantiene contraste accesible; no se altera la proporción del activo.
- La app web tiene un comando de ejecución/build reproducible y las pruebas pertinentes pasan.
- Login, renovación y cierre de sesión usan contratos reales, conservan estados de error/procesamiento y no filtran credenciales.
- Navegación y acciones corresponden a rutas existentes y permisos reales; no hay destinos vacíos ni módulos inventados.
- Dashboard/listados muestran datos solo desde fuentes comprobadas e incluyen loading, error y empty states.
- Formularios mantienen sus campos y reglas existentes; acciones destructivas confirman antes de continuar.
- La interfaz funciona sin desbordamientos en escritorio, tablet y ventanas estrechas, y puede recorrerse por teclado.
- API, autenticación, permisos, MongoDB Atlas y datos no sufren cambios por motivos exclusivamente visuales.
- El estado de cada fase, pruebas ejecutadas, pendientes y limitaciones queda actualizado en este documento.

## Resumen de avance

**Realizado:** arranque y build web, login y auto-registro de empresa/admin conectados a API, permisos de módulo, refresh de access token, shell/dash/listados de lectura y estados de carga/error/vacío con estilo de marca.

**Pendiente:** formularios CRUD, navegación URL, paginación, automatización de pruebas UI, endurecimiento del auto-registro/logout y validación contra una base autorizada. El build y las pruebas del monorepo requieren corregir configuraciones preexistentes; no se alteraron dentro de esta tarea. CRM, ventas, inventario y demás quedan fuera hasta que existan endpoints y reglas de negocio comprobadas.