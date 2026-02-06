# Le Tiende - Centro Cultural

> Aplicacion web de alto rendimiento con arquitectura serverless para Le Tiende - Centro cultural, libreria, cafe, bar y teatro ubicado en el Parkway de Bogota, Colombia.

[![Angular](https://img.shields.io/badge/Angular-21.x-red?logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21.x-blue?logo=primeng)](https://primeng.org)
[![Serverless](https://img.shields.io/badge/Serverless-4.x-fd5750?logo=serverless)](https://www.serverless.com/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?logo=amazonaws)](https://aws.amazon.com/lambda/)
[![Firebase](https://img.shields.io/badge/Firebase-21.x-FFCA28?logo=firebase)](https://firebase.google.com/)

---

## Tabla de Contenidos

- [Caracteristicas Principales](#caracteristicas-principales)
- [Stack Tecnologico](#stack-tecnologico)
- [Prerrequisitos](#prerrequisitos)
- [Inicio Rapido](#inicio-rapido)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuracion de Variables de Entorno](#configuracion-de-variables-de-entorno)
- [Sistema de Diseno](#sistema-de-diseno)
- [Rutas y Navegacion](#rutas-y-navegacion)
- [Servicios y APIs](#servicios-y-apis)
- [Integracion con Servicios Externos](#integracion-con-servicios-externos)
- [Scripts Disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)
- [Flujo de Trabajo Git](#flujo-de-trabajo-git)
- [Solucion de Problemas](#solucion-de-problemas)
- [Analisis de Costos](#analisis-de-costos)
- [Contribuciones](#contribuciones)

---

## Caracteristicas Principales

### Arquitectura Zero-Infrastructure Cost

Esta aplicacion demuestra como construir una aplicacion web moderna, escalable y de alto rendimiento utilizando **servicios gratuitos o de muy bajo costo**, eliminando la necesidad de servidores dedicados:

- **Angular 21 SSR + AWS Lambda**: Server-Side Rendering en funciones serverless sin administracion de servidores
- **Pay-per-request**: Solo se paga por las solicitudes reales, sin costos fijos mensuales
- **Firebase**: Autenticacion federada, base de datos Firestore y storage sin gestion de backend
- **Cloudinary**: CDN global para imagenes y videos con transformaciones on-the-fly
- **Google Workspace + Apps Script**: CMS headless gratuito con actualizaciones en tiempo real

### Innovaciones Arquitectonicas

#### 1. CMS Headless con Google Sheets

```
Google Sheets -> Apps Script -> API Publica -> AWS S3 -> Angular SSR
```

Los editores de contenido actualizan una hoja de calculo, que automaticamente:
1. Dispara un trigger de Apps Script al cambiar celdas
2. Convierte los datos a JSON segun esquema definido
3. Llama a una API publica (`https://api.letiende.co/actualizarContenido`)
4. Almacena el JSON en S3 (`https://assets.letiende.co/data/`)
5. La aplicacion consume los datos estaticos desde CDN

**Ventaja**: CMS gratuito, familiar para usuarios no tecnicos, sin base de datos tradicional.

#### 2. SSR Serverless con Serverless Framework

```typescript
// Configuracion optimizada para AWS Lambda
provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
```

El bundle de Angular SSR se ejecuta en AWS Lambda usando `@codegenie/serverless-express`, permitiendo:
- Renderizado del lado del servidor para SEO optimo
- Hidratacion instantanea del cliente con Event Replay
- Escalado automatico basado en demanda
- Cold start < 1s con optimizaciones de bundle

#### 3. Gestion de Secretos Multi-Entorno

```yaml
# Variables de entorno desde AWS SSM Parameter Store
environment:
  CLOUDINARY_API_KEY: ${ssm:/letiende/${sls:stage}/CLOUDINARY_API_KEY}
  FIREBASE_API_KEY: ${ssm:/letiende/${sls:stage}/FIREBASE_API_KEY}
```

**Seguridad**: Cero secretos en el codigo. AWS Systems Manager gestiona credenciales por entorno (dev/prod).

#### 4. Arquitectura Zoneless

```typescript
// Angular sin Zone.js para mejor rendimiento
provideZonelessChangeDetection()
```

Utiliza Angular Signals y deteccion de cambios manual para:
- Reducir tamano del bundle (~20KB menos)
- Mejorar performance de rendering
- Control granular sobre actualizaciones del DOM

---

## Stack Tecnologico

### Frontend

| Tecnologia | Version | Proposito | Documentacion |
|------------|---------|-----------|---------------|
| [Angular](https://angular.dev) | 21.x | Framework SPA con SSR | https://angular.dev |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | Type safety y DX mejorado | https://www.typescriptlang.org/docs |
| [PrimeNG](https://primeng.org) | 21.x | Componentes UI empresariales | https://primeng.org |
| [PrimeIcons](https://primeng.org/icons) | 7.x | Libreria de iconos | https://primeng.org/icons |
| [FontAwesome](https://fontawesome.com) | 7.x | Iconos adicionales | https://docs.fontawesome.com |
| [Angular Fire](https://github.com/angular/angularfire) | 21.x | SDK oficial de Firebase | https://github.com/angular/angularfire |
| [Cloudinary Angular SDK](https://cloudinary.com/documentation/angular_integration) | 2.x | Gestion de medios | https://cloudinary.com/documentation/angular_integration |

### Backend & Infraestructura

| Servicio | Proposito | Costo Estimado |
|----------|-----------|----------------|
| AWS Lambda | Ejecucion de SSR | Pay-per-request |
| AWS S3 | Storage de assets estaticos | ~$0.01/mes |
| AWS Systems Manager | Gestion de secretos | Gratuito |
| AWS API Gateway | Enrutamiento HTTP | Pay-per-request |
| Firebase Auth | Autenticacion federada | Gratuito (tier Spark) |
| Firebase Firestore | Base de datos NoSQL | Gratuito hasta 1GB |
| Firebase Storage | Almacenamiento de archivos | Gratuito hasta 5GB |
| Cloudinary | CDN de imagenes/videos | Gratuito hasta 25GB/mes |
| Google Workspace | Apps Script como backend | Incluido con cuenta |

### Herramientas de Desarrollo

| Herramienta | Version | Proposito |
|-------------|---------|-----------|
| Node.js | 22.x | Runtime JavaScript |
| npm | 10.x | Gestor de paquetes |
| Serverless Framework | 4.x | Despliegue a AWS Lambda |
| AWS CLI | 2.x | Gestion de AWS |

---

## Prerrequisitos

Antes de comenzar, asegurate de tener instalado:

### Requeridos

1. **Node.js 22.x o superior**
   ```bash
   # Verificar version
   node --version
   # v22.x.x

   # Instalar con nvm (recomendado)
   nvm install 22
   nvm use 22
   ```

2. **npm 10.x o superior**
   ```bash
   npm --version
   # 10.x.x
   ```

3. **AWS CLI configurado** (para despliegue)
   ```bash
   # Instalar AWS CLI
   brew install awscli  # macOS

   # Configurar credenciales
   aws configure
   # AWS Access Key ID: [tu-access-key]
   # AWS Secret Access Key: [tu-secret-key]
   # Default region name: us-east-1
   ```

4. **Serverless Framework 4.x** (para despliegue)
   ```bash
   npm install -g serverless
   serverless --version
   # Framework Core: 4.x.x
   ```

### Opcionales

- **Firebase CLI** (para emuladores locales)
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

- **VS Code** con extensiones recomendadas:
  - Angular Language Service
  - ESLint
  - Prettier
  - SCSS IntelliSense

---

## Inicio Rapido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/ocastelblanco/letiende.co.git
cd letiende.co
```

### 2. Instalar Dependencias

```bash
npm install
```

Este comando instalara todas las dependencias definidas en `package.json`, incluyendo:
- Angular 21 y sus modulos (@angular/core, @angular/ssr, etc.)
- PrimeNG y PrimeIcons
- Firebase y AngularFire
- Cloudinary SDK
- Express y serverless-express

### 3. Configurar Secretos Locales

Crear el archivo `src/secrets.ts` (este archivo esta en `.gitignore`):

```typescript
export const localSecrets = {
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: 'tu-cloud-name',
  CLOUDINARY_API_KEY: 'tu-api-key',
  CLOUDINARY_API_SECRET: 'tu-api-secret',

  // Firebase
  FIREBASE_PROJECT_ID: 'tu-project-id',
  FIREBASE_APP_ID: 'tu-app-id',
  FIREBASE_STORAGE_BUCKET: 'tu-bucket.firebasestorage.app',
  FIREBASE_API_KEY: 'tu-api-key',
  FIREBASE_AUTH_DOMAIN: 'tu-project.firebaseapp.com',
  FIREBASE_MESSAGING_SENDER_ID: 'tu-sender-id',
  FIREBASE_MEASUREMENT_ID: 'G-XXXXXXXXXX',
};
```

> **Nota**: Contacta al administrador del proyecto para obtener las credenciales de desarrollo.

### 4. Iniciar el Servidor de Desarrollo

```bash
npm start
```

Esto ejecutara `ng serve` y abrira la aplicacion en `http://localhost:4200`.

**Modos alternativos de ejecucion:**

```bash
# Modo watch (reconstruccion automatica)
npm run watch

# Servidor SSR local (simula Lambda)
npm run build && npm run serve:ssr:letiende.co
```

### 5. Verificar la Instalacion

1. Abre `http://localhost:4200` en tu navegador
2. Deberias ver la pagina de inicio con el navbar
3. Navega a `/menu` para verificar la carga de datos desde S3
4. Abre DevTools > Console para verificar que no hay errores

---

## Arquitectura del Sistema

### Diagrama de Alto Nivel

```
+------------------+     +-------------------+     +------------------+
|   Google Sheets  | --> |   Apps Script     | --> |   AWS Lambda     |
|   (Contenido)    |     |   (Trigger)       |     |   (API)          |
+------------------+     +-------------------+     +------------------+
                                                           |
                                                           v
+------------------+     +-------------------+     +------------------+
|   Cloudinary     | <-- |   Angular SSR     | <-- |   AWS S3         |
|   (Imagenes)     |     |   (Lambda)        |     |   (JSON Data)    |
+------------------+     +-------------------+     +------------------+
         |                       |                         |
         v                       v                         v
+------------------------------------------------------------------+
|                         Cliente (Browser)                         |
|   - Hidratacion con Event Replay                                  |
|   - Signals para estado reactivo                                  |
|   - PrimeNG UI Components                                         |
+------------------------------------------------------------------+
```

### Ciclo de Vida de una Request

1. **Request entrante** -> API Gateway
2. **API Gateway** -> AWS Lambda (handler serverless-express)
3. **Lambda** -> Express middleware
4. **Express** -> AngularNodeAppEngine.handle()
5. **Angular SSR** -> Renderiza componente con datos
6. **Response** -> HTML completo + TransferState
7. **Browser** -> Hidratacion con Event Replay

### Flujo de Datos

```typescript
// 1. Servicio obtiene datos desde S3
this.http.get<MenuResponse>('https://assets.letiende.co/data/menu.json')

// 2. Componente usa signals para reactividad
readonly menuCompleto = signal<MenuResponse | null>(null);
readonly menuIdioma = computed(() => {
  const menu = this.menuCompleto();
  return this.idioma() === 'ES' ? menu?.idiomas.es : menu?.idiomas.en;
});

// 3. Template usa control flow nativo
@if (menuIdioma()) {
  @for (categoria of menuIdioma()!.categorias; track categoria.id) {
    <p-panel [header]="categoria.nombre">
      <!-- contenido -->
    </p-panel>
  }
}
```

### TransferState (SSR -> Browser)

La aplicacion usa `TransferState` para pasar configuracion del servidor al cliente:

```typescript
// En el servidor (app.config.server.ts)
{ provide: CLOUDINARY_CLOUD_NAME, useValue: process.env['CLOUDINARY_CLOUD_NAME'] }

// En el servicio (cloudinary-config.ts)
if (isPlatformServer(this.platformId)) {
  this.cloudName = this.serverCloudName;
  this.transferState.set(CLOUDINARY_CLOUD_NAME_STATE, this.cloudName);
} else {
  this.cloudName = this.transferState.get(CLOUDINARY_CLOUD_NAME_STATE, null);
}
```

---

## Estructura del Proyecto

```
letiende.co/
├── .claude/                          # Configuracion de Claude Code
│   ├── CLAUDE.md                     # Instrucciones del proyecto para IA
│   └── skills/                       # Skills personalizados
│       ├── angular-best-practices-21/
│       └── web-design-best-practices/
├── .serverless/                      # Cache de Serverless Framework
├── .vscode/                          # Configuracion de VS Code
│   ├── extensions.json               # Extensiones recomendadas
│   ├── launch.json                   # Configuracion de debug
│   └── tasks.json                    # Tareas automatizadas
├── docs/                             # Documentacion adicional
│   ├── esquema-contenido.json        # Esquema del CMS
│   └── fix-google-apps-script-origin.md
├── public/                           # Assets estaticos
├── src/
│   ├── app/
│   │   ├── compartidos/              # Codigo reutilizable
│   │   │   ├── componentes/          # Componentes compartidos
│   │   │   │   ├── icono.ts          # Wrapper unificado de iconos
│   │   │   │   ├── imagen-fondo.ts   # Imagen de fondo con blur
│   │   │   │   ├── menu-lateral/     # Navegacion lateral
│   │   │   │   │   ├── menu-lateral.html
│   │   │   │   │   ├── menu-lateral.scss
│   │   │   │   │   └── menu-lateral.ts
│   │   │   │   └── navbar/           # Barra de navegacion
│   │   │   │       ├── navbar.html
│   │   │   │       ├── navbar.scss
│   │   │   │       └── navbar.ts
│   │   │   ├── modulos/
│   │   │   │   ├── iconos/
│   │   │   │   │   └── iconos-module.ts    # FontAwesome tree-shaken
│   │   │   │   └── primeng/
│   │   │   │       └── primeng-module.ts   # PrimeNG tree-shaken
│   │   │   └── servicios/
│   │   │       ├── breakpoint-service.ts   # Deteccion responsive
│   │   │       ├── cloudinary-api.ts       # Cliente Cloudinary
│   │   │       ├── cloudinary-config.ts    # Configuracion Cloudinary
│   │   │       ├── datos.ts                # Servicio de datos (S3)
│   │   │       ├── firebase-config.ts      # Configuracion Firebase
│   │   │       ├── lt-config.ts            # Configuracion global
│   │   │       └── meta.ts                 # SEO y Open Graph
│   │   ├── vistas/                   # Componentes de pagina
│   │   │   ├── inicio/
│   │   │   │   ├── inicio.html
│   │   │   │   ├── inicio.scss
│   │   │   │   └── inicio.ts
│   │   │   └── menu/
│   │   │       ├── menu.html
│   │   │       ├── menu.scss
│   │   │       └── menu.ts
│   │   ├── app.config.server.ts      # Configuracion SSR
│   │   ├── app.config.ts             # Configuracion cliente
│   │   ├── app.html                  # Template raiz
│   │   ├── app.routes.server.ts      # Rutas SSR
│   │   ├── app.routes.ts             # Definicion de rutas
│   │   ├── app.scss                  # Estilos raiz
│   │   └── app.ts                    # Componente raiz
│   ├── tema/                         # Sistema de diseno
│   │   ├── lt-tema.ts                # Preset PrimeNG custom
│   │   ├── mixins.scss               # Mixins SCSS (glassmorphism)
│   │   └── var.scss                  # Variables CSS/SCSS
│   ├── index.html                    # HTML raiz
│   ├── main.server.ts                # Bootstrap servidor
│   ├── main.ts                       # Bootstrap cliente
│   ├── secrets.ts                    # Secretos locales (gitignored)
│   ├── server.ts                     # Express + SSR handler
│   └── styles.scss                   # Estilos globales
├── angular.json                      # Configuracion Angular CLI
├── firebase.json                     # Configuracion Firebase
├── package.json                      # Dependencias y scripts
├── serverless.yml                    # Configuracion Serverless
├── setup-secrets.sh                  # Script para AWS SSM
├── tsconfig.app.json                 # TypeScript (app)
├── tsconfig.json                     # TypeScript (base)
└── tsconfig.spec.json                # TypeScript (tests)
```

### Descripcion de Archivos Clave

#### `src/server.ts` - Servidor Express + SSR

```typescript
// Handler para AWS Lambda via serverless-express
export const handler = serverlessExpress({ app });

// Handler para desarrollo local
export const reqHandler = createNodeRequestHandler(app);
```

Este archivo:
- Crea una instancia de Express
- Configura endpoints API (`/api/cloudinary/signature`, `/api/cloudinary/details`)
- Sirve archivos estaticos desde `dist/browser`
- Maneja SSR con `AngularNodeAppEngine`
- Ajusta el `base href` segun el entorno (dev/prod)

#### `src/app/app.config.ts` - Configuracion del Cliente

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),        // Sin Zone.js
    provideRouter(routes),                    // Router
    provideClientHydration(withEventReplay()), // Hidratacion SSR
    provideFirebaseApp(() => initializeApp(options)), // Firebase
    provideAuth(() => getAuth()),             // Auth
    provideFirestore(() => getFirestore()),   // Firestore
    providePrimeNG({ theme: { preset: LTPreset } }), // UI
    provideHttpClient(withFetch()),           // HTTP
  ]
};
```

#### `src/tema/lt-tema.ts` - Tema Personalizado PrimeNG

Define colores, superficies y estilos glassmorphism:

```typescript
export const LTPreset = definePreset(Aura, {
  semantic: {
    primary: primaryColors,       // Paleta verde-azulado
    colorScheme: {
      light: { surface: lightSurface },
      dark: { surface: darkSurface },
    },
  },
  css: () => `
    /* Variables glassmorphism */
    :root {
      --lt-light-panel-surface: rgba(255, 255, 255, 0.25);
      --lt-dark-panel-surface: rgba(19, 16, 15, 0.25);
    }

    /* Componentes con blur */
    .p-menubar.menu-bar {
      backdrop-filter: blur(10px);
    }
  `,
});
```

---

## Configuracion de Variables de Entorno

### Variables Requeridas

| Variable | Descripcion | Tipo | Ejemplo |
|----------|-------------|------|---------|
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary | String | `letiende` |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | SecureString | `754879372588642` |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | SecureString | `oYin7v60...` |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | String | `le-tiende-37d7a` |
| `FIREBASE_APP_ID` | ID de la aplicacion Firebase | String | `1:109484...` |
| `FIREBASE_API_KEY` | API Key de Firebase | SecureString | `AIzaSy...` |
| `FIREBASE_AUTH_DOMAIN` | Dominio de autenticacion | String | `le-tiende-37d7a.firebaseapp.com` |
| `FIREBASE_STORAGE_BUCKET` | Bucket de Storage | String | `le-tiende-37d7a.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | ID del sender FCM | String | `1094845429912` |
| `FIREBASE_MEASUREMENT_ID` | ID de Analytics | String | `G-3QGY12V72N` |

### Variables Automaticas (Serverless)

| Variable | Descripcion | Valor |
|----------|-------------|-------|
| `PROVIDER_STAGE` | Stage actual | `dev` o `prod` |
| `APP_BASE_HREF` | Base path de la app | `/dev/` o `/` |

### Desarrollo Local (`src/secrets.ts`)

```typescript
export const localSecrets = {
  CLOUDINARY_CLOUD_NAME: 'letiende',
  CLOUDINARY_API_KEY: 'xxx',
  CLOUDINARY_API_SECRET: 'xxx',
  FIREBASE_PROJECT_ID: 'le-tiende-37d7a',
  FIREBASE_APP_ID: 'xxx',
  FIREBASE_STORAGE_BUCKET: 'le-tiende-37d7a.firebasestorage.app',
  FIREBASE_API_KEY: 'xxx',
  FIREBASE_AUTH_DOMAIN: 'le-tiende-37d7a.firebaseapp.com',
  FIREBASE_MESSAGING_SENDER_ID: 'xxx',
  FIREBASE_MEASUREMENT_ID: 'xxx',
};
```

### Produccion (AWS SSM Parameter Store)

Usar el script `setup-secrets.sh` para configurar parametros:

```bash
# Editar el script con tus valores
vim setup-secrets.sh

# Ejecutar para el stage dev
./setup-secrets.sh

# Para produccion, cambiar STAGE="prod" en el script
```

El script crea parametros en la ruta `/letiende/{stage}/`:

```bash
aws ssm get-parameters-by-path \
  --path "/letiende/dev" \
  --with-decryption \
  --region us-east-1
```

---

## Sistema de Diseno

### Glassmorphism

La aplicacion implementa el efecto **glassmorphism** moderno, caracterizado por:

- **Fondos translucidos** con `backdrop-filter: blur()`
- **Transparencias controladas** con opacidades variables
- **Bordes sutiles** y sombras multicapa
- **Microanimaciones** para feedback visual

#### Implementacion en SCSS

```scss
// src/tema/mixins.scss
@mixin glass-box($blur, $shadow-opacity, $background-opacity) {
  box-shadow: 0 4px 30px rgba(var(--lt-glass-shadow), $shadow-opacity);
  backdrop-filter: blur($blur);
  -webkit-backdrop-filter: blur($blur);
  background: rgba(var(--lt-glass-bg), $background-opacity);
  border: 1px solid var(--lt-glass-border);
}

@mixin glass-soft { @include glass-box(6px, 0.05, 0.1); }
@mixin glass-frosted { @include glass-box(12px, 0.1, 0.25); }
@mixin glass-heavy { @include glass-box(20px, 0.2, 0.35); }
```

#### Variables de Tema

```scss
// src/tema/var.scss
$light-glass-settings: (
  bg: rgba(255, 239, 209, 0.4),
  hover: rgba(255, 239, 209, 0.9),
  border: rgba(255, 239, 209, 0.4),
  shadow: rgba(24, 16, 0, 0.4),
  primary-bg: rgb(110, 249, 226)
);

$dark-glass-settings: (
  bg: rgba(24, 16, 0, 0.4),
  hover: rgba(24, 16, 0, 0.9),
  // ...
);
```

### Tipografia

| Fuente | Uso | Carga |
|--------|-----|-------|
| **Angellya** | Titulos principales (`.titulo-principal`) | CDN fonts.cdnfonts.com |
| **Poppins** | Texto general (weights: 300, 400, 500, 800) | Google Fonts |
| **Material Symbols** | Iconos de navegacion | Google Fonts |
| **PrimeIcons** | Iconos UI | CDN jsDelivr |

### Paleta de Colores

#### Colores Primarios (Verde Azulado)

| Token | Hex | Uso |
|-------|-----|-----|
| `primary.50` | `#001411` | Texto sobre fondo claro |
| `primary.500` | `#008677` | Color principal |
| `primary.900` | `#6EF9E2` | Acentos brillantes |
| `primary.950` | `#B5FFF0` | Highlights |

#### Superficies (Modo Claro)

| Token | Hex | Uso |
|-------|-----|-----|
| `surface.0` | `#FFFFFF` | Fondo base |
| `surface.50` | `#F8E0AD` | Paneles |
| `surface.900` | `#181000` | Texto principal |

#### Superficies (Modo Oscuro)

| Token | Hex | Uso |
|-------|-----|-----|
| `surface.0` | `#FFFFFF` | Texto |
| `surface.900` | `#13100F` | Fondo base |
| `surface.950` | `#000000` | Fondo profundo |

### Cambio de Tema

```typescript
// src/app/compartidos/componentes/navbar/navbar.ts
cambiarTema(): void {
  const element = document.querySelector('html') as HTMLElement;
  element.classList.toggle('tema-oscuro');
  this.config.modoTema.set(
    this.config.modoTema() === 'light' ? 'dark' : 'light'
  );
}
```

---

## Rutas y Navegacion

### Definicion de Rutas

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio, title: 'Le Tiende' },
  { path: 'menu', component: Menu, title: 'Menu Le Tiende', data: { preload: true } },
  { path: 'menu/:categoria', component: Menu, title: 'Menu Le Tiende', data: { preload: true } },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
```

### Paginas Disponibles

| Ruta | Componente | Descripcion |
|------|------------|-------------|
| `/inicio` | `Inicio` | Pagina principal |
| `/menu` | `Menu` | Menu de comidas y bebidas |
| `/menu/:categoria` | `Menu` | Menu filtrado por categoria |

### Navbar

El componente `Navbar` proporciona navegacion global:

```typescript
// Configuracion en lt-config.ts
public navbarItems: NavbarItem[] = [
  { label: 'Inicio', icon: 'pi-home', tipoIcono: 'primeng', routerLink: '/inicio' },
  { label: 'Menu', icon: 'menu_book_2', tipoIcono: 'material_symbol', routerLink: '/menu' },
];
```

Caracteristicas:
- Logo responsive (completo en desktop, mono en mobile)
- Selector de idioma (ES/EN)
- Toggle de tema claro/oscuro
- Glassmorphism con blur

---

## Servicios y APIs

### `Datos` - Servicio de Contenido

```typescript
// src/app/compartidos/servicios/datos.ts
@Injectable({ providedIn: 'root' })
export class Datos {
  private readonly assetsUrl = isDevMode()
    ? '/'
    : 'https://assets.letiende.co/data/';

  getMenu(): Observable<MenuResponse> {
    return this.http.get<MenuResponse>(this.assetsUrl + 'menu.json');
  }
}
```

### `LtConfig` - Configuracion Global

```typescript
// src/app/compartidos/servicios/lt-config.ts
@Injectable({ providedIn: 'root' })
export class LtConfig {
  idioma: WritableSignal<string> = signal('ES');
  modoTema: WritableSignal<string> = signal('light');
  cdnUrl = 'https://assets.letiende.co/';
  cloudinaryAPIUrl = `${this.baseUrl}api/cloudinary/`;
}
```

### `MetaService` - SEO y Open Graph

```typescript
// src/app/compartidos/servicios/meta.ts
@Injectable({ providedIn: 'root' })
export class MetaService {
  updatePageMeta(pageMeta: PageMeta): void {
    this.title.setTitle(pageMeta.title);
    this.meta.updateTag({ name: 'description', content: pageMeta.description });
    this.updateOpenGraphTags(pageMeta);
    this.updateTwitterTags(pageMeta);
  }
}
```

### `BreakpointService` - Responsive

Detecta el tamano de pantalla actual:

```typescript
type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Uso en componentes
readonly bp = computed(() => this.breakpointService.getCurrentBreakpoint());

@if (bp() === 'xs' || bp() === 'sm') {
  <mobile-layout />
} @else {
  <desktop-layout />
}
```

### API Endpoints del Servidor

El servidor Express expone:

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/cloudinary/signature` | POST | Genera firma para uploads |
| `/api/cloudinary/details` | POST | Obtiene detalles de un recurso |

---

## Integracion con Servicios Externos

### Cloudinary

**Configuracion:**

```typescript
// src/app/app.config.ts
{
  provide: Cloudinary,
  useFactory: () => {
    const config = inject(CloudinaryConfig);
    return new Cloudinary({ cloud: { cloudName: config.cloudName } });
  },
}
```

**Uso en componentes:**

```typescript
import { Cloudinary } from '@cloudinary/url-gen';

@Component({...})
export class MiComponente {
  private readonly cloudinary = inject(Cloudinary);

  getImageUrl(publicId: string): string {
    return this.cloudinary.image(publicId)
      .resize(fill().width(800).height(600))
      .toURL();
  }
}
```

### Firebase

**Servicios disponibles:**

```typescript
// Autenticacion
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

// Firestore
import { Firestore, collection, doc, getDoc } from '@angular/fire/firestore';

// Storage
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

// Analytics
import { Analytics, logEvent } from '@angular/fire/analytics';
```

### Google Apps Script (CMS)

El contenido se actualiza desde Google Sheets mediante Apps Script:

```javascript
// En Google Apps Script
function onEdit(e) {
  const contenido = construirJSON(e.range.getSheet());
  UrlFetchApp.fetch('https://api.letiende.co/actualizarContenido', {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(contenido),
  });
}
```

Ver `docs/esquema-contenido.json` para la estructura completa del JSON.

---

## Scripts Disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm start` | Inicia servidor de desarrollo (`ng serve`) |
| `npm run build` | Build de produccion |
| `npm run watch` | Build en modo watch |
| `npm test` | Ejecuta tests unitarios |
| `npm run serve:ssr:letiende.co` | Sirve SSR localmente |
| `npm run build:ssr` | Build SSR para produccion |
| `npm run build:ssr:dev` | Build SSR con base-href `/dev/` |
| `npm run build:ssr:prod` | Build SSR con base-href `/` |
| `npm run deploy:dev` | Build + Deploy a stage dev |
| `npm run deploy:prod` | Build + Deploy a stage prod |
| `npm run deploy` | Alias de `deploy:dev` |

### Uso Tipico

```bash
# Desarrollo diario
npm start

# Verificar SSR localmente
npm run build:ssr && npm run serve:ssr:letiende.co

# Deploy a desarrollo
npm run deploy:dev

# Deploy a produccion
npm run deploy:prod
```

---

## Despliegue

### Arquitectura de Deployment

```
+-------------+     +----------------+     +---------------+
|   GitHub    | --> |   Local Dev    | --> |   AWS Lambda  |
|   (codigo)  |     |   (build)      |     |   (runtime)   |
+-------------+     +----------------+     +---------------+
                           |
                           v
                    +----------------+
                    |   Serverless   |
                    |   Framework    |
                    +----------------+
                           |
                    +------+------+
                    |             |
                    v             v
              +----------+  +----------+
              | /dev     |  | /        |
              | (stage)  |  | (prod)   |
              +----------+  +----------+
```

### Proceso de Deploy

#### 1. Configurar Secretos (primera vez)

```bash
# Editar valores en setup-secrets.sh
vim setup-secrets.sh

# Ejecutar para dev
./setup-secrets.sh

# Para prod, cambiar STAGE="prod"
./setup-secrets.sh
```

#### 2. Deploy a Desarrollo

```bash
npm run deploy:dev
```

Esto ejecuta:
1. `ng build --configuration production --base-href /dev/`
2. `sls deploy --stage dev`

URL resultante: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/`

#### 3. Deploy a Produccion

```bash
npm run deploy:prod
```

Esto ejecuta:
1. `ng build --configuration production --base-href /`
2. `sls deploy --stage prod`

URL resultante: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/` (o dominio custom)

### Estructura del Bundle Lambda

```
dist/letiende.co/
├── browser/              # Assets estaticos (JS, CSS, imagenes)
│   ├── main-xxxxx.js
│   ├── polyfills-xxxxx.js
│   └── styles-xxxxx.css
└── server/               # Servidor SSR
    ├── server.mjs        # Entry point Lambda
    └── chunk-xxxxx.mjs   # Chunks del servidor
```

### Configuracion Serverless

```yaml
# serverless.yml
service: letiende
provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    APP_BASE_HREF: "${self:custom.stageSpecificBaseHref.${sls:stage}, self:custom.defaultBaseHref}"
    CLOUDINARY_API_KEY: ${ssm:/letiende/${sls:stage}/CLOUDINARY_API_KEY}
    # ... mas variables

functions:
  main:
    handler: dist/letiende.co/server/server.handler
    events:
      - http:
          method: any
          path: /
      - http:
          method: any
          path: /{proxy+}

package:
  patterns:
    - "!**/*"
    - "dist/letiende.co/browser/**"
    - "dist/letiende.co/server/**"
    - "node_modules/@codegenie/serverless-express/**"
```

### Verificar Deploy

```bash
# Ver logs de Lambda
sls logs -f main --stage dev -t

# Invocar funcion manualmente
sls invoke -f main --stage dev --path test-event.json

# Ver info del stack
sls info --stage dev
```

---

## Flujo de Trabajo Git

### Conventional Commits

Formato: `<tipo>(<alcance>): <descripcion>`

```bash
feat(menu): agregado selector de bebidas
fix(teatro): corregido selector de precios
docs(readme): actualizar instrucciones
refactor(navbar): mejorado performance
chore(deps): actualizado PrimeNG
style(inicio): ajustado espaciado glassmorphism
perf(imagenes): implementado lazy loading
test(menu): agregados tests unitarios
```

**Tipos validos:**
- `feat`: Nueva funcionalidad
- `fix`: Correccion de bug
- `docs`: Cambios en documentacion
- `style`: Cambios de formato (no afectan codigo)
- `refactor`: Refactorizacion de codigo
- `perf`: Mejoras de performance
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento
- `ci`: Cambios en CI/CD
- `build`: Cambios en sistema de build

### Estrategia de Branches

| Branch | Proposito | Protegido |
|--------|-----------|-----------|
| `main` | Produccion actual | Si |
| `2025` | Desarrollo de nueva version | No |
| `feature/*` | Nuevas funcionalidades | No |
| `fix/*` | Correcciones de bugs | No |
| `hotfix/*` | Correcciones urgentes | No |

### Flujo de Trabajo

```bash
# 1. Crear feature branch desde 2025
git checkout 2025
git pull origin 2025
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y hacer commits
git add .
git commit -m "feat(scope): descripcion"

# 3. Push y crear PR
git push origin feature/nueva-funcionalidad
# Crear PR hacia branch 2025

# 4. Merge a produccion (despues de QA)
git checkout main
git merge 2025
git tag v2.x.x
git push origin main --tags
```

### Versionado Semantico

Formato: `v<MAJOR>.<MINOR>.<PATCH>[-<PRERELEASE>]`

```bash
# Desarrollo inicial
git tag v2.0.0-alpha.1

# Beta publica
git tag v2.0.0-beta.1

# Release candidate
git tag v2.0.0-rc.1

# Produccion
git tag v2.0.0

# Hotfix
git tag v2.0.1
```

---

## Solucion de Problemas

### Error: "Cannot find module 'secrets'"

**Causa**: Falta el archivo `src/secrets.ts`.

**Solucion**:
```bash
# Crear archivo de secretos
cat > src/secrets.ts << 'EOF'
export const localSecrets = {
  CLOUDINARY_CLOUD_NAME: 'tu-cloud-name',
  // ... resto de secretos
};
EOF
```

### Error: "Firebase configuration options are not available"

**Causa**: Variables de entorno de Firebase no configuradas.

**Solucion**:
1. En desarrollo: Verificar `src/secrets.ts`
2. En produccion: Verificar parametros en AWS SSM

```bash
aws ssm get-parameter \
  --name "/letiende/dev/FIREBASE_API_KEY" \
  --with-decryption \
  --region us-east-1
```

### Error: "Cloudinary SDK not configured"

**Causa**: Faltan credenciales de Cloudinary.

**Solucion**:
```bash
# Verificar variables
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
```

### Error: SSR "Cannot read properties of undefined"

**Causa**: Acceso a APIs del browser en el servidor.

**Solucion**:
```typescript
import { isPlatformBrowser } from '@angular/common';

if (isPlatformBrowser(this.platformId)) {
  // Codigo que usa window, document, localStorage, etc.
}
```

### Error: "base href mismatch"

**Causa**: El `APP_BASE_HREF` no coincide con el stage.

**Solucion**:
1. Verificar `serverless.yml`:
```yaml
custom:
  stageSpecificBaseHref:
    prod: "/"
  defaultBaseHref: "/${sls:stage}/"
```

2. Rebuild con el stage correcto:
```bash
npm run deploy:dev   # base-href: /dev/
npm run deploy:prod  # base-href: /
```

### Logs de Lambda vacios

**Solucion**:
```bash
# Ver logs en tiempo real
sls logs -f main --stage dev -t

# O usar AWS Console
aws logs tail /aws/lambda/letiende-dev-main --follow
```

### Bundle demasiado grande

**Causa**: Dependencias innecesarias incluidas.

**Solucion**:
1. Analizar bundle:
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/letiende.co/browser/stats.json
```

2. Verificar imports tree-shaken:
```typescript
// MAL - importa todo PrimeNG
import { PrimeNGModule } from 'primeng';

// BIEN - importa solo lo necesario
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
```

---

## Analisis de Costos

### Estimacion Mensual

| Visitas/mes | AWS Lambda | S3 | Firebase | Cloudinary | **Total** |
|-------------|------------|----|---------| -----------|-----------|
| 10,000 | $0.20 | $0.06 | $0.00 | $0.00 | **~$0.26** |
| 100,000 | $2.00 | $0.60 | $0.00 | $0.00 | **~$2.60** |
| 1,000,000 | $20.00 | $6.00 | $5.00* | $0.00 | **~$31.00** |

*Firebase Spark tier gratuito hasta ~50K lecturas/dia

### Comparativa con VPS

| Solucion | Costo Mensual | Escalabilidad | Mantenimiento |
|----------|---------------|---------------|---------------|
| **Serverless (este proyecto)** | $0.26 - $31 | Automatica | Ninguno |
| VPS basico (DigitalOcean) | $5 - $20 | Manual | Alto |
| VPS managed (Heroku) | $7 - $50 | Limitada | Medio |
| EC2 + RDS | $30 - $100+ | Manual | Alto |

### Optimizaciones de Costos

1. **Reducir cold starts**: Usar Provisioned Concurrency solo si necesario
2. **Cache de assets**: S3 + CloudFront con TTL largo
3. **Optimizar imagenes**: Cloudinary transformaciones automaticas
4. **Firebase bajo tier gratuito**: Usar caching agresivo

---

## Contribuciones

Este proyecto sirve como showcase de arquitecturas modernas serverless.

### Como Contribuir

1. **Fork** del repositorio
2. **Crear branch**: `git checkout -b feature/mi-feature`
3. **Commit**: `git commit -m 'feat(scope): descripcion'`
4. **Push**: `git push origin feature/mi-feature`
5. **Pull Request** hacia branch `2025`

### Guias de Estilo

- **TypeScript**: Strict mode habilitado
- **Angular**: Standalone components, signals, OnPush
- **SCSS**: BEM methodology para clases custom
- **Commits**: Conventional Commits

### Codigo de Conducta

- Respetar a todos los contribuidores
- Documentar cambios significativos
- Escribir tests para nuevas funcionalidades
- Mantener compatibilidad con arquitectura existente

---

## Licencia

Proyecto propietario de Le Tiende (c) 2025

---

**Desarrollado por**: Oscar Castelblanco
**Sitio**: [letiende.co](https://letiende.co)
**Ubicacion**: Parkway, Bogota, Colombia

---

*Ultima actualizacion: Febrero 2026*
