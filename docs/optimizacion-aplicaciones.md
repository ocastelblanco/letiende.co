# Optimización del ecosistema Le Tiende

Roadmap de deuda técnica **entre los cuatro repositorios** de Le Tiende — `letiende.co`, `agora-letiende`,
`babel-letiende` y `comandante` — creado el 07/09/2026 a partir de evidencia real (cuatro reportes de
Lighthouse contra producción y la comparación directa de los cuatro `README`), no de opinión.

**Por qué vive en `letiende.co` y no en cada repo por separado.** Ninguno de los cuatro tiene un lugar
único para rastrear trabajo que los toca a todos. `letiende.co` es el contenedor que ya unifica el
dominio, el menú y la capa de SEO/AEO de los tres servicios (ADR-001) — es el candidato natural para
también ser el punto único de seguimiento de este roadmap, aunque **la implementación real de cada
tarea ocurre en el repositorio dueño del código**, siguiendo el `CLAUDE.md` y el git flow de *ese*
repositorio, no los de este. Ver «Protocolo de coordinación» más abajo.

Este documento es el nivel de detalle completo. `docs/TODO.md` solo referencia, en cada momento, cuáles
de estas tareas son las 2 activas del motor JIT — mismo criterio que el resto del roadmap propio de este
repositorio (`tech-specs.md` §11).

---

## 1. Protocolo de despliegue seguro

Los cuatro sitios están **en producción real**, con tráfico real. Ninguna tarea de este roadmap se
implementa fuera de estas reglas:

1. **Nunca se toca un repositorio hermano sin leer primero su propio `CLAUDE.md`.** Cada uno puede tener
   convenciones ligeramente distintas (nombres de rama, comandos de verificación, plantilla de PR).
2. **El flujo de cada repo es el suyo, no el de `letiende.co`.** PR → `staging` (automático) → `main`
   despliega a producción (automático) — verificado que los cuatro repos siguen este mismo patrón
   (`tech-specs.md` §7.1 de cada uno).
3. **Un PR por tarea, por repositorio.** Nunca agrupar varios hallazgos sin relación en un mismo
   despliegue — si algo sale mal, el rollback tiene que ser acotado.
4. **Nada se despliega a producción manualmente desde una máquina local.** `serverless deploy` (o
   equivalente) sale siempre de CI, con trazabilidad — mismo criterio que `CLAUDE.md` §6 de este repo.
5. **Verificar en `staging` antes de fusionar, cuando el hallazgo se pueda reproducir ahí.** No todo se
   puede: este mismo repositorio ya documentó dos casos reales donde `staging` no basta (GA4 solo carga
   en el host de producción; el CSP del *event replay* de Angular solo se pudo confirmar contra
   `letiende.co` real). Si una tarea cae en ese caso, decirlo explícitamente antes de darla por cerrada.
6. **Volver a correr Lighthouse después de cada fix de rendimiento/SEO/accesibilidad**, contra la URL
   real de producción, para cerrar el ciclo con una medición nueva — no asumir que el cambio funcionó
   porque el código "se ve bien". Los cuatro reportes base de este roadmap quedan en
   `../fuentes/ReportesLighthouse/` (fuera de control de versiones de este repo) como referencia de
   "antes".
7. **Registrar el esfuerzo** de cada tarea cerrada con `/ai-effort-tracking capture` en `letiende.co`
   (aquí vive el registro unificado), referenciando el `trace_id` (`T-NNNN`) que le corresponda en
   `docs/TODO.md` — igual que cualquier otra tarea de este repositorio.

## 2. Protocolo de coordinación con los repos hermanos

- Cada repositorio hermano lleva su **propio** `docs/TODO.md`/motor JIT para su propio roadmap de
  producto. Cuando una tarea de este documento empieza a ejecutarse en, por ejemplo, `babel-letiende`,
  esa tarea también debe entrar al `TODO.md` **de Babel**, con su propio identificador, y llevar en su
  descripción una referencia de vuelta a este archivo (`letiende.co/docs/optimizacion-aplicaciones.md
  #OPT-NN`) — así cualquiera que abra el repo de Babel entiende de dónde salió la tarea sin tener que
  conocer este repositorio primero.
