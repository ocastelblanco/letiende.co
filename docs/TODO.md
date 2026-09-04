# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

**Sin tareas activas por decisión explícita (04/09/2026).** T-0013 y T-0014 (abajo, en el Historial)
cerraron el rollout del proxy — T-11/T-12/T-13/T-14 del roadmap técnico (`tech-specs.md` §11) ya están
completos. La siguiente pieza del roadmap es **T-15: el cutover real** (verificación completa del
proxy + cambio del registro de producción en Route 53) — una acción sobre DNS de producción,
deliberadamente **no auto-seleccionada aquí**: requiere que el humano decida cuándo y confirme antes de
empezar, mismo criterio ya aplicado a otras acciones irreversibles de este proyecto.

**T-0015 — [INFRA] Encabezados de seguridad de CloudFront, único bloqueo real antes de T-15 (roadmap),
COMPLETA (04/09/2026):** el hallazgo de los encabezados de seguridad ausentes (ver el Historial,
entrada T-0013/T-0014, hallazgo 8) quedó cerrado — dos `ResponseHeadersPolicy` de CloudFront,
verificadas en vivo contra `staging.letiende.co` (CSP completo en las páginas propias del contenedor,
los otros 4 encabezados sin CSP en `/cartelera/*`/`/libros/*`/`/assets/*`, decisión explícita del
humano para no arriesgar el checkout real de Ágora). Detalle completo en el Historial de abajo,
`tech-specs.md` §7.2 y `CLAUDE.md` §5. PR **#25, fusionado**. Con esto, **nada** bloquea técnicamente
el cutover.

**T-0016 — [INFRA] Preparación del cutover (T-15), COMPLETA (04/09/2026):** dejado listo para que el
humano solo tenga que ejecutar, no investigar, cuando decida el momento. Ver
`docs/runbook-cutover-t15.md` para la secuencia exacta y el estado verificado en vivo (certificado
ACM, ambas distribuciones, registros de Route 53). Hallazgo real durante la preparación: la
distribución de producción (`ER22S2WADMM83`) todavía no tenía `Aliases`/`ViewerCertificate` propios en
`serverless.yml` (quedaba en `AWS::NoValue`, sin que el roadmap lo mencionara como pendiente aparte) —
agregado en PR **`infra/prepara-cutover-t15`**, con el certificado ya `ISSUED` de la distribución
vieja (`ca9cd231-…`, cubre `letiende.co` y `www.letiende.co`). **Ese PR no se fusiona solo**: fusionarlo
antes de quitar el alias de la distribución vieja hace fallar el deploy (`CNAMEAlreadyExists`) — el
runbook cubre el orden correcto. El cutover en sí (quitar el alias viejo, fusionar ese PR, mover
Route 53) sigue sin ejecutarse — eso sigue siendo la decisión del humano.

---

## Historial

- **T-0016** — [INFRA] Preparación del cutover (T-15). Completada 04/09/2026, PR
  `infra/prepara-cutover-t15` (código) + `docs/runbook-cutover-t15.md` (secuencia de ejecución).
  Verificado contra la cuenta real de AWS, no de memoria: `ListDistributions`/
  `GetDistributionConfig` de las tres distribuciones relevantes, `DescribeCertificate` del ACM de
  `letiende.co` (`ca9cd231-…`, `ISSUED`, SAN cubre `www.letiende.co`, vence 2027-01-28,
  `InUseBy` solo la distribución vieja — no exclusivo, se puede referenciar desde la nueva sin
  conflicto) y `ListResourceRecordSets` de la zona de producción (`Z010633738KAGFIPOZVEW`: los
  registros `A` de `letiende.co`/`www.letiende.co` apuntan hoy a `d1gbhem25hsxvv.cloudfront.net`,
  la distribución vieja; además hay `MX`/`TXT`/`NS`/`SOA` que el runbook marca explícitamente como
  intocables).

  **Hallazgo real, no anticipado por el roadmap:** `serverless.yml` nunca declaró `Aliases`/
  `ViewerCertificate` de producción — la distribución nueva (`ER22S2WADMM83`) seguía con
  `CloudFrontDefaultCertificate` y sin alias, condición que haría inútil cualquier cambio de DNS
  hasta corregirla. Agregado `Aliases: !If [EsStaging, ['staging.letiende.co'], ['letiende.co',
  'www.letiende.co']]` y el `ViewerCertificate` con el ARN fijo del certificado ya existente (no se
  creó uno nuevo). Verificado con `serverless package --stage production` y `--stage staging` (el
  `Fn::If` resuelve distinto en cada uno, confirmado leyendo el JSON generado), build, 49/49 pruebas
  y lint limpios.

  **Decisión de diseño explícita, no delegada a CloudFormation:** el registro de Route 53 de
  producción se deja fuera de este stack a propósito (ADR-006) — moverlo es un paso manual del
  runbook, no una propiedad gestionada por `serverless.yml`, para que revertirlo no dependa del
  ciclo de vida de este stack.

  El PR de código queda **listo pero sin fusionar**: fusionarlo antes de quitar el alias de la
  distribución vieja hace fallar el deploy real (`CNAMEAlreadyExists`, CloudFront no permite el
  mismo alias en dos distribuciones a la vez). El cutover real (la secuencia completa de 4 pasos del
  runbook) sigue sin ejecutarse — es la parte que el humano decide cuándo hacer.

