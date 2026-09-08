# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

**Corrección encontrada hoy (07/09/2026), no un anuncio nuevo: el cutover de T-15 ya está hecho.**
Este archivo llevaba tres días diciendo "sigue sin ejecutarse" — el motor JIT nunca llegó a
recalcularse después de la ejecución real. Verificado contra la cuenta real de AWS antes de corregir
nada aquí: `ER22S2WADMM83` (producción) tiene los alias `letiende.co`/`www.letiende.co`, Route 53 ya
apunta ambos registros `A` a esa distribución, y la distribución vieja (`E33QAN86FY24JZ`) no tiene
ningún alias. Detalle completo, con la línea de tiempo reconstruida desde el propio historial de git
(el trabajo sí se hizo y sí se documentó en commits — solo faltó la entrada de cierre en este
archivo), en la nueva entrada **T-0017** del Historial de abajo.

Con el objetivo de etapa 1 (OBJ-5, `PRD.md` §6) cerrado del todo, la "Cola priorizada" que traía este
archivo (T-14 → T-15) queda agotada — ver esa sección al final, actualizada. El motor JIT tomó las
siguientes dos tareas de la única cola con trabajo real pendiente: `docs/optimizacion-aplicaciones.md`,
el roadmap de deuda técnica **entre los cuatro repositorios de Le Tiende** (creado 07/09/2026, a partir
de reportes reales de Lighthouse contra producción y comparación de los cuatro `README`). Ese documento
es el nivel de detalle completo — evidencia, esfuerzo estimado, y las 17 tareas completas ordenadas de
menor a mayor esfuerzo; acá solo se referencian las 2 activas.

**T-0018 — [DOCS] Insignias de README + relicenciar a Apache 2.0 (OPT-4/OPT-18), COMPLETA
(07/09/2026):** los cuatro PR fusionados por el humano — `letiende.co#35`, `agora-letiende#66`,
`babel-letiende#122`, `comandante#23`. Detalle completo (hallazgo de Comandante sin `LICENSE`, el
badge de autoría verificado por repo, la corrección de la inconsistencia histórica de Ágora) en el
Historial de abajo.

**T-0020 — [ACCESIBILIDAD] Landmark `<main>` en Ágora (OPT-5), COMPLETA (07/09/2026):** PR
`agora-letiende#68`, fusionado por el humano. No existía ningún `<main>` en toda la app — se envolvió
el `router-outlet`. Detalle en el Historial de abajo.

**T-0022 — [CALIDAD] Fallo de prueba ESM de `@ionic/core` en Comandante (OPT-19), COMPLETA
(07/09/2026):** PR `comandante#26`, fusionado por el humano. Causa raíz real: `@ionic/angular@8.8.8`
importa `@ionic/core/components` como *directory import* sin `/index.js`, que Node ESM nativo rechaza
en el entorno de pruebas. Corregido con `patch-package` sobre la dependencia instalada — detalle
completo, incluidos dos hallazgos que destapó el fix (falta de `provideRouter` para `IonRouterOutlet`,
un test de scaffold obsoleto), en el Historial de abajo. **Nota de coordinación:** el humano fusionó
`comandante#27` (T-0023) antes que este PR por error, lo que produjo un conflicto real de `git merge`
en el `TODO.md` de Comandante (dos tareas insertadas en el mismo punto) — resuelto conservando ambas
entradas, verificado con build + pruebas reales después del merge antes de confirmar que el PR podía
fusionarse.

**T-0019 — [SEO] Meta description en Ágora, Babel y Comandante (OPT-1), COMPLETA (07/09/2026):** los
tres PR fusionados por el humano — `agora-letiende#67`, `babel-letiende#123`, `comandante#24`. Los
tres repos ya tenían servicio de SEO/`Meta` propio, solo faltaba llamarlo en la ruta pública auditada
— salvo Comandante, sin SSR y con todas las rutas protegidas por `authGuard` (Lighthouse audita sin
sesión), donde se optó por un `<meta>` estático en `index.html` en vez de construir un servicio
dinámico que nunca se ejecutaría para ese caso. Detalle completo en el Historial de abajo.

**T-0021 — [SEO] `robots.txt` inválido en Babel y Comandante (OPT-2), COMPLETA (07/09/2026):** PRs
`babel-letiende#124` y `comandante#25`, fusionados por el humano. Causa real en ambos: no existía
ningún `robots.txt` en absoluto — Babel caía en el catch-all SSR de Angular, Comandante servía el
`index.html` completo vía el rewrite `**` de Firebase Hosting (cada línea de ese HTML contaba como
directiva inválida, explica los "16 errores" exactos que reportaba Lighthouse). Detalle completo en
el Historial de abajo.

**T-0023 — [SEO/AEO] `llms.txt` en Babel y Comandante (OPT-3), COMPLETA (07/09/2026):** PRs
`babel-letiende#125` y `comandante#27`, fusionados por el humano. Contenido basado en la convención
real de `llmstxt.org`, verificado contra el código fuente exacto de la auditoría de Lighthouse — Babel
enlaza contenido público real (catálogo), Comandante (sin rutas públicas) lo dice explícitamente en
vez de inventar enlaces falsos. Detalle en el Historial de abajo.

**T-0024 — [ACCESIBILIDAD] Contraste de color (WCAG) en Babel y Comandante (OPT-6), COMPLETA
(07/09/2026):** los tres PR fusionados por el humano — `babel-letiende#126`, `comandante#28`,
`letiende.co#40`. Verificado en producción real tras la fusión: `curl` contra el CSS compilado de
`https://letiende.co/libros/` y `https://comandante.letiende.co/` confirma que `text-secondary-
accesible` y `text-espresso/{62,64,68,70}` resuelven a los colores esperados. Detalle completo en el
Historial de abajo.

**T-0025 — [RENDIMIENTO] `width`/`height` explícitos en imágenes en los cuatro repos (OPT-7),
COMPLETA (07/09/2026):** los cuatro PR fusionados por el humano — `letiende.co#42`,
`agora-letiende#69`, `babel-letiende#127`, `comandante#29`. Verificado en producción real tras la
fusión: `curl` contra `letiende.co/`, `/cartelera/` y `/libros/` confirma `width="73" height="32"` en
el logo de la barra. Detalle completo en el Historial de abajo.

