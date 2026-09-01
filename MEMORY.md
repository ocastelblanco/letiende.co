# MEMORY.md — Rehidratación de Estado · letiende.co

> Leer este archivo al inicio de cada sesión para restaurar el contexto completo del proyecto.
> **Última actualización:** Abril 2026 · Rama activa: `2025`

---

## Estado actual del proyecto

| Aspecto | Estado |
|---|---|
| Versión | v2.0.0-alpha (en desarrollo, rama `2025`) |
| Producción | https://letiende.co (rama `main`) |
| Staging | https://letiende.co/dev/ |
| API pública | https://api.letiende.co |
| CDN assets | https://assets.letiende.co |
| Última sesión | Abril 2026 |

### Funcionalidades completadas

- [x] `/inicio` — Hero landing con glassmorphism
- [x] `/menu`, `/menu/:categoria` — Menú bilíngüe con datos desde CDN
- [x] `/eventos` — Galería de eventos futuros con Google Calendar + .ics
- [x] `/admin` — Dashboard de administración (protegido con Firebase Auth)
- [x] `/admin/eventos` — CRUD completo de eventos + sync Google Calendar
- [x] Firebase Auth con Google Sign-In
- [x] Sistema de correo AWS SES (redirecciones activas a Gmail)
- [x] API Lambda Node.js 22.x (`api.letiende.co`)
- [x] Documentación: `README.md`, `PRD.md`, `tech-specs.md`, `CLAUDE.md` con reglas OWASP

### Funcionalidades pendientes (roadmap)

- [ ] Admin de Menú (placeholder en `/admin`)
- [ ] Catálogo de librería — vista pública
- [ ] Admin de librería (CRUD con Google Books / Discogs)
- [ ] Formulario de contacto con reCAPTCHA
- [ ] Reservas para eventos
- [ ] Página "Nosotros"
- [ ] Página "Auditorio / Le Teatre"
- [ ] Vitrina de vinilos (Discogs)

---

## Registro de Decisiones de Arquitectura (ADR)

### ADR-001: Angular SSR en AWS Lambda con Serverless Framework

**Fecha:** 2025-Q3
**Estado:** Implementado y en producción

**Decisión:** Desplegar Angular con Server-Side Rendering en AWS Lambda usando `@codegenie/serverless-express` y Serverless Framework 4.x.

**Razón:** Costo casi cero (Lambda free tier cubre el tráfico esperado), sin servidores que administrar, SSR nativo para SEO, y capacidad de escalar automáticamente. Alternativas como Vercel o Netlify tienen costos más altos a escala y menos control sobre la infraestructura AWS ya usada.

**Consecuencias conocidas:**
- Cold starts en Lambda pueden generar latencia de hasta 2–3s en el primer request.
- El bundle debe optimizarse estrictamente: solo `dist/browser`, `dist/server` y `@codegenie/serverless-express` en el package.
- `APP_BASE_HREF` debe ser `/dev/` en staging y `/` en producción — inyectado desde SSM.

---

### ADR-002: Contenido headless via Google Sheets → Apps Script → Lambda → S3

**Fecha:** 2025-Q3
**Estado:** Implementado

**Decisión:** La fuente de verdad del contenido del sitio es una hoja de cálculo de Google Workspace. Apps Script detecta cambios (`onEdit`) y envía el JSON a `api.letiende.co/actualizarContenido`, que lo guarda en S3 como `{seccion}.json`.

**Razón:** Permite al equipo no técnico de Le Tiende actualizar el contenido sin intervención del desarrollador. Costo cero (Google Workspace ya existía). El sitio Angular consume los JSON directamente desde CDN.

**Consecuencias conocidas:**
- No hay validación de esquema estricta en el Apps Script — la Lambda debe validar antes de escribir en S3.
- `eventos.json` puede ser actualizado tanto desde el admin Angular como desde Sheets — posibles conflictos si se usan simultáneamente.
- El endpoint `/actualizarContenido` requiere un `X-API-Key` secreto (pendiente de implementar según reglas OWASP en `CLAUDE.md`).
- Validación de origen: dual header `Origin` + User-Agent porque Apps Script no envía `Origin`. Ver `docs/fix-google-apps-script-origin.md`.

