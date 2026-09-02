# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

## Tarea T-0006 — [FEATURE] Páginas institucionales: Nosotros y Contacto

**Origen:** PRD §5 F-5, F-6, prioridad alta · `tech-specs.md` §11, T-5

**Archivos:**

- `src/app/features/nosotros/nosotros.ts` (+ `.html`, `.spec.ts`)
- `src/app/features/contacto/contacto.ts` (+ `.html`, `.spec.ts`)
- `src/app/app.routes.ts` (`/nosotros` y `/contacto` dejan de apuntar a `PaginaPendiente`)

**Qué hacer:**

1. `NosotrosComponent`: contenido derivado **estrictamente** de `PRD.md` §2 y §3 — qué es Le Tiende,
   qué pasa ahí. No inventar hechos que no estén en `PRD.md`; si falta algo (una cifra, una fecha),
   se omite, no se completa a criterio propio.

2. `ContactoComponent`: formulario (nombre, correo, mensaje, casilla de consentimiento — `CLAUDE.md`
   §5, Ley 1581) más dirección, horarios y mapa. **Dirección y horarios van "por confirmar"**, igual
   que ya hace `PiePagina` (T-0003) — no inventar una dirección real.

   El formulario se construye completo (`ReactiveFormsModule`, validaciones, mensajes de error) pero
   **su envío no puede funcionar todavía**: `POST /api/contacto` es T-7, que no existe. Dejar el
   `(ngSubmit)` conectado a un método que hoy solo valida y deja evidencia clara en el propio
   componente (un `signal` de estado, no una llamada HTTP real) de que falta conectar el backend.

3. Reemplazar `PaginaPendiente` en ambas rutas de `app.routes.ts`. La ruta `''` (portada) sigue
   usando `PaginaPendiente` hasta T-0005 — no tocarla aquí.

4. Seguir el patrón de contenedor de `DESIGN.md` §3 (`max-w-3xl` para Nosotros, `max-w-lg` para el
   formulario de Contacto) y las clases de input/botón de `DESIGN.md` §5, §6.

**Definition of done:**

- [ ] `npm run build -- --configuration=production` sin errores
- [ ] `npm run lint` y `npx tsc --noEmit` sin errores
- [ ] `npm test -- --watch=false` pasa, con pruebas de validación del formulario (campo vacío,
      correo inválido, consentimiento no marcado — cada uno bloquea el envío)
- [ ] Ningún dato inventado: dirección, horarios y cualquier cifra no presente en `PRD.md` dicen
      explícitamente "por confirmar"
- [ ] El componente de Contacto deja evidencia visible (no silenciosa) de que el envío real todavía
      no está conectado

---

## Tarea T-0007 — [FEATURE] `serverless.yml` del contenedor (solo SSR)

**Origen:** `tech-specs.md` §11, T-8 · depende solo de T-1 (hecha)

**Alcance de esta tarea:** únicamente la función `ssr`. La función `contacto` es T-7 (todavía sin
handler real) — no crear un handler vacío aquí solo para llenar el archivo; T-7 agrega su propio
bloque cuando exista código real que desplegar.

**Archivos:**

- `serverless.yml` (nuevo, raíz del repo)
- `package.json` (script `build:infra`, hoy documentado en `CLAUDE.md` §3 pero inexistente)

**Qué hacer:**

1. Usar el `serverless.yml` de Ágora (`~/Documents/LeTiende/letiende.co/agora/serverless.yml`) como
   referencia de estructura — no copiarlo entero, este proyecto no tiene DynamoDB ni Firebase.
   Obligatorio de `tech-specs.md` §7.4 / `CLAUDE.md` §5: `logRetentionInDays: 14`, `stackTags` y
   `tags` con `Proyecto: letiende-co`, `deploymentBucket.maxPreviousDeploymentArtifacts: 5`.

2. Una sola función `ssr`, runtime `nodejs24.x`, con `@codegenie/serverless-express` envolviendo el
   `server.ts` ya generado por T-0001 — verificar si hace falta un adaptador Lambda nuevo o si el
   `server.mjs` que ya produce `ng build` sirve tal cual (Ágora usa un `server/ssr/handler.mjs`
   propio; revisar si Angular 22 lo simplificó).

3. HTTP API con ruta comodín `/{proxy+}` `ANY` hacia la función `ssr` — **sin** las rutas de
   `/cartelera/*` ni `/libros/*`: esas viven en CloudFront (T-13), no en este `serverless.yml`
   (`tech-specs.md` §7.2 — no confundir el proxy de CloudFront con las rutas de este API).

4. **No** definir todavía `staging.letiende.co` ni `letiende.co` como dominios propios de este API —
   eso es T-13. Este `serverless.yml` debe poder desplegarse con `npx serverless package --stage
   staging` sin fallar, aunque no tenga dominio ni CloudFront delante todavía.

5. `npm run build:infra` como script nuevo: `npm run build && npm run build:api` — no hay
   `server/api/` con lógica propia todavía (eso llega con T-7), así que por ahora es solo el build
   de Angular. Ajustar cuando T-7 agregue código de backend real.

**Definition of done:**

- [ ] `npx serverless package --stage staging` sin errores (no hace falta desplegar de verdad)
- [ ] `logRetentionInDays`, `stackTags`, `tags` y el tope de `deploymentBucket` presentes y
      verificables por lectura del YAML, no solo declarados
- [ ] `docs/MEMORY.md` actualizado con el nombre real del stack y cualquier decisión tomada sobre el
      adaptador Lambda del SSR

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

En orden, según `tech-specs.md` §11:

1. **T-6** Capa de SEO/AEO
2. **T-7** Lambda de contacto con SES y antiabuso
3. **T-9** CI/CD con GitHub Actions
4. **T-13** Certificados ACM, distribuciones de CloudFront y `staging.letiende.co`
5. **T-11 / T-12** Cambios en Ágora y en Babel — **después** de T-13
6. **T-14 → T-15** Redirecciones 301 y cutover
7. Preguntas frecuentes (PRD F-7, prioridad media — sin tarea de roadmap técnico dedicada todavía)

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
