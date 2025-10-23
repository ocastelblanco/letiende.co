# letiende.co

> Aplicación web de alto rendimiento con arquitectura serverless para Le Tiende - Centro cultural, librería, café, bar y teatro en Bogotá, Colombia.

[![Angular](https://img.shields.io/badge/Angular-20.x-red?logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Serverless](https://img.shields.io/badge/Serverless-4.x-fd5750?logo=serverless)](https://www.serverless.com/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?logo=amazonaws)](https://aws.amazon.com/lambda/)

## Destacados Técnicos

### Arquitectura Zero-Infrastructure Cost

Esta aplicación demuestra cómo construir una aplicación web moderna, escalable y de alto rendimiento utilizando **servicios gratuitos o de muy bajo costo**, eliminando la necesidad de servidores dedicados:

- **Angular 20 SSR + AWS Lambda**: Server-Side Rendering en funciones serverless sin administración de servidores
- **Pay-per-request**: Solo se paga por las solicitudes reales, sin costos fijos mensuales
- **Firebase**: Autenticación, base de datos y storage sin gestión de backend
- **Cloudinary**: CDN global para imágenes y videos con transformaciones on-the-fly
- **Google Workspace + Apps Script**: CMS headless gratuito con actualizaciones en tiempo real

### Innovaciones Arquitectónicas

#### 1. CMS Headless con Google Sheets
```
Google Sheets → Apps Script → API Pública → AWS S3 → Angular SSR
```
Los editores de contenido actualizan una hoja de cálculo, que automáticamente:
- Dispara un trigger de Apps Script al cambiar celdas
- Convierte los datos a JSON
- Llama a una API pública que almacena en S3
- La aplicación consume los datos estáticos desde CDN

**Ventaja**: CMS gratuito, familiar para usuarios no técnicos, sin base de datos tradicional.

#### 2. SSR Serverless con Serverless Framework
```typescript
// Configuración optimizada para AWS Lambda
provider:
  name: aws
  runtime: nodejs22.x
  memorySize: 1024
  timeout: 10
```

El bundle de Angular SSR se ejecuta en AWS Lambda usando `@codegenie/serverless-express`, permitiendo:
- Renderizado del lado del servidor para SEO óptimo
- Hidratación instantánea del cliente
- Escalado automático basado en demanda
- Cold start < 1s con optimizaciones de bundle

#### 3. Gestión de Secretos Multi-Entorno
```typescript
// Variables de entorno desde AWS SSM Parameter Store
environment:
  CLOUDINARY_API_KEY: ${ssm:/letiende/${sls:stage}/CLOUDINARY_API_KEY}
  FIREBASE_API_KEY: ${ssm:/letiende/${sls:stage}/FIREBASE_API_KEY}
```

**Seguridad**: Cero secretos en el código. AWS Systems Manager gestiona credenciales por entorno (dev/prod).

#### 4. Arquitectura Zoneless
```typescript
// Angular sin Zone.js para mejor rendimiento
provideZonelessChangeDetection()
```

Utiliza Angular Signals y detección de cambios manual para:
- Reducir tamaño del bundle (~20KB menos)
- Mejorar performance de rendering
- Control granular sobre actualizaciones del DOM

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Angular](https://angular.dev) | 20.x | Framework SPA con SSR |
| [TypeScript](https://www.typescriptlang.org/) | 5.8 | Type safety y DX mejorado |
| [PrimeNG](https://primeng.org) | 20.x | Componentes UI empresariales |
| [Angular Fire](https://github.com/angular/angularfire) | 20.x | SDK oficial de Firebase |
| [Cloudinary Angular SDK](https://cloudinary.com/documentation/angular_integration) | 2.x | Gestión de medios |

### Backend & Infraestructura
| Servicio | Propósito | Costo |
|----------|-----------|-------|
| AWS Lambda | Ejecución de SSR | Pay-per-request |
| AWS S3 | Storage de assets estáticos | ~$0.01/mes |
| AWS Systems Manager | Gestión de secretos | Gratuito |
| Firebase Auth | Autenticación federada | Gratuito (tier Spark) |
| Firebase Firestore | Base de datos NoSQL | Gratuito hasta 1GB |
| Cloudinary | CDN de imágenes/videos | Gratuito hasta 25GB/mes |
| Google Workspace | Apps Script como backend | Incluido con cuenta |

### Deployment
```bash
# Desarrollo local
npm start

# Build para producción
npm run build:ssr:prod

# Deploy a AWS Lambda
npm run deploy:prod
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── compartidos/              # Código reutilizable
│   │   ├── componentes/          # Componentes compartidos
│   │   │   ├── icono.ts          # Wrapper unificado de iconos
│   │   │   ├── imagen-fondo.ts   # Imagen de fondo con glassmorphism
│   │   │   ├── menu-lateral/     # Navegación lateral
│   │   │   └── navbar/           # Barra de navegación
│   │   ├── modulos/
│   │   │   ├── iconos/           # FontAwesome icons tree-shaken
│   │   │   └── primeng/          # PrimeNG components tree-shaken
│   │   └── servicios/
│   │       ├── breakpoint-service.ts    # Detección responsive
│   │       ├── cloudinary-api.ts        # Cliente Cloudinary
│   │       ├── datos.ts                 # Servicio de datos centralizado
│   │       └── meta.ts                  # SEO y Open Graph
│   └── vistas/                   # Componentes de página
│       ├── inicio/
│       └── menu/
├── tema/                         # Sistema de diseño custom
│   ├── lt-tema.ts               # Preset de PrimeNG
│   ├── mixins.scss              # Mixins SCSS reutilizables
│   └── var.scss                 # Variables de diseño
└── server.ts                    # Entry point para SSR
```

## Principios de Diseño

### Glassmorphism
La interfaz implementa el efecto glassmorphism moderno:
- Fondos con backdrop-filter: blur()
- Transparencias con opacidad controlada
- Bordes sutiles y sombras multicapa
- Microanimaciones para feedback visual

Referencia: [Design Studio UI/UX - Glassmorphism](https://www.designstudiouiux.com/blog/what-is-glassmorphism-ui-trend)

### Performance Optimizations
- **Code Splitting**: Lazy loading por rutas
- **Tree Shaking**: Imports selectivos de PrimeNG y FontAwesome
- **Image Optimization**: NgOptimizedImage + Cloudinary transformations
- **Prefetching**: Event replay para hidratación instantánea

## Buenas Prácticas Angular 20

### Standalone Components
```typescript
@Component({
  selector: 'lt-navbar',
  imports: [RouterLink, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {}
```

### Signals para State Management
```typescript
// Estado reactivo sin RxJS
readonly isMenuOpen = signal<boolean>(false);
readonly menuItems = computed(() => this.datos.menu());
```

### Control Flow Nativo
```html
@if (isMenuOpen()) {
  <nav class="menu-lateral">
    @for (item of menuItems(); track item.id) {
      <a [routerLink]="item.ruta">{{ item.titulo }}</a>
    }
  </nav>
}
```

### Inject Function Pattern
```typescript
export class MiComponente {
  private readonly datos: DatosService = inject(DatosService);
  private readonly router: Router = inject(Router);
}
```

## Variables de Entorno

### Desarrollo Local
Crear archivo `src/secrets.ts` (gitignored):
```typescript
export const localSecrets = {
  CLOUDINARY_CLOUD_NAME: 'tu-cloud-name',
  CLOUDINARY_API_KEY: 'tu-api-key',
  FIREBASE_API_KEY: 'tu-firebase-key',
  // ... resto de credenciales
};
```

### Producción (AWS)
Usar el script `setup-secrets.sh` para configurar AWS SSM Parameter Store:
```bash
./setup-secrets.sh prod
```

## Despliegue

### Requisitos Previos
1. AWS CLI configurado con credenciales
2. Node.js 22.x o superior
3. Serverless Framework 4.x

### Proceso de Deploy
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar secretos en AWS SSM
./setup-secrets.sh prod

# 3. Build y deploy
npm run deploy:prod
```

El deploy automáticamente:
- Construye la aplicación con Angular AOT
- Genera bundles optimizados para SSR
- Empaqueta solo dependencias necesarias
- Sube a AWS Lambda
- Configura API Gateway

### Gestión de Stages
```bash
# Desarrollo
npm run deploy:dev     # Despliega en /dev

# Producción
npm run deploy:prod    # Despliega en /
```

## Flujo de Trabajo Git

### Conventional Commits
```bash
feat(menu): agregado selector de bebidas
fix(teatro): corregido selector de precios
docs(readme): actualizar instrucciones
refactor(navbar): mejorado performance
chore(deps): actualizado PrimeNG
```

### Estrategia de Branches
- `main`: Producción actual
- `2025`: Desarrollo de nueva versión
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correcciones de bugs

## Análisis de Costos

### Estimación Mensual (10,000 visitas/mes)
| Servicio | Costo Estimado |
|----------|----------------|
| AWS Lambda (100ms avg) | $0.20 |
| AWS S3 Storage | $0.01 |
| AWS S3 Requests | $0.05 |
| Firebase (bajo tier gratuito) | $0.00 |
| Cloudinary (bajo tier gratuito) | $0.00 |
| Google Workspace (Apps Script) | $0.00 |
| **Total** | **~$0.26/mes** |

### Escalabilidad
- **100,000 visitas/mes**: ~$2.50/mes
- **1,000,000 visitas/mes**: ~$25/mes

Compare con VPS tradicional: $5-20/mes con capacidad limitada.

## Contribuciones

Este proyecto sirve como showcase de arquitecturas modernas serverless. Las contribuciones son bienvenidas siguiendo:

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m 'feat(scope): descripción'`
4. Push: `git push origin feature/mi-feature`
5. Pull Request a branch `2025`

## Licencia

Proyecto propietario de Le Tiende © 2025

---

**Desarrollado por**: Oscar Castelblanco
**Sitio**: [letiende.co](https://letiende.co)
**Ubicación**: Parkway, Bogotá, Colombia