---

### ADR-003: Firebase Auth con Google Sign-In para el panel admin

**Fecha:** 2025-Q4
**Estado:** Implementado

**Decisión:** Usar Firebase Authentication con proveedor Google OAuth para proteger el panel `/admin`.

**Razón:** Costo cero en el free tier de Firebase. No requiere base de datos de usuarios propia. Integración nativa con AngularFire. Los administradores ya tienen cuentas Google.

**Consecuencias conocidas:**
- El `authGuard` retorna `true` en SSR (Firebase no se inicializa en el servidor). Las rutas `/admin` no exponen datos sensibles en el HTML renderizado en servidor.
- La lista de usuarios autorizados se gestiona manualmente en Firebase Console — no hay flujo de registro.
- No hay roles diferenciados actualmente (todo o nada). Cuando haya más de 2 admins, implementar custom claims.
- Firebase ID token debe verificarse server-side antes de firmar uploads de Cloudinary (pendiente según OWASP A01).

---

### ADR-004: Cloudinary para almacenamiento y CDN de media

**Fecha:** 2025-Q3
**Estado:** Implementado

**Decisión:** Usar Cloudinary para almacenar y distribuir imágenes y videos de eventos. Los uploads se firman server-side desde `server.ts`.

**Razón:** Costo cero en el free tier (25 créditos/mes). Transformaciones on-the-fly sin pre-procesar (resize, quality auto, format auto, blur). CDN global. SDK Angular oficial.

**Consecuencias conocidas:**
- El `CLOUDINARY_API_SECRET` nunca debe llegar al cliente — solo existe en el servidor Lambda.
- El endpoint `/api/cloudinary/signature` en `server.ts` debe verificar el Firebase ID token antes de firmar (pendiente según OWASP A01).
- `public_id` se guarda en el campo `media_id` del evento en el JSON.
- Free tier tiene límite de bandwidth — monitorear si el tráfico de eventos crece.

---

### ADR-005: Angular Signals + Zoneless (sin Zone.js, sin NgRx)

**Fecha:** 2025-Q4 (migración desde Angular 20)
**Estado:** Implementado

**Decisión:** Usar `provideZonelessChangeDetection()` + `ChangeDetectionStrategy.OnPush` + Signals para toda la gestión de estado. Sin Zone.js, sin NgRx, sin BehaviorSubject.

**Razón:** Signals son el estándar de Angular 21+. Zoneless mejora el rendimiento significativamente en Lambda (sin overhead de Zone.js). NgRx es excesivo para este volumen de estado.

**Consecuencias conocidas:**
- `effect()` debe usarse con cuidado — solo para side effects reales (no para derivar estado, usar `computed()` para eso).
- `ChangeDetectorRef.markForCheck()` es necesario en casos donde la detección de cambios no se dispara automáticamente en contextos fuera de Angular (ej. callbacks de Firebase).

---

### ADR-006: PrimeNG 21 con preset LTPreset personalizado

**Fecha:** 2025-Q4
**Estado:** Implementado

**Decisión:** Usar PrimeNG 21.x con el nuevo sistema de theming basado en `@primeuix/themes` y un preset personalizado `LTPreset` definido en `src/tema/lt-tema.ts`.

**Razón:** PrimeNG 21 abandona el theming basado en CSS variables globales en favor de design tokens. `LTPreset` permite personalizar todos los tokens con prefijo `lt` sin romper los componentes base. Dark mode con selector `.tema-oscuro` en `<html>`.

**Consecuencias conocidas:**
- Los componentes PrimeNG se importan individualmente en `src/app/compartidos/modulos/primeng/primeng-module.ts` para tree-shaking.
- NO usar `@import` en SCSS. Siempre `@use "ruta" as alias`.
- Color primario: `#00B7A3` (turquesa Le Tiende).

