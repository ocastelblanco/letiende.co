# Especificaciones técnicas — letiende.co

Referencia de arquitectura del contenedor. Nivel: suficiente para retomar el proyecto sin contexto
previo. El "por qué" de negocio de cada decisión está en [`PRD.md`](PRD.md), referenciado por sección.

---

## 1. Arquitectura

```
                            ┌──────────────────────┐
   visitante  ─────────────►│      Route 53        │
                            │  letiende.co  (A)    │
                            └──────────┬───────────┘
                                       │
                            ┌──────────▼─────────────────────────────────┐
                            │        CloudFront  (producción)            │
                            │        una distribución, cuatro behaviors  │
                            └──┬───────────┬────────────┬────────────┬───┘
                               │           │            │            │
                  /cartelera/*  ───┘           │            │            └───  /assets/*
                               │  /libros/*│            │  /*  (default)
                               │           │            │            │
         ┌─────────────────────▼──┐  ┌─────▼─────────┐  │   ┌────────▼─────────┐
         │  HTTP API  qe36b86eb7  │  │ HTTP API      │  │   │ S3 letiende-     │
         │  agora-letiende        │  │ aav553hwx4    │  │   │ assets (cacheado)│
         │  ┌──────────────────┐  │  │ babel-letiende│  │   └──────────────────┘
         │  │ Lambda  ssr      │  │  │ ┌───────────┐ │  │
         │  │ + Lambdas de API │  │  │ │Lambda ssr │ │  │
         │  └────────┬─────────┘  │  │ └─────┬─────┘ │  │
         └───────────┼────────────┘  └───────┼───────┘  │
                     │                       │          │
              ┌──────▼──────┐         ┌──────▼──────┐   │
              │  DynamoDB   │         │  DynamoDB   │   │
              │  (Ágora)    │         │  (Babel)    │   │
              └─────────────┘         └─────────────┘   │
                                                        │
                          ┌─────────────────────────────▼──────────────┐
                          │  HTTP API   letiende-co-production         │
                          │  ┌──────────────────┐  ┌────────────────┐  │
                          │  │ Lambda  ssr      │  │ Lambda contacto│──┼──► SES
                          │  │ (este repo)      │  │                │  │
                          │  └────────┬─────────┘  └────────────────┘  │
                          └───────────┼────────────────────────────────┘
                                      │  lectura, solo para la portada
                                      └──────►  GET /api/eventos-publicos  (Ágora)

   Sin base de datos propia.  Sin autenticación.  Sin estado de servidor.
```

**La idea en una línea:** CloudFront es el único punto donde se junta todo. Los tres orígenes son
independientes, se despliegan por separado y ninguno sabe de los otros (PRD §9, D-1).

---

## 2. Stack tecnológico

Versiones verificadas contra el registro de npm el 01/09/2026.

| Componente | Versión | Propósito | Documentación |
|---|---|---|---|
| Angular | `~22.1.x` | Framework de la aplicación | <https://angular.dev> |
| `@angular/ssr` | `~22.1.x` | Renderizado en servidor | <https://angular.dev/guide/ssr> |
| `@angular/build` | `~22.1.x` | Builder (`application`, `unit-test`, `dev-server`) | <https://angular.dev/tools/cli/build> |
| TypeScript | `~6.0.x` | Lenguaje. **No 7.x**: Angular 22 aún no la soporta | <https://www.typescriptlang.org/docs/> |
| Tailwind CSS | `^4.3.x` | Estilos, vía `@tailwindcss/postcss` | <https://tailwindcss.com/docs> |
| Vitest | `^4.x` | Pruebas unitarias, vía `@angular/build:unit-test` | <https://vitest.dev> |
| Express | `^5.x` | Servidor del SSR dentro de la Lambda | <https://expressjs.com> |
| `@codegenie/serverless-express` | `^5.x` | Adaptador Express → Lambda | <https://github.com/CodeGenieApp/serverless-express> |
| Node.js | `24.x` | Runtime de Lambda y de desarrollo local | <https://nodejs.org> |
| Serverless Framework | `4.41.x` | Infraestructura como código | <https://www.serverless.com/framework/docs> |
| AWS SDK v3 (`client-ses`) | `^3.x` | Envío del formulario de contacto | <https://docs.aws.amazon.com/sdk-for-javascript/> |
| ESLint + `angular-eslint` | última estable | Análisis estático | <https://github.com/angular-eslint/angular-eslint> |
| Prettier | `^3.x` | Formato | <https://prettier.io> |

**Deliberadamente ausentes:** Angular Material, PrimeNG, Firebase, DynamoDB, cualquier gestor de
estado global. Ver PRD §9, D-4 y D-5.