**T-0026 — [RENDIMIENTO] Activar `sourceMap` en el build de producción de Babel y Comandante
(OPT-8), COMPLETA (08/09/2026) — con un incidente real de producción en el camino, ya resuelto:**
Comandante (`comandante#30`) quedó bien a la primera, verificado en producción real. Babel
(`babel-letiende#128`) causó **500 real** en `/libros/main-*.js.map` minutos después de fusionarse —
`RequestEntityTooLarge`, el mapa de 5,9 MB del bundle principal cruzaba el límite de 6 MB de respuesta
síncrona de Lambda (Babel sirve estáticos desde dentro del propio Lambda `ssr`, a diferencia de
Comandante). Revertido en `babel-letiende#129`, verificado en producción real tras el segundo
despliegue: `main-*.js` vuelve al hash previo, sin `sourceMappingURL`, y la petición del `.map`
inexistente cae en el 302 normal de la app (no en 500). OPT-20 queda en el backlog para el arreglo real
(S3 + CloudFront en Babel). Detalle completo en el Historial de abajo.

**T-0027 — [CALIDAD] Revisar el panel "Issues" de Chrome DevTools en Ágora, Babel y Comandante
(OPT-9), COMPLETA (08/09/2026) — resuelta junto con T-0028, misma causa raíz real:** investigado con
navegador real (`claude-in-chrome`) contra las tres URL de producción, sin adivinar. El JSON completo
de Lighthouse (audit `inspector-issues`) ya traía la respuesta exacta, sin necesidad de abrir DevTools
a mano: el único `issueType` registrado en los tres es `Cookie`, apuntando siempre a
`apis.google.com/js/api.js` (Ágora, Comandante) o a `books.google.com` (Babel, además del anterior).
Verificado en vivo: sin errores de consola, sin peticiones fallidas, `document.compatMode` en modo
estándar (`CSS1Compat`, sin *quirks*) en las tres. Verificado en el código, no solo inferido:
`GoogleAuthProvider` de Firebase Auth en `servicio-auth.ts`/`auth.service.ts` de los tres repos — el
inicio de sesión con Google es lo que carga `apis.google.com/js/api.js`. Detalle completo en el
Historial de abajo.

**T-0028 — [PRIVACIDAD] Auditar las cookies de terceros en Ágora, Babel y Comandante (OPT-10),
COMPLETA (08/09/2026):** el audit `third-party-cookies` de Lighthouse confirma que las 53 cookies de
cada repo vienen de esa misma única fuente — `apis.google.com/js/api.js` en Ágora y Comandante,
`books.google.com` (API de Google Books, integración real de metadatos de libros, documentada en
`docs/PRD.md` de Babel) en Babel. **Documentado como aceptado, no un falso positivo perseguido a
ciegas:** ambas son dependencias de terceros reales y necesarias — inicio de sesión con Google
(requisito de autenticación) y enriquecimiento de metadatos de ISBN — no hay ninguna cookie propia ni
evitable que corregir. Detalle completo en el Historial de abajo.

**T-0029 — [DOCS] Reescribir el `README` de Ágora al estilo bilingüe (OPT-11), COMPLETA
(08/09/2026):** PR `agora-letiende#70`, fusionado por el humano. Traducción fiel del contenido
existente, no el formato de caso de estudio extendido de Babel/Comandante (esos números son
específicos de esos repos). Detalle completo en el Historial de abajo.

**T-0030 — [RENDIMIENTO] `Cache-Control` eficiente para activos estáticos en los cuatro repos
(OPT-12), COMPLETA (08/09/2026):** los dos PR fusionados por el humano — `agora-letiende#71`,
`comandante#31`. Investigado con el detalle completo de `cache-insight` de Lighthouse antes de tocar
nada, no adivinado — el mismo audit señala orígenes distintos por repo, no un patrón único de
`ResponseHeadersPolicy`/`CacheBehavior` en los cuatro `serverless.yml` como asumía la evidencia
original del backlog. **Ágora y letiende.co** comparten la misma causa real: el bucket
`agora-activos-production` (imágenes de eventos, embebidas también en la portada de `letiende.co` vía
el proxy) con `cacheLifetimeMs: 0` — corregido agregando `CacheControl` al `PutObjectCommand` firmado
y al `PUT` del frontend (mismo encabezado exacto, forma parte de la firma de S3); `letiende.co` no
necesitó ningún cambio propio, el mismo fix resuelve su parte del audit. **Comandante** tenía una
causa distinta y real: sus bundles JS/CSS (hasheados) solo tenían 1 hora de cache por el valor por
defecto de Firebase Hosting, sin ninguna regla en `firebase.json` — corregido con `Cache-Control` de
un año para `**/*.@(js|css)`, deliberadamente sin tocar imágenes/logo sin hash de contenido. **Babel
no tiene ninguna causa fixeable en este repositorio:** el 100% de su desperdicio de caché son orígenes
de terceros que no controla — documentado como aceptado, sin PR. Verificado en producción real tras
la fusión: `curl -I` contra el bundle de Comandante confirma `Cache-Control: public, max-age=31536000,
immutable`; en Ágora el mismo `curl` contra una imagen ya existente (subida antes del fix) no lo trae
— esperado, no un defecto: el encabezado es metadato de S3 fijado al momento de subir, no retroactivo,
así que solo las imágenes de eventos subidas de ahora en adelante lo llevan. Detalle completo en el
Historial de abajo.

