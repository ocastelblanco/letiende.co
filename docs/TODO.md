# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

## Tarea T-0012 — [FEATURE] Página de Preguntas frecuentes (F-7)

**Origen:** `PRD.md` §5 F-7, roadmap §6 (prioridad Media, etapa 1) — único ítem de la cola priorizada
que no depende de T-0011 (T-11/T-12/T-14/T-15 sí dependen; ver "Cola priorizada" al final de este
documento)

**Contexto.** F-7 pide horarios, parqueadero, accesibilidad y cómo programar un evento en el espacio.
No hay contenido de terceros: es contenido propio, igual que Nosotros y Contacto (T-0006), así que no
hay razón para esperar a Ágora/Babel/CloudFront (T-0011) para hacerla.

**Archivos:**

- `src/app/features/preguntas-frecuentes/preguntas-frecuentes.ts` + `.html` (nuevo componente de
  página, mismo patrón que `NosotrosComponent`)
- `src/app/app.routes.ts` (ruta `/preguntas-frecuentes`)
- `src/app/app.routes.server.ts` (`RenderMode.Prerender`, contenido 100% estático — mismo criterio que
  `nosotros`/`contacto`)
- `src/app/shared/navegacion/barra-navegacion.html` (enlace nuevo, mismo patrón `routerLink` que
  `/nosotros` y `/contacto` — versión de escritorio y versión de menú móvil)
- `src/app/core/seo/esquemas.ts` (nuevo `esquemaFaqPage()`, schema.org `FAQPage`)
- `server.ts` (agregar `/preguntas-frecuentes` a `/sitemap.xml`, mismo patrón que las otras dos rutas
  propias, T-0008)

**Qué hacer:**

1. Contenido real, no inventado: horarios y dirección salen de `DATOS_NEGOCIO`
   (`core/negocio/datos-negocio.ts`, ya existe, T-0006) — nunca repetidos a mano. Parqueadero,
   accesibilidad y "cómo programar un evento" necesitan que el humano confirme el texto exacto antes
   de publicarlo (mismo criterio que ya aplicó T-0006 con horarios/dirección: no inventar cifras ni
   políticas).
2. `esquemaFaqPage()` en `core/seo/esquemas.ts`, tipo `FAQPage` de schema.org
   (`mainEntity: Question[]`, cada una con `acceptedAnswer.text`) — la razón real de esta tarea para
   el objetivo OBJ-3 de visibilidad en asistentes de IA (`PRD.md`): es el tipo de dato estructurado
   que los motores de respuesta citan directamente. Mismo patrón de escape de JSON-LD que las demás
   páginas (`CLAUDE.md` §5, A03) — nunca concatenar cadenas.
3. `MetaService.actualizar()` + `JsonLdService.establecer()` en el constructor del componente, patrón
   ya establecido (`docs/MEMORY.md` §6) — nunca en `ngOnInit` ni `afterNextRender`.
4. Sin acordeón con JavaScript ni librería de componentes (ADR-004): si hace falta colapsar/expandir
   preguntas, evaluar primero `<details>`/`<summary>` nativos de HTML antes de escribir cualquier
   `signal` de estado — más simple y accesible por defecto.

**Definition of done:**

- [ ] Contenido de horarios/dirección verificado como idéntico al de `DATOS_NEGOCIO` (no duplicado a
      mano en la plantilla)
- [ ] `curl` real en SSR: `/preguntas-frecuentes` responde 200 con HTML, JSON-LD `FAQPage` extraído del
      HTML y verificado con `JSON.parse()` real (mismo criterio de verificación que T-0008)
- [ ] `/sitemap.xml` incluye la ruta nueva
- [ ] Enlace visible y funcional en `BarraNavegacion`, escritorio y menú móvil, con el mismo estado
      "activo" (`routerLinkActive`) que `/nosotros` y `/contacto`
- [ ] Pruebas unitarias del componente y del nuevo esquema JSON-LD, `tsc --noEmit` y `lint` limpios

---