---

## 3. Estructura del repositorio

```
letiende.co/
├── CLAUDE.md                    # instrucciones para agentes IA
├── AGENTS.md                    # → enlace simbólico a CLAUDE.md
├── README.md                    # inglés
├── README.es.md                 # español
├── LICENSE
├── angular.json
├── package.json
├── serverless.yml               # infraestructura del contenedor
├── .postcssrc.json              # { "plugins": { "@tailwindcss/postcss": {} } }
├── .prettierrc
├── eslint.config.js
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── deploy.yml           # PR → staging, merge → production
├── docs/                        # toda la documentación menos CLAUDE.md
│   ├── PRD.md
│   ├── tech-specs.md
│   ├── DESIGN.md
│   ├── MEMORY.md
│   └── TODO.md
├── metrics/                     # registro de esfuerzo (ai-effort-tracking)
│   ├── config.json
│   ├── pricing.json
│   └── events/*.jsonl
├── public/                      # favicons, logos, manifest, robots.txt
├── server/
│   ├── tsconfig.json
│   └── api/
│       ├── handlers/contacto.ts
│       └── lib/                 # utilidades compartidas + sus *.spec.ts
└── src/
    ├── index.html
    ├── main.ts
    ├── main.server.ts
    ├── server.ts                # entrada del SSR
    ├── styles.css               # @theme de Tailwind 4
    ├── environments/
    │   ├── environment.ts
    │   └── environment.production.ts
    └── app/
        ├── app.ts / app.html / app.css
        ├── app.config.ts
        ├── app.config.server.ts
        ├── app.routes.ts
        ├── app.routes.server.ts
        ├── core/
        │   ├── api/             # servicios HTTP
        │   └── seo/             # metadatos y JSON-LD
        ├── features/
        │   ├── inicio/
        │   ├── nosotros/
        │   ├── contacto/
        │   └── preguntas-frecuentes/
        └── shared/
            └── navegacion/      # barra superior y pie de página
```

Estructura `core / features / shared` idéntica a la de Ágora y Babel, a propósito: quien salta entre
los tres repositorios no debe tener que reaprender dónde vive cada cosa. Nombres de archivo y de
clase en español (`CLAUDE.md` §4).

**Path aliases** en `tsconfig.json`:

```jsonc
"paths": {
  "@core/*":        ["src/app/core/*"],
  "@features/*":    ["src/app/features/*"],
  "@shared/*":      ["src/app/shared/*"],
  "@environments/*":["src/environments/*"]
}
```

---

## 4. Frontend

### 4.1 Patrones obligatorios

Los de `CLAUDE.md` §4, sin excepciones: componentes standalone, `OnPush`, signals, `inject()`,
control de flujo `@if`/`@for`, aplicación *zoneless*, formularios reactivos, cero `any`.

Para datos remotos se usa `httpResource()`, no `HttpClient` + `subscribe` manual: da estado de carga,
error y valor en un solo signal, y funciona en SSR sin trabajo extra.

**`resource.value()` lanza cuando el recurso está en estado de error — verificado en vivo en T-0005,
no es solo lo que dice la documentación de Angular.** El encadenamiento opcional (`?.`, `??`) no
alcanza a proteger nada: la excepción salta al leer `.value()`, antes de que esos operadores
puedan actuar. La única lectura no explosiva es `resource.hasValue()` primero:

```ts
protected readonly proximosEventos = computed(() => {
  const recurso = this.eventosPublicos.cartelera;
  return recurso.hasValue() ? recurso.value().slice(0, 3) : [];
});
```

`datos() ?? []`/`datos()?.campo` solo son seguros para el estado *previo a la primera respuesta*
(`value()` en `undefined`, no lanza); para el estado de error hace falta `hasValue()`. `GET
/api/eventos-publicos` de Ágora devuelve el arreglo directamente, sin envoltorio — verificado contra
`agora/server/api/handlers/eventos-publicos.ts` (`respuestaJson(200, eventos)`), no asumido.

### 4.2 Rutas

Todas públicas. **No hay guards en este proyecto** (PRD §9, D-4).

| Ruta | Componente | Renderizado | Notas |
|---|---|---|---|
| `/` | `InicioComponent` | SSR | Portada. Consume la cartelera de Ágora para los próximos eventos |
| `/nosotros` | `NosotrosComponent` | Prerender | Contenido estático |
| `/contacto` | `ContactoComponent` | Prerender | Formulario + mapa + horarios — nada depende de una petición por visita; verificado con `npm run build` (T-0006/T-0008: "Prerendered 2 static routes"), corregido frente al "SSR" de la planeación original |
| `/preguntas-frecuentes` | `PreguntasFrecuentesComponent` | Prerender | Base del `FAQPage` para AEO |
| `/cartelera/**` | — | — | **No es ruta de Angular.** La resuelve CloudFront contra Ágora |
| `/libros/**` | — | — | **No es ruta de Angular.** La resuelve CloudFront contra Babel |
| `/carta` *(etapa 2)* | — | — | Por definir. Ver PRD §6 |
| `**` | `NoEncontradaComponent` | SSR, código 404 | Debe responder 404 real, no 200 |

