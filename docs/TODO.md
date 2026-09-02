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

## Tarea T-0005 — [FEATURE] Portada con próximos eventos

**Origen:** PRD §5 F-1, prioridad alta · `tech-specs.md` §11, T-4 · `tech-specs.md` §4.3, §5

**Archivos:**

- `src/environments/environment.ts` y `src/environments/environment.production.ts` (nuevos)
- `src/app/core/api/eventos-publicos.service.ts` (+ `.spec.ts`)
- `src/app/features/inicio/inicio.ts` (+ `.html`, `.spec.ts`)
- `src/app/app.routes.ts` (la ruta `''` deja de apuntar a `PaginaPendiente`)

**Qué hacer:**

1. Crear `src/environments/` — no existe todavía (Angular 22 ya no lo genera por defecto). Cada
   archivo expone `urlBaseApiAgora`, **una dirección pública, nunca un secreto** (`CLAUDE.md` §5,
   A02):

   ```ts
   // environment.ts (desarrollo) y environment.production.ts — mismo valor de producción
   // en ambos hasta que exista un stage de staging real para Ágora con dominio propio.
   export const environment = {
     urlBaseApiAgora: 'https://agora.letiende.co',
   };
   ```

   Verificar contra `MEMORY.md` §5 antes de escribir el valor — **no asumirlo de memoria**. El de
   staging es `https://ttukw9i82m.execute-api.us-east-1.amazonaws.com` (Ágora no tiene dominio propio
   en staging todavía); decidir si vale la pena diferenciarlo aquí o esperar a que este mismo
   proyecto tenga su propio staging (ADR-002) antes de que la distinción importe.

2. Agregar el `fileReplacements` correspondiente en `angular.json` (`configurations.production`),
   como ya lo documenta `tech-specs.md` §3.

3. `EventosPublicosService` con `httpResource()` (`tech-specs.md` §4.1, §4.3) contra
   `${environment.urlBaseApiAgora}/api/eventos-publicos`, tipado con la interfaz
   `EventoEnCartelera` ya declarada en `tech-specs.md` §4.3 — copiarla tal cual, es un subconjunto
   deliberadamente parcial de lo que expone Ágora.

4. `InicioComponent`: muestra hasta 3 próximos eventos con `computed()` sobre el recurso, **con
   encadenamiento opcional obligatorio** (`datos()?.eventos ?? []`, nunca `datos().eventos` —
   `MEMORY.md` §6). Si Ágora no responde, la portada se renderiza igual, sin la sección de eventos
   — nunca falla entera (`tech-specs.md` §5).

5. Reemplazar la ruta `path: ''` en `app.routes.ts`: hoy apunta al placeholder `PaginaPendiente` de
   T-0003, pasa a apuntar a `InicioComponent`.

**Definition of done:**

- [ ] `npm run build -- --configuration=production` sin errores, con el `environment.production.ts`
      real inyectado (verificar que el bundle no contiene `ttukw9i82m` si el de producción no lo usa)
- [ ] Con la API de Ágora accesible, `/` muestra hasta 3 eventos reales
- [ ] Con la API de Ágora simulada como caída (mock que rechaza), `/` sigue respondiendo 200 con el
      resto de la portada, sin la sección de eventos y sin error no controlado
- [ ] `npm test -- --watch=false` pasa
- [ ] `npx tsc --noEmit` no reporta errores
- [ ] Ningún secreto ni credencial en `src/environments/*` — solo la URL pública

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

---

## Cola priorizada (no son tareas activas — referencia para calcular la siguiente)

En orden, según `tech-specs.md` §11:

1. **T-8** `serverless.yml` del contenedor
2. **T-6** Capa de SEO/AEO
3. **T-7** Lambda de contacto con SES y antiabuso
4. **T-9** CI/CD con GitHub Actions
5. **T-13** Certificados ACM, distribuciones de CloudFront y `staging.letiende.co`
6. **T-11 / T-12** Cambios en Ágora y en Babel — **después** de T-13
7. **T-14 → T-15** Redirecciones 301 y cutover
8. Preguntas frecuentes (PRD F-7, prioridad media — sin tarea de roadmap técnico dedicada todavía)

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
