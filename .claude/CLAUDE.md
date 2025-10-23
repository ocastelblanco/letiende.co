# Buenas prácticas de desarrollo para esta aplicación

## Role
You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Incluye el type de todas las variables, siempre. Por ejemplo: `const datos: DatoMenu = inject(DatosMenu)`;

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
- Usa siempre las `paths` definidas en tsconfig.json para importar elementos

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

# Descripción de la aplicación letiende.co
## Contexto
La aplicación letiende.co es el sitio web de Le Tiende, un centro cultural, librería, café, bar y teatro (llamado Le Teatre), ubicado en el Parkway de Bogotá, Colombia.

## Objetivo
El objetivo de la aplicación es, principalmente, ofrecer información sobre los eventos que se realizan en Le Teatre, el menú de comida y bebidas, e información acerca de los libros con que cuenta la librería.

### Diseño

La aplicación debe ser visualmente muy impactante y usa, como principio de diseño, glassmorphism, como se explica en https://www.designstudiouiux.com/blog/what-is-glassmorphism-ui-trend.

Se deben privilegiar las microanimaciones en los componentes, que destaquen la información y den peso a la navegación.

## Contenido

El contenido del sitio web se alojará en una hoja de cálculo de Google Workspace que, mediante Apps Script y cuando hay un cambio en alguna de sus celdas, llama a la API pública api.letiende.co con el nuevo JSON y dicha API lo convierte en un archivo *.json que almacena en https://assets.letiende.co, que es un bucket de AWS S3.

Cada sección principal tiene una hoja en la spreadsheet mencionada, con los textos (tanto de contenido como de interfaz), id de imagen en Cloudinary, y demás contenido del sitio, en español e inglés.

## Filosofía general de la aplicación
* La aplicación es un frontend construído con Angular SSR, alojada en AWS Lambda.
* Todos los servicios backend se obtienen a partir de servicios externos, gratuitos o de muy bajo costo, tales como:
  * Google Workspace / Apps Script: información básica, actualizada por los usuarios administradores.
  * Google Firebase: servicios de autenticación federada, base de datos no relacional.
  * AWS S3 / Route 53 / CloudFront: alojamiento de assets estáticos como logos, íconos, etc.
  * Cloudinary: alojamiento de fotografías y videos, principalmente de eventos.
  * AWS Lambda: lógica backend sobre Node.js 22.x para usar API públicas como Google Books, Google Recaptcha, etc.

## Tecnologías
|Tecnología|Versión|Propósito|Documentación|
|----------|-------|---------|-------------|
|Angular|20.x|Framework frontend|https://angular.dev|
|PrimeNG|20.x|Componentes UI|https://primeng.org|
|PrimeIcons|7.x|Librería de iconos|https://primeng.org/icons|
|FontAwesome|6.x|Librería de iconos|https://docs.fontawesome.com|
|FontAwesome Angular|2.x|SDK de Angular para íconos|https://github.com/FortAwesome/angular-fontawesome|
|Google Symbols & Icons||Librería de iconos|https://developers.google.com/fonts/docs/material_symbols|
|Angular Fire|20.x|Servicios backend libres de administración|https://github.com/angular/angularfire|
|Serverless|4.x|Framework de despliegue|https://www.serverless.com/framework/docs|
|serverless-express|4.x|Generador de Express para Serverless / AWS Lambda|https://github.com/CodeGenieApp/serverless-express|
|Cloudinary API||Almacenamiento y distribución de imágenes|https://cloudinary.com/documentation/cloudinary_references|
|Cloudinary AngularSDK||SDK de Cloudinary para Angular|https://cloudinary.com/documentation/angular_integration|