> **Trampa que ya costó tiempo en otros proyectos:** una página de "no encontrada" que responde
> HTTP 200 hace que los buscadores indexen basura. El estado se fija en el servidor.

`app.routes.server.ts` declara `RenderMode.Prerender` para las rutas estáticas y `RenderMode.Server`
para el resto. Ninguna ruta usa `RenderMode.Client`: rompería el requisito de SEO (PRD §8).

### 4.3 Modelos de datos

El contenedor **no tiene modelo de datos propio persistido**. Solo dos formas leídas de terceros:

```ts
// core/api/eventos-publicos.service.ts — subconjunto de lo que expone Ágora.
// Nombres de campo verificados contra agora/src/app/core/models/evento.model.ts
// (interfaz EventoPublico) el 02/09/2026, no adivinados: no existen `titulo`,
// `fechaInicio`, `imagenAfiche` ni `lugar` en la respuesta real de Ágora — Ágora
// no rastrea un campo de lugar por evento (siempre es el mismo teatro).
export interface EventoEnCartelera {
  readonly slug: string;
  readonly nombre: string;
  readonly fechaHora: string;   // ISO-8601
  readonly imagenUrl?: string;  // ausente si el evento no tiene imagenKey — usar un placeholder
}

// Lo que ContactoComponent.enviar() manda a POST /api/contacto — no vive en
// un contacto.service.ts separado (la planeación original lo daba por
// hecho; en el código real, T-0009, la llamada queda directo en el
// componente, sin una capa de servicio que no aportaba nada nuevo).
export interface MensajeDeContacto {
  readonly nombre: string;
  readonly correo: string;
  readonly mensaje: string;
  readonly consentimientoDatos: boolean;   // obligatorio, Ley 1581
  readonly sitioWeb: string;               // honeypot — un humano lo deja vacío (T-0009)
  readonly recaptchaToken: string;         // reCAPTCHA v3, token de un solo uso (T-0009, ADR-020)
}
```

### 4.4 Estilos

Tailwind 4 sin archivo de configuración: la paleta se declara en `src/styles.css` dentro de `@theme`.
Los valores exactos —y las clases de contenedor, tarjeta, botón e input— salen de
[`DESIGN.md`](DESIGN.md) y de ningún otro lado.

### 4.5 SEO y AEO

Requisito de primer orden (PRD §8), no un acabado.

| Pieza | Dónde | Detalle |
|---|---|---|
| Renderizado en servidor | Todas las rutas | Sin SSR no hay indexación ni respuesta de asistentes de IA |
| `<title>` y `<meta description>` | Por ruta, vía `MetaService` | Únicos por página, escritos a mano |
| Canónica | Por ruta | Siempre `https://letiende.co/...`, incluso en las rutas por proxy |
| Open Graph y Twitter Card | Por ruta | Imagen propia por sección |
| `robots.txt` | `GET /robots.txt` en `server.ts` (dinámico, no `public/`) | `Disallow: /` fuera de `letiende.co` (staging incluido) — el mismo artefacto sirve a los dos stages, así que el host de la petición es lo único que los distingue en tiempo de ejecución (ADR-015, ADR-018) |
| Mapa del sitio | `GET /sitemap.xml` en `server.ts` | **Hoy solo las rutas propias** (`/`, `/nosotros`, `/contacto`, `/preguntas-frecuentes`), no el índice de los tres — ver ADR-018 |
| Redirecciones 301 | `agora.letiende.co`, `babel.letiende.co` | Hacia la ruta equivalente. Evita competir contra sí mismo |
| Datos estructurados | JSON-LD, `core/seo/` | Ver abajo |

**JSON-LD por página** (implementado en T-0008; `esquemaX()` vive en `core/seo/esquemas.ts`):

| Página | Tipos |
|---|---|
| Todas | `Organization` + `WebSite` (sin `SearchAction`: el sitio no tiene una función de búsqueda real — ver ADR-018) |
| `/` | `LocalBusiness` → `PerformingArtsTheater`, con `openingHoursSpecification`, `address` (sin `geo`: no hay coordenadas verificadas) |
| `/` | `ItemList` de los próximos eventos, cada uno como `Event`, solo si hay eventos que mostrar |
| `/nosotros` | `AboutPage` + `BreadcrumbList` |
| `/contacto` | `ContactPage` + repetición de `LocalBusiness` + `BreadcrumbList` |
| `/preguntas-frecuentes` | `FAQPage` + `BreadcrumbList` (T-0012) |