- La tabla de seguimiento (§5) es la fuente de verdad de **qué está pendiente, en curso o cerrado**
  entre los cuatro repos. Se actualiza cada vez que una tarea cambia de estado, no solo al final.
- Si una tarea revela un hallazgo que cambia el diagnóstico (como ya pasó hoy dos veces en este mismo
  repositorio con el CSP), se corrige aquí y se dice explícitamente qué se creía antes y qué se verificó
  después — mismo estándar que las ADRs de `MEMORY.md`.

## 3. Puntajes base (Lighthouse, 07/09/2026)

| Proyecto | URL auditada | Rendimiento | Accesibilidad | Buenas prácticas | SEO | Agentic browsing |
|---|---|---|---|---|---|---|
| `letiende.co` | `/` | 70 | 100 | 100 | 100 | 100 |
| Ágora | `/cartelera/` | 72 | 98 | 77 | 92 | 100 |
| Babel | `/libros/` | **38** | 90 | 77 | 83 | **32** |
| Comandante | `/admin/dashboard` | 67 | 94 | 77 | 83 | 67 |

Babel es, con diferencia, el que más necesita atención — y no por sorpresa: su tiempo de respuesta del
servidor en `/libros/` es de **8.930 ms**, medido por Lighthouse el mismo día que este repositorio subió
el `timeout` de la Lambda `ssr` de Babel de 10s a 25s para evitar el 500 intermitente que reportó el
humano (`babel-letiende` PR #121). Ese fix le dio más presupuesto de tiempo al mismo `Scan` lento — no
lo hizo más rápido. Ver OPT-17.

## 4. Backlog completo, de menor a mayor esfuerzo

Niveles de esfuerzo: **XS** (minutos, una línea o un archivo de contenido) · **S** (menos de una hora,
un componente o un flag de build) · **M** (horas, varios archivos dentro de un repositorio) · **L** (un
día o más, rediseño acotado a un flujo) · **XL** (días, cambio de arquitectura).

### XS

| ID | Tarea | Repos | Evidencia |
|---|---|---|---|
| OPT-1 | Agregar `<meta name="description">` | Ágora, Babel, Comandante | Lighthouse SEO: "Document does not have a meta description". `letiende.co` ya lo resuelve con `MetaService` — mismo patrón replicable. |
| OPT-2 | Corregir sintaxis de `robots.txt` | Babel, Comandante | Comandante: 16 errores reportados por el validador de Lighthouse. Babel: "no válido", sin detalle — revisar con el mismo validador antes de tocarlo. |
| OPT-3 | Crear `llms.txt` | Babel, Comandante | Categoría "agentic-browsing" lo exige — es la que más pesa en el puntaje de 32/100 de Babel. |
| OPT-4 | Agregar insignias `License`, `SLIM` y autoría IA (nivel a verificar por repo, no copiar el de `letiende.co`) | Babel, Comandante | Ya usan el mismo estilo `flat-square` y ya son bilingües (`README.md`/`README.es.md`) — solo faltan estas tres para calzar con el set de `letiende.co`. Sin riesgo de despliegue: el `README` no forma parte del artefacto construido. |
| OPT-5 | Agregar landmark `<main>` | Ágora | Único hallazgo de accesibilidad de Ágora: "Document does not have a main landmark". |
| OPT-18 | Migrar los cuatro repositorios a licencia Apache 2.0 | `letiende.co`, Ágora, Babel, Comandante | Surgió al ejecutar OPT-4: el ejecutor encontró que **Comandante no tiene ningún archivo `LICENSE`** (ni en el repo, ni en `package.json`, ni en el historial de git — hallazgo real, no de la prosa del README). Consultado el humano, decisión explícita (07/09/2026): unificar los cuatro en Apache 2.0, no solo tapar el hueco de Comandante. Efecto por repo: `letiende.co` y Babel tenían MIT real — cambia el archivo y el badge; Ágora **ya tenía Apache 2.0 como archivo real, pero el badge decía MIT** (inconsistencia conocida desde `docs/TODO.md` T-0002, nunca corregida por estar fuera de alcance de esa tarea — se corrige aquí) — solo hace falta arreglar el badge; Comandante no tenía nada — se agrega el archivo y el badge por primera vez. |

### S

| ID | Tarea | Repos | Evidencia |
|---|---|---|---|
| OPT-6 | Corregir contraste de color (WCAG) | Babel, Comandante | "Background and foreground colors do not have a sufficient contrast ratio" — real, no cosmético. Revisar contra los tokens compartidos de `DESIGN.md`. |
| OPT-7 | Agregar `width`/`height` explícitos a imágenes | `letiende.co`, Ágora, Babel, Comandante | Evita *layout shift* durante la carga — mismo hallazgo en los cuatro. |
| OPT-8 | Activar `sourceMap` en el build de producción | Babel, Comandante | "Missing source maps for large first-party JavaScript" — un flag en `angular.json`, sin efecto en runtime, solo en el tamaño del artefacto de despliegue (evaluar impacto en el límite de tamaño de Lambda antes de fusionar). |
| OPT-9 | Revisar el panel "Issues" de Chrome DevTools | Ágora, Babel, Comandante | Lighthouse solo confirma que hay algo registrado ahí — hace falta abrirlo a mano para saber qué es (deprecaciones, *quirks*) antes de decidir el arreglo. |
| OPT-10 | Auditar las cookies de terceros | Ágora, Babel, Comandante | Mismo número exacto (53) en los tres — probablemente Firebase Auth. Confirmar la fuente real y documentar como aceptado si es requisito de autenticación; no perseguir un falso positivo. |
| OPT-19 | Corregir el fallo de prueba por resolución ESM de `@ionic/core` | Comandante | `app.component.spec.ts` falla con `Directory import '@ionic/core/components' is not supported` — verificado tres veces (T-0018/OPT-18, T-0021/OPT-2) con `git stash`/`stash pop` que es preexistente y ajeno a esos cambios, nunca convertido en tarea propia hasta que el humano lo pidió explícitamente (07/09/2026). Rompe la señal de CI: una suite roja hace que cualquier fallo real futuro pase desapercibido entre el ruido. Investigar antes de tocar nada: es un problema de resolución de módulos ESM del *test runner* (Vitest/Karma, revisar cuál usa este repo) contra el paquete `@ionic/core`, probablemente config de resolución (`moduleNameMapper`/`deps.optimizer`/`transformIgnorePatterns`, según el runner) o versión de `@ionic/core` que cambió su punto de entrada — no asumir la causa sin verificarla contra el error real. |

### M

| ID | Tarea | Repos | Evidencia |
|---|---|---|---|
| OPT-11 | Reescribir el `README` de Ágora al estilo bilingüe | Ágora | Hoy es un único `README.md` en español, insignias sin `flat-square`. Necesita: traducir a inglés como `README.md`, mover el contenido actual a `README.es.md`, alinear insignias — la tarea de README más grande de las cuatro. |
| OPT-12 | `Cache-Control` eficiente en CloudFront para activos estáticos | `letiende.co`, Ágora, Babel, Comandante | `cache-insight`: hasta 4.737 KiB de ahorro potencial en Ágora, 3.834 KiB en `letiende.co`. Mismo patrón de `ResponseHeadersPolicy`/`CacheBehavior` en los cuatro `serverless.yml`. |
| OPT-13 | Investigar el origen de los 309 KiB de JS sin minificar | `letiende.co`, Ágora, Babel, Comandante | Mismo número exacto en los cuatro proyectos — huele a una sola dependencia compartida (¿Firebase SDK?) que, de confirmarse, se resuelve una vez y beneficia a los cuatro. |
| OPT-14 | Comprimir y servir imágenes en formato moderno | `letiende.co`, Ágora, Babel | `image-delivery-insight`: 3.987 KiB de ahorro en Ágora, 3.495 KiB en `letiende.co` (portadas de eventos sin comprimir, servidas directo desde el bucket `agora-activos-<stage>`) — WebP/AVIF + tamaños responsivos. |
| OPT-15 | *Lazy-load* de rutas para reducir JS sin usar | `letiende.co`, Ágora, Babel, Comandante | `unused-javascript`: 1.113 KiB en Babel, 617 KiB en Ágora, ~600 KiB en `letiende.co` y Comandante — revisar qué rutas cargan código que la vista actual no necesita. |

### L

| ID | Tarea | Repos | Evidencia |
|---|---|---|---|
| OPT-16 | Pase completo de rendimiento en el dashboard de Comandante | Comandante | LCP 5,5s, Speed Index 5,0s en `/admin/dashboard` — no hay un solo culpable como en Babel; es la suma de varios hallazgos M de arriba aplicados juntos a esa vista. Depende de haber cerrado OPT-7/12/13/15 primero. |
| OPT-20 | Servir los estáticos de Babel desde S3 + CloudFront, no desde el Lambda `ssr` | Babel | Surgió al ejecutar OPT-8 (T-0026, 08/09/2026): el `.js.map` del bundle principal (5,9 MB) hizo que `/libros/main-*.js.map` respondiera **500 real en producción** — `RequestEntityTooLarge`, límite de 6 MB de respuesta síncrona de Lambda (`server.ts` sirve `express.static` desde dentro del propio Lambda `ssr`). `sourceMap` quedó revertido (`babel-letiende#129`) hasta que exista esta tarea. Mismo patrón que `letiende-assets` de `letiende.co`, pero afecta también a cualquier estático futuro que crezca lo suficiente — no es exclusivo de los source maps. |

### XL

| ID | Tarea | Repos | Evidencia |
|---|---|---|---|
| OPT-17 | Sacar el catálogo público de Babel del `Scan` completo | Babel | 8.930 ms de respuesta del servidor en `/libros` — el mismo `Scan` paginado sobre 2.000+ libros que hoy solo ganó más tiempo de espera (`timeout` 10s→25s, PR babel-letiende#121). Arreglo real: paginar la vista, mover a una consulta por índice (GSI), o cachear el catálogo — no es una tarea de una tarde. Máxima prioridad de impacto de todo el roadmap, aunque sea la de mayor esfuerzo. |

## 5. Tabla de seguimiento

Se actualiza en cada sesión que toque una tarea de este roadmap — no solo al cerrarla.

| ID | Estado | `T-NNNN` en `TODO.md` | PR(s) | Notas |
|---|---|---|---|---|
| OPT-1 | **Completada** | T-0019 | agora-letiende#67, babel-letiende#123, comandante#24 | Comandante sin SSR ni servicio SEO propio (rutas protegidas por `authGuard`, Lighthouse audita sin sesión) — se optó por un `<meta>` estático en `index.html` en vez de construir un servicio dinámico innecesario |
| OPT-2 | **Completada** | T-0021 | babel-letiende#124, comandante#25 | Causa real en ambos: no existía ningún `robots.txt` — Babel caía en el catch-all SSR (HTML vacío, 200); Comandante servía el `index.html` completo vía el rewrite `**` de Firebase Hosting, cada línea contaba como directiva inválida (explica los "16 errores" exactos) |
| OPT-3 | **Completada** | T-0023 | babel-letiende#125, comandante#27 | Babel enlaza contenido público real; Comandante dice explícitamente que no tiene rutas públicas, sin inventar enlaces |
| OPT-4 | **Completada** | T-0018 | babel-letiende#122, comandante#23 | Autoría IA: Babel = AI-generated (79,2% agente, medido); Comandante sin badge (sin registro de esfuerzo propio que lo respalde) |
| OPT-5 | **Completada** | T-0020 | agora-letiende#68 | No existía ningún `<main>` en toda la app — envuelve el `router-outlet` |
| OPT-18 | **Completada** | T-0018 (ampliada) | letiende.co#35, agora-letiende#66, babel-letiende#122, comandante#23 | Comandante quedó con un fallo de prueba preexistente y ajeno a este cambio (`app.component.spec.ts`, error ESM de `@ionic/core`) — verificado con `git stash` que ya fallaba antes, no se tocó |
| OPT-6 | **Completada** | T-0024 | babel-letiende#126, comandante#28, letiende.co#40 | Fórmula real de contraste WCAG, no aproximada. Babel: `text-secondary` (3.37:1) → token nuevo `secondary-accesible` (5.12:1), solo en texto pequeño. Comandante: `text-espresso/{30,35,40,45}` (2.28–3.04:1) → `/{62,64,68,70}` (5.32–7.11:1), en los 4 archivos con el patrón, no solo el dashboard auditado. Verificado en producción real con `curl` contra el CSS compilado tras la fusión. Pendiente, no bloqueante: re-medición de Lighthouse. |
| OPT-7 | **Completada** | T-0025 | letiende.co#42, agora-letiende#69, babel-letiende#127, comandante#29 | Siempre el mismo elemento: el logo, sin `width`/`height`. Corregidas todas las instancias de cada repo (1/2/3/9), no solo la auditada — el resto de imágenes ya usa `aspect-ratio` explícito o ambas dimensiones fijas. Verificado en producción real con `curl` tras la fusión. |
| OPT-8 | **Completada, con incidente real en Babel ya resuelto** | T-0026 | comandante#30, babel-letiende#128 (causó 500 real), babel-letiende#129 (hotfix, revierte) | Babel: el `.js.map` principal pesa 5,9MB y el Lambda `ssr` lo sirve desde dentro de sí mismo — cruzó el límite de 6MB de respuesta síncrona de Lambda (distinto del límite de tamaño del zip, que sí se evaluó bien). Revertido y verificado en producción real. Habilitarlo de verdad exige OPT-20 (S3+CloudFront). Comandante sin este problema (Firebase Hosting), verificado en producción real. |
| OPT-9 | **Completada — sin PR, hallazgo documentado** | T-0027 | — | Único `issueType` en los tres: `Cookie`, apuntando a `apis.google.com/js/api.js` — misma causa que OPT-10. |
| OPT-10 | **Completada — sin PR, aceptado** | T-0028 | — | Las 53 cookies vienen de `apis.google.com/js/api.js` (`GoogleAuthProvider` de Firebase Auth, verificado en el código) y `books.google.com` (API de Google Books en Babel, funcionalidad real). Ninguna cookie propia evitable — aceptado, no falso positivo perseguido. |
| OPT-11 | **Completada** | T-0029 | agora-letiende#70 | Traducción fiel, sin el formato de caso de estudio de Babel/Comandante (`tracking.csv` de Ágora solo mide tiempo del agente, sin reparto humano/agente calculable). |
| OPT-12 | **Activa — PR abiertos, esperando fusión** | T-0030 | agora-letiende#71, comandante#31 | Causas distintas por repo, no un patrón único: Ágora/letiende.co comparten el bucket `agora-activos-production` (`CacheControl` en el `PutObjectCommand` firmado); Comandante son sus bundles JS/CSS (`firebase.json`); Babel no tiene ninguna causa fixeable aquí — 100% orígenes de terceros, sin PR. |
| OPT-13 | Pendiente | — | — | — |
| OPT-14 | Pendiente | — | — | — |
| OPT-15 | Pendiente | — | — | — |
| OPT-16 | Pendiente | — | — | Depende de OPT-7/12/13/15 |
| OPT-17 | Pendiente | — | — | Relacionado con babel-letiende#121 — máxima prioridad de impacto, pero deliberadamente no seleccionada como una de las 2 activas todavía: es la más grande del roadmap y este repositorio no toca código de Babel a la ligera. |
| OPT-20 | Pendiente | T-0026 (hallazgo) | babel-letiende#129 | Surgió del incidente real de OPT-8 en Babel — 500 en producción por el límite de respuesta de Lambda, no del tamaño del zip. |
| OPT-19 | **Completada** | T-0022 | comandante#26 | Causa real: `@ionic/angular@8.8.8` hace *directory import* de `@ionic/core/components`, Node ESM lo rechaza. Corregido con `patch-package` — vigilar en el próximo `ng update` que toque `@ionic/angular` |

## 6. Fuentes

- Cuatro reportes reales de Lighthouse contra producción, `../fuentes/ReportesLighthouse/`
  (07/09/2026, 11:12–11:46, fuera de control de versiones de este repositorio).
- Comparación directa de los cuatro `README.md`/`README.es.md` reales (no de memoria).
- Diagnóstico del timeout de `/libros` (mismo día, sesión anterior): `babel-letiende` PR #121,
  `letiende.co` `docs/MEMORY.md` (entrada del 07/09/2026 en §9).