**T-0031 — [RENDIMIENTO] Investigar el origen de los 309 KiB de JS sin minificar en los cuatro
repos (OPT-13), COMPLETA (08/09/2026) — falso positivo del entorno de auditoría, sin ningún cambio de
código:** el audit `unminified-javascript` completo de los cuatro reportes trae 11 elementos
idénticos, byte a byte, en los cuatro — y los 11 son `chrome-extension://...`, no una sola URL de
`letiende.co`, Ágora, Babel ni Comandante. Identificados por su ID de extensión:
`nngceckbapebfimnlniiiahkandclblb` es **Bitwarden** (gestor de contraseñas —
`bootstrap-autofill-overlay-notifications.js`, `fido2-*`), `gighmmpiobklfepjocnamgkkbiglidom` es
**AdBlock** (`adblock-functions.js`, `@eyeo/webext-ad-filtering-solution` — eyeo es la empresa detrás
de Adblock Plus/AdBlock). Suma exacta: 316.691 bytes = 309,27 KiB — coincide byte a byte con el
"309 KiB" que traía la evidencia original del backlog. Las cuatro apps nunca tuvieron este problema:
Lighthouse corrió en un Chrome con extensiones normales instaladas (no incógnito/perfil limpio), y
esas extensiones inyectan sus propios scripts en cada pestaña — Lighthouse los cuenta igual que
cualquier recurso de la página. **Lección para la próxima ronda de reportes base:** correr Lighthouse
en una ventana de incógnito o un perfil sin extensiones para no repetir este falso positivo.
`docs/optimizacion-aplicaciones.md` §5 actualizado.

**T-0032 — [RENDIMIENTO] Comprimir y servir en formato moderno las imágenes de eventos (OPT-14),
ACTIVA:** Lighthouse (`image-delivery-insight`) marca ahorro real en Ágora y letiende.co — las
portadas de eventos del bucket `agora-activos-<stage>` se sirven sin comprimir y sin formato moderno
(WebP/AVIF). Corresponde al mismo bucket que T-0030 ya tocó (`CacheControl`), esta vez el formato/peso
del archivo, no el cacheo. DoD: portadas nuevas servidas en formato moderno con tamaños responsivos
(evaluar conversión en la subida vs. un servicio de transformación en el borde); verificado con
`curl -I`/tamaño real contra producción; sin romper las portadas ya subidas; `docs/optimizacion-
aplicaciones.md` §5 actualizado; esfuerzo registrado.

**T-0033 — [RENDIMIENTO] *Lazy-load* de rutas para reducir JS sin usar en los cuatro repos
(OPT-15), ACTIVA:** Lighthouse (`unused-javascript`) marca 1.113 KiB en Babel, 617 KiB en Ágora, ~600
KiB en `letiende.co` y Comandante — revisar qué rutas cargan código que la vista auditada no necesita,
no asumir que ya todo está lazy-loaded solo porque el router lo permite. DoD: identificadas con el
detalle real del audit (`unused-javascript`, no solo el número total) las rutas/módulos concretos que
se cargan sin usarse en la vista auditada de cada repo; corregido con `loadComponent`/rutas hijas
lazy donde aplique, sin romper la navegación; verificado con build (tamaño de chunks) y con la vista
real en el navegador; `docs/optimizacion-aplicaciones.md` §5 actualizado; esfuerzo registrado.

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
runbook cubre el orden correcto. El cutover en sí se ejecutó el mismo día, horas después de esta
preparación — ver **T-0017**, entrada nueva del Historial (corrección del 07/09/2026: nunca se había
registrado el cierre).

---

## Historial

- **T-0031** — [RENDIMIENTO] Investigar el origen de los 309 KiB de JS sin minificar (OPT-13).
  Completada 08/09/2026 — **falso positivo del entorno de auditoría, sin ningún PR ni cambio de
  código en ningún repo**.

  El audit `unminified-javascript` completo (no solo el número total que traía la evidencia original
  del backlog) trae 11 elementos idénticos byte a byte en los cuatro reportes de Lighthouse, y los 11
  son `chrome-extension://...` — ninguno es una URL de `letiende.co`, Ágora, Babel ni Comandante.
  Identificados por su ID de extensión de Chrome: `nngceckbapebfimnlniiiahkandclblb` es **Bitwarden**
  (gestor de contraseñas — los archivos son `bootstrap-autofill-overlay-notifications.js`, `fido2-
  page-script.js`, `fido2-content-script.js`, del autocompletado de formularios y WebAuthn de la
  extensión); `gighmmpiobklfepjocnamgkkbiglidom` es **AdBlock** (`adblock-functions.js`,
  `adblock-picreplacement.js`, `@eyeo/webext-ad-filtering-solution/content-main.js` — eyeo es la
  empresa detrás de Adblock Plus/AdBlock); un tercer ID sin identificar aporta un `main.js` menor.
  Suma exacta de `wastedBytes`: 316.691 bytes = **309,27 KiB** — coincide byte a byte con el "309 KiB"
  original, confirmando que es la misma causa en los cuatro, tal como sospechaba la evidencia, pero no
  la dependencia compartida (Firebase SDK) que se sospechaba — es el entorno del navegador donde corrió
  Lighthouse, no el código de ninguna app.

  **Causa de fondo:** Lighthouse corrió en una ventana normal de Chrome con extensiones instaladas
  (no incógnito, no un perfil limpio) — las extensiones del navegador inyectan sus propios scripts en
  cada pestaña que se visita, y Lighthouse los audita igual que cualquier recurso real de la página,
  sin distinguir el origen. **Lección para la próxima ronda de reportes base de este roadmap:** correr
  Lighthouse en incógnito o con un perfil de Chrome sin extensiones, para no repetir este mismo falso
  positivo en la siguiente medición.