Ágora ya emite `Event` en sus fichas y Babel debe emitir `Book`; el contenedor **no los duplica**. El
`ItemList` de la portada no es un duplicado: describe el resumen de eventos que aparece en la propia
portada de `letiende.co`, contenido del contenedor, no de Ágora.

> **Mapa del sitio: reducido a propósito frente al plan original.** Verificado con `curl` contra
> `agora.letiende.co/sitemap.xml` (200, `<urlset>` vacío porque hoy no hay eventos publicados): Ágora
> **ya** expone un sitemap real, pero sigue emitiendo bajo su propio subdominio, no bajo
> `/cartelera` — ese ajuste es T-11. Babel **no tiene sitemap propio todavía** — T-12. Construir hoy
> un índice que agregue los tres enviaría a los buscadores una entrada rota (Babel) y una con el
> dominio equivocado (Ágora), peor que no tener índice. `/sitemap.xml` de este repo lista solo sus
> tres rutas propias hasta que T-11/T-12 hagan del índice de tres algo real (ver ADR-018).

---

## 5. Backend

Superficie mínima a propósito. Todo lo demás llega por proxy o desde el API público de Ágora.

| Método | Ruta | Quién la llama | Descripción | Cuerpo |
|---|---|---|---|---|
| `POST` | `/api/contacto` | Formulario de `/contacto` | Envía el mensaje al correo del equipo vía SES, tras verificar honeypot y reCAPTCHA v3 (T-0009, ADR-019/ADR-020) | `MensajeDeContacto` (§4.3) |
| `GET` | `/api/salud` | CI, tras cada despliegue | Prueba de humo | — |
| `GET` | `/sitemap.xml` | Buscadores | Índice de mapas del sitio | — |
| `*` | `/**` | Visitantes | SSR de la aplicación Angular | — |

**Consumido de terceros** (no es de este repositorio, se lee desde el SSR):

| Método | Ruta | Origen | Uso |
|---|---|---|---|
| `GET` | `/api/eventos-publicos` | Ágora | Próximos eventos en la portada |

Esa lectura ocurre **en el servidor durante el SSR**, contra el endpoint del API de Ágora, nunca
desde el navegador contra otro dominio: evita CORS y evita una petición extra en el cliente.
Si Ágora no responde, la portada se renderiza igual, sin la sección de eventos — nunca falla entera.

---

## 6. Servicios externos

| Servicio | Estado | Uso |
|---|---|---|
| **Ágora** (`qe36b86eb7`) | En producción | Cartelera y boletería, servidas por proxy en `/cartelera/*` |
| **Babel** (`aav553hwx4`) | En producción | Catálogo, servido por proxy en `/libros/*` |
| **AWS SES** | Activo en la cuenta | Envío del formulario de contacto |
| **Comandante** | En producción | Lista de precios del café bar. **Etapa 2** |
| **`letiende-api`** (`uklz2j4u38`) | Heredado, fuera de IaC | **No se usa en la etapa 1.** Ver §11 |
| **Google Maps Embed API** | Activo (T-0006) | Mapa incrustado en `/contacto`, vía `iframe`. La llave (pública, restringida por dominio del lado de Google Cloud) **no está en el código**: `environment.googleMapsApiKey` es un marcador que `scripts/inyectar-llaves-publicas.mjs` sustituye sobre `dist/` a partir de `GOOGLE_MAPS_API_KEY` (docs/MEMORY.md, ADR-017) |
| **Google Analytics 4** | Activo (T-0006) | Reemplaza la integración legacy (Universal Analytics). Carga solo en el host `letiende.co` (`AnalyticsService` comprueba el hostname en tiempo de ejecución, para no contaminar las métricas con tráfico de staging, que despliega el mismo artefacto). El Measurement ID tampoco está en el código — mismo mecanismo de marcador que Maps, variable `GOOGLE_ANALYTICS_ID` |
| **reCAPTCHA v3** | Activo (T-0009, ADR-020) | Antiabuso de `POST /api/contacto`, junto con honeypot y límite de tasa (ADR-019) — verifica el token en la misma petición que el envío, corrigiendo un gap real que el legado abandonado (rama `2025`) nunca cerró. Site key pública con marcador en `environments/` (mismo mecanismo que Maps/GA4); secret key solo como `RECAPTCHA_SECRET_KEY` en el entorno de la Lambda `contacto`, nunca en el bundle |