---

### ADR-007: Bilingüismo ES/EN con estructura JSON dual

**Fecha:** 2025-Q3
**Estado:** Implementado

**Decisión:** Todo el contenido del sitio tiene estructura `{ idiomas: { es: {...}, en: {...} } }`. El idioma activo se controla con el signal `LtConfig.idioma`. Los componentes usan `computed()` para filtrar por idioma.

**Razón:** Requisito de negocio para atender audiencia internacional. La estructura dual en el JSON permite cambiar de idioma en el cliente sin peticiones adicionales al servidor.

**Consecuencias conocidas:**
- Siempre usar optional chaining al acceder a datos remotos: `datos()?.idiomas?.es?.eventos` — el JSON puede estar vacío al inicializar.
- La señal `idioma` es `'ES' | 'EN'` (mayúsculas). Verificar consistencia al comparar.

---

### ADR-008: AWS SES para correo institucional (migración completada)

**Fecha:** 2026-Q1
**Estado:** Implementado y en producción

**Decisión:** Migrar el sistema de correo a AWS SES con flujo SES → SNS → Lambda `letiende-email-forwarder` → Gmail para recepción, y Lambda `api.letiende.co` endpoint `/mensaje` para envío.

**Razón:** AWS SES es el servicio de email más económico disponible (~$0.10 por 1000 emails). Integración natural con el resto de la infraestructura AWS. Permite redirecciones configurables sin redespliegue (via SSM Parameter Store).

**Consecuencias conocidas:**
- Las redirecciones se configuran en SSM: `/letiende/prod/FORWARD_MAP`. Ver `docs/servicio-email.md`.
- Región: `us-east-1` (consistente con todo el stack).
- Lambda de reenvío: `letiende-email-forwarder`. Código en `external_resources/AWS_Lambda_EmailForwarder/`.
- Redirecciones activas: `info@`, `eventos@`, `reservas@`, `libreria@`, catch-all `*@`.
- Nomenclatura de recursos AWS: `{slug}-{componente}` donde slug = `letiende` para este dominio.

---

### ADR-009: Glassmorphism como identidad visual

**Fecha:** 2025-Q3
**Estado:** Implementado — no negociable

**Decisión:** El principio visual central del sitio es glassmorphism: fondos semitransparentes con `backdrop-filter: blur()`, bordes sutiles y sombras difusas. Microanimaciones en todos los componentes interactivos.

**Razón:** Decisión de diseño de marca del cliente. Diferenciador visual respecto a sitios culturales típicos.

**Consecuencias conocidas:**
- Mixins en `src/tema/mixins.scss`: `glass-heavy`, `glass-soft`, `glass-frosted`. Usar siempre estos, nunca hardcodear `rgba`.
- Las rutas de SCSS son manuales (sin `stylePreprocessorOptions` en `angular.json`):
  - `vistas/*/` → 3 niveles: `../../../tema/mixins.scss`
  - `compartidos/componentes/*/` → 4 niveles: `../../../../tema/mixins.scss`
  - `vistas/admin/eventos/form-evento/` → 5 niveles: `../../../../../tema/mixins.scss`

---

### ADR-010: Standalone components por defecto (Angular 21)

**Fecha:** 2025-Q4
**Estado:** Implementado

**Decisión:** Todos los componentes son standalone por defecto en Angular 21. No se declara `standalone: true` (es el default). Los únicos "módulos" son los barrels de PrimeNG e iconos en `src/app/compartidos/modulos/`.

**Consecuencias conocidas:**
- NO usar `CommonModule` — importar pipes específicos (`AsyncPipe`, `CurrencyPipe`, etc.) directamente.
- NO poner `standalone: true` en el decorador — ya no existe en Angular 21.

---

### ADR-011: Seguridad OWASP integrada en CLAUDE.md

**Fecha:** Abril 2026
**Estado:** Documentado — pendiente implementación en código