- **T-0030** — [RENDIMIENTO] `Cache-Control` eficiente para activos estáticos (OPT-12). Completada
  08/09/2026, dos PR fusionados: `agora-letiende#71`, `comandante#31`.

  Investigado con el detalle completo de `cache-insight` de Lighthouse antes de tocar nada — la
  evidencia original del backlog asumía un patrón único de `ResponseHeadersPolicy`/`CacheBehavior` en
  los cuatro `serverless.yml`, pero el audit real mostró tres causas distintas, ninguna del patrón
  asumido:
  - **Ágora + letiende.co** (misma causa real): el bucket `agora-activos-production` (imágenes de
    eventos, embebidas también en la portada de `letiende.co` vía el proxy) con `cacheLifetimeMs: 0`.
    Corregido agregando `CacheControl: 'public, max-age=31536000, immutable'` al `PutObjectCommand`
    firmado en `server/api/handlers/eventos.ts` — el encabezado forma parte de la firma de S3, así que
    `EventosService.subirActivo()` (frontend) tuvo que enviar el mismo encabezado exacto en el `PUT`, o
    la firma no habría validado. Cada key lleva un UUID nuevo por subida, nunca se reescribe con
    contenido distinto, así que cachear "para siempre" es seguro. `letiende.co` no necesitó ningún
    cambio propio — el mismo fix resuelve su parte del audit, porque comparte el mismo origen.
  - **Comandante**: causa distinta y real — sus bundles JS/CSS (hasheados por `outputHashing: all`)
    solo tenían 1 hora de cache, el valor por defecto de Firebase Hosting sin ninguna regla en
    `firebase.json`. Corregido con una regla nueva (`Cache-Control` de un año para `**/*.@(js|css)`,
    mismo formato de extglob que documenta la guía oficial de Firebase Hosting), deliberadamente sin
    tocar imágenes ni el logo — viven en `public/` sin hash de contenido en el nombre, así que
    cachearlos por un año habría sido inseguro (un cambio real de logo tardaría hasta un año en verse).
  - **Babel**: sin ninguna causa fixeable en este repositorio — el 100% de su desperdicio de caché son
    orígenes de terceros que no controla (portadas de libros escaneadas de sitios externos, el iframe
    de autenticación de Firebase). Sus propios bundles ya cachean bien (`express.static` con
    `maxAge: '1y'`, ya verificado durante T-0026). Documentado como aceptado, sin PR abierto.

  Verificado en producción real tras la fusión, no solo con el resultado del build: `curl -I` contra
  el bundle principal de Comandante confirma `Cache-Control: public, max-age=31536000, immutable`; en
  Ágora, el mismo `curl` contra una imagen ya existente (subida antes de la fusión) no trae el
  encabezado — verificado que es el comportamiento esperado, no un defecto: el encabezado es metadato
  de S3 fijado en el momento de la subida, nunca retroactivo, así que solo las imágenes de eventos
  subidas de ahora en adelante lo llevan. Build + pruebas en verde en ambos repos antes de cada PR
  (incluida una prueba nueva en Ágora que verifica el encabezado real enviado a S3).

- **T-0029** — [DOCS] Reescribir el `README` de Ágora al estilo bilingüe (OPT-11). Completada
  08/09/2026, PR `agora-letiende#70` fusionado.

  Antes de escribir una sola línea, se investigó el alcance real del DoD: traducir el contenido
  existente y alinear insignias, no replicar el formato de caso de estudio extendido de Babel/Comandante
  (Pareto humano/agente, incidente de costos propio) — ese contenido es específico de esos dos repos y
  copiarlo a Ágora habría significado inventar cifras. Se leyó `docs/tracking.csv` real de Ágora (233
  tareas, 105 h 09 min medidas) para confirmar que solo registra tiempo de ejecución del agente
  (`role` siempre `AI`, sin filas de tiempo humano por separado) — por eso no se calculó ni se mostró
  ningún reparto humano/agente, habría sido una cifra inventada. Se verificó contra `docs/MEMORY.md` de
  Ágora que su objetivo de `< US$1/mes` es una reacción directa al incidente real de **Babel**
  (US$94,44 en un mes), nunca un incidente propio de Ágora, antes de escribir esa frase en el README.

  `README.md` (inglés, traducción fiel) y `README.es.md` (español, contenido original) con insignias
  `flat-square` alineadas al resto de repos (`Live`, `Firebase`, cruce de idioma en ambos sentidos).

- **T-0027/T-0028** — [CALIDAD/PRIVACIDAD] Panel "Issues" de Chrome DevTools (OPT-9) y cookies de
  terceros (OPT-10) en Ágora, Babel y Comandante. Completadas juntas 08/09/2026 — no hubo PR de código,
  el resultado fue un hallazgo documentado, no un cambio de código: ninguna de las dos exigía fusión en
  ningún repo hermano.

  Investigado con navegador real (`claude-in-chrome`) contra las tres URL de producción, y con los
  audits completos de Lighthouse ya descargados — sin adivinar la causa antes de mirar la evidencia.
  El JSON de Lighthouse ya traía el detalle exacto que el DoD de T-0027 pedía abrir a mano en DevTools:
  el audit `inspector-issues` registra un único `issueType: 'Cookie'` en los tres repos, y el audit
  `third-party-cookies` confirma que las 53 cookies que reporta cada uno vienen de esa misma fuente
  única — `apis.google.com/js/api.js` (Ágora, Comandante) o `books.google.com` (Babel, además de la
  anterior). Verificado en vivo con el navegador, no solo con el reporte: `read_console_messages` sin
  ningún error ni advertencia en las tres URL, `read_network_requests` sin ninguna petición fallida,
  `document.compatMode` en modo estándar (`CSS1Compat`) en las tres — nada más que reportar fuera de
  esa única cookie de terceros.

  **Causa raíz confirmada en el código, no solo inferida del dominio de la URL:** `GoogleAuthProvider`
  de Firebase Auth aparece en `servicio-auth.ts` (Ágora) y `auth.service.ts` (Babel, Comandante) — el
  inicio de sesión con Google es lo que carga `apis.google.com/js/api.js` y dispara la cookie de
  terceros. En Babel, la segunda fuente (`books.google.com`) es la API de Google Books para
  enriquecimiento de metadatos de ISBN, integración real documentada en `docs/PRD.md` de ese repo —
  verificado con `grep` que no es un remanente sin usar.

  **Decisión, siguiendo exactamente el criterio que ya traía el DoD original de T-0028:** documentado
  como aceptado, no perseguido como falso positivo. Ambas fuentes son dependencias de terceros reales
  y necesarias — inicio de sesión con Google es un requisito de autenticación, el enriquecimiento de
  metadatos es una funcionalidad real del producto — y ninguna de las dos tiene una cookie propia del
  proyecto ni evitable de por medio. No hay ningún cambio de código que hacer sin eliminar
  funcionalidad real; el "arreglo" es la documentación de esta sesión, que es lo que impide que la
  próxima auditoría de Lighthouse vuelva a perseguir el mismo hallazgo desde cero.