---

## 7. Infraestructura

### 7.1 Multi-entorno

**Los dos stages son estructuralmente idénticos.** Es la decisión que hace verificable al proxy
(ADR-002): staging tiene su propio dominio, su propio certificado y su propia distribución de
CloudFront, así que se puede probar entero antes de tocar producción.

| Stage | Dirección | CloudFront | Orígenes del proxy | Cómo se despliega |
|---|---|---|---|---|
| `staging` | `https://staging.letiende.co` | Distribución propia | Ágora y Babel **staging** | Automático al abrir o actualizar un PR |
| `production` | `https://letiende.co` | Distribución propia | Ágora y Babel **producción** | Automático al fusionar a `main` |

Staging apunta a los stacks de staging de los repos hermanos, no a los de producción: una prueba
del contenedor no puede escribir sobre datos reales de boletería ni de inventario.

**Requisitos de infraestructura de staging** (se crean una sola vez, antes del primer despliegue):

- Certificado ACM para `staging.letiende.co` en **`us-east-1`** — CloudFront no acepta certificados
  de otra región, sin importar dónde viva el resto del stack.
- Registro `A` de tipo alias en la zona `Z010633738KAGFIPOZVEW` apuntando a la distribución.
- `robots.txt` de staging con `Disallow: /`. **Obligatorio:** un staging indexable compite contra
  producción por las mismas palabras y se lleva parte del posicionamiento que costó ganar.

### 7.2 Las distribuciones de CloudFront

Una por stage, con la **misma estructura de behaviors** y distintos orígenes. La distribución de
producción es **nueva**: la actual (`E33QAN86FY24JZ`, que sirve el sitio estático desde S3) se deja
intacta hasta el cutover, para que revertir sea cambiar un registro de Route 53 (PRD §9, D-8).

| Behavior | Origen en `production` | Origen en `staging` | Política de caché |
|---|---|---|---|
| `/cartelera/*` | `qe36b86eb7.execute-api…` (Ágora prod) | `ttukw9i82m.execute-api…` (Ágora staging) | `CachingDisabled` |
| `/libros/*` | `aav553hwx4.execute-api…` (Babel prod) | `oyzau0c910.execute-api…` (Babel staging) | `CachingDisabled` |
| `/assets/*` | `letiende-assets.s3…` | `letiende-assets.s3…` | `CachingOptimized` |
| `*` (default) | API Gateway de este stack | API Gateway de este stack | `CachingDisabled` |

Todos los sufijos son `.us-east-1.amazonaws.com`, omitidos en la tabla por ancho.

**Cuatro detalles que rompen esto si se hacen mal:**

1. El origen de `/cartelera/*` debe ser el endpoint `execute-api` **crudo**, nunca `agora.letiende.co`.
   Ese dominio va a redirigir con 301 hacia `letiende.co/cartelera`, así que usarlo como origen crea un
   bucle infinito de redirecciones.
2. **No se reenvía el encabezado `Host`** al origen: API Gateway lo valida contra su propio dominio
   y responde 403 si llega el del visitante. Se usa una política de petición al origen tipo
   *AllViewerExceptHostHeader*.
3. **No se define `OriginPath`.** Ágora tiene que recibir la ruta completa (`/cartelera/evento/x`) porque
   su aplicación se compila con `--base-href /cartelera/` y espera ese prefijo.
4. **`/assets/*` sí necesita quitar su propio prefijo antes del origen** — a diferencia de
   `/cartelera/*`/`/libros/*`. El bucket `letiende-assets` no tiene `assets/` en sus keys (son
   `logos/…`, `data/…`, `flags/…`); sin una `AWS::CloudFront::Function` (`viewer-request`) que quite
   `/assets` de la URI antes de reenviarla a S3, la petición busca una key que no existe y S3
   responde **403**, no 404 (comportamiento del propio S3 cuando el solicitante no tiene
   `s3:ListBucket`, para no revelar la estructura del bucket) — hallazgo real de T-0011, verificado con
   `curl` contra `staging.letiende.co/assets/...` después del primer despliegue, no anticipado aquí.

**Dos hallazgos más, de T-0013/T-0014, ninguno anticipado en esta sección:**

5. **El header `Host` real del visitante no llega a Ágora/Babel** — consecuencia directa del punto 2:
   *AllViewerExceptHostHeader* despoja el `Host` original, pero `EmbebidoService` de cada app necesita
   saber cuál era para decidir si mostrar la barra común. Se agregó una `AWS::CloudFront::Function`
   (`FuncionInyectarHostVisitante`, `viewer-request`) que copia el `Host` real a un header propio,
   `x-le-tiende-host`, antes de reenviar al origen — cada app lo lee en vez de `Host`.
