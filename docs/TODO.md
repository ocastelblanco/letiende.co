# TODO.md — letiende.co

**Motor JIT: siempre exactamente 2 tareas activas.** Ni una más.
Al completar una, se elimina de aquí, se mueve al historial y se calcula la siguiente más prioritaria
comparando `PRD.md` contra `MEMORY.md`.

Criterio de prioridad: (1) seguridad activa en producción, (2) roadmap de prioridad alta,
(3) roadmap de prioridad media.

---

## Tarea T-0001 — [FEATURE] Andamiaje de la aplicación Angular 22 con SSR y Tailwind 4

**Origen:** PRD §6, prioridad alta (F-1 a F-7 dependen de esto) · `tech-specs.md` §11, T-1

**Archivos:**

- Generados por el CLI: `src/`, `angular.json`, `package.json`, `tsconfig*.json`
- Editados a mano: `src/styles.css`, `angular.json`, `.postcssrc.json`

**Qué hacer:**

1. Generar la aplicación en el directorio actual, que ya es un repositorio git con archivos:

   ```bash
   npx @angular/cli@22 new letiende-co --directory . --ssr --style=css \
       --package-manager=npm --skip-git --zoneless
   ```

   Si el CLI se niega por el contenido existente, generar en un directorio temporal y mover lo
   generado, **sin pisar** `CLAUDE.md`, `AGENTS.md`, `docs/`, `metrics/`, `.gitignore` ni `.claude/`.

2. Fijar `typescript` en `~6.0.x` en `package.json`. **No dejar 7.x**: Angular 22 aún no la soporta
   (`MEMORY.md` §4).

3. Instalar y configurar Tailwind 4:

   ```bash
   npm i -D tailwindcss @tailwindcss/postcss postcss
   ```

   Crear `.postcssrc.json` con `{ "plugins": { "@tailwindcss/postcss": {} } }` y escribir en
   `src/styles.css` el `@import "tailwindcss"` y el bloque `@theme` **con los valores exactos de
   `DESIGN.md` §1**. No crear `tailwind.config.js`.

4. En `angular.json`, dentro del target `test`, agregar `"options": { "isolate": true }`.
   Sin eso las pruebas fallan según el orden de ejecución (`MEMORY.md` §7).

5. Cargar Poppins en `src/index.html` con `preconnect` a `fonts.gstatic.com` y `display=swap`.

6. Agregar los alias de rutas de `tech-specs.md` §3 a `tsconfig.json`.

7. Verificar que el runtime local sea Node 24.x. Hoy la máquina tiene v22.23.2.

**Definition of done:**

- [ ] `npm run build -- --configuration=production` termina sin errores y genera salida de servidor
- [ ] `npm run serve:ssr` levanta y `curl -s localhost:4000 | grep -q "<app-root"` encuentra HTML ya
      renderizado (no una cáscara vacía)
- [ ] `npm test -- --watch=false` pasa
- [ ] Una clase `bg-primary` en una plantilla produce el color `#230C00` en el navegador
- [ ] `npx tsc --noEmit` no reporta errores
- [ ] `docs/MEMORY.md` §4 actualizado con las versiones **realmente instaladas**, leídas de
      `package-lock.json`, no de memoria

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

## Historial

*(vacío — no se ha completado ninguna tarea todavía)*

---

## Cola priorizada (no son tareas activas — referencia para calcular la siguiente)

En orden, según `tech-specs.md` §11:

1. **T-3** Barra de navegación y pie de página comunes
2. **T-10** Pruebas y ganchos de pre-commit
3. **T-4** Portada con próximos eventos
4. **T-5** Páginas institucionales
5. **T-8** `serverless.yml` del contenedor
6. **T-6** Capa de SEO/AEO
7. **T-7** Lambda de contacto con SES y antiabuso
8. **T-9** CI/CD con GitHub Actions
9. **T-13** Certificados ACM, distribuciones de CloudFront y `staging.letiende.co`
10. **T-11 / T-12** Cambios en Ágora y en Babel — **después** de T-13
11. **T-14 → T-15** Redirecciones 301 y cutover

> El orden de T-13 frente a T-11/T-12 no es arbitrario: el `--base-href /cartelera/` de Ágora solo se
> puede validar detrás de un CloudFront, y desde ADR-002 existe uno en staging para hacerlo.