- **T-0026** — [RENDIMIENTO] Activar `sourceMap` en el build de producción de Babel y Comandante
  (OPT-8). Completada 08/09/2026, tres PR fusionados: `comandante#30`, `babel-letiende#128` (causó el
  incidente) y `babel-letiende#129` (hotfix que lo revirtió).

  **Comandante, sin sobresaltos:** `"sourceMap": true` agregado a la configuración `production` de
  `angular.json` (ya existía en `development`). Verificado antes de fusionar que este repo despliega a
  Firebase Hosting sin Lambda propia — su `dist/` creció de ~2 MB a 11 MB sin ningún límite real que
  cruzar. Verificado en producción real tras la fusión: `curl` contra
  `https://comandante.letiende.co/main-*.js.map` responde 200 con el JSON real (7,5 KB).

  **Babel, incidente real de producción, no un hallazgo teórico.** El mismo cambio de una línea se
  fusionó (`babel-letiende#128`) tras verificar — correctamente — que el **zip** de despliegue de
  Lambda pasaba de 1,4 MB a 5,8 MB, muy por debajo del límite de 50 MB de carga directa. Minutos después
  de la fusión, `curl` real contra `https://letiende.co/libros/main-*.js.map` devolvió **500**.
  Investigado en CloudWatch (`/aws/lambda/babel-letiende-production-ssr`, filtro `ERROR`), no adivinado:
  `RequestEntityTooLarge — Exceeded maximum allowed payload size (6291556 bytes)`. Causa raíz real: el
  mapa del bundle principal (`main-*.js.map`) pesa 5,9 MB — el resto de mapas son de pocos KB — y Babel
  sirve sus estáticos con `express.static` **desde dentro del propio Lambda `ssr`**
  (`server.ts:150-151`), a diferencia de Comandante (Firebase Hosting). La respuesta síncrona de una
  invocación de Lambda tiene un límite duro de 6 MB **tras** la codificación que aplica API Gateway —
  un límite completamente distinto al del tamaño del zip de despliegue, y ese archivo lo cruza. Nunca se
  había topado este límite antes porque nunca había existido un estático de este tamaño en el paquete.

  **Revertido el mismo día** (`babel-letiende#129`): se quita `"sourceMap": true` de `production` en
  `angular.json`. Verificado en producción real tras el segundo despliegue —
  `curl` contra `main-*.js` confirma que vuelve al hash previo al cambio (sin `sourceMappingURL`), y la
  petición del `.map` (que ya no existe) cae en el 302 normal de la app en vez de un 500. Habilitar
  `sourceMap` de verdad en Babel exige mover el estático fuera del Lambda (S3 + CloudFront, mismo patrón
  que `letiende-assets` de `letiende.co`) — se agregó **OPT-20** al backlog de
  `docs/optimizacion-aplicaciones.md` para esa tarea, de mayor esfuerzo, en vez de dejarla perdida.

  **Lección para sesiones futuras, la misma que ya dejaron T-0013/T-0014 y el cutover (T-0017):** un DoD
  que dice "evaluar el impacto en el tamaño del paquete de despliegue" puede quedar satisfecho y aun así
  dejar un límite real sin cubrir, cuando el mismo servicio que empaqueta el archivo también lo sirve —
  el tamaño del artefacto y el tamaño de una respuesta HTTP individual son límites distintos, y verificar
  uno no basta para el otro.

- **T-0025** — [RENDIMIENTO] `width`/`height` explícitos en imágenes en los cuatro repos (OPT-7).
  Completada 07/09/2026, cuatro PR fusionados: `letiende.co#42`, `agora-letiende#69`,
  `babel-letiende#127`, `comandante#29`.

  Investigado antes de tocar nada: en los cuatro repos, el único elemento que Lighthouse marcaba
  (`unsized-images`) era el logo de marca, sin `width`/`height` explícitos — causa real de *layout
  shift* durante la carga, no cosmético. El resto de imágenes de cada repo (portadas de eventos y
  libros, avatares, códigos QR) ya usa `aspect-ratio` explícito en CSS o ambas dimensiones fijas vía
  Tailwind, así que el mismo audit no las marcaba — verificado leyendo cada plantilla antes de asumir
  qué imagen era el problema.

  Se agregó `width`/`height` con la proporción real del viewBox del SVG del logo (525.26×230.56, sin
  `width`/`height` propios en el archivo) en **todas** las instancias de cada repo, no solo la que
  Lighthouse había auditado — 1 en `letiende.co` (barra), 2 en Ágora (barra + login), 3 en Babel
  (barra + catálogo + login), 9 en Comandante (5 toolbars a 24px, 2 a 26px, login, sidebar de admin).
  El tamaño visible lo sigue controlando la clase/`style` de Tailwind que ya existía en cada una — el
  atributo HTML solo establece la proporción para que el navegador reserve el espacio correcto antes
  de que cargue la imagen.

  **Incidente de coordinación durante el cierre, encontrado y corregido en la misma sesión:** al cerrar
  T-0024 se abrió un PR de documentación (`letiende.co#41`) y, sin que se fusionara todavía, se creó la
  rama de esta tarea desde `main` — quedaron dos PR con contenido de cierre superpuesto. Se fusionó la
  rama del #41 dentro de la de esta tarea (`git merge`, un conflicto real resuelto conservando ambas
  versiones) antes de abrir el PR de `letiende.co`, y se dejó explícito en ambos PR que #41 quedaba
  redundante una vez se fusionara #42 — el humano fusionó los dos sin que produjera ningún conflicto
  real en `main` (git reconoció el contenido ya idéntico).

  Verificado en producción real tras la fusión, no solo con el resultado del build: `curl` contra
  `https://letiende.co/`, `https://letiende.co/cartelera/` y `https://letiende.co/libros/` confirma
  `width="73" height="32"` en el HTML servido de verdad. Build + pruebas en verde en los cuatro repos
  antes de cada PR.