6. **El sitemap de cada app no respondía a través del proxy** (`/cartelera/sitemap.xml`,
   `/libros/sitemap.xml`) — CloudFront reenvía la ruta completa con el prefijo (punto 3: sin
   `OriginPath`), pero cada API Gateway solo tenía registrada la ruta sin prefijo. Se registró también
   la ruta con prefijo en el API Gateway de cada app.

**Un séptimo hallazgo, real incidente de producción (T-0013/T-0014, PR #63 de `agora-letiende` y #112
de `babel-letiende`):** la redirección de `/`/`evento-o-libro-detalle` que el diseño original hacía
CROSS-DOMAIN a `letiende.co/cartelera|libros/...` (para consolidar SEO) se desplegó a producción de
Ágora/Babel antes de que el cutover real de este stack (T-15) hiciera que ese destino existiera —
`letiende.co` en producción sigue sirviendo el sitio estático viejo (`E33QAN86FY24JZ`). Como
`agora.letiende.co`/`babel.letiende.co` son hoy el único acceso público real, ambos quedaron rotos.
Corregido en ambos repos: mientras el cutover no ocurra, toda ruta redirige mismo dominio con el
prefijo; la rama cross-domain queda comentada en el código de cada uno para restaurarse cuando T-15
esté hecho — **no antes**, y es responsabilidad de quien ejecute T-15 volver a esos dos repos después
del cutover para restaurarla.

**Octavo hallazgo, encontrado en la verificación previa a T-15 (03/09/2026), no relacionado con el
proxy:** ninguna de las tres distribuciones de CloudFront del dominio (`E33QAN86FY24JZ`/actual,
`EQW683KP4VXIV`/staging, `ER22S2WADMM83`/producción nueva) emite los encabezados de seguridad que
`CLAUDE.md` §5 (A05) exige como obligatorios en **todos** los behaviors: `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` — verificado con `curl -i` real contra
las tres, ninguna los trae. `serverless.yml` de este repositorio nunca declaró un
`ResponseHeadersPolicy` de CloudFront (grep vacío); T-0011 nunca lo incluyó, pese a que la regla ya
existía en `CLAUDE.md` cuando se planeó. No es una regresión de T-0013/T-0014 — es un requisito
documentado desde antes que nunca se implementó. **Recomendado resolverlo antes o como parte de T-15**:
después del cutover, `letiende.co` sirve contenido embebido de dos aplicaciones de terceros bajo el
mismo origen, así que la ausencia de CSP pesa más que hoy.

### 7.3 Qué cambia en Ágora y en Babel

El humano autorizó modificar ambos repositorios, con la instrucción de hacerlo **al mínimo**. La
planeación original preveía cuatro cambios por repositorio; el primer despliegue real a staging reveló
un quinto, no anticipado, sin el cual las páginas cargaban vacías (nunca se probó, en la planeación,
qué le pasa a una llamada de API con ruta *absoluta* bajo un `baseHref` con prefijo):

| # | Cambio | Archivo | Por qué |
|---|---|---|---|
| 1 | `"baseHref": "/cartelera/"` (Babel: `/libros/`) en el target `build` | `angular.json` | El router y los activos tienen que resolver bajo el prefijo del proxy |
| 2 | La barra de navegación propia pasa a ser la barra común de `DESIGN.md` §7 | 1 componente | Un solo menú visible en todo el recorrido |
| 3 | El mapa del sitio emite `https://letiende.co/cartelera/…` | handler del sitemap | Si no, apunta a direcciones que redirigen |
| 4 | Redirección 301 cuando el `Host` es el subdominio antiguo | handler del SSR | Evita contenido duplicado y rescata enlaces viejos |
| 5 | `absoluteUrlInterceptor` antepone el prefijo a `/api/*` cuando `EmbebidoService.embebido` es `true` | interceptor HTTP ya existente (ampliado) | Una ruta absoluta (`http.get('/api/…')`) la resuelve el navegador contra el origen de la página, **ignorando el `<base href>`** — a diferencia de una ruta relativa, nunca hereda su prefijo. Sin este cambio, CloudFront enruta la llamada al comportamiento por defecto (el contenedor) en vez de a la app real, y la página carga sin datos. Hallazgo real reportado en producción/staging por el humano ("nada funciona"), verificado con navegador real tras el fix: las llamadas de API salen prefijadas y responden 200 |