## Estructura del proyecto
.
├── README.md
├── angular.json
├── firebase.json
├── package-lock.json
├── package.json
├── serverless.yml
├── setup-secrets.sh                            # Script para configurar las variables de entorno
├── src
│   ├── app
│   │   ├── app.config.server.ts
│   │   ├── app.config.ts
│   │   ├── app.html
│   │   ├── app.routes.server.ts
│   │   ├── app.routes.ts
│   │   ├── app.scss
│   │   ├── app.ts
│   │   ├── compartidos                         # Elementos reutilizables
│   │   │   ├── componentes
│   │   │   │   ├── icono.ts                    # Genera un ícono de Prime, Fontawesome o Google Symbols & Icons
│   │   │   │   ├── imagen-fondo.ts             # Genera la imagen de fondo de las secciones principales
│   │   │   │   ├── menu-lateral                # Menú lateral de navegación
│   │   │   │   │   ├── menu-lateral.html
│   │   │   │   │   ├── menu-lateral.scss
│   │   │   │   │   └── menu-lateral.ts
│   │   │   │   └── navbar                       # Barra de navegación principal
│   │   │   │       ├── navbar.html
│   │   │   │       ├── navbar.scss
│   │   │   │       └── navbar.ts
│   │   │   ├── modulos                          # Módulos de la aplicación
│   │   │   │   ├── iconos
│   │   │   │   │   └── iconos-module.ts         # Los íconos disponibles (Fontawesome)
│   │   │   │   └── primeng
│   │   │   │       └── primeng-module.ts        # Los componentes de PrimeNG disponibles
│   │   │   └── servicios
│   │   │       ├── breakpoint-service.ts        # Servicio de detección de tamaño de pantalla
│   │   │       ├── cloudinary-api.ts            # Servicio de Cloudinary
│   │   │       ├── cloudinary-config.ts         # Configuración de Cloudinary
│   │   │       ├── datos.ts                     # Servicio de obtención de datos de la aplicación -> interactúa con las API externas
│   │   │       ├── firebase-config.ts           # Configuración de Firebase
│   │   │       ├── lt-config.ts                 # Configuración de la aplicación     
│   │   │       └── meta.ts                      # Servicio de metadatado para SEO y redes sociales
│   │   └── vistas                               # Componentes principales de la aplicación
│   │       ├── inicio
│   │       │   ├── inicio.html
│   │       │   ├── inicio.scss
│   │       │   └── inicio.ts
│   │       └── menu
│   │           ├── menu.html
│   │           ├── menu.scss
│   │           └── menu.ts
│   ├── index.html
│   ├── main.server.ts
│   ├── main.ts
│   ├── secrets.ts
│   ├── server.ts
│   ├── styles.scss
│   └── tema                                      # Estilos personalizados para la aplicación
│       ├── lt-tema.ts
│       ├── mixins.scss
│       └── var.scss
├── tsconfig.app.json
├── tsconfig.json                                 # Contiene el campo `paths` con accesos directos a las principales carpetas 
└── tsconfig.spec.json

## Integración de APIs Externas

### AWS Lambda con Serverless Framework
La aplicación se despliega en AWS Lambda utilizando Serverless Framework. El archivo `serverless.yml` define:

- **Runtime**: Node.js 22.x
- **Handler**: `dist/letiende.co/server/server.handler` usando `@codegenie/serverless-express`
- **Eventos HTTP**: Captura todas las rutas (`/` y `/{proxy+}`) para SSR
- **Variables de entorno**: Inyectadas desde AWS SSM Parameter Store
  - `CLOUDINARY_*`: Credenciales de Cloudinary
  - `FIREBASE_*`: Configuración de Firebase
  - `APP_BASE_HREF`: Base path según stage (dev/prod)

#### Configuración Multi-Entorno
```yaml
provider:
  stage: ${opt:stage, 'dev'}
  environment:
    APP_BASE_HREF: "${self:custom.stageSpecificBaseHref.${sls:stage}, self:custom.defaultBaseHref}"
```

### Firebase (AngularFire)
Configurado en `app.config.ts` usando providers de Angular:

```typescript
provideFirebaseApp(() => initializeApp(firebaseOptions))
provideAuth(() => getAuth())
provideAnalytics(() => getAnalytics())
provideFirestore(() => getFirestore())
provideStorage(() => getStorage())
```

**Servicios utilizados**:
- **Authentication**: Login federado (Google, Facebook, etc.)
- **Firestore**: Base de datos NoSQL para datos dinámicos
- **Storage**: Almacenamiento de archivos
- **Analytics**: Seguimiento de usuarios y eventos

### Cloudinary
SDK configurado mediante provider factory en `app.config.ts`:

```typescript
{
  provide: Cloudinary,
  useFactory: () => new Cloudinary({ cloud: { cloudName: config.cloudName } }),
  deps: [CloudinaryConfig]
}
```

**Características**:
- Transformaciones on-the-fly (resize, quality, format)
- Efectos (blur para fondos)
- Lazy loading automático con `<advanced-image>`
- CDN global para delivery

### Gestión de Secretos

#### Desarrollo Local
Archivo `src/secrets.ts` (gitignored):
```typescript
export const localSecrets = {
  CLOUDINARY_CLOUD_NAME: 'valor',
  FIREBASE_API_KEY: 'valor',
  // ... otros secretos
};
```

#### Producción (AWS SSM Parameter Store)
Script `setup-secrets.sh` para configurar parámetros:
```bash
./setup-secrets.sh prod  # Configura /letiende/prod/*
./setup-secrets.sh dev   # Configura /letiende/dev/*
```

Serverless Framework obtiene automáticamente:
```yaml
environment:
  CLOUDINARY_API_KEY: ${ssm:/letiende/${sls:stage}/CLOUDINARY_API_KEY}
```