- **T-0015** — [INFRA] Encabezados de seguridad de CloudFront (CSP y 4 más). Completada 04/09/2026, PR
  #25, fusionado. Cierra el hallazgo 8 de la entrada T-0013/T-0014 de abajo: ninguna
  de las tres distribuciones de CloudFront del dominio emitía `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` ni `X-Frame-Options`, pese a
  que `CLAUDE.md` §5 (A05) los exige — nunca se implementó un `ResponseHeadersPolicy` en T-0011.

  **Decisión de alcance, tomada explícitamente con el humano tras plantear un riesgo real:** en vez de
  un único CSP para las 4 rutas de la distribución, dos políticas separadas.
  `PoliticaEncabezadosSeguridadContenedor` lleva el CSP completo (`default-src 'self'`; Google Fonts en
  `style-src`/`font-src`; el mapa embebido de `/contacto` en `frame-src https://www.google.com`; Google
  Analytics 4 en `script-src`/`connect-src`, `googletagmanager.com`/`google-analytics.com` — ausente en
  la regla original de `CLAUDE.md` §5, "Fonts y mapa, nada más", corregida en el mismo cambio; el bucket
  de imágenes de eventos de Ágora, `agora-activos-<stage>`, en `img-src`, porque la portada de este
  contenedor muestra imágenes ajenas cargadas directo de ese bucket) y se asocia **solo** al
  `DefaultCacheBehavior`. `PoliticaEncabezadosSeguridadProxy` lleva los otros 4 encabezados, sin CSP, y
  se asocia a `/cartelera/*`, `/libros/*` y `/assets/*`. **Por qué no un CSP único:** verificado leyendo
  el código real de Ágora, `comprar.component.ts` inyecta dinámicamente
  `<script src="https://checkout.bold.co/library/boldPaymentButton.js">` para el checkout real de
  compra de boletas (dinero real), y ambas apps usan Firebase Auth — un CSP pensado solo para este
  contenedor las habría roto en silencio. Cerrar el CSP de esas dos rutas queda como tarea aparte,
  coordinada con `agora-letiende`/`babel-letiende`. No es una regresión: hoy esas rutas tampoco tienen
  CSP.

  **Un hallazgo real durante la implementación, encontrado con el primer despliegue a staging:**
  CloudFront limita el campo `Comment` de un `ResponseHeadersPolicy` a 128 caracteres — el primer
  intento (`CREATE_FAILED`, con el mensaje exacto de CloudFront) tenía un comentario de 129. La pila
  completa (CloudFormation `UPDATE_ROLLBACK_COMPLETE`) revirtió sola sin afectar el servicio real
  (verificado con `curl` contra `staging.letiende.co` durante el rollback, seguía respondiendo 200).
  Corregido acortando ambos comentarios; segundo despliegue exitoso.

  Verificado en vivo, no solo con el resultado del pipeline: `curl -i` real contra
  `staging.letiende.co/` (los 5 encabezados, CSP incluido), `/cartelera/`, `/libros/` y
  `/assets/logos/favicon.ico` (los 4 sin CSP) — y navegador real (`claude-in-chrome`) contra
  `/contacto`: el mapa carga bien, sin errores de consola, confirmando que el CSP no rompió el iframe
  ni las fuentes de Google. Plantilla validada dos veces antes de desplegar:
  `serverless package --stage staging` local y `cloudformation ValidateTemplate` real contra la API de
  AWS.