**Sobre el cambio 2 — es reemplazo, no ocultamiento.** Esconder la barra propia y no poner nada deja
al visitante dentro de la cartelera sin forma de volver: el HTML bajo `/cartelera` lo genera Ágora, y
este proyecto no tiene manera de inyectarle su barra desde afuera. El cambio mínimo que sí funciona es
que Ágora renderice la barra común en el lugar donde hoy renderiza la suya — mismo componente, mismo
punto de montaje, distinto contenido (ADR-003).

**Sobre el cambio 4** — no requiere tocar infraestructura. El subdominio antiguo sigue mapeado al
mismo API, y el propio SSR decide según el encabezado `Host`:

```ts
// En el handler de SSR de Ágora, antes de entregarle la petición a Angular.
// Solo actúa cuando la petición llegó por el subdominio viejo; por CloudFront
// el Host es letiende.co y esto no se ejecuta.
if (req.headers.host === 'agora.letiende.co') {
  return res.redirect(301, `https://letiende.co/cartelera${req.originalUrl}`);
}
```

**Consecuencia del cambio 1 que hay que tener presente:** una vez que Ágora se compila con
`--base-href /cartelera/`, abrir su URL cruda de API Gateway directamente deja de funcionar bien
(los activos se piden bajo `/cartelera/`). A partir de ahí, la forma correcta de probar Ágora es
a través de `staging.letiende.co/cartelera`. Es exactamente lo que ADR-002 vuelve posible, y la
razón por la que T-11 y T-12 dependen de T-13 y no al revés.

### 7.4 Costos

La cuenta de AWS es compartida con Ágora, Babel y otros proyectos. Sin etiquetas, el explorador de
costos no puede separar el gasto. **Obligatorio en `serverless.yml`:**

```yaml
provider:
  logRetentionInDays: 14          # nunca el infinito por defecto de CloudWatch
  stackTags: { Proyecto: letiende-co, Stage: '${sls:stage}' }
  tags:      { Proyecto: letiende-co, Stage: '${sls:stage}' }
  deploymentBucket:
    maxPreviousDeploymentArtifacts: 5