- **T-0024** — [ACCESIBILIDAD] Contraste de color (WCAG) en Babel y Comandante (OPT-6). Completada
  07/09/2026, tres PR fusionados: `babel-letiende#126`, `comandante#28`, `letiende.co#40`.

  Investigado con los cuatro reportes reales de Lighthouse (`color-contrast`) antes de tocar nada, no
  adivinado. **Babel** (`/libros/`, 1678 elementos): el precio de cada tarjeta del catálogo usa
  `text-secondary` (`#E8630A`) a 14px negrita — 3.37:1 sobre blanco, bajo el 4.5:1 exigido a texto
  normal (14px negrita no llega al umbral de "texto grande"). **Comandante** (`/admin/dashboard`, 9
  elementos): `text-espresso/45` (3.04:1), `/40` (2.62:1), `/35` (2.28:1) — la variable
  `--color-espresso` con modificador de opacidad de Tailwind, nunca documentada en el `DESIGN.md` de
  ese repo (solo el color a opacidad plena), usada para jerarquía de texto secundario en 4 vistas
  distintas, no solo la auditada.

  **Fix, verificado con la fórmula real de contraste relativo de WCAG, no aproximado** (incluida la
  variante de Comandante sobre `bg-espresso/8`, más exigente que sobre blanco puro): Babel gana un
  token nuevo, `--color-secondary-accesible: #B84D08` (5.12:1), aplicado solo donde `secondary`
  coloreaba texto pequeño real (precio de catálogo y detalle, enlace activo de la barra) —
  `secondary` puro se conserva en bordes/fondos/anillos de foco, que no exigen 4.5:1. Comandante sube
  la opacidad mínima por nivel preservando la jerarquía relativa (`/30→/62`, `/35→/64`, `/40→/68`,
  `/45→/70`), en los 4 archivos donde aparece el patrón, no solo el dashboard auditado.

  Verificado en producción real tras la fusión, no solo con el resultado del build: `curl` contra el
  CSS compilado real de `https://letiende.co/libros/` confirma `text-secondary-accesible{color:var(
  --color-secondary-accesible)}` con el valor `#b84d08`, y contra `https://comandante.letiende.co/`
  confirma las cuatro clases `text-espresso/{62,64,68,70}` resolviendo al `color-mix()` esperado.
  Pendiente, no bloqueante: volver a correr Lighthouse (`color-contrast`) contra ambas URL para cerrar
  el ciclo con una medición nueva, según el protocolo de `docs/optimizacion-aplicaciones.md` §1.6.

- **T-0023** — [SEO/AEO] `llms.txt` en Babel y Comandante (OPT-3). Completada 07/09/2026, dos PR
  fusionados: `babel-letiende#125`, `comandante#27`.

  Antes de escribir contenido, se verificó la convención real de `llmstxt.org` (H1 + blockquote de
  resumen + secciones H2 con links Markdown) y los requisitos exactos de la auditoría `llms-txt` de
  Lighthouse contra su propio código fuente (`GoogleChrome/lighthouse`), no adivinados: un H1, al
  menos un link Markdown, más de 50 caracteres.
  - **Babel:** tiene contenido público real (catálogo SSR, sin autenticación) — se agregó una ruta
    Express (`/llms.txt`, mismo patrón que `/robots.txt` de T-0021) enlazando el catálogo público
    real y la documentación del repo.
  - **Comandante:** herramienta interna sin ninguna ruta pública (mismo criterio que su
    `robots.txt: Disallow: /`) — el `llms.txt` **lo dice explícitamente** en vez de inventar
    contenido público que no existe; el único link real es al repositorio de GitHub.

  Verificado con build + servidor real (SSR local en Babel, `firebase serve` en Comandante) — el
  contenido responde de verdad en `/llms.txt`, no solo existe en el código.

- **T-0022** — [CALIDAD] Fallo de prueba ESM de `@ionic/core` en Comandante (OPT-19). Completada
  07/09/2026, PR `comandante#26`.

  **Causa raíz, confirmada por depuración empírica, no supuesta:** `@ionic/angular@8.8.8` empaqueta
  sus archivos `fesm2022` (`ionic-angular-common.mjs`, `ionic-angular-standalone.mjs`) con imports
  estáticos a `@ionic/core/components` sin el sufijo `/index.js` — Node ESM nativo no resuelve
  *directory imports* (a diferencia de CJS/`require`), y como las pruebas de
  `@angular/build:unit-test` corren en entorno Node (jsdom/happy-dom, no navegador), ese paquete se
  externaliza y su import llega sin transformar al loader nativo de Node. Se verificó
  experimentalmente que `optimizeDeps.include`, `resolve.noExternal` y `test.server.deps.inline` en
  `vitest.config.ts` **no** evitan la externalización para este caso — solo corregir la ruta de
  import real lo resuelve, exactamente lo que sugiere el propio mensaje de error de Node.

  **Fix:** `patch-package` (nueva dependencia + `postinstall`), parcheando `@ionic/angular@8.8.8`
  instalado para importar `@ionic/core/components/index.js`. Es una superficie de mantenimiento
  nueva a vigilar: si Ionic actualiza de versión y cambia esos archivos, el parche puede dejar de
  aplicar — falla ruidosamente en la instalación, no en silencio, pero hay que revisarlo en el
  próximo `ng update`/`npm update` de ese repo que toque `@ionic/angular`.

  Arreglar el crash destapó dos problemas reales más, corregidos en el mismo PR: faltaba
  `provideRouter` para la dependencia `ActivatedRoute` de `IonRouterOutlet` en el `TestBed`, y un
  test de scaffold obsoleto (`<h1>` que ya no existe en la plantilla real). `npm test` pasa limpio,
  sin excluir ni saltar la prueba — la regla que pedía el DoD.

  **Incidente de coordinación durante el cierre:** el humano fusionó `comandante#27` (T-0023) antes
  que este PR por error, produciendo un conflicto de `git merge` real en `TODO.md` de Comandante (dos
  entradas de historial insertadas en el mismo punto por ambas ramas). Resuelto conservando las dos
  entradas completas, sin perder ninguna; verificado con build + pruebas reales corridas de nuevo
  después del merge, antes de confirmar que el PR quedaba listo para fusionarse.

