# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

## Tarea T-0002 — [DOCS] `README.md` en inglés y `README.es.md` en español

**Origen:** Requisito explícito del planteamiento · `tech-specs.md` §11, T-2
**Independiente de T-0001:** todo su contenido sale del PRD, de tech-specs y de `CLAUDE.md` §3.

**Archivos:** `README.md`, `README.es.md`, `LICENSE`

**Qué hacer:**

1. Seguir la estructura de `/slim-readme`, tomando como referencia de tono y estructura el
   `README.es.md` de Babel (`~/Documents/LeTiende/letiende.co/babel/README.es.md`).

2. Insignias según `/slim-badges`, en la línea de las de Babel: estado, licencia, SLIM, Angular 22,
   AWS, Serverless, y la insignia de autoría que corresponda al reparto real de esfuerzo — que sale
   de `metrics/`, **no de una estimación**.

3. Secciones mínimas: qué es y qué problema resuelve, estado del proyecto, stack, arranque rápido,
   arquitectura en una frase con enlace a `tech-specs.md`, cómo contribuir, licencia, soporte.

4. Enlace recíproco entre las dos versiones, con insignia de idioma como hace Babel.

5. Explicar la arquitectura de proxy en dos frases. Es lo primero que confunde a quien llega nuevo:
   hay que decir de entrada que la cartelera y el catálogo **no viven en este repositorio**.

6. `LICENSE`: copiar el de Ágora (MIT), verificando titular y año.

**Definition of done:**

- [ ] Los dos archivos existen y cada uno enlaza al otro
- [ ] Todos los enlaces internos resuelven (`docs/PRD.md`, `docs/tech-specs.md`, `LICENSE`)
- [ ] Todas las insignias renderizan (ninguna con URL rota)
- [ ] Los comandos de la sección de arranque coinciden con los de `CLAUDE.md` §3
- [ ] Ninguna insignia afirma una cifra de esfuerzo que no salga de `metrics/`

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

---

## Cola priorizada (no son tareas activas — referencia para calcular la siguiente)

En orden, según `tech-specs.md` §11:

1. **T-10** Pruebas y ganchos de pre-commit
2. **T-4** Portada con próximos eventos
3. **T-5** Páginas institucionales
4. **T-8** `serverless.yml` del contenedor
5. **T-6** Capa de SEO/AEO
6. **T-7** Lambda de contacto con SES y antiabuso
7. **T-9** CI/CD con GitHub Actions
8. **T-13** Certificados ACM, distribuciones de CloudFront y `staging.letiende.co`
9. **T-11 / T-12** Cambios en Ágora y en Babel — **después** de T-13
10. **T-14 → T-15** Redirecciones 301 y cutover

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
