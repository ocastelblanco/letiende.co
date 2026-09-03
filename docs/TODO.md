# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

## Tarea T-0009 — [FEATURE] Lambda de contacto con SES y antiabuso

**Origen:** PRD §5 F-6, `tech-specs.md` §5 y §1 (diagrama de arquitectura), T-7 · `CLAUDE.md` §5,
A03/A07 · **depende de T-0007** (necesita que `serverless.yml` ya exista, para agregarle la función
`contacto`)

**Contexto.** `ContactoComponent` (T-0006) ya tiene el formulario completo, validado en el navegador,
con la casilla de consentimiento (Ley 1581). `enviar()` hoy solo pone `estadoEnvio` en
`'backend-pendiente'` — no hace ninguna llamada HTTP real. Esta tarea es ese backend.

**Corrección frente al primer borrador de esta tarea:** `contacto` **no** es una ruta de Express
dentro de `src/server.ts`. El diagrama de `tech-specs.md` §1 la muestra como una **Lambda separada**,
hermana de `ssr`, con su propia flecha a SES — mismo patrón que Ágora
(`agora/server/api/handlers/*.ts`, cada uno una Lambda propia con `APIGatewayProxyHandlerV2`, nunca
montadas en su Express del SSR). Separarla importa: permisos de IAM para enviar por SES escopados
solo a esta función, no a `ssr`, y un bug en el formulario de contacto no puede tumbar el SSR ni
viceversa.

**Archivos:**

- `server/api/handlers/contacto.ts` (nuevo — handler `APIGatewayProxyHandlerV2`, no una ruta Express)
- `server/api/handlers/contacto.spec.ts`
- `server/tsconfig.json` (nuevo, mismo patrón que el de Ágora: `include: ["api/**/*.ts"]`, runtime
  `nodejs24.x`, tipos `node` + `aws-lambda`)
- `serverless.yml` (agrega la función `contacto` y su ruta `POST /api/contacto` en el HTTP API que
  T-0007 ya declaró — **no** bajo el comodín `/{proxy+}` de `ssr`)
- `src/app/features/contacto/contacto.ts` (`enviar()` pasa a hacer la petición HTTP real; agrega el
  campo honeypot al `FormGroup`)
- `src/app/features/contacto/contacto.html` (campo honeypot, oculto de verdad — no solo
  `display:none`, ver punto 3)
- `package.json` (`@aws-sdk/client-ses` y `@types/aws-lambda` como dependencias nuevas)

**Qué hacer:**

1. Handler que reciba `{ nombre, correo, mensaje, consentimientoDatos, <campo honeypot> }`, limpie
   cada campo de texto con algo equivalente a `v.replace(/[\r\n]/g, ' ').trim().slice(0, 200)`
   (CLAUDE.md §5, A03 — inyección de encabezados de correo; `mensaje` con un tope propio, más
   generoso) y **rechace la petición si `consentimientoDatos` no es `true`**, incluso si el navegador
   ya validó lo mismo: la validación del cliente no basta.

2. Envía por AWS SES con `@aws-sdk/client-ses`. `Source` es **siempre**
   `process.env.SES_REMITENTE` — nunca un valor del cuerpo de la petición. El correo de quien escribe
   va en `ReplyToAddresses`, nunca en `Source` (CLAUDE.md, prohibición absoluta).

3. Antiabuso, los tres a la vez, no por separado — es parte de la definición de terminado, no una
   mejora posterior (CLAUDE.md §5, A07):
   - Campo trampa oculto (*honeypot*): si llega con contenido, responder 200 sin enviar nada (no
     delatar al bot con un 4xx). En el HTML tiene que estar realmente oculto a un humano (fuera de
     pantalla + `aria-hidden`/`tabindex="-1"`, no `display:none` a secas — algunos rastreadores de
     accesibilidad sí leen `display:none` y podría confundir a un lector de pantalla real).
   - Límite por dirección IP en una ventana de tiempo — evaluar en memoria de la Lambda (gratis, pero
     no se comparte entre invocaciones concurrentes ni sobrevive un cold start: mitigación parcial,
     no una garantía) frente al costo de un almacén nuevo (DynamoDB con TTL, que choca con PRD §9/D-1
     "sin base de datos propia"; o una regla de tasa de AWS WAF, que es infraestructura de CloudFront
     y no existe hasta T-13). Decidir y documentar el trade-off en `MEMORY.md`, no dejarlo implícito.
   - Tope de longitud por campo (punto 1).