- **T-0021** — [SEO] `robots.txt` inválido en Babel y Comandante (OPT-2). Completada 07/09/2026, dos
  PR fusionados: `babel-letiende#124`, `comandante#25`.

  **Regla seguida: investigar antes de tocar nada, no adivinar la causa.** El error de Lighthouse
  ("no válido" en Babel, "16 errores" en Comandante) no traía detalle — se obtuvo el `robots.txt` real
  servido en producción de cada uno antes de escribir cualquier fix:
  - **Babel:** no existía ninguna ruta `/robots.txt`. La petición caía en el catch-all SSR de Angular,
    que devolvía `200` con HTML vacío — Lighthouse lo interpretaba como robots.txt inválido porque,
    de hecho, no era un robots.txt en absoluto. Corregido con una ruta Express dedicada en
    `server.ts`, registrada antes del middleware de redirección del dominio antiguo.
  - **Comandante:** mismo problema de fondo, causa distinta. Sin archivo `robots.txt` en `public/`, el
    rewrite `"source": "**"` de `firebase.json` servía el `index.html` completo de la SPA como
    respuesta — **cada línea de ese HTML contaba como una directiva inválida**, explicando
    exactamente los "16 errores" que reportaba Lighthouse (no un número arbitrario). Corregido
    agregando un `public/robots.txt` estático — verificado en vivo con `firebase serve` que un
    archivo estático gana sobre el rewrite.

  Verificado con SSR/hosting real en ambos (`curl` contra el servidor local, no solo el código), y
  ambos repos corrieron su build/test antes del PR.

- **T-0020** — [ACCESIBILIDAD] Landmark `<main>` en Ágora (OPT-5). Completada 07/09/2026, PR
  `agora-letiende#68`. No existía ningún `<main>` en ningún componente de la app (verificado antes de
  agregar uno, para no terminar con dos anidados) — se envolvió el `<router-outlet />` en `app.html`.
  Verificado con SSR real: `curl` contra la página confirma exactamente un `<main>`/`</main>`
  envolviendo el contenido correcto.

- **T-0019** — [SEO] Meta description en Ágora, Babel y Comandante (OPT-1). Completada 07/09/2026,
  tres PR fusionados: `agora-letiende#67`, `babel-letiende#123`, `comandante#24`.

  Antes de escribir nada, se verificó en cada repo si ya existía un servicio de SEO equivalente a
  `MetaService` de `letiende.co` — en los tres **ya existía**, solo faltaba llamarlo en la ruta pública
  auditada por Lighthouse:
  - **Ágora:** `Meta`/`Title` de `@angular/platform-browser` ya se usaba en `DetalleEventoComponent`,
    pero no en `CarteleraComponent` (la ruta pública real, `/cartelera` vía `baseHref`). Agregado ahí.
  - **Babel:** mismo patrón — `LibroDetalleComponent` ya lo usaba, `CatalogoPublicoComponent` no.
    Agregado ahí. Hallazgo aparte, no relacionado con el fix: `@angular/ssr` 22.x valida el header
    `Host` contra `allowedHosts` del manifest — para probar SSR en local hace falta
    `NG_ALLOWED_HOSTS=localhost` (configuración preexistente de cada repo, no tocada).
  - **Comandante:** **no** tenía ningún servicio de SEO, y **no se construyó uno** — decisión de
    ingeniería explícita: ese repo no tiene SSR (`ng build` simple, Firebase Hosting client-side) y
    **todas las rutas salvo `/login` están protegidas por `authGuard`**, así que un `Meta.updateTag()`
    en cualquier componente protegido nunca se ejecutaría para el visitante sin sesión que Lighthouse
    audita (auditó `/admin/dashboard` sin autenticarse). Se agregó un `<meta name="description">`
    **estático** en `src/index.html`, que Firebase Hosting sirve igual para cualquier ruta — proporcional
    al problema real, sin construir infraestructura que ese caso no necesita.

  Las tres descripciones salieron de texto real ya existente en cada repo (`README`/`CLAUDE.md`), no
  inventadas. Verificado con build + SSR real (Ágora, Babel) o build + inspección del `index.html`
  compilado (Comandante) — no solo con el código, con el HTML servido de verdad.

- **T-0018** — [DOCS] Insignias de README (OPT-4) + relicenciar los cuatro repos a Apache 2.0
  (OPT-18). Completada 07/09/2026, cuatro PR fusionados: `letiende.co#35`, `agora-letiende#66`,
  `babel-letiende#122`, `comandante#23`.

  **Primera ronda (OPT-4):** agregar insignias `License`, `SLIM` y el nivel de autoría IA correcto a
  `README.md`/`README.es.md` de Babel y Comandante. **El nivel de autoría IA no se copió de
  `letiende.co`** — cada repo tiene su propio reparto humano/agente medido: Babel usó **AI-generated**
  (no "AI-assisted"), verificado contra `tracking-detail.csv` real de ese repo (149 filas, 79,2%
  agente / 20,8% humano — mayoría del agente, nivel más alto de la taxonomía SLIM). Comandante se
  dejó **sin** badge de autoría: ese repo no tiene ningún registro de esfuerzo propio (`metrics/`,
  CSV o equivalente) contra el cual verificarlo, y "~60% orquestado desde el teléfono" (lo que sí
  dice su README) mide *canal de ejecución*, no reparto de autoría — no es lo mismo, y no se inventó
  el dato.

  **Hallazgo real que amplió la tarea:** verificando el `LICENSE` de cada repo antes de poner el
  badge (mismo cuidado documentado desde T-0002/§7, cuando se encontró la misma clase de
  inconsistencia en Ágora), apareció que **Comandante no tiene ningún archivo `LICENSE`** — ni en el
  repo, ni en `package.json`, ni en el historial de git. Consultado el humano, la decisión fue no
  solo tapar ese hueco sino **migrar los cuatro repositorios a Apache 2.0**:
  - `letiende.co`: tenía MIT real — `LICENSE` reemplazado por el texto canónico de
    `apache.org/licenses/LICENSE-2.0.txt`, verificado línea por línea contra el `LICENSE` real de
    Ágora (mismo formato, sin encabezado de copyright agregado).
  - Ágora: **ya tenía Apache 2.0 como archivo real** desde antes — solo el badge decía "MIT", una
    inconsistencia conocida desde T-0002/§7 que nunca se había corregido por estar fuera de alcance
    en ese momento. Se corrigió aquí (`agora-letiende#66`, solo el badge, el archivo no se tocó).
  - Babel y Comandante: reemplazo/creación del `LICENSE`, como commits adicionales sobre los PR de
    la primera ronda (`#122`/`#23`) ya abiertos — no ramas nuevas.

  **Hallazgo aparte, ajeno a esta tarea, verificado y no tocado:** Comandante tenía una prueba que ya
  fallaba antes de este cambio (`app.component.spec.ts`, error de importación ESM en `@ionic/core`)
  — confirmado con `git stash`/`stash pop` que fallaba igual sin las modificaciones de esta tarea, así
  que se dejó tal cual, sin arreglarlo de paso ni ocultarlo.

  Los cuatro repos verificaron build/test/lint (donde existiera) antes de cada PR — ninguno afecta el
  artefacto construido (`README`/`LICENSE` no entran en ningún `assets`/`fileReplacements`).