```

Regla heredada de un incidente real documentado en `agora/docs/advertencia-urgente-costos-aws.md`:
**retención de logs siempre acotada, artefactos de despliegue siempre podados.**

---

## 8. Autenticación y seguridad

**No hay autenticación en este proyecto** (PRD §9, D-4). Eso elimina de raíz las categorías OWASP
que dominan a los repos hermanos, y deja tres superficies reales:

1. El **formulario de contacto**: entrada sin autenticar que dispara un envío de correo.
2. El **proxy**: lo que CloudFront reenvía y lo que decide no reenviar.
3. El **contenido renderizado en servidor**: cualquier dato de terceros que llegue a la plantilla.

El análisis por categoría OWASP, con las reglas de código exactas, está en `CLAUDE.md` §5.

---

## 9. Gestión de secretos

Ningún secreto vive en el repositorio. Todos llegan como variables de entorno desde los secrets de
GitHub Actions, y `serverless.yml` los resuelve con `${env:NOMBRE, ''}`.

| Variable | Propósito | Contexto |
|---|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Despliegue (llaves de larga duración — ADR-021, no OIDC) | CI, ambos stages |
| `SERVERLESS_LICENSE_KEY` | Serverless Framework 4 sin login interactivo | CI, ambos stages |
| `SES_REMITENTE` | Dirección desde la que sale el correo de contacto (también el buzón que lo recibe: `Destination` es el propio `SES_REMITENTE`, no un buzón separado) | Lambda `contacto` |
| `CLOUDFRONT_DISTRIBUTION_ID_STAGING` | Invalidación tras desplegar staging | CI, entorno `staging` |
| `CLOUDFRONT_DISTRIBUTION_ID_PRODUCTION` | Invalidación tras desplegar producción | CI, entorno `production` |
| `ACM_CERTIFICATE_ARN_STAGING` | Certificado de `staging.letiende.co` (us-east-1) | CI, entorno `staging` |
| `ACM_CERTIFICATE_ARN_PRODUCTION` | Certificado de `letiende.co` (us-east-1) | CI, entorno `production` |

> **Trampa verificada en Ágora y Babel:** `${env:X, ''}` resuelve a cadena vacía en silencio cuando
> el secreto no existe en el entorno del job. La función despliega, no falla, y el correo simplemente
> nunca llega. **Tras cada despliegue, verificar por CLI** que la Lambda tiene el valor real:
> `aws lambda get-function-configuration --function-name letiende-co-production-contacto`.

---

## 10. Convenciones y git flow

Las de código están en `CLAUDE.md` §4; las de git, en `CLAUDE.md` §6.

**Pruebas** (detalle en `docs/TODO.md`, tarea de testing continuo):

| Nivel | Herramienta | Qué cubre | Umbral |
|---|---|---|---|
| Unitarias frontend | Vitest vía `@angular/build:unit-test` | Servicios, componentes, SEO | 80% de líneas |
| Unitarias backend | Vitest | Handlers y utilidades de `server/` | 80% de líneas |
| Estático | ESLint + `angular-eslint` + `tsc --noEmit` | Todo el repositorio | 0 errores |
| Secretos | `scripts/verificar-secretos.mjs`, en pre-commit | Archivos en stage | 0 hallazgos |
| Humo | `curl` contra `/api/salud` | Tras cada despliegue | HTTP 200 |
| Accesibilidad y SEO | Lighthouse CI | Portada y contacto | A11y ≥ 95, SEO = 100 |

`isolate: true` en el builder de pruebas es obligatorio: sin él, un `vi.mock` de un archivo se filtra
a otro y las pruebas fallan según el orden de ejecución (verificado en Ágora, no es teoría).

**Secretos, no GitGuardian.** Ágora y Babel dependen de la GitHub App de GitGuardian (`.gitguardian.
yaml` en Ágora es solo su lista de falsos positivos ignorados) — una integración a nivel de cuenta
de GitHub, no de código, fuera del alcance de un commit en este repositorio. `detect-secrets` es
Python, y habría metido un segundo lenguaje de tooling en un proyecto puramente Node. En su lugar,
T-0004 escribió un escáner propio de patrones conocidos (llaves de AWS, encabezados de llave privada,
tokens de OpenAI/Stripe/GitHub/Slack/Google), sin dependencias, ejecutado en cada commit. Es una red
más angosta que GitGuardian — decisión consciente, no un descuido — documentada en `MEMORY.md` §3
(ADR-011). Instalar la GitHub App de GitGuardian para este repositorio sigue siendo una mejora
disponible, y es del humano decidirla, no de un agente.

---

## 11. Roadmap técnico

| # | Trabajo | Archivos / dónde | Depende de |
|---|---|---|---|
| T-1 | Andamiaje Angular 22 + SSR + Tailwind 4 | Todo `src/`, `angular.json`, `package.json` | — |
| T-2 | `README.md` y `README.es.md` con insignias | Raíz | — |
| T-3 | Barra de navegación y pie de página comunes | `shared/navegacion/` | T-1 |
| T-4 | Portada con próximos eventos | `features/inicio/`, `core/api/` | T-1, T-3 |
| T-5 | Páginas institucionales | `features/nosotros/`, `features/contacto/` | T-1, T-3 |
| T-6 | Capa de SEO/AEO: `MetaService`, JSON-LD, `robots.txt`, mapa del sitio | `core/seo/`, `public/` | T-4, T-5 |
| T-7 | Lambda de contacto con SES + antiabuso | `server/api/handlers/contacto.ts` | T-5 |
| T-8 | `serverless.yml` del contenedor | Raíz | T-1 |
| T-9 | CI/CD con GitHub Actions y pruebas de humo | `.github/workflows/deploy.yml` | T-8 |
| T-10 | Pruebas y ganchos de pre-commit | `vitest.config.ts`, `.husky/` | T-1 |
| T-11 | **En Ágora:** `--base-href /cartelera/`, barra común en vez de la propia (`DESIGN.md` §8), mapa del sitio con prefijo | repo `agora` | T-13 |
| T-12 | **En Babel:** `--base-href /libros/`, barra común en vez de la propia (`DESIGN.md` §8), agregar mapa del sitio | repo `babel` | T-13 |
| T-13 | Distribuciones de CloudFront (staging y producción) con los cuatro behaviors, más certificados ACM y registro de `staging.letiende.co` | `serverless.yml` o consola | T-9 |
| T-14 | Redirecciones 301 de los subdominios antiguos | Ágora y Babel | T-13 |
| T-15 | Cutover: verificación completa del proxy en `staging.letiende.co` y cambio del registro de producción en Route 53 | Route 53 | T-13, T-14 |
| T-16 | *Etapa 2:* publicación de la carta del café bar | Por definir | T-15 |
| T-17 | *Etapa 2:* actualización de `letiende-api` (runtime, IaC, revisión de seguridad) | repo por definir | — |

**Sobre T-17.** `letiende-api` es una función Lambda con `nodejs22.x`, 128 MB, desplegada a mano, con
el rol compartido `generica-role-o1869of8` y variables `SES_FROM_ADDRESS`, `discogs_token` y
`google_API_KEY`. Esas dos últimas indican que **algo más depende de ella**. No se toca en la etapa 1.
Antes de moverla hay que averiguar quién la consume; redesplegarla a ciegas rompería ese consumidor.