**Decisión:** Agregar sección `## Seguridad (OWASP)` en `CLAUDE.md` con reglas obligatorias mapeadas a OWASP Top 10 (2021), específicas para la arquitectura de letiende.co.

**Vulnerabilidades cubiertas y pendientes de implementar en código:**

| Ítem | Archivo | Estado |
|---|---|---|
| `X-API-Key` en `/actualizarContenido` | `external_resources/AWS_Lambda/index.mjs` | Pendiente |
| Verificar Firebase ID token en `/api/cloudinary/signature` | `src/server.ts` | Pendiente |
| Validación anti-SSRF en `/coverDiscogs` | `external_resources/AWS_Lambda/index.mjs` | ✅ Completado (2026-04-13) |
| Headers de seguridad HTTP en `server.ts` | `src/server.ts` | ✅ Completado (2026-04-13) |
| Rate limiting en endpoints Lambda públicos | `external_resources/AWS_Lambda/index.mjs` | Pendiente |
| Validación de esquema estricta antes de `s3.putObject` | `external_resources/AWS_Lambda/libs/funciones.mjs` | Pendiente |
| Reglas Firestore deny-all por defecto | `firebase.json` / Firestore Rules | Pendiente |

---

## Dependencias instaladas

### Producción (`dependencies`)

| Paquete | Versión declarada | Propósito |
|---|---|---|
| `@angular/animations` | ^21.1.3 | Animaciones Angular |
| `@angular/cdk` | ^21.1.3 | Component Dev Kit (BreakpointObserver) |
| `@angular/common` | ^21.1.3 | Pipes, directivas comunes |
| `@angular/compiler` | ^21.1.3 | Compilador Angular |
| `@angular/core` | ^21.1.3 | Core framework |
| `@angular/fire` | ^21.0.0-rc.0 | Firebase SDK para Angular |
| `@angular/forms` | ^21.1.3 | Reactive Forms |
| `@angular/platform-browser` | ^21.1.3 | Browser platform |
| `@angular/platform-server` | ^21.1.3 | Server platform (SSR) |
| `@angular/router` | ^21.1.3 | Router |
| `@angular/ssr` | ^21.1.2 | Server-Side Rendering |
| `@cloudinary/ng` | ^2.1.5 | SDK Cloudinary para Angular |
| `@cloudinary/url-gen` | ^1.21.0 | Generación de URLs Cloudinary |
| `@codegenie/serverless-express` | ^4.16.0 | Adaptador Express → Lambda |
| `@fortawesome/angular-fontawesome` | ^4.0.0 | FontAwesome para Angular |
| `@fortawesome/free-brands-svg-icons` | ^7.1.0 | Iconos de marcas |
| `@fortawesome/free-regular-svg-icons` | ^7.1.0 | Iconos regular |
| `@fortawesome/free-solid-svg-icons` | ^7.1.0 | Iconos sólidos |
| `@primeuix/themes` | ^2.0.3 | Sistema de temas PrimeNG |
| `cloudinary` | ^2.7.0 | SDK Cloudinary (server-side) |
| `express` | ^5.1.0 | HTTP server para SSR |
| `primeng` | ^21.1.1 | Componentes UI |
| `rxjs` | ~7.8.0 | Programación reactiva |
| `tslib` | ^2.3.0 | Helpers TypeScript |

### Desarrollo (`devDependencies`)

| Paquete | Versión declarada | Propósito |
|---|---|---|
| `@angular/build` | ^21.1.2 | Build tooling Angular |
| `@angular/cli` | ^21.1.2 | CLI Angular |
| `@angular/compiler-cli` | ^21.1.3 | Compilador CLI |
| `@types/express` | ^5.0.1 | Tipos TypeScript para Express |
| `@types/jasmine` | ~5.1.0 | Tipos para testing |
| `@types/node` | ^22.13.4 | Tipos Node.js |
| `jasmine-core` | ~5.7.0 | Framework de testing |
| `karma` | ~6.4.0 | Test runner |
| `karma-chrome-launcher` | ~3.2.0 | Karma + Chrome |
| `karma-coverage` | ~2.2.0 | Cobertura de tests |
| `karma-jasmine` | ~5.1.0 | Karma + Jasmine |
| `karma-jasmine-html-reporter` | ~2.1.0 | Reportes HTML |
| `serverless` | ^4.31.2 | Framework de despliegue |
| `typescript` | ~5.9.3 | Compilador TypeScript |