- **T-0013/T-0014** — [INFRA] Integración de Ágora y Babel con el proxy: `--base-href`, barra común,
  sitemap, redirecciones 301. Completadas y verificadas en producción real 03-04/09/2026. Cambios
  reales en `agora-letiende` (PRs #58, #59, #60, #61, #62, #63 — todos fusionados) y en
  `babel-letiende` (PR #111 y #112 — ambos fusionados), coordinados desde este repositorio (T-11/T-12
  del roadmap técnico, `tech-specs.md` §11) pero ejecutados en los repos hermanos, con su propio
  `CLAUDE.md` y su propio Git Flow, tal como estaba planeado. `letiende.co` aportó su propia mitad:
  `FuncionInyectarHostVisitante` (PR #20 y #23, fusionados) — la `CloudFront Function` que inyecta el
  `Host` real del visitante en `x-le-tiende-host` y quita el prefijo de proxy de `/api/*` y
  `/sitemap.xml` antes de reenviar a cada app.

  **Siete hallazgos reales, ninguno anticipado por la planeación original de `tech-specs.md` §7.2/§7.3**
  (detalle técnico completo de cada uno en `docs/MEMORY.md` §7 de este repositorio y en
  `docs/MEMORY.md`/`docs/TODO.md` de Ágora y Babel):

  1. `baseHref` fijo rompe rutas sin prefijo fuera del proxy — redirección 301 desde el dominio antiguo.
  2. El sitemap no respondía a través del proxy (falta de `OriginPath`, ruta sin registrar en cada API
     Gateway).
  3. El `Host` real del visitante no llegaba a Ágora/Babel (`AllViewerExceptHostHeader` lo despoja) —
     corregido con el header propio `x-le-tiende-host`.
  4. Las llamadas a `/api/*` no llegaban a la app cuando estaba embebida — el más grave, reportado en
     vivo por el humano ("nada funciona"): una ruta absoluta ignora el `<base href>` por completo. Arreglo
     en dos partes: CloudFront quita el prefijo antes del origen, y el `absoluteUrlInterceptor` de cada
     app lo antepone en el navegador cuando está embebida.
  5. **Incidente real de producción**, también reportado en vivo por el humano: la redirección
     cross-domain de `/`/detalle a `letiende.co/cartelera|libros` se desplegó a producción antes de que
     el cutover (T-15, todavía no ejecutado) hiciera que ese destino existiera — `agora.letiende.co`/
     `babel.letiende.co`, el único acceso público real hoy, quedaron rotos (caían en `/eventos`, el
     fallback del sitio viejo). Corregido colapsando la redirección a "mismo dominio con el prefijo,
     sin excepción" en ambos repos, hasta que T-15 exista — la rama cross-domain queda comentada en el
     código para restaurarse entonces, no antes.
  6. **Verificación previa a T-15 (04/09/2026):** la distribución de producción nueva (`ER22S2WADMM83`,
     sin alias todavía) se probó de punta a punta contra su propio dominio de CloudFront
     (`d1o48r8wylv3sh.cloudfront.net`, sin afectar tráfico real) — los 4 behaviors, el header de host
     embebido, el prefijo de `/api/*`/sitemap y los orígenes reales de producción de Ágora/Babel
     funcionan correctamente. `robots.txt` bloquea correctamente ese dominio no-canónico.
  7. **Hallazgo de la misma verificación, no relacionado con el proxy:** ninguna de las tres
     distribuciones de CloudFront del dominio emite los encabezados de seguridad que `CLAUDE.md` §5
     exige — nunca se implementó un `ResponseHeadersPolicy` en T-0011, pese a que la regla ya existía
     cuando se planeó. No bloquea el cutover técnicamente, pero se recomienda resolverlo antes o junto
     con T-15 (después del cutover, `letiende.co` sirve contenido embebido de terceros bajo el mismo
     origen, así que la ausencia de CSP pesa más que hoy). Detalle completo en `tech-specs.md` §7.2.

  Verificado en producción real tras cada fusión, no solo en staging: `curl` contra
  `https://agora.letiende.co/` y `https://babel.letiende.co/` (301 → mismo dominio con el prefijo → 200)
  y navegador real (`claude-in-chrome`) contra `staging.letiende.co/cartelera` y `/libros` (datos reales,
  sin errores de consola). Registro de esfuerzo de esta ronda en `metrics/events/`.

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