## Tarea T-0011 — [INFRA] Certificados ACM, distribuciones de CloudFront y `staging.letiende.co`

**Origen:** `tech-specs.md` §7, T-13 · T-0010 (CI/CD) completada — el pipeline ya despliega de verdad
a `staging` (`letiende-co-staging`, PR #14, 03/09/2026), así que esta tarea ya no tiene ningún
bloqueo pendiente

> **Categoría de riesgo distinta a las tareas anteriores.** Todo lo hecho hasta T-0010 era código e
> IaC verificado con `serverless package`/`serverless deploy --stage staging` — el stack de staging ya
> existe (`letiende-co-staging`, sin dominio propio todavía), pero producción sigue intacta y esto es
> reversible con un `git revert`. Esta tarea **crea recursos reales de AWS con costo y persistencia
> propios**
> (certificados ACM, distribuciones de CloudFront, un registro en la zona de Route 53 de producción).
> Ninguna acción de creación/modificación real contra la cuenta de AWS se ejecuta sin confirmarlo
> explícitamente con el humano antes, aunque el paquete de cambios (IaC, PRs) sí se prepare de punta a
> punta como en las tareas anteriores.

**Archivos:**

- `serverless.yml` (o recursos de CloudFormation aparte — decidir cuál durante la tarea) para las
  distribuciones de CloudFront, los certificados ACM y el registro de Route 53
- `public/robots.txt` de staging — ya no aplica: `server.ts` (T-0008) ya sirve `robots.txt`
  dinámico con `Disallow: /` fuera de `letiende.co`, esta tarea solo tiene que verificar que sigue
  cumpliendo el requisito una vez que `staging.letiende.co` exista de verdad
- `docs/MEMORY.md` con los identificadores reales de cada recurso creado

**Qué hacer:**

1. Certificado ACM para `staging.letiende.co`, en **`us-east-1`** obligatoriamente (CloudFront no
   acepta certificados de otra región) — validación por DNS en la zona `Z010633738KAGFIPOZVEW`.

2. Dos distribuciones de CloudFront (staging y producción), misma estructura de cuatro behaviors
   (`tech-specs.md` §7.2): `/cartelera/*` → HTTP API de Ágora del stage correspondiente,
   `/libros/*` → HTTP API de Babel del stage correspondiente, `/assets/*` → bucket
   `letiende-assets`, `*` (default) → el HTTP API de este stack (T-0007/T-0009). Producción usa una
   distribución **nueva** — la actual (`E33QAN86FY24JZ`) no se toca hasta el cutover (ADR-006).

3. Los tres detalles que ya rompieron esto en otros proyectos (`tech-specs.md` §7.2): origen de
   `/cartelera/*` es el `execute-api` **crudo**, nunca `agora.letiende.co` (bucle de 301); no
   reenviar el encabezado `Host` al origen (política *AllViewerExceptHostHeader*, si no 403); no
   definir `OriginPath` (Ágora necesita la ruta completa con el prefijo).

4. Registro `A` alias en Route 53 para `staging.letiende.co`.

5. Verificar que `NG_ALLOWED_HOSTS` (T-0007) se amplía con el dominio real en el mismo cambio que lo
   monta — nunca antes (mismo principio que ya aplicó Ágora, docs/MEMORY.md).

**Definition of done:**

- [ ] Certificado ACM emitido y validado (`ISSUED`, no `PENDING_VALIDATION`), verificado con
      `aws acm describe-certificate`
- [ ] `curl https://staging.letiende.co/` responde 200 con HTML real, no un error de CloudFront
- [ ] `curl https://staging.letiende.co/robots.txt` responde `Disallow: /`
- [ ] Los tres detalles del punto 3 verificados en vivo, no solo declarados en la plantilla
- [ ] `docs/MEMORY.md` actualizado con los IDs reales (certificado, distribución, registro DNS) en
      la tabla de "Por crear" de §5, que pasan a "Configuraciones vigentes"

---

## Historial

- **T-0010** — [FEATURE] CI/CD con GitHub Actions. Completada 03/09/2026, PR #14 (abierto, sin
  fusionar — solo humanos fusionan, `CLAUDE.md` §6). `.github/workflows/deploy.yml` con el mismo
  patrón de tres jobs que Ágora y Babel (`build-y-test` en cada PR, `desplegar-staging` al abrir/
  actualizar el PR, `desplegar-produccion` solo en `push` a `main`), adaptado a los scripts propios de
  este repositorio (`build:api`, `bundle:api`, `test:api`) en vez de los de los repos hermanos.
  `serverless.yml` ganó `Outputs.HttpApiUrl` con el mismo patrón `Fn::Join` que Ágora ya había
  verificado (evita el gotcha real de mezclar `Fn::Sub` dentro de un `Value` con `${...}`, que rompió
  el primer intento de ese mismo Output en Ágora). Decisión explícita del humano en credenciales de
  AWS: llaves de larga duración, no OIDC — se verificó primero que la cuenta compartida no tiene
  ningún proveedor OIDC configurado (`aws iam list-open-id-connect-providers` vacío), así que OIDC
  aquí habría sido un mecanismo nuevo y aislado frente a Ágora/Babel, no una mejora consistente
  (ADR-021). Verificado con un PR real (no solo `actionlint` en local, que también pasó limpio): el
  job `build-y-test` corrió sus 10 pasos, y el único que falló fue el esperado — "Verificar sintaxis
  de infraestructura" con `SERVERLESS_LICENSE_KEY`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
  todavía sin configurar como secrets del repositorio, error explícito de Serverless Framework
  ("You must sign in or use a license key"), no un fallo silencioso — y por el `needs: build-y-test`,
  ambos jobs de despliegue quedaron en `skipped`, confirmado con
  `gh run view --json jobs -q '.jobs[] | {name, conclusion}'`. `desplegar-produccion` además solo
  puede dispararse con `github.event_name == 'push' && github.ref == 'refs/heads/main'` — estructuralmente
  imposible desde un PR o desde otra rama. `docs/MEMORY.md` §5 documenta cuáles de los 8 secrets
  relevantes ya existen (`GOOGLE_ANALYTICS_ID`, `GOOGLE_MAPS_API_KEY`, `RECAPTCHA_SITE_KEY`,
  `RECAPTCHA_SECRET_KEY`, los cuatro de tareas anteriores) y cuáles siguen pendientes de que el humano
  los cree (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SERVERLESS_LICENSE_KEY`, `SES_REMITENTE`).
  De regalo: se encontró que `tech-specs.md` §9 documentaba `SES_DESTINATARIO` y `URL_BASE_APP` como
  secrets necesarios, pero ningún código real los consume (`contacto.ts` envía el correo al propio
  `SES_REMITENTE`, no a un buzón separado; la URL canónica es la constante `DOMINIO` de
  `core/seo/dominio.ts`, no una variable de entorno) — corregido en la documentación, no se cablearon
  al workflow. Los ocho comandos del pipeline (`build`, `build:api`, `bundle:api`, `test`, `test:api`,
  `lint`, `tsc --build --noEmit`, `serverless package`) se corrieron y verificaron en este entorno
  antes de abrir el PR.

  **Ampliada el mismo día, mismo PR (#14):** el humano configuró los 4 secrets pendientes
  (`SERVERLESS_LICENSE_KEY` él mismo; `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` reutilizando su
  access key personal de `@ocastelblanco` — confirmado que pertenece al grupo IAM `Administrador`,
  mismo riesgo ya aceptado en Ágora/Babel, no una decisión nueva de este proyecto; `SES_REMITENTE` con
  `info@letiende.co`, identidad ya verificada en SES). Con los 8 secrets configurados se volvió a
  correr el mismo workflow del PR #14 (`gh run rerun`): esta vez **el despliegue real a staging se
  completó**, `letiende-co-staging` existe de verdad. Verificado con `curl` real contra
  `https://dhffew1x85.execute-api.us-east-1.amazonaws.com` (200 HTML en `/`, `Disallow: /` en
  `/robots.txt`, 404 real en una ruta inventada) y con
  `aws lambda get-function-configuration --function-name letiende-co-staging-contacto`: `SES_REMITENTE`
  y `RECAPTCHA_SECRET_KEY` con su valor real, no la cadena vacía del gotcha de `${env:X, ''}`
  (tech-specs.md §9). Esto además destraba T-0011: ya no depende de nada. Detalle completo en
  `MEMORY.md` ADR-021 y §5.

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