### Lambda `api.letiende.co` (dependencias en Layer, no en package.json)

| Dependencia | Propósito |
|---|---|
| Layer: `externalAPIs:2` | Dependencias externas de la Lambda letiende-api |
| `disconnect` (CommonJS) | Cliente Discogs API — es CommonJS, importar con `createRequire` |

---

## Configuraciones vigentes

### AWS

| Recurso | Valor |
|---|---|
| Región | `us-east-1` |
| Lambda SSR (prod) | `letiende-prod-main` |
| Lambda SSR (dev) | `letiende-dev-main` |
| Lambda API pública | `
letiende-api` · ARN: `arn:aws:lambda:us-east-1:696912647258:function:letiende-api` |
| Lambda email forwarder | `letiende-email-forwarder` |
| S3 bucket assets | `letiende-assets` |
| CDN assets | `https://assets.letiende.co` |
| Parámetros SSM | `/letiende/prod/*` y `/letiende/dev/*` |

### Firebase

| Parámetro | Referencia |
|---|---|
| Project ID | En SSM: `/letiende/prod/FIREBASE_PROJECT_ID` |
| Auth domain | `{projectId}.firebaseapp.com` |
| Proveedor activo | Google Sign-In |
| Firestore | Disponible, sin datos (reglas pendientes) |
| Storage | Disponible, sin uso (reglas pendientes) |

### Cloudinary

| Parámetro | Referencia |
|---|---|
| Cloud name | En SSM: `/letiende/prod/CLOUDINARY_CLOUD_NAME` |
| API key | En SSM: `/letiende/prod/CLOUDINARY_API_KEY` |
| API secret | En SSM: `/letiende/prod/CLOUDINARY_API_SECRET` (solo servidor) |

### Angular / Build

| Configuración | Valor |
|---|---|
| Locale | `es-CO` |
| Change detection | `provideZonelessChangeDetection()` + `OnPush` |
| Dark mode selector | `.tema-oscuro` en `<html>` |
| Theme prefix | `lt` (LTPreset) |
| Base href prod | `/` |
| Base href dev | `/dev/` |
| SSR render mode | `RenderMode.Server` en todas las rutas |
| Path aliases | `@vistas`, `@servicios`, `@componentes`, `@modulos`, `@core` |

### Git

| Parámetro | Valor |
|---|---|
| Rama producción | `main` |
| Rama desarrollo | `2025` |
| Formato de commits | Conventional Commits en español |
| Versionado | Semantic Versioning · v2.0.0-alpha en curso |

---

## Patrones de código establecidos

### Patrón de vista (seguir `menu.ts` como referencia)

```typescript
export default class MiVista {
  private readonly ltConfig: LtConfig = inject(LtConfig);
  private readonly meta: MetaService = inject(MetaService);
  private readonly bp: BreakpointService = inject(BreakpointService);
  private readonly datos: Datos = inject(Datos);

  protected readonly idioma: Signal<string> = computed(() => this.ltConfig.idioma());
  protected readonly breakpoint: Signal<string> = computed(() => this.bp.getCurrentBreakpoint());
  protected readonly datosCompleto = toSignal(this.datos.getXxx());
  protected readonly datosIdioma = computed(() =>
    this.datosCompleto()?.idiomas?.[this.idioma().toLowerCase() as 'es' | 'en']
  );
}
```

### Rutas de SCSS (sin stylePreprocessorOptions)