4. **Nunca** escribir nombre, correo ni contenido del mensaje en los logs de CloudWatch (Ley 1581,
   CLAUDE.md). Los mensajes no se almacenan: se envían y se acaban ahí.

5. `ContactoComponent.enviar()` pasa a hacer `HttpClient.post('/api/contacto', …)` de verdad. El
   `signal` de estado gana un caso más para el error del backend (además de `'backend-pendiente'`),
   sin inventar mensajes de éxito que no correspondan a una respuesta real.

**Definition of done:**

- [ ] `npm run build -- --configuration=production` sin errores
- [ ] `npm run lint` y `npx tsc --noEmit` sin errores (incluido `server/tsconfig.json`)
- [ ] `npm test -- --watch=false` pasa, con pruebas del handler: consentimiento ausente rechaza,
      inyección de `\r\n` en `nombre`/`correo` no llega a los encabezados de SES, honeypot lleno
      responde 200 sin enviar
- [ ] `Source` de SES verificado como `process.env.SES_REMITENTE` por lectura del código, nunca del
      cuerpo de la petición
- [ ] Verificado que nombre/correo/mensaje no aparecen en ningún `console.log` ni log de CloudWatch
- [ ] `npx serverless package --stage staging` sin errores con la función `contacto` incluida

---

## Tarea T-0010 — [FEATURE] CI/CD con GitHub Actions

**Origen:** `tech-specs.md` §11, T-9 · depende de T-0007 (hecha) · `CLAUDE.md` §6 (Git Flow)