- **T-0009** — [FEATURE] Lambda de contacto con SES y antiabuso. Completada 02/09/2026.
  `server/api/handlers/contacto.ts`, Lambda separada de `ssr` (corrección de arquitectura hecha en
  T-0007, antes de escribir código). Limpia `\r\n` de cada campo (CLAUDE.md §5, A03), rechaza sin
  consentimiento aunque el navegador ya validó, `Source` de SES siempre `SES_REMITENTE`. Antiabuso
  completo: honeypot oculto de verdad (fuera de pantalla, `aria-hidden`, `tabindex="-1"`), límite de
  5 peticiones por IP cada 10 minutos en memoria de la Lambda (ver ADR-019 para el trade-off frente a
  DynamoDB/WAF), tope de longitud por campo. `server/bundle-lambdas.mjs` empaqueta con esbuild — sin
  eso, la función habría fallado en el arranque igual que ya le pasó a Ágora dos veces (mismo patrón,
  mismo motivo). `vitest.config.ts` nuevo con su propio `test:api`, separado de `ng test`.
  `ContactoComponent.enviar()` hace el `POST` real; `angular.json` amplió `lintFilePatterns` para
  cubrir `server/`. **Incidente durante la verificación:** invocar el bundle real confirmó que este
  entorno tiene credenciales reales de AWS de producción — un envío de prueba por SES se completó de
  verdad contra una dirección inventada para la prueba. Cerrado con el humano, lección documentada en
  ADR-019 para no repetirlo. Verificado: `build:infra` + `serverless package` sin errores, `.zip` de
  `contacto` con un solo archivo, rol IAM de SES acotado a `identity/letiende.co` (confirmado con
  `aws sesv2 list-email-identities` contra la cuenta real). 41/41 pruebas de Angular, 8/8 del
  handler, `tsc --noEmit` y `lint`, todos limpios.

  **Ampliada el mismo día, mismo PR (#13):** el humano preguntó si el antiabuso bastaba sin
  reCAPTCHA. Se investigó el historial de git antes de responder — la rama `2025` (abandonada) ya
  había considerado reCAPTCHA necesario para este mismo endpoint (nota de seguridad explícita nunca
  implementada de verdad). Se agregó reCAPTCHA v3 (`RecaptchaService`, verificación en la misma
  petición que el envío — a diferencia del legado de 2025), con la site key pública sin versionar
  (mismo mecanismo de marcador que Maps/GA4) y `RECAPTCHA_SECRET_KEY` como variable de entorno de la
  Lambda. Ver ADR-020. 15/15 pruebas del handler y 44/44 de Angular. El humano ya creó y dio el par
  de llaves el mismo día — guardadas como secrets de GitHub Actions, verificadas en vivo contra la
  API real de Google con un token inválido a propósito (rechazó antes de llegar a SES). Detalle
  completo en `MEMORY.md` §9.

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

En orden, según `tech-specs.md` §11 (T-6 a T-9 ya hechas: T-0008, T-0009, T-0010; T-13 es la tarea
activa T-0011; F-7 es la tarea activa T-0012):

1. **T-11 / T-12** Cambios en Ágora y en Babel — **después** de T-13 (T-0011)
2. **T-14 → T-15** Redirecciones 301 y cutover
3. Carta del café bar (F-8, prioridad media, etapa 2 — depende de Comandante, todavía en etapa 2 del
   roadmap propio de Le Tiende)

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
