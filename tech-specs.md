# Especificaciones Técnicas — letiende.co

> **Stack:** Angular 21 SSR · AWS Lambda · Firebase · Cloudinary
> **Última actualización:** Abril 2026
> **Documentos relacionados:** [PRD.md](./PRD.md) · [README.md](./README.md)

---

## Tabla de contenidos

1. [Visión general de la arquitectura](#1-visión-general-de-la-arquitectura)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Frontend — Angular SSR](#4-frontend--angular-ssr)
5. [Backend y APIs externas](#5-backend-y-apis-externas)
6. [Gestión de contenido (CMS headless)](#6-gestión-de-contenido-cms-headless)
7. [Infraestructura y despliegue](#7-infraestructura-y-despliegue)
8. [Autenticación y seguridad](#8-autenticación-y-seguridad)
9. [Sistema de correo electrónico](#9-sistema-de-correo-electrónico)
10. [Gestión de secretos y variables de entorno](#10-gestión-de-secretos-y-variables-de-entorno)
11. [Convenciones de código y flujo de trabajo](#11-convenciones-de-código-y-flujo-de-trabajo)
12. [Roadmap técnico](#12-roadmap-técnico)

---

## 1. Visión general de la arquitectura

letiende.co es un sitio Angular 21 con Server-Side Rendering (SSR) desplegado en AWS Lambda. El contenido lo gestiona el equipo de Le Tiende sin intervención técnica a través de Google Sheets. Las imágenes y videos viven en Cloudinary. Los usuarios del panel admin se autentican con Firebase. El correo institucional se procesa con AWS SES.

```
┌───────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                          │
│          Angular hydration · Signals · Zoneless · OnPush          │
└────────────────────────┬──────────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼──────────────────────────────────────────┐
│          AWS API Gateway + Lambda (letiende-{stage}-main)         │
│          Angular SSR (AngularNodeAppEngine) + Express 5           │
│          Runtime: Node.js 22.x · Handler: server.handler          │
│          Endpoints internos: /api/cloudinary/*                    │
└─────┬──────────┬──────────────┬──────────────┬────────────────────┘
      │          │              │              │
  Firebase   Cloudinary    assets.          api.letiende.co
  Auth/FS    CDN imgs/     letiende.co      (Lambda separado)
  Analytics  videos        S3 · JSON CDN    Node.js 22.x
                                │                │
                         Google Sheets    APIs externas:
                         + Apps Script    Discogs · Google Books
                                          Google Calendar
                                          AWS SES · reCAPTCHA
```

**Capas:**

| Capa | Descripción |
|---|---|
| **Presentación** | Angular 21 SSR. Componentes standalone con Signals y OnPush. PrimeNG para UI. |
| **Lógica de aplicación** | Servicios Angular (`datos`, `auth`, `adminEventos`, `cloudinaryApi`, `meta`, `calendario`). |
| **API backend** | Lambda `api.letiende.co`: actualizar contenido, libros, discogs, email, recaptcha. |
| **Datos estáticos** | Archivos JSON en S3 (`assets.letiende.co`). Actualizados por Apps Script o el admin. |
| **Autenticación** | Firebase Authentication con Google Sign-In. |
| **Media** | Cloudinary: almacenamiento, transformaciones y CDN de imágenes y videos. |
| **Infraestructura** | AWS (Lambda, API Gateway, S3, SES, SSM, Route 53). Serverless Framework 4.x. |

---

## 2. Stack tecnológico

| Tecnología | Versión | Propósito | Documentación |
|---|---|---|---|
| Angular | 21.1.3 | Framework frontend, SSR | https://angular.dev |
| @angular/ssr | 21.1.2 | Server-Side Rendering | https://angular.dev/guide/ssr |
| TypeScript | 5.9.3 | Tipado estático | https://typescriptlang.org |
| PrimeNG | 21.1.1 | Biblioteca de componentes UI | https://primeng.org |
| @primeuix/themes | 2.0.3 | Sistema de temas PrimeNG | https://primeng.org/theming |
| AngularFire | 21.0.0-rc | Firebase SDK para Angular | https://github.com/angular/angularfire |
| @cloudinary/ng | 2.1.5 | SDK Cloudinary para Angular | https://cloudinary.com/documentation/angular_integration |
| @cloudinary/url-gen | 1.21.0 | Generación de URLs Cloudinary | https://cloudinary.com/documentation |
| @fortawesome/angular-fontawesome | 4.0.0 | Iconos FontAwesome | https://github.com/FortAwesome/angular-fontawesome |
| Express | 5.1.0 | HTTP server para SSR | https://expressjs.com |
| @codegenie/serverless-express | 4.16.0 | Adaptador Express → Lambda | https://github.com/CodeGenieApp/serverless-express |
| Serverless Framework | 4.31.2 | IaC y despliegue en AWS | https://serverless.com/framework/docs |
| Node.js | 22.x | Runtime AWS Lambda | https://nodejs.org |
| Firebase Auth | — | Autenticación federada (Google) | https://firebase.google.com/docs/auth |
| Firebase Firestore | — | Base de datos NoSQL | https://firebase.google.com/docs/firestore |
| Firebase Storage | — | Almacenamiento de archivos | https://firebase.google.com/docs/storage |
| Firebase Analytics | — | Seguimiento de usuarios | https://firebase.google.com/docs/analytics |
| AWS Lambda | — | Hosting SSR + APIs | https://aws.amazon.com/lambda |
| AWS S3 | — | CDN de assets estáticos y JSON | https://aws.amazon.com/s3 |
| AWS SES | — | Envío y recepción de email | https://aws.amazon.com/ses |
| AWS SSM | — | Gestión segura de secretos | https://aws.amazon.com/systems-manager/features |
| Google Apps Script | — | Automatización: Sheets → Lambda | https://developers.google.com/apps-script |
| Google Calendar API | — | Sincronización de eventos | https://developers.google.com/calendar |
| Cloudinary | — | Almacenamiento y CDN de media | https://cloudinary.com/documentation |

**Configuraciones especiales de Angular:**

| Configuración | Valor | Impacto |
|---|---|---|
| Change detection | `provideZonelessChangeDetection()` | Sin Zone.js, mayor rendimiento |
| Estrategia | `ChangeDetectionStrategy.OnPush` | Solo detecta cambios en inputs o eventos explícitos |
| Locale | `LOCALE_ID: 'es-CO'` | Formateo de fechas y números en español colombiano |
| Tema PrimeNG | Preset `LTPreset` | Tokens CSS con prefijo `lt`, dark mode con selector `.tema-oscuro` |

---

## 3. Estructura del repositorio

```
letiende.co/
├── src/
│   ├── app/
│   │   ├── app.ts                          # Componente raíz
│   │   ├── app.routes.ts                   # Definición de rutas
│   │   ├── app.routes.server.ts            # RenderMode.Server para todas las rutas
│   │   ├── app.config.ts                   # Providers Angular (cliente)
│   │   ├── app.config.server.ts            # Providers Angular (SSR)
│   │   ├── app.html / app.scss             # Layout principal
│   │   │
│   │   ├── compartidos/                    # Código reutilizable entre vistas
│   │   │   ├── componentes/
│   │   │   │   ├── navbar/                 # Barra de navegación, idioma, tema
│   │   │   │   ├── menu-lateral/           # Sidebar con categorías del menú
│   │   │   │   ├── evento-card/            # Tarjeta de evento (pública)
│   │   │   │   ├── dialogo-login/          # Modal de autenticación Google
│   │   │   │   ├── evento-media.ts         # Handler de imagen/video de eventos
│   │   │   │   ├── imagen-fondo.ts         # Imagen de fondo glassmorphism
│   │   │   │   └── icono.ts                # Wrapper unificado: PrimeIcons / FA / Material
│   │   │   ├── modulos/
│   │   │   │   ├── primeng/primeng-module.ts   # Barrel de imports PrimeNG (tree-shaking)
│   │   │   │   └── iconos/iconos-module.ts     # Barrel de imports FontAwesome
│   │   │   └── servicios/
│   │   │       ├── datos.ts                # HTTP: menu.json + eventos.json desde CDN
│   │   │       ├── lt-config.ts            # Config global: idioma, tema, URLs base
│   │   │       ├── meta.ts                 # SEO: Open Graph, Twitter Card, canonical
│   │   │       ├── cloudinary-api.ts       # Upload firmado + detalles de recursos
│   │   │       ├── cloudinary-config.ts    # InjectionToken + Transfer State
│   │   │       ├── firebase-config.ts      # InjectionToken + Transfer State
│   │   │       ├── breakpoint-service.ts   # Responsive: xs|sm|md|lg|xl (signal)
│   │   │       └── calendario.ts           # Google Calendar URL + descarga .ics
│   │   │
│   │   ├── core/
│   │   │   ├── servicios/
│   │   │   │   ├── auth.service.ts             # Firebase Auth con Signals
│   │   │   │   └── admin-eventos.service.ts    # CRUD eventos + Google Calendar sync
│   │   │   └── guards/
│   │   │       └── auth.guard.ts               # authGuard (requiere auth) + publicGuard
│   │   │
│   │   └── vistas/
│   │       ├── inicio/                     # Hero landing
│   │       ├── menu/                       # Menú bilíngüe con categorías
│   │       ├── eventos/                    # Galería de eventos futuros
│   │       └── admin/
│   │           ├── admin.ts/html/scss       # Dashboard admin
│   │           └── eventos/
│   │               ├── admin-eventos.ts/html/scss  # Lista + CRUD de eventos
│   │               └── form-evento/                # Formulario reactivo bilíngüe
│   │
│   ├── tema/
│   │   ├── lt-tema.ts      # Preset PrimeNG personalizado (LTPreset)
│   │   ├── mixins.scss     # Mixins glassmorphism y utilidades CSS
│   │   └── var.scss        # Variables CSS / design tokens
│   │
│   ├── server.ts           # Express + AngularNodeAppEngine + /api/cloudinary/*
│   ├── main.ts / main.server.ts
│   ├── index.html
│   ├── styles.scss
│   └── secrets.ts          # [gitignored] Secretos para desarrollo local
│
├── docs/                   # Documentación técnica adicional
│   ├── AWS_EMAIL_SYSTEM.md
│   ├── servicio-email.md
│   ├── plan-servicio-email.md
│   ├── esquema-contenido.json
│   └── ...
│
├── external_resources/
│   ├── AWS_Lambda/         # Código de api.letiende.co (index.mjs + libs/)
│   ├── AWS_Lambda_EmailForwarder/
│   └── Google_Apps_Script/ # actualizarContenido.gs
│
├── angular.json
├── serverless.yml          # IaC: Lambda, API Gateway, referencias a SSM
├── tsconfig.json           # Path aliases (ver tabla abajo)
├── package.json
└── setup-secrets.sh        # Carga secretos desde SSM a secrets.ts local
```

**Path aliases configurados en `tsconfig.json`:**

| Alias | Ruta real | Uso típico |
|---|---|---|
| `@vistas/*` | `src/app/vistas/*` | `import { Inicio } from '@vistas/inicio/inicio'` |
| `@servicios/*` | `src/app/compartidos/servicios/*` | `import { Datos } from '@servicios/datos'` |
| `@componentes/*` | `src/app/compartidos/componentes/*` | `import { Navbar } from '@componentes/navbar/navbar'` |
| `@modulos/*` | `src/app/compartidos/modulos/*` | `import { PrimengModule } from '@modulos/primeng/primeng-module'` |
| `@core/*` | `src/app/core/*` | `import { AuthService } from '@core/servicios/auth.service'` |

---

## 4. Frontend — Angular SSR

### 4.1 Patrones arquitectónicos

| Patrón | Descripción | Regla |
|---|---|---|
| **Standalone components** | Sin NgModules propios. Imports directos en cada componente. | Obligatorio. No declarar `standalone: true` (es el default). |
| **Signals** | Estado reactivo con `signal()`, `computed()`, `effect()`. Sin NgRx, sin BehaviorSubject. | Usar para todo estado local y global. |
| **Zoneless** | Sin Zone.js. `provideZonelessChangeDetection()` en `app.config.ts`. | No usar `NgZone.run()`. |
| **OnPush** | `ChangeDetectionStrategy.OnPush` en todos los componentes. | Sin excepción. |
| **inject()** | Inyección funcional de dependencias. | Nunca usar constructor injection. |
| **Control flow nativo** | `@if`, `@for`, `@switch` en templates. | No usar `*ngIf`, `*ngFor`, `*ngSwitch`. |
| **input() / output()** | Funciones en lugar de decoradores. | No usar `@Input()`, `@Output()`. |
| **host bindings** | Declarar en el objeto `host` del decorador `@Component`. | No usar `@HostBinding`, `@HostListener`. |
| **Bindings nativos** | `[class.nombre]`, `[style.propiedad]`. | No usar `ngClass`, `ngStyle`. |

### 4.2 Rutas y navegación

Definidas en `src/app/app.routes.ts`:

| Ruta | Componente | Guard | Carga | Notas |
|---|---|---|---|---|
| `/` | — | — | — | Redirect a `/inicio` |
| `/inicio` | `Inicio` | — | Eager | Hero landing |
| `/menu` | `Menu` | — | Eager + preload | Menú bilíngüe |
| `/menu/:categoria` | `Menu` | — | Eager + preload | Categoría por slug |
| `/eventos` | `Eventos` | — | Eager + preload | Solo eventos futuros |
| `/admin` | `Admin` | `authGuard` | Eager | Dashboard |
| `/admin/eventos` | `AdminEventos` | `authGuard` | **Lazy** (`loadComponent`) | CRUD de eventos |
| `**` | — | — | — | Redirect a `/` |

Todas las rutas usan `RenderMode.Server` (definido en `app.routes.server.ts`).

### 4.3 Modelos de datos

Los datos del sitio se cargan desde archivos JSON alojados en `assets.letiende.co`. Ambos tienen una estructura bilíngüe envuelta en un wrapper común:

```
EventosResponse / MenuResponse
├── seccion: string
├── idiomas
│   ├── es: EventosIdioma / MenuIdioma
│   └── en: EventosIdioma / MenuIdioma
├── metadata
│   ├── autor: string
│   ├── version: string
│   └── publicado: boolean
└── timestamp: string (ISO 8601)
```

**Modelo `Evento`** (dentro de `EventosIdioma.eventos[]`):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único del evento |
| `titulo` | string | Título del evento (bilíngüe) |
| `descripcion` | string | Descripción larga (bilíngüe) |
| `fecha_inicio` | string | ISO 8601 |
| `fecha_fin` | string | ISO 8601 |
| `ubicacion` | string | Nombre del espacio (ej: "Le Teatre") |
| `media_id` | string | Public ID del recurso en Cloudinary |
| `media_tipo` | `'imagen' \| 'video'` | Tipo de media principal |
| `artistas` | `EventoArtista[]` | `{ nombre, bio }` |
| `precios` | `EventoPrecio[]` | `{ categoria, valor, moneda, tipo_venta }` |
| `forma_pago` | `FormaPagoItem[]` | `{ tipo, telefono? }` |
| `capacidad` | number | Aforo máximo |
| `entradas_disponibles` | number | Entradas restantes |
| `enlaces` | object | `{ boletas, instagram, tiktok, web }` |
| `codigo_pulep` | string | Código PULEP (opcional) |
| `categorias` | string[] | Etiquetas del evento |
| `destacado` | boolean | Aparece en portada |

**Modelo `MenuItem`** (dentro de `MenuCategoria.items[]`):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único |
| `nombre` | string | Nombre del ítem |
| `descripcion` | string | Descripción corta |
| `precio` | number | Precio en COP |
| `disponible` | boolean | Visibilidad en el menú |
| `alergenos` | string[] | Alérgenos presentes |
| `opciones` | `MenuOpcion[]` | Variantes del ítem |
| `imagen_id` | string | Public ID en Cloudinary (opcional) |

### 4.4 Sistema de temas y diseño

**Glassmorphism** es el principio visual central. Para implementarlo correctamente:

- Usar los mixins definidos en `src/tema/mixins.scss`:
  - `glass-heavy`: fondo muy opaco, para elementos principales.
  - `glass-soft`: fondo semitransparente, para tarjetas secundarias.
  - `glass-frosted`: máximo efecto blur, para overlays.
- Usar variables CSS de PrimeNG (`--p-text-color`, `--p-primary-color`, etc.) en lugar de valores hardcodeados.
- El color primario del tema es `#00B7A3` (turquesa Le Tiende).

**Dark / Light mode:**
- Toggle en el navbar. Modifica la clase `.tema-oscuro` en el elemento `<html>`.
- Persistido en el signal `LtConfig.modoTema`.
- PrimeNG detecta el cambio automáticamente gracias al selector `.tema-oscuro`.

**Sistema de iconos unificado** — componente `src/app/compartidos/componentes/icono.ts`:
- Acepta `tipo: 'pi' | 'fas' | 'material-symbols-outlined'` y `nombre`.
- Usar este componente en lugar de renderizar los iconos directamente.

**Rutas de SCSS** (sin `stylePreprocessorOptions` configurado en `angular.json`):
- Desde `vistas/*/`: `../../../tema/mixins.scss` (3 niveles hacia arriba).
- Desde `compartidos/componentes/*/`: `../../../../tema/mixins.scss` (4 niveles).
- Usar siempre `@use "ruta" as alias;` (no `@import`).

### 4.5 SEO y Server-Side Rendering

**`MetaService`** (`src/app/compartidos/servicios/meta.ts`):
- Actualiza `<title>`, `<meta name="description">`, Open Graph, Twitter Card, canonical y robots.
- Llamar en cada componente de vista al inicializar.

**Transfer State:**
- `FirebaseConfig` y `CloudinaryConfig` usan el patrón Transfer State para transferir credenciales del servidor al cliente sin exponerlas como variables JS globales.
- Implementado con `StateKey` y el servicio `TransferState` de Angular.

**HTTP Transfer Cache:**
- `withHttpTransferCacheOptions()` en `app.config.ts` evita que el cliente repita las peticiones HTTP ya realizadas en el servidor.
- Solo aplica a peticiones GET; los POSTs no se cachean.

**`APP_BASE_HREF`:**
- Dinámico según el stage: `/dev/` en desarrollo, `/` en producción.
- Inyectado desde variables de entorno en `app.config.server.ts`.
- `server.ts` ajusta los redirects del SSR según este valor.

---

## 5. Backend y APIs externas

### 5.1 API pública: api.letiende.co

Lambda Node.js 22.x desplegada independientemente. ARN: `arn:aws:lambda:us-east-1:696912647258:function:letiende-api`. Código fuente en `external_resources/AWS_Lambda/`.

| Endpoint | Método | Llamado por | Descripción |
|---|---|---|---|
| `/actualizarContenido` | POST | Google Apps Script, Admin Angular | Recibe JSON de contenido, lo guarda en S3 |
| `/discogs` | GET | (futuro) Admin librería | Búsqueda de álbumes en Discogs por código de barras o artista/álbum |
| `/coverDiscogs` | GET | (futuro) Admin librería | Obtiene portada de álbum desde Discogs |
| `/libros` | GET | (futuro) Admin librería | Búsqueda en Google Books API |
| `/mensaje` | POST | (futuro) Formulario contacto | Envío de email via AWS SES |
| `/recaptcha` | POST | (futuro) Formulario contacto | Validación de token reCAPTCHA v3 |

**Payload de `/actualizarContenido`:**
```json
{
  "seccion": "menu | eventos | inicio | auditorio | libreria | contacto | nosotros",
  "idiomas": {
    "es": { "...contenido en español..." },
    "en": { "...contenido en inglés..." }
  },
  "metadata": {
    "autor": "nombre del editor",
    "version": "1.0",
    "publicado": true
  }
}
```

Validaciones: `seccion` es obligatorio y debe ser una sección válida. `idiomas.es` es obligatorio. CORS: origen `https://script.google.com` autorizado vía validación dual (header `Origin` + User-Agent). Timestamp agregado automáticamente al payload si no existe.

### 5.2 Endpoints internos (server.ts)

El propio servidor SSR expone rutas `/api/*` para operaciones que requieren credenciales de servidor:

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/cloudinary/signature` | POST | Genera firma HMAC-SHA256 para upload seguro a Cloudinary. `CLOUDINARY_API_SECRET` nunca llega al cliente. |
| `/api/cloudinary/details` | POST | Obtiene metadata de un recurso Cloudinary por `public_id` usando credenciales de servidor. |

### 5.3 Firebase

| Servicio | Estado | Uso |
|---|---|---|
| **Authentication** | Activo | Login administrador con Google Sign-In |
| **Analytics** | Activo | Screen tracking automático (`ScreenTrackingService`) |
| **Firestore** | Disponible (no usado aún) | Candidato natural para librería, reservas, datos dinámicos futuros |
| **Storage** | Disponible (no usado aún) | Alternativa a Cloudinary para uploads |

### 5.4 Cloudinary

**Flujo de upload de imagen:**
1. Admin selecciona imagen en `FormEvento`.
2. Frontend solicita firma a `/api/cloudinary/signature` (POST con `params` del upload).
3. Servidor genera firma HMAC y la retorna.
4. Frontend hace POST directo a `api.cloudinary.com/v1_1/{cloudName}/upload` con la firma.
5. Cloudinary responde con `public_id` y metadatos.
6. El `public_id` se guarda en el campo `media_id` del evento.

**Transformaciones on-the-fly** (sin necesidad de pre-procesar):
- `f_auto`: formato óptimo según navegador (WebP, AVIF).
- `q_auto`: calidad automática.
- `w_{n},c_fill`: resize con crop centrado.
- `e_blur:{n}`: desenfoque para imágenes de fondo.

### 5.5 Google Apps Script → Lambda → S3

Archivo fuente: `external_resources/Google_Apps_Script/actualizarContenido.gs`

```
1. Editor modifica una celda en Google Sheets
2. Trigger onEdit() se activa en Apps Script
3. Apps Script construye JSON según el esquema en docs/esquema-contenido.json
4. POST a https://api.letiende.co/actualizarContenido con el JSON
5. Lambda valida el JSON y agrega timestamp
6. Lambda guarda {seccion}.json en S3: s3://letiende-assets/data/{seccion}.json
7. Archivo disponible en: https://assets.letiende.co/data/{seccion}.json
8. El sitio lo consume en cada request (o desde caché CDN)
```

### 5.6 Google Calendar

**Sincronización desde `AdminEventosService`:**
- `sincronizarConCalendario(payload)`: POST al endpoint de Google Apps Script con `accion: 'crear' | 'editar'` y los datos del evento.
- `eliminarDeCalendario(eventoId)`: DELETE via Google Apps Script.

**Utilidades para el visitante** (`src/app/compartidos/servicios/calendario.ts`, métodos estáticos):
- `generarEnlaceGoogleCalendar(evento)`: Genera URL con parámetros pre-poblados para abrir directamente en Google Calendar.
- `generarArchivoIcs(evento)`: Genera string con formato iCalendar (.ics).
- `descargarArchivoIcs(evento)`: Dispara la descarga del archivo .ics en el navegador.

---

## 6. Gestión de contenido (CMS headless)

letiende.co no tiene un CMS tradicional. El contenido se gestiona con herramientas gratuitas de Google y se almacena como archivos JSON en S3.

**Flujo completo:**

```
Google Sheets (equipo edita)
        ↓
Google Apps Script (trigger onEdit)
        ↓
POST → api.letiende.co/actualizarContenido
        ↓
Lambda valida + agrega timestamp
        ↓
S3: letiende-assets/data/{seccion}.json
        ↓
CDN: https://assets.letiende.co/data/{seccion}.json
        ↓
Angular: servicio Datos.getMenu() / getEventos()
        ↓
Vista renderizada al visitante
```

**Archivos JSON en producción:**

| Archivo | URL | Actualizado por | Consumido en |
|---|---|---|---|
| `menu.json` | assets.letiende.co/data/menu.json | Google Sheets + Apps Script | Vista `/menu` |
| `eventos.json` | assets.letiende.co/data/eventos.json | Admin Angular + Apps Script | Vista `/eventos` |

> `eventos.json` tiene la particularidad de ser actualizable tanto desde el panel admin web (CRUD directo) como desde Google Sheets via Apps Script.

**Esquema de contenido:** Ver `docs/esquema-contenido.json` para la estructura completa de cada sección: `inicio`, `menu`, `eventos`, `auditorio`, `libreria`, `contacto`, `nosotros`.

---

## 7. Infraestructura y despliegue

### 7.1 Diagrama de infraestructura AWS

```
Route 53 (letiende.co, api.letiende.co, assets.letiende.co)
    │
    ├── API Gateway (HTTP) → Lambda: letiende-{stage}-main
    │       Handlers: / y /{proxy+}
    │       Runtime: Node.js 22.x
    │       Memory: configurable · Timeout: 29s (API Gateway limit)
    │       Env vars: desde SSM Parameter Store /letiende/{stage}/*
    │
    ├── API Gateway (HTTP) → Lambda: letiende-api (api.letiende.co)
    │       Runtime: Node.js 22.x
    │       Layer: externalAPIs:2
    │
    └── S3: letiende-assets
            /data/         → JSON de contenido (menu.json, eventos.json, ...)
            /logos/        → Assets estáticos del sitio
            /icons/        → Íconos institucionales
```

### 7.2 Multi-entorno

| Stage | URL | Base href | Secretos SSM | Comando de deploy |
|---|---|---|---|---|
| `dev` | letiende.co/dev/ | `/dev/` | `/letiende/dev/*` | `npm run deploy:dev` |
| `prod` | letiende.co/ | `/` | `/letiende/prod/*` | `npm run deploy:prod` |

### 7.3 Proceso de build y deploy

```bash
# 1. Build Angular SSR (genera dist/)
ng build --configuration production --base-href /[stage]/

# 2. Serverless empaqueta y despliega
sls deploy --stage [stage]
```

Lo que hace Serverless Framework:
1. Empaqueta `dist/letiende.co/browser/**` (assets cliente), `dist/letiende.co/server/**` (server.mjs) y `node_modules/@codegenie/serverless-express/**`.
2. Sube el ZIP a S3 interno de Serverless.
3. Actualiza el código de la función Lambda.
4. Actualiza las variables de entorno desde SSM.
5. Actualiza las rutas en API Gateway si hubo cambios.

**Scripts disponibles en `package.json`:**

| Script | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo local (`ng serve`) |
| `npm run build:ssr` | Build production con base-href `/` |
| `npm run build:ssr:dev` | Build production con base-href `/dev/` |
| `npm run serve:ssr:letiende.co` | Ejecuta el servidor SSR localmente (`node dist/.../server.mjs`) |
| `npm run deploy:dev` | Build + deploy a stage `dev` |
| `npm run deploy:prod` | Build + deploy a stage `prod` |

### 7.4 Optimización del bundle Lambda

Estrategia en `serverless.yml`:
```yaml
package:
  individually: true
  patterns:
    - "!**/*"                                          # Excluye todo
    - "dist/letiende.co/browser/**"                   # Assets del cliente
    - "dist/letiende.co/server/**"                    # Servidor SSR
    - "node_modules/@codegenie/serverless-express/**" # Runtime adaptador
```

Angular CLI ya bundlea la mayoría de las dependencias npm en `server.mjs`. Solo se incluye `@codegenie/serverless-express` como dependencia externa porque no está dentro del bundle Angular.

> **Nota de troubleshooting:** Si Lambda falla con "Cannot find module 'express'", agregar `node_modules/express/**` a los patterns de `serverless.yml`.

---

## 8. Autenticación y seguridad

### 8.1 Firebase Auth con Signals

`AuthService` en `src/app/core/servicios/auth.service.ts`:

| Signal | Tipo | Descripción |
|---|---|---|
| `usuario` | `Signal<UsuarioAuth \| null>` | Datos del usuario autenticado (readonly) |
| `cargando` | `Signal<boolean>` | Estado de carga al verificar sesión (readonly) |
| `error` | `Signal<string \| null>` | Mensaje de error (readonly) |
| `estaAutenticado` | `Signal<boolean>` | Computed: `usuario() !== null` |

**Métodos:**
- `loginConGoogle()`: Abre popup de Google Sign-In. Solo disponible en el navegador (`isPlatformBrowser`).
- `logout()`: Cierra la sesión Firebase.

**Comportamiento en SSR:** En el servidor, `cargando = false` y `usuario = null` (Firebase Auth no se inicializa en Node.js).

### 8.2 Guards de rutas

| Guard | Comportamiento en cliente | Comportamiento en SSR |
|---|---|---|
| `authGuard` | Espera a que `cargando` resuelva. Si `estaAutenticado`, continúa. Si no, redirige a `/inicio`. | Siempre retorna `true` (no bloquea el renderizado). |
| `publicGuard` | Si `estaAutenticado`, redirige a `/admin`. | Siempre retorna `true`. |

### 8.3 Seguridad en uploads a Cloudinary

- El `CLOUDINARY_API_SECRET` **nunca** llega al cliente.
- Los uploads requieren una firma generada en `server.ts` (`/api/cloudinary/signature`).
- La firma usa HMAC-SHA256 con el secreto de Cloudinary y los parámetros del upload.
- Sin firma válida, Cloudinary rechaza el upload.

### 8.4 Gestión de usuarios admin

- La lista de usuarios autorizados se gestiona desde Firebase Console → Authentication.
- No hay registro público. Solo el administrador del proyecto puede agregar nuevas cuentas.
- Actualmente no hay roles diferenciados (acceso completo o nulo).

---

## 9. Sistema de correo electrónico

Documentación completa: `docs/AWS_EMAIL_SYSTEM.md` y `docs/servicio-email.md`.

**Redirecciones activas:**

| Dirección | Destino | Mecanismo |
|---|---|---|
| info@letiende.co | Gmail equipo | SES → SNS → Lambda `letiende-email-forwarder` → SES SendRawEmail → Gmail |
| eventos@letiende.co | Gmail equipo | Mismo mecanismo |
| reservas@letiende.co | Gmail equipo | Mismo mecanismo |
| libreria@letiende.co | Gmail equipo | Mismo mecanismo |
| *@letiende.co | Gmail equipo | Catch-all para cualquier otra dirección |

**Cambiar destinos sin redesplegar:** Las direcciones de destino están almacenadas en AWS SSM Parameter Store (`/letiende/prod/FORWARD_MAP`). Se puede modificar sin tocar el código de la Lambda.

**Envío saliente:** El endpoint `POST /mensaje` en `api.letiende.co` permite enviar emails vía AWS SES desde el código de la aplicación. Usado (en el futuro) por el formulario de contacto.

**Región:** us-east-1 (consistente con toda la infraestructura).

---

## 10. Gestión de secretos y variables de entorno

### Desarrollo local

1. Ejecutar `./setup-secrets.sh dev` para cargar los valores desde SSM a `src/secrets.ts`.
2. `src/secrets.ts` está en `.gitignore` y nunca se sube al repositorio.
3. `app.config.ts` y `server.ts` importan `localSecrets` con try/catch; si el archivo no existe, usan variables de entorno.

### Producción (Lambda)

Todos los secretos viven en AWS SSM Parameter Store bajo `/letiende/{stage}/NOMBRE`. `serverless.yml` los inyecta como variables de entorno al desplegar:

```yaml
environment:
  CLOUDINARY_API_KEY: ${ssm:/letiende/${sls:stage}/CLOUDINARY_API_KEY}
```

### Variables completas

| Variable | Propósito | Contexto |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloud name para inicializar el SDK | Cliente + servidor |
| `CLOUDINARY_API_KEY` | API key para firmar uploads | Cliente + servidor |
| `CLOUDINARY_API_SECRET` | Secret para generar firmas de upload | **Solo servidor** |
| `FIREBASE_API_KEY` | Inicialización de Firebase | Cliente + servidor |
| `FIREBASE_APP_ID` | Identificador de la app Firebase | Cliente + servidor |
| `FIREBASE_AUTH_DOMAIN` | Dominio de autenticación Firebase | Cliente + servidor |
| `FIREBASE_MEASUREMENT_ID` | ID de Analytics | Cliente + servidor |
| `FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | Cliente + servidor |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | Cliente + servidor |
| `FIREBASE_STORAGE_BUCKET` | Bucket de Firebase Storage | Cliente + servidor |
| `APP_BASE_HREF` | Base href según stage (`/` o `/dev/`) | Solo servidor (SSR) |

---

## 11. Convenciones de código y flujo de trabajo

### Convenciones Angular

- **Idioma:** Español colombiano en comentarios, mensajes de error, nombres de variables de negocio. Términos técnicos del framework en inglés (signal, computed, input, etc.).
- **Tipos:** Siempre declarar el tipo explícito en todas las variables. Ejemplo: `const datos: DatosMenu = inject(DatosMenu)`.
- **Inyección:** Siempre `inject()`. Nunca constructor injection.
- **Change Detection:** `ChangeDetectionStrategy.OnPush` en todos los componentes sin excepción.
- **Host bindings:** En el objeto `host` del decorador, nunca `@HostBinding` / `@HostListener`.
- **Clases condicionales:** `[class.nombre]="condicion"`, nunca `[ngClass]`.
- **Estilos condicionales:** `[style.propiedad]="valor"`, nunca `[ngStyle]`.
- **Templates:** `@if`, `@for`, `@switch`. Nunca `*ngIf`, `*ngFor`.
- **Imports:** Siempre usar los path aliases de `tsconfig.json`.
- **`@` en templates:** Para texto literal como `@letiende_parkway`, usar `&#64;` (entidad HTML). Angular 21 interpreta `@` como directiva.
- **Self-closing tags:** No usar `<button />`. Angular 21 requiere `<button></button>`.

### Git workflow

**Ramas:**

| Rama | Propósito |
|---|---|
| `main` | Código en producción. Protegida. |
| `2025` | Rama principal de desarrollo activo. |
| `feature/*` | Nuevas funcionalidades. Se mergea a `2025`. |
| `fix/*` | Corrección de bugs. Se mergea a `2025`. |
| `hotfix/*` | Correcciones urgentes en producción. Mergea a `main` y `2025`. |

**Formato de commits** (Conventional Commits, en español):
```
<tipo>(<alcance>): <descripción en español>

Ejemplos:
feat(eventos): agregar descarga de archivo .ics por evento
fix(navbar): corregir selector de idioma que no cerraba en móvil
chore(deps): actualizar PrimeNG a 21.1.1
```

Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.

**Tags (Semantic Versioning):**

| Contexto | Formato | Ejemplo |
|---|---|---|
| Desarrollo en `2025` | `v{M}.{m}.{p}-alpha.{n}` | `v2.0.0-alpha.3` |
| Pruebas finales | `v{M}.{m}.{p}-rc.{n}` | `v2.0.0-rc.1` |
| Release en `main` | `v{M}.{m}.{p}` | `v2.0.0` |
| Hotfix en `main` | `v{M}.{m}.{p+1}` | `v2.0.1` |

### Agregar nuevas funcionalidades

Antes de implementar cualquier nueva funcionalidad verificar:
1. **Costo:** El servicio externo involucrado debe ser gratuito o de costo mínimo.
2. **Versiones:** Consultar la documentación de la versión exacta del stack (Angular 21, PrimeNG 21, etc.).
3. **Patrón:** Seguir el patrón establecido por el módulo de eventos admin (`AdminEventos` + `FormEvento`).
4. **Glassmorphism:** Los nuevos componentes deben seguir el principio visual definido en `mixins.scss`.

---

## 12. Roadmap técnico

> Funcionalidades con infraestructura parcial o completamente lista, pendientes de implementación en el frontend.

| Funcionalidad | Archivos a crear/modificar | APIs Lambda disponibles | Notas de implementación |
|---|---|---|---|
| **Admin de Menú** | `vistas/admin/menu/`, `core/servicios/admin-menu.service.ts` | `/actualizarContenido` ✅ | Seguir patrón de `AdminEventos`. El `menu.json` ya tiene el esquema. |
| **Catálogo de librería (público)** | `vistas/libreria/`, `compartidos/servicios/libreria.ts` | `/libros` ✅ | Definir si los datos vienen de Sheets o Firestore. Componente `LibroCard` similar a `EventoCard`. |
| **Admin de librería (CRUD)** | `vistas/admin/libreria/`, `form-libro/` | `/libros`, `/discogs`, `/coverDiscogs` ✅ | Decidir modelo de datos. Firestore es el backend natural para este caso. |
| **Formulario de contacto** | `vistas/contacto/` o componente en `/inicio` | `/mensaje`, `/recaptcha` ✅ | La Lambda ya maneja AWS SES. Solo falta el componente Angular con ReactiveForm. |
| **Reservas de eventos** | `vistas/reservas/`, posiblemente Firestore | `/mensaje` ✅ | Definir flujo: ¿Firestore para persistir reservas? ¿Confirmación por email automática? |
| **Roles en admin** | `auth.service.ts`, Firebase custom claims o Firestore | No necesaria | Solo cuando haya más de 2 admins con permisos distintos. Firebase custom claims es la solución nativa. |
| **Página "Nosotros"** | `vistas/nosotros/` | `/actualizarContenido` ✅ | La sección `nosotros` ya está en el esquema de contenido. Solo falta la vista y la hoja de Sheets. |
| **Página "Auditorio"** | `vistas/auditorio/` | `/actualizarContenido` ✅ | Similar a "Nosotros". Sección `auditorio` ya en el esquema. |