**Contexto.** `serverless.yml` (T-0007) ya empaqueta sin errores, pero nunca se ha desplegado —
`npx serverless deploy` a mano queda prohibido por `CLAUDE.md` ("los despliegues salen de GitHub
Actions... no deja rastro y puede llevar código que no está en `main`"). Esta tarea es el pipeline
que lo hace posible.

**Archivos:**

- `.github/workflows/deploy.yml` (nuevo)
- `docs/MEMORY.md` (secrets/variables de GitHub Actions que queden configurados)

**Qué hacer:**

1. Job de verificación en cada push/PR: `npm ci` (nunca `npm install`, CLAUDE.md §5, A08),
   `npm run build -- --configuration=production`, `npm run lint`, `npx tsc --noEmit`,
   `npm test -- --watch=false`. Si falla, no continúa a empaquetar ni desplegar.

2. Despliegue a `staging` al abrir o actualizar un PR contra `main` (`tech-specs.md` §7.1) —
   `npm run build:infra && npx serverless deploy --stage staging`. Despliegue a `production` al
   fusionar a `main` (mismo comando con `--stage production`). Nunca al revés.

3. `SERVERLESS_LICENSE_KEY` como secret del repositorio (CLAUDE.md §2 lo da por requisito) — pedir al
   humano que lo configure si no existe; este agente no puede generarlo. `GOOGLE_ANALYTICS_ID` y
   `GOOGLE_MAPS_API_KEY` ya existen como secrets (T-0006, ADR-017) — exponerlos como `env:` del paso
   de build para que `scripts/inyectar-llaves-publicas.mjs` (`postbuild`) los sustituya de verdad en
   el `dist/` que se despliega.

4. Credenciales de AWS: decidir el mecanismo (OIDC de GitHub hacia un rol de IAM, preferible a llaves
   de acceso de larga duración — verificar contra la documentación oficial de `aws-actions/
   configure-aws-credentials` antes de implementar, no asumir la sintaxis).

5. `concurrency` por stage: `cancel-in-progress: true` en `staging` (un PR actualizado cancela el
   despliegue anterior de sí mismo), `false` en `production` (nunca cancelar un despliegue a
   producción a medias) — gotcha ya documentado en `docs/MEMORY.md` §7, heredado de Ágora/Babel.

6. Prueba de humo mínima tras el despliegue: `curl` contra la URL real del stage recién desplegado
   (`/` responde 200 con HTML, no solo que `serverless deploy` no haya lanzado error) — el endpoint
   exacto sale del Output de CloudFormation (`aws cloudformation describe-stacks`), no de parsear la
   salida de `serverless deploy` (gotcha ya documentado, Serverless 4 no siempre la imprime).

**Definition of done:**

- [ ] Workflow válido (`actionlint` o el propio linter de GitHub al abrir un PR de prueba)
- [ ] Verificado con un PR real: el job de verificación corre, y si se planta un error a propósito
      (mismo patrón que T-0004 con el gancho de pre-commit), el despliegue no se dispara
- [ ] `docs/MEMORY.md` actualizado con qué secrets/variables quedaron configurados en el repositorio
      y cuáles siguen pendientes de que el humano los cree
- [ ] Confirmado que un despliegue a `production` nunca puede dispararse desde una rama que no sea
      `main`

---

## Historial

- **T-0001** — [FEATURE] Andamiaje de la aplicación Angular 22 con SSR y Tailwind 4. Completada
  01/09/2026. `npx @angular/cli@22 new` generado en directorio temporal y fusionado a mano; ajustes
  de `DESIGN.md` §1 en `@theme`, alias de rutas, `isolate: true`, `provideZonelessChangeDetection()`.
  Verificado: build de producción con SSR, `serve:ssr` responde HTML ya renderizado, `.bg-primary`
  resuelve a `#230c00`, pruebas y `tsc --noEmit` limpios. Detalle completo en `MEMORY.md` §9.

- **T-0002** — [DOCS] `README.md` en inglés y `README.es.md` en español. Completada 02/09/2026.
  `LICENSE` en MIT, copiada de Babel (no de Ágora: su badge dice MIT pero el archivo real es Apache
  2.0 — inconsistencia detectada y no propagada; ver `MEMORY.md` §7). Insignia de autoría
  **AI-assisted**, calculada desde `metrics/events/` (73,4% humano / 26,6% agente sobre tiempo de
  labor medido, sin contar pausas entre sesiones), no estimada. Los tres comandos del arranque
  rápido se ejecutaron y verificaron antes de documentarlos.

- **T-0003** — [FEATURE] Barra de navegación y pie de página comunes. Completada 02/09/2026.
  `BarraNavegacion` con el marcado exacto de `DESIGN.md` §7, colapso móvil con `signal` + `@if`
  (sin librería), foco gestionado con `effect()` + `viewChild()`. Se agregaron dos cosas fuera de la
  lista original de archivos, ambas necesarias para que la tarea funcionara: `public/logo_blanco_
  sin_fondo.svg` (el header no podía renderizar sin él) y rutas placeholder para `''`, `/nosotros` y
  `/contacto` con un componente `PaginaPendiente` compartido — sin la ruta `''` el build dejaba de
  prerenderizar la raíz y el servidor SSR respondía 404, regresión encontrada y corregida en la
  misma tarea. Verificado en SSR real, no solo en pruebas unitarias: `/nosotros` y `/contacto`
  responden 200 con `text-secondary` en el enlace correcto y sin él en el otro; `/cartelera` y
  `/libros` son `<a href>` planos en el HTML. 9/9 pruebas pasan, incluida una que simula Tab → click
  → Escape y verifica que el foco vuelve al botón. Detalle completo en `MEMORY.md` §9.

- **T-0004** — [FEATURE] Pruebas continuas: ESLint, `tsc` y ganchos de pre-commit. Completada
  02/09/2026. ESLint vía `ng add @angular-eslint/schematics` (la vía oficial, no manual), `husky` +
  `lint-staged` en vez de la plantilla Python de `/slim-continuous-testing` (proyecto puramente
  Node), escáner de secretos propio en vez de GitGuardian/`detect-secrets` (GitGuardian es una
  GitHub App a nivel de cuenta, no de código; `detect-secrets` es Python) — las tres decisiones
  documentadas en ADR-011. El linter encontró un hallazgo real de accesibilidad en el panel del menú
  móvil de T-0003 (`interactive-supports-focus`), corregido con `role="dialog"` + `tabindex="-1"`,
  no silenciado. DoD verificado de punta a punta: un commit con un error de `tsc` real fue rechazado
  por el gancho, y el mismo commit corregido pasó. Detalle completo en `MEMORY.md` §9.

- **T-0006** — [FEATURE] Páginas institucionales: Nosotros y Contacto — más íconos/manifest, Google
  Maps y Google Analytics 4, agregados por decisión explícita del humano dentro de la misma tarea.
  Completada 02/09/2026. `NosotrosComponent` con contenido derivado estrictamente de `PRD.md` §1, §2,
  §3, §5 y §10 (sin inventar cifras). `ContactoComponent` con formulario reactivo completo
  (`ReactiveFormsModule`), las tres validaciones bloqueantes exigidas por el DoD (campo vacío, correo
  inválido, consentimiento no marcado) verificadas en el navegador real, no solo en pruebas, y un
  `signal` de estado que muestra en pantalla que `POST /api/contacto` (T-7) todavía no existe.
  `PaginaPendiente` se eliminó por completo (ADR-010 ya avisaba que no debía sobrevivir más allá de
  esta tarea). Dirección y horarios **ya no son "por confirmar"**: el humano los dio directamente
  (Carrera 24 #37-44, Bogotá; domingo a miércoles 2–8 p. m., jueves a sábado 2–10 p. m.), centralizados
  en `core/negocio/datos-negocio.ts` para no repetirlos en tres archivos. Íconos y
  `manifest.webmanifest` copiados de Ágora, ya documentados como contrato en `DESIGN.md` §9 pero nunca
  ejecutados. Mapa de `/contacto` con Google Maps Embed API. Google Analytics 4 reemplaza la
  integración legacy (Universal Analytics, descontinuada) vía `gtag.js`, cargado con
  `afterNextRender` — nunca en el SSR — y con una guarda de host: solo carga en `letiende.co`, nunca
  en `staging.letiende.co`, porque ambos stages despliegan el mismo artefacto
  (`environment.production.ts`) y sin esa guarda el tráfico de staging contaminaría las métricas
  reales. Ninguna de las dos llaves se versiona (ADR-017): el escáner de secretos bloqueó el primer
  intento de commitearlas directamente (aunque son públicas por diseño de Google), así que
  `environment.ts` lleva marcadores que `scripts/inyectar-llaves-publicas.mjs` sustituye sobre
  `dist/` en el build, leyendo variables de entorno — ya guardadas como *secrets* de GitHub Actions
  del repositorio para cuando exista T-9. Se evaluó y se descartó la integración con la API de Google
  Business Profile: requiere un perfil verificado y activo 60+ días, aprobación manual de Google
  (días a semanas) y OAuth2 con almacenamiento de refresh token — desproporcionado frente a datos que
  el humano ya tenía a mano y que no cambian con frecuencia; queda como opción futura si algún día
  hace falta sincronización en vivo.
  Verificado en vivo: build de producción, SSR real (`curl` 200 en `/`, `/nosotros`, `/contacto`,
  `manifest.webmanifest`, íconos), navegador real (mapa renderiza el punto correcto en Bogotá, las 4
  validaciones bloquean el envío una por una, el envío válido muestra el aviso de backend pendiente,
  cero errores de hidratación ni de consola). 25/25 pruebas, `tsc --noEmit` y `lint` limpios.

  **Incidente tras el PR:** GitGuardian marcó una llave real de Google filtrada en el historial del
  PR (un commit incluyó por error las llaves reales antes de que otro las reemplazara por marcadores).
  Historial reescrito con `git filter-branch` y `push --force-with-lease` con autorización del humano.
  Hallazgo: el commit viejo siguió siendo recuperable por SHA directo en GitHub incluso después del
  force-push — reescribir no basta, solo rotar la llave neutraliza el riesgo de verdad. El humano
  decidió no rotarla por ahora, riesgo explicado y aceptado. Detalle completo en `MEMORY.md` §9.

- **T-0007** — [FEATURE] `serverless.yml` del contenedor, solo la función `ssr`. Completada
  02/09/2026. `src/server.ts` ahora exporta `app`; `server/ssr/handler.mjs` (JavaScript plano, no
  TypeScript, a propósito) lo envuelve con `@codegenie/serverless-express`, mismo patrón exacto que
  `agora/server/ssr/handler.mjs`. Se corrigió el borrador original de T-0009 antes de escribir
  código: `tech-specs.md` §1 muestra `contacto` como una Lambda **separada**, no una ruta de Express
  — el orden de las dos tareas se invirtió (T-0007 primero, porque T-0009 necesita que
  `serverless.yml` ya exista). Hallazgo real: `NG_ALLOWED_HOSTS` (variable de entorno que
  `@angular/ssr` sí soporta, verificado leyendo el código fuente del paquete) resuelve el gotcha que
  esta memoria traía pendiente desde T-0001 sobre `security.allowedHosts` — verificado invocando el
  handler con eventos de API Gateway simulados: 400 sin la variable, 200 con ella. `serverless.yml`
  sin DynamoDB ni ningún otro recurso de estado, rol IAM de solo `AWSLambdaBasicExecutionRole`.
  Hallazgo aparte, de la máquina: el `PATH` con el que este agente ejecuta comandos no pasaba por
  `~/.zshrc` (solo lo leen las shells interactivas), así que `node`/`npm` seguían resolviendo a v22
  pese al fix de T-0001 — corregido agregando la misma línea a `~/.zshenv`. Verificado en vivo: el
  paquete de `serverless package` inspeccionado a mano (trae `dist/letiende-co/**`,
  `server/ssr/handler.mjs`, `node_modules/@codegenie/serverless-express/**`, nada más), el handler
  invocado directamente con eventos simulados responde 200 en `/`/`/nosotros`/`/robots.txt`/
  `/sitemap.xml` y **404** en una ruta inventada (la página 404 de T-0008 funciona igual a través del
  wrapper de Lambda). 39/39 pruebas, `tsc --noEmit` y `lint` limpios. Detalle completo en
  `MEMORY.md` §9.

- **T-0008** — [FEATURE] Capa de SEO/AEO. Completada 02/09/2026. `MetaService` (título, descripción,
  canónica, Open Graph, Twitter Card) y `JsonLdService` (JSON-LD con el escape de `<` de CLAUDE.md §5
  A03) en `core/seo/`, llamados desde el constructor de cada página — nunca desde `afterNextRender`,
  que llegaría tarde para el SSR. Tres correcciones a la planeación original de `tech-specs.md` §4.5,
  mismo patrón que las tres de T-0005: sin `SearchAction` (no hay búsqueda real en el sitio), sin
  `geo` en `LocalBusiness` (nunca hubo coordenadas verificadas, y `geo` es opcional en schema.org), y
  `/sitemap.xml` reducido a las tres rutas propias del contenedor en vez del índice de los tres
  planeado — verificado con `curl` que Ágora expone su propio sitemap pero bajo su subdominio (no
  `/cartelera`, eso es T-11) y que Babel no tiene sitemap propio en absoluto (T-12). `robots.txt` y
  `sitemap.xml` pasaron de `public/` a rutas dinámicas de Express en `server.ts`, con el mismo patrón
  de `AnalyticsService` (comprobar el host de la petición) para que staging responda `Disallow: /` sin
  necesitar un segundo build. `NoEncontradaComponent` con HTTP 404 real, usando el campo `status` de
  `ServerRoute` de `@angular/ssr` (verificado leyendo el tipo, no asumido) — esto también obligó a dar
  a `nosotros` y `contacto` su propia entrada en `app.routes.server.ts`, porque el comodín pasó a
  significar "ruta no encontrada". De regalo: se encontró que `tech-specs.md` documentaba `/contacto`
  como `SSR` desde la planeación original, pero en el código ya era `Prerender` desde T-0006 — nadie
  lo había notado; corregido en la documentación. Verificado en vivo: build + SSR real con `curl`
  (200 en las tres rutas, **404 real** en una ruta inventada, `robots.txt`/`sitemap.xml` correctos), el
  JSON-LD de las tres páginas extraído del HTML y verificado con `JSON.parse()` real, y en el
  navegador (página 404, navegación entre rutas, cero errores de consola). 39/39 pruebas, `tsc
  --noEmit` y `lint` limpios. Ver `MEMORY.md` ADR-018.

- **T-0005** — [FEATURE] Portada con próximos eventos. Completada 02/09/2026. `httpResource()` contra
  `GET /api/eventos-publicos` de Ágora. Tres hallazgos reales, no solo implementación: (1) los
  nombres de campo que `tech-specs.md` documentaba desde la planeación original (`titulo`,
  `fechaInicio`, `imagenAfiche`, `lugar`) eran adivinados y ninguno existe en la respuesta real —
  corregidos contra `evento.model.ts` de Ágora (son `nombre`, `fechaHora`, `imagenUrl`; `lugar` no
  existe); (2) `resource.value()` **lanza** en estado de error, el patrón de encadenamiento opcional
  documentado desde la planeación era insuficiente — hace falta `hasValue()` (ADR-013); (3)
  `RenderMode.Prerender` en la portada congelaba los eventos en el estado del último build — se
  verificó con `curl` real contra la Ágora de producción, y se corrigió a `RenderMode.Server`
  (ADR-012). De regalo: `HttpClient` se inyecta sin `provideHttpClient()` explícito en Angular 22,
  verificado con un diagnóstico desechable (ADR-014). `tech-specs.md` y `MEMORY.md` corregidos en
  los tres puntos, no solo el código. Detalle completo en `MEMORY.md` §9.

---

## Cola priorizada (no son tareas activas — referencia para calcular la siguiente)

En orden, según `tech-specs.md` §11 (T-6, T-7 y T-8 ya son tareas activas/hechas: T-0008, T-0009,
T-0010):

1. **T-13** Certificados ACM, distribuciones de CloudFront y `staging.letiende.co`
2. **T-11 / T-12** Cambios en Ágora y en Babel — **después** de T-13
3. **T-14 → T-15** Redirecciones 301 y cutover
4. Preguntas frecuentes (PRD F-7, prioridad media — sin tarea de roadmap técnico dedicada todavía)

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