- **T-0017** — [INFRA] Cutover real (T-15): ejecución, verificación y cierre de OBJ-5. Ejecutada
  04/09/2026 — **entrada de cierre escrita hoy, 07/09/2026**, tres días después: el trabajo se hizo y
  quedó en el historial de `git` (commits y PRs reales), pero nadie actualizó `TODO.md`/`MEMORY.md`
  para reflejar que había terminado. Encontrado al preparar el roadmap de optimización del ecosistema
  (`docs/optimizacion-aplicaciones.md`), verificado contra la cuenta real de AWS antes de escribir esta
  entrada — no contra lo que decía la documentación.

  **Reconstrucción de la secuencia real, con evidencia:**
  1. PR **#28** (`infra/prepara-cutover-t15`, fusionado 04/09/2026 22:39) — la preparación de T-0016.
  2. **Cutover ejecutado** (paso manual del runbook, fuera de `serverless.yml` por diseño — ADR-006):
     Route 53 movió `letiende.co`/`www.letiende.co` de la distribución vieja (`E33QAN86FY24JZ`, ya sin
     alias) a la nueva de producción (`ER22S2WADMM83`). Confirmado hoy con `cloudfront ListDistributions`
     y `route53 ListResourceRecordSets` reales — ambos registros `A` apuntan a
     `d1o48r8wylv3sh.cloudfront.net`, la distribución nueva.
  3. PR **#29** (`fix/robots-txt-host-real-produccion`, fusionado 04/09/2026 23:12) — **incidente real
     de producción, encontrado en la verificación posterior al cutover**: `https://letiende.co/robots.txt`
     respondía `Disallow: /` con el dominio real ya apuntando a este stack, bloqueando la indexación de
     Google. Causa: `AllViewerExceptHostHeader` nunca reenvía el `Host` real, ni siquiera en el
     `DefaultCacheBehavior` propio del contenedor — el fix de `x-le-tiende-host`
     (`FuncionInyectarHostVisitante`) solo se había asociado a `/cartelera/*` y `/libros/*` (T-0013/
     T-0014), nunca al comportamiento por defecto. Nunca se detectó antes porque nunca hubo un dominio
     real apuntando a este stack hasta el cutover mismo. Corregido asociando la misma función también al
     `DefaultCacheBehavior` y haciendo que `/robots.txt` lea `x-le-tiende-host` en vez de
     `req.hostname`.
  4. PR **#30** (`chore/registra-esfuerzo-restauracion-cross-domain`, fusionado 04/09/2026 23:38) —
     siguiendo lo que ya avisaba `tech-specs.md` §7.2 (hallazgo 5 de T-0013/T-0014): con el cutover
     verificado en vivo, se restauró la redirección cross-domain de Ágora y Babel hacia
     `letiende.co/cartelera|libros` (código real en `agora-letiende#65` y `babel-letiende#120`,
     coordinado desde este repositorio).

  **Por qué la documentación quedó desactualizada:** los PRs #29 y #30 sí registraron el trabajo real
  (incluido, en #29, decir explícitamente "tras el cutover" en el propio mensaje de commit), pero
  ninguno actualizó el bloque activo de `TODO.md` ni `MEMORY.md` §1 para marcar T-15/T-16 como
  completas — el motor JIT se quedó apuntando a un estado de tres días atrás hasta esta corrección.
  **Lección para sesiones futuras:** cerrar el código de una tarea no es lo mismo que cerrar la tarea
  en el motor JIT — falta siempre el último paso de actualizar `TODO.md`/`MEMORY.md` antes de terminar
  la sesión, incluso si el trabajo real ya quedó bien hecho y bien commiteado.

  Con esto, el objetivo de etapa 1 **OBJ-5** (`PRD.md` §6) queda formalmente cerrado.

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

El roadmap original de `tech-specs.md` §11 (T-1 a T-15) está **completo** — OBJ-5 (`PRD.md` §6) cerrado
con T-0017. Las 2 tareas activas de hoy (T-0018/T-0019) salen de una cola distinta, la de
mantenimiento: `docs/optimizacion-aplicaciones.md` §4, 17 tareas ordenadas de menor a mayor esfuerzo
(OPT-1 a OPT-17), con su propia tabla de seguimiento en §5 de ese documento. Consultar ese archivo para
calcular la siguiente pareja de tareas activas, no este.

Cuando ese roadmap también se agote, la siguiente cola es la etapa 2 del producto (no empieza antes):
carta del café bar (F-8, depende de Comandante) y actualización de la interfaz de datos heredada (F-9,
`letiende-api`, ADR-007 — pendiente averiguar quién la consume).