| Ubicación del componente | Ruta a mixins |
|---|---|
| `src/app/vistas/*/` | `../../../tema/mixins.scss` |
| `src/app/compartidos/componentes/*/` | `../../../../tema/mixins.scss` |
| `src/app/vistas/admin/*/` | `../../../../tema/mixins.scss` |
| `src/app/vistas/admin/eventos/form-evento/` | `../../../../../tema/mixins.scss` |

Siempre: `@use "../../../tema/mixins" as mixins;` (nunca `@import`)

### Iconos

| Sistema | Sintaxis | Cuándo usar |
|---|---|---|
| PrimeIcons | `<i class="pi pi-calendar"></i>` | Iconos de UI general |
| Material Symbols | `<span class="material-symbols-outlined">event</span>` | Iconos descriptivos |
| FontAwesome | `<lt-icono tipo="fas" nombre="music"></lt-icono>` | Siempre via componente `lt-icono` |

---

## Gotchas conocidos y lecciones aprendidas

| Situación | Solución |
|---|---|
| `@letiende_parkway` en template | Usar `&#64;letiende_parkway` — Angular 21 interpreta `@` como directiva |
| `<button />` self-closing | Angular 21 lanza NG5002. Siempre `<button></button>` |
| Signals con datos remotos | Siempre `datos()?.idiomas?.es?.eventos` — el JSON puede estar vacío al inicializar |
| `standalone: true` en decorador | No ponerlo — es el default en Angular 21 y genera warnings |
| `@import` en SCSS | Usar `@use "ruta" as alias` — `@import` está deprecado en Sass |
| Fechas en JSON de prueba | Deben ser futuras (la vista `/eventos` filtra `fecha_inicio > now`) |
| Deploy Lambda `letiende-api` | `aws lambda update-function-code --function-name letiende-api --zip-file fileb://bundle.zip` |
| `disconnect` (Discogs SDK) | Es CommonJS. Importar con `import { createRequire } from 'module'; const require = createRequire(import.meta.url)` |
| Transfer State con secretos | Solo pasar a Transfer State credenciales públicas de Firebase. `CLOUDINARY_API_SECRET` nunca al cliente |
| `CommonModule` en imports | No usar. Importar pipes específicos: `AsyncPipe`, `CurrencyPipe`, `DatePipe`, etc. |

---

## Documentos de referencia

| Documento | Propósito | Última revisión |
|---|---|---|
| `CLAUDE.md` | Reglas de desarrollo para IA (TypeScript, Angular, seguridad OWASP) | Abril 2026 |
| `PRD.md` | Product Requirements Document (negocio + roadmap) | Abril 2026 |
| `tech-specs.md` | Especificaciones técnicas completas | Abril 2026 |
| `README.md` | Guía de inicio rápido y arquitectura | Feb 2026 |
| `docs/AWS_EMAIL_SYSTEM.md` | Sistema de correo AWS SES completo | Feb 2026 |
| `docs/servicio-email.md` | Redirecciones activas y operación del correo | Feb 2026 |
| `docs/esquema-contenido.json` | Esquema JSON de todas las secciones del sitio | 2025 |
| `docs/fix-google-apps-script-origin.md` | Validación dual Origin + User-Agent para Apps Script | 2025 |

---

## Contexto de la sesión actual

**Sesión de Abril 2026 — Documentación + primera tarea de seguridad:**

1. Se crearon `PRD.md`, `tech-specs.md`, `MEMORY.md`, `TODO.md` y `docs/instrucciones-inicio.md`.
2. Se agregó la sección `## Seguridad (OWASP)` en `CLAUDE.md` con 7 categorías OWASP Top 10.
3. ✅ **T1 completada:** Headers de seguridad HTTP en `src/server.ts` (OWASP A05). Middleware con CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Build verificado.

**Próximas tareas (ver `TODO.md`):**
- T1: Crear `src/app/core/servicios/admin-menu.service.ts` (Admin de Menú — feature Alta)
- T2: Validación anti-SSRF en `GET /coverDiscogs` en `external_resources/AWS_Lambda/index.mjs` (OWASP A10)
