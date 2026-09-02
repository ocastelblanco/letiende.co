# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

## Tarea T-0004 — [FEATURE] Pruebas continuas: ESLint, `tsc` y ganchos de pre-commit

**Origen:** Requisito explícito del planteamiento (`/slim-continuous-testing`) · `tech-specs.md` §10,
§11 T-10

**Archivos:**

- `eslint.config.js` (nuevo)
- `package.json` (scripts `lint`, `format`, dependencias de dev)
- `.husky/pre-commit` (nuevo)
- `.lintstagedrc.json` o bloque `lint-staged` en `package.json`

**Qué hacer:**

1. Instalar y configurar ESLint con `angular-eslint`, siguiendo `/slim-continuous-testing`, con las
   reglas de `CLAUDE.md` §4 activas donde el linter pueda exigirlas (nada de `any`, sin `*ngIf`).

2. `npm run lint` y `npm run format` como scripts reales en `package.json` — hoy `CLAUDE.md` §3 los
   documenta pero no existen todavía; esta tarea los crea.

3. Ganchos de pre-commit con `husky` + `lint-staged`: `tsc --noEmit`, `eslint --fix` y `prettier
   --write` sobre los archivos en stage, más un escaneo de secretos (`detect-secrets` o equivalente,
   `tech-specs.md` §10) antes de cada commit.

4. **No** intentar aquí la cobertura del 80%, el humo contra `/api/salud` ni Lighthouse CI
   (`tech-specs.md` §10): no hay páginas propias todavía (T-4/T-5) ni CI (T-9) para correrlos. Esta
   tarea deja el terreno listo para que T-9 los enchufe.

**Definition of done:**

- [ ] `npm run lint` corre sin errores sobre el andamiaje actual
- [ ] Un commit con un error de lint o de `tsc` es rechazado por el gancho de pre-commit; corregido,
      el commit pasa
- [ ] `npm run build -- --configuration=production` sigue pasando sin errores
- [ ] `docs/MEMORY.md` actualizado con las herramientas y versiones realmente instaladas

---

## Tarea T-0003 — [FEATURE] Barra de navegación y pie de página comunes

**Origen:** PRD §5 F-2, prioridad alta · `tech-specs.md` §11, T-3 · `DESIGN.md` §7

**Alcance de esta tarea:** solo la implementación de **este** repositorio. Replicarla en Ágora y en
Babel es T-11/T-12, que van **después** de T-13 (ADR-002) — no adelantar esa parte aquí.

**Archivos:**

- `src/app/shared/navegacion/barra-navegacion.ts` (+ `.html`, `.spec.ts`)
- `src/app/shared/navegacion/pie-pagina.ts` (+ `.html`, `.spec.ts`)
- `src/app/app.html` (monta la barra y el pie alrededor de `<router-outlet>`)

**Qué hacer:**

1. Implementar `BarraNavegacion` siguiendo el marcado exacto de `DESIGN.md` §7: `<header
   class="sticky top-0 z-50 bg-primary text-neutral">`, logo enlazado a `/`, lista de enlaces
   (Cartelera → `/cartelera`, Librería → `/libros`, Nosotros → `/nosotros`, Contacto → `/contacto`).
   Los dos primeros son `<a href>` normales (**no** `routerLink`: apuntan fuera del router de este
   proyecto, `DESIGN.md` §7); los dos institucionales sí usan `routerLink` con `routerLinkActive`
   para el estado `text-secondary`.

2. Colapso en celular: un botón de menú por debajo del punto de quiebre, panel `bg-primary` a
   pantalla completa. Cierra con `Escape` y devuelve el foco al botón que lo abrió — usar
   `signal` + `@if` para el estado abierto/cerrado, sin librería de menú.

3. Implementar `PiePagina`: dirección, horarios, redes — el contenido exacto se completa en T-5
   (páginas institucionales); por ahora placeholders de texto, no vacío.

4. Montar ambos en `src/app/app.html`, envolviendo el `<router-outlet>` ya existente del andamiaje
   de T-0001. Quitar el marcador temporal "Andamiaje listo" que dejó T-0001.

5. Ambos componentes: `standalone` implícito, `ChangeDetectionStrategy.OnPush`, `inject()` para
   cualquier dependencia, cero `*ngIf`/`*ngFor` (usar `@if`/`@for`), nombres de archivo y de clase
   en español (`CLAUDE.md` §4).

**Definition of done:**

- [ ] `npm run build -- --configuration=production` sin errores
- [ ] `npm test -- --watch=false` pasa, con al menos una prueba por componente que verifique el
      enlace activo y la apertura/cierre del menú móvil
- [ ] Navegar a `/nosotros` y `/contacto` (aunque las páginas aún no existan, con rutas placeholder
      si hace falta) marca el enlace correspondiente con `text-secondary`
- [ ] Los enlaces a `/cartelera` y `/libros` son `<a href>`, verificable en el HTML renderizado —
      no aparecen en el árbol de rutas de Angular
- [ ] En una ventana angosta, `Tab` hasta el botón de menú, `Enter` lo abre, `Escape` lo cierra y el
      foco vuelve al botón — verificar manualmente, no hay runner de accesibilidad en el repo todavía
- [ ] `npx tsc --noEmit` no reporta errores

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

---

## Cola priorizada (no son tareas activas — referencia para calcular la siguiente)

En orden, según `tech-specs.md` §11:

1. **T-4** Portada con próximos eventos
2. **T-5** Páginas institucionales
3. **T-8** `serverless.yml` del contenedor
4. **T-6** Capa de SEO/AEO
5. **T-7** Lambda de contacto con SES y antiabuso
6. **T-9** CI/CD con GitHub Actions
7. **T-13** Certificados ACM, distribuciones de CloudFront y `staging.letiende.co`
8. **T-11 / T-12** Cambios en Ágora y en Babel — **después** de T-13
9. **T-14 → T-15** Redirecciones 301 y cutover

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