### Server-Side Rendering (SSR)

La configuración SSR en `app.config.server.ts` inyecta variables de entorno:

```typescript
providers: [
  provideServerRendering(withRoutes(serverRoutes)),
  { provide: CLOUDINARY_API_KEY, useValue: process.env['CLOUDINARY_API_KEY'] },
  { provide: APP_BASE_HREF, useValue: process.env['APP_BASE_HREF'] || '/' }
]
```

## Despliegue

### Scripts de Despliegue
```json
{
  "build:ssr:dev": "ng build --configuration production --base-href /dev/",
  "build:ssr:prod": "ng build --configuration production --base-href /",
  "deploy:dev": "npm run build:ssr:dev && sls deploy --stage dev",
  "deploy:prod": "npm run build:ssr:prod && sls deploy --stage prod"
}
```

### Proceso de Deploy
1. **Build Angular SSR**: Genera bundles optimizados (browser + server)
2. **Package Serverless**: Empaqueta solo dependencias necesarias
3. **Deploy Lambda**: Sube función y configura API Gateway
4. **Actualizar DNS**: CloudFront apunta a nueva versión

### Optimizaciones de Bundle
En `serverless.yml`:
```yaml
package:
  individually: true
  patterns:
    - "!**/*"                                    # Excluir todo
    - "dist/letiende.co/browser/**"             # Incluir assets del cliente
    - "dist/letiende.co/server/**"              # Incluir servidor SSR
    - "node_modules/@codegenie/serverless-express/**"  # Incluir runtime
```

## Git Workflow

### Conventional Commits
Formato: `<tipo>(<alcance>): <descripción>`

Ejemplos:
```
feat(menu): agregado selector de bebidas
fix(teatro): corregido selector de precios
docs(readme): actualizar instrucciones
refactor(navbar): mejorado performance
chore(deps): actualizado PrimeNG
style(inicio): ajustado espaciado glassmorphism
perf(imagenes): implementado lazy loading
test(menu): agregados tests unitarios
```

**Tipos válidos**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización de código
- `perf`: Mejoras de performance
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento
- `ci`: Cambios en CI/CD
- `build`: Cambios en sistema de build

### Branch Strategy
- **`main`**: Producción actual (protegido)
- **`2025`**: Desarrollo de nueva versión (rama principal de desarrollo)
- **`feature/*`**: Nuevas funcionalidades (merge a `2025`)
- **`fix/*`**: Correcciones de bugs (merge a `2025`)
- **`hotfix/*`**: Correcciones urgentes (merge a `main` y `2025`)

### Estrategia de Tags (Semantic Versioning)

Formato: `v<MAJOR>.<MINOR>.<PATCH>[-<PRERELEASE>]`

**Versionado**:
- **MAJOR** (v2.0.0): Cambios incompatibles con versión anterior
- **MINOR** (v1.1.0): Nueva funcionalidad compatible
- **PATCH** (v1.0.1): Correcciones de bugs

**Pre-releases**:
- `v1.0.0-alpha.1`: Versión alfa (desarrollo inicial)
- `v1.0.0-beta.1`: Versión beta (pruebas)
- `v1.0.0-rc.1`: Release candidate (casi producción)

**Ejemplos de uso**:
```bash
# Desarrollo inicial de 2025
git tag v2.0.0-alpha.1
git push origin v2.0.0-alpha.1

# Primera beta pública
git tag v2.0.0-beta.1
git push origin v2.0.0-beta.1

# Release a producción
git tag v2.0.0
git push origin v2.0.0

# Hotfix en producción
git tag v2.0.1
git push origin v2.0.1
```

**Workflow de Tags**:
1. **Desarrollo**: Tags en rama `2025` con sufijo `-alpha` o `-beta`
2. **Staging**: Tag `-rc` (release candidate) para pruebas finales
3. **Producción**: Tag sin sufijo en rama `main` después de merge
4. **Hotfix**: Tag PATCH en `main` para correcciones urgentes

**Automatización**:
```bash
# Crear tag anotado con mensaje
git tag -a v2.0.0-alpha.1 -m "feat: implementación inicial arquitectura 2025"

# Ver historial de tags
git tag -l -n9

# Eliminar tag (si fue error)
git tag -d v2.0.0-alpha.1
git push origin :refs/tags/v2.0.0-alpha.1
```

## IMPORTANTE
- TODO en español de Colombia: respuestas en el chat, código, comentarios, documentación, mensajes de error. Así las instrucciones se entreguen en inglés.
- Toda sugerencia de servicios externos debe ser gratuita.
- Antes de sugerir o construir código, te debes asegurar que se está usando la versión mencionada en la sección [Tecnologías](#tecnologias); si es necesario, consulta la documentación.