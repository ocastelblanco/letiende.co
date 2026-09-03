# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

## Tarea T-0013 — [INFRA] Cambios mínimos en Ágora: `--base-href /cartelera/`, barra común, sitemap, 301

> **Estado (03/09/2026, actualizado): T-0013 (Ágora) y T-0014 (Babel) implementadas, verificadas de
> punta a punta en vivo (curl real + navegador real con `claude-in-chrome`), con **cuatro rondas de
> hallazgos reales** encontrados y corregidos tras el primer despliegue — ninguno anticipado por la
> planeación original de `tech-specs.md` §7.2/§7.3. Detalle técnico completo de cada uno en
> `docs/MEMORY.md` §7 de este repositorio, y en `docs/MEMORY.md`/`docs/TODO.md` de los propios
> repositorios de Ágora y Babel. Ninguno de estos PRs se fusiona solo — quedan a la espera de revisión
> humana:
>
> 1. **`baseHref` fijo rompe rutas sin prefijo fuera del proxy** — con `baseHref: /cartelera/`
>    (Ágora) / `/libros/` (Babel), el Router de Angular del lado cliente exige que la URL real ya
>    lleve el prefijo. Redirección 301 en dos ramas: `/`/`evento-o-libro-detalle` cross-domain a
>    `letiende.co/cartelera|libros` (SEO), el resto mismo dominio con el prefijo agregado (el staff
>    sigue entrando por `agora.letiende.co`/`babel.letiende.co` igual que siempre).
> 2. **El sitemap no respondía a través del proxy** — CloudFront reenvía la ruta completa sin
>    `OriginPath`, así que `staging.letiende.co/cartelera/sitemap.xml` llegaba a cada app como
>    literalmente `/cartelera/sitemap.xml`/`/libros/sitemap.xml`, que no calzaba con la ruta
>    `/sitemap.xml` sin prefijo registrada en su API Gateway (404/302 según la app). Corregido
>    registrando también la ruta con prefijo en cada API Gateway (`agora-letiende`#61,
>    `babel-letiende`#111).
> 3. **El `Host` real del visitante nunca llega al SSR de Ágora/Babel** — la política
>    `AllViewerExceptHostHeader` (obligatoria para que API Gateway no rechace con 403) despoja el
>    header `Host` original. Corregido con una `CloudFront Function` (`FuncionInyectarHostVisitante`)
>    que lo copia a un header propio (`x-le-tiende-host`) antes de reenviar (`letiende.co`#20).
> 4. **Las llamadas a la API propia (`/api/...`) de Ágora/Babel no llegaban a su app cuando estaban
>    embebidas** — el hallazgo más grave, reportado en vivo por el humano ("nada funciona"): esas
>    rutas son absolutas (`http.get('/api/eventos-publicos')`), y el navegador las resuelve contra el
>    ORIGEN de la página, ignorando el `<base href>` por completo — salían sin prefijo hacia
>    `staging.letiende.co/api/...`, que CloudFront enrutaba al comportamiento por defecto (este mismo
>    contenedor) en vez de a la app real. Arreglo en dos partes, ambas necesarias: (a) la misma
>    `CloudFront Function` del punto 3, ampliada para quitar el prefijo de `/api/*`/`/sitemap.xml`
>    antes de reenviar al origen (`letiende.co`#23); (b) el `absoluteUrlInterceptor` de cada app
>    (ya existía para el caso SSR) extendido para anteponer el prefijo a las llamadas `/api/*` cuando
>    `EmbebidoService.embebido` es `true` (`agora-letiende`#62, `babel-letiende`#111). Verificado con
>    navegador real: las 5 llamadas de API entre las dos apps (`eventos-publicos`, `libros`,
>    `espacios`, `muebles`, `ubicaciones`) salen prefijadas y responden 200, catálogo y cartelera
>    cargan datos reales, sin errores de consola.
>
> **PRs abiertos esperando revisión humana al cierre de esta ronda:** `letiende.co`#23 (prefijo de
> API/sitemap); `agora-letiende`#61 (sitemap), `#62` (interceptor); `babel-letiende`#111 (T-0014
> completa, con los 4 hallazgos ya incorporados). `letiende.co`#20 (host visitante) ya fusionado y en
> producción — todo lo demás está en `staging`, verificado, pero no se despliega a producción sin que
> el humano revise y fusione cada PR.

**Origen:** `tech-specs.md` §7.3, T-11 — T-13 (T-0011: ACM + CloudFront + `staging.letiende.co`)
completada y verificada en vivo el 03/09/2026 (PR #17 + #18), así que esta tarea ya no tiene ningún
bloqueo pendiente. **Repositorio afectado:** `~/Documents/LeTiende/letiende.co/agora/` (no este
repositorio) — el cambio se planea, verifica y documenta aquí porque es parte del rollout coordinado
del proxy, pero el commit/PR real sale del repositorio de Ágora, con su propio `CLAUDE.md` y su propio
Git Flow.

**Archivos (en el repo de Ágora):**

- `angular.json` — `"baseHref": "/cartelera/"` en el target `build`
- El componente de la barra de navegación propia de Ágora — se reemplaza por la barra común de
  `DESIGN.md` §7 de este repositorio (mismo punto de montaje, distinto contenido — ADR-003, "se
  reemplaza, no se oculta")
- El handler que emite el sitemap de Ágora — las URLs pasan a `https://letiende.co/cartelera/…`
- El handler de SSR de Ágora — redirección 301 cuando `Host` es `agora.letiende.co` (snippet exacto
  en `tech-specs.md` §7.3)

**Qué hacer:**

1. `--base-href /cartelera/`: el router y los assets de Ágora tienen que resolver bajo ese prefijo.
   Consecuencia a tener presente (`tech-specs.md` §7.3): una vez compilado así, la URL cruda de
   `execute-api` deja de servir bien los assets — probar de ahora en adelante siempre por
   `https://staging.letiende.co/cartelera`, nunca por la URL cruda de Ágora.
2. Barra de navegación: **reemplazo**, no ocultamiento (ADR-003) — mismo componente compartido, mismo
   punto de montaje donde hoy Ágora renderiza la suya.
3. Sitemap de Ágora con URLs bajo `https://letiende.co/cartelera/…` — de lo contrario apunta a
   direcciones que van a redirigir (301).
4. Redirección 301 en el SSR cuando `Host === 'agora.letiende.co'`, hacia
   `https://letiende.co/cartelera${originalUrl}` — snippet ya verificado en `tech-specs.md` §7.3. No
   toca infraestructura: el subdominio viejo sigue mapeado al mismo API Gateway.
5. **Diff mínimo, autorizado explícitamente por el humano** (`tech-specs.md` §7.3): estos cuatro
   cambios y nada más. Si aparece la tentación de tocar algo adicional de Ágora, detenerse y
   consultarlo antes.

**Definition of done:**

- [ ] `curl https://staging.letiende.co/cartelera/` responde con el HTML real de Ágora (no el 404 de
      este contenedor, no un `Cannot GET` de Express crudo — verificado ya hoy que el proxy llega al
      origen correcto, pero Ágora todavía no tiene rutas bajo ese prefijo)
- [ ] La barra visible en `/cartelera` es la común de `DESIGN.md` §7, idéntica a la de `letiende.co`
      (navegar de `/` a `/cartelera` sin salto visual — mismo criterio de verificación de ADR-003)
- [ ] `curl https://staging.letiende.co/cartelera/sitemap.xml` (o donde Ágora lo sirva) tiene URLs
      `https://letiende.co/cartelera/…`, no `https://agora.letiende.co/…`
- [ ] Redirección 301 real desde `agora.letiende.co` verificada con `curl -I`, no solo leída en el
      código
- [ ] Ningún cambio fuera de los cuatro autorizados
- [ ] `docs/MEMORY.md` de este repositorio actualizado con el resultado

---

## Tarea T-0014 — [INFRA] Cambios mínimos en Babel: `--base-href /libros/`, barra común, sitemap, 301

**Origen:** `tech-specs.md` §7.3, T-12 — mismo desbloqueo que T-0013 (T-13/T-0011 completada), mismo
patrón exacto de cuatro cambios, aplicado al repositorio de Babel
(`~/Documents/LeTiende/letiende.co/babel/`) en vez de Ágora. Se ejecuta en paralelo o justo después de
T-0013, sin dependencia entre ambas.

**Archivos (en el repo de Babel):**

- `angular.json` — `"baseHref": "/libros/"` en el target `build`
- El componente de la barra de navegación propia de Babel — reemplazo por la barra común (ADR-003)
- El handler que emite el sitemap de Babel — hoy **no existe sitemap propio** (verificado en T-0008,
  `docs/MEMORY.md` ADR-018): esta tarea es la que lo crea, con URLs `https://letiende.co/libros/…`
- El handler de SSR de Babel — redirección 301 cuando `Host` es `babel.letiende.co`

**Qué hacer:** los mismos cinco puntos de T-0013, adaptados a `/libros/` y a Babel. La diferencia real
frente a Ágora: Babel no tiene sitemap propio todavía, así que este cambio no es "corregir URLs" sino
"crear el sitemap por primera vez" — no inventar su estructura, seguir el mismo patrón que ya usa este
repositorio en `server.ts` (rutas dinámicas de Express, no `public/`).

**Definition of done:**

- [ ] `curl https://staging.letiende.co/libros/` responde con el HTML real de Babel
- [ ] Barra común visible en `/libros`, sin salto visual respecto a `letiende.co`
- [ ] Babel expone un sitemap real con URLs `https://letiende.co/libros/…` (verificar que existe,
      hoy no hay ninguno)
- [ ] Redirección 301 real desde `babel.letiende.co` verificada con `curl -I`
- [ ] Ningún cambio fuera de los cuatro autorizados
- [ ] `docs/MEMORY.md` de este repositorio actualizado con el resultado

---

## Historial

- **T-0011** — [INFRA] Certificado ACM, distribuciones de CloudFront y `staging.letiende.co`.
  Completada 03/09/2026, PR #17 (certificado + distribuciones + DNS) y PR #18 (fix del prefijo
  `/assets`), ambos fusionados. Certificado ACM de `staging.letiende.co` en `us-east-1`
  (`arn:...certificate/24668c16-…`), validación DNS automática vía CloudFormation contra la zona
  `Z010633738KAGFIPOZVEW` — `ISSUED`, verificado con `aws acm describe-certificate`, no solo con el
  estado del stack. Una distribución de CloudFront por stage con los cuatro behaviors de
  `tech-specs.md` §7.2: staging (`EQW683KP4VXIV`) con alias `staging.letiende.co` real; producción
  (`ER22S2WADMM83`) creada en el mismo cambio pero **sin alias** — CloudFront no permite que
  `letiende.co`/`www.letiende.co` estén en dos distribuciones a la vez, y la actual (`E33QAN86FY24JZ`)
  sigue teniéndolos; el alias se mueve en el cutover real (T-14/T-15, ADR-006), no aquí. Orígenes de
  Ágora/Babel verificados contra la cuenta real (`apigatewayv2 GetApis`), no contra lo documentado —
  coincidieron exactamente con `tech-specs.md`. Políticas administradas (`CachingDisabled`,
  `CachingOptimized`, `AllViewerExceptHostHeader`) verificadas contra distribuciones reales ya en uso
  en la cuenta, no de memoria. Plantilla validada dos veces: `serverless package` local y
  `cloudformation ValidateTemplate` real contra la API de AWS antes de desplegar.

  **Hallazgo real, no anticipado en la planeación** (mismo patrón que ADR-005/012/013/018): el bucket
  `letiende-assets` no tiene prefijo `assets/` en sus keys, así que `/assets/*` devolvía 403 (S3
  responde 403, no 404, cuando el solicitante no puede listar el bucket). Corregido con una
  `AWS::CloudFront::Function` (`FuncionQuitarPrefijoAssets`, evento `viewer-request`) que quita el
  prefijo antes de reenviar a S3 — PR #18. `tech-specs.md` §7.2 corregido con un cuarto detalle, no
  solo el código.

  **Acción real fuera de este stack, autorizada explícitamente por el humano:** la política del
  bucket `letiende-assets` (privado, con Origin Access Control) solo permitía leer a la distribución
  actual de `assets.letiende.co` (`E3RUGH3MUSR7PS`) — se amplió para incluir también las dos
  distribuciones nuevas, sin quitarle el acceso a la existente (verificado que `assets.letiende.co`
  sigue respondiendo 200 después del cambio). El bucket solo tiene contenido viejo de la rama `2025`
  abandonada (`data/`, `flags/`, `logos/`, 97 objetos, confirmado con `s3 ListObjectsV2`); el humano
  confirmó que se puede limpiar y reutilizar, la limpieza en sí queda pendiente como tarea aparte.

  Verificado en vivo de punta a punta, no solo con el resultado del pipeline: `curl` real a
  `https://staging.letiende.co/` (200, HTML real), `/robots.txt` (`Disallow: /`), `/cartelera/` y
  `/libros/` (llegan de verdad a los orígenes reales de Ágora/Babel staging — 404/302 desde esos
  backends, no desde CloudFront, esperado porque T-0013/T-0014 todavía no existen), `/assets/*` (200
  tras el fix, con contenido SVG real). El humano confirmó además, desde su propio navegador, que
  `https://staging.letiende.co/` se visualiza bien. `docs/MEMORY.md` §5 actualizado con los 5
  identificadores reales.

- **T-0012** — [FEATURE] Página de Preguntas frecuentes (F-7). Completada 04/09/2026.
  `PreguntasFrecuentesComponent`, mismo patrón que `NosotrosComponent`: horarios y dirección
  derivados de `DATOS_NEGOCIO` (nunca repetidos a mano), parqueadero/accesibilidad/cómo-programar-un-
  evento con texto confirmado explícitamente por el humano en la sesión (parqueadero: no hay propio;
  accesibilidad: acceso limitado por escaleras, sin inventar rampas; evento propio: WhatsApp
  +57 318 7056288, con enlace real `wa.me`). Sin acordeón con JavaScript ni librería (ADR-004):
  `<details>`/`<summary>` nativos. Un único array `preguntas` en el componente alimenta tanto el
  `@for` del template como `esquemaFaqPage()` nueva en `core/seo/esquemas.ts` (schema.org `FAQPage`,
  `mainEntity: Question[]` con `acceptedAnswer.text`), para no declarar el contenido dos veces.
  Ruta agregada a `app.routes.ts`, `app.routes.server.ts` (`RenderMode.Prerender`, contenido 100%
  estático), `RUTAS_PROPIAS` de `server.ts` (ahora 4, no 3) y enlace en `BarraNavegacion` (escritorio
  y menú móvil, mismo `routerLinkActive` que `/nosotros`/`/contacto`). Verificado en vivo, no solo con
  pruebas: build de producción prerenderiza la ruta nueva, `curl` real contra el SSR responde 200 con
  el JSON-LD `FAQPage` extraído del HTML y parseado con `JSON.parse()` real (no solo `grep`),
  `/sitemap.xml` incluye la ruta. 48/48 pruebas (incluidas las nuevas del componente y del esquema),
  `tsc --noEmit` y `lint` limpios. `docs/tech-specs.md` §4.5 y §7 corregidos (la fila de
  `/preguntas-frecuentes` ya no dice "pendiente, la ruta todavía no existe").

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
  (tech-specs.md §9). Esto además destraba T-0011: ya no depende de nada.

  **Fusionado el mismo día:** el humano fusionó el PR #14 a `main` y eliminó la rama remota. Eso
  disparó `desplegar-produccion` de verdad (`push` a `main`) — se verificó con
  `gh run view --json jobs` que en ese run **solo** corrió `desplegar-produccion`
  (`build-y-test`/`desplegar-staging` quedaron `skipped`, confirmando en producción lo mismo que ya se
  había confirmado por diseño para staging: cada job solo se dispara por el evento que le corresponde).
  `letiende-co-production` existe de verdad — verificado con `curl` real (200 HTML en `/`, 404 real) y
  `aws lambda get-function-configuration --function-name letiende-co-production-contacto` con los
  secrets reales. El sitio público (`letiende.co`, CloudFront `E33QAN86FY24JZ`) **no cambió**: nada
  apunta todavía a este stack nuevo, eso es el cutover de T-0011/T-14/T-15. Detalle completo en
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

En orden, según `tech-specs.md` §11 (T-6 a T-10 ya hechas; F-7 ya hecha, T-0012; T-13/T-0011 ya
completada — T-11/T-12 son las tareas activas T-0013/T-0014):

1. **T-14 → T-15** Redirecciones 301 y cutover — **después** de que T-0013 y T-0014 terminen. Cierra
   el objetivo de etapa 1 OBJ-5 (`PRD.md` §6)
2. Etapa 2 (no empieza antes de que OBJ-5 esté resuelto): carta del café bar (F-8, depende de
   Comandante) y actualización de la interfaz de datos heredada (F-9, `letiende-api`, ADR-007 —
   pendiente averiguar quién la consume)

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
