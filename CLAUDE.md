# CLAUDE.md — Instrucciones del proyecto letiende.co

Documento de arranque obligatorio para cualquier agente IA que trabaje en este repositorio.
`AGENTS.md` es un enlace simbólico a este archivo, para compatibilidad con otras herramientas.

**Documentos del proyecto**, todos en `docs/`:

| Archivo | Qué contiene | Cuándo leerlo |
|---|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Producto: visión, usuarios, objetivos, roadmap | Antes de proponer o priorizar una funcionalidad |
| [`docs/tech-specs.md`](docs/tech-specs.md) | Arquitectura, rutas, infraestructura, endpoints | Antes de escribir cualquier código |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Sistema de diseño: colores, tipografía, componentes | Antes de tocar una plantilla o una clase de Tailwind |
| [`docs/MEMORY.md`](docs/MEMORY.md) | Estado, ADRs, configuraciones vigentes, gotchas | Al inicio de cada sesión |
| [`docs/TODO.md`](docs/TODO.md) | Exactamente 2 tareas atómicas activas | Al inicio de cada sesión |

---

## 1. Descripción del proyecto

`letiende.co` es el **sitio principal** de Le Tiende, centro cultural en Bogotá, Colombia. No es una
aplicación nueva con lógica propia: es el **contenedor** que une, bajo un solo dominio y un solo menú,
las aplicaciones desacopladas que ya están en producción.

| Aplicación | Repositorio hermano | Qué aporta | Etapa |
|---|---|---|---|
| **Ágora** | `~/Documents/LeTiende/letiende.co/agora/` | Cartelera de eventos y compra de boletas | 1 |
| **Babel** | `~/Documents/LeTiende/letiende.co/babel/` | Catálogo de libros y su ubicación física | 1 |
| **Comandante** | `~/Documents/LeTiende/letiende.co/comandante/` | Lista de precios del café bar | 2 |

El contenedor aporta por sí mismo: la página de inicio, las páginas institucionales
(quiénes somos, contacto, ubicación), el menú superior común y la capa de SEO/AEO del dominio raíz.

**Regla que define la arquitectura:** el contenido de Ágora y Babel **no se reimplementa aquí**.
Se sirve por *proxy de ruta*, desde los mismos stacks SSR que ya están en producción. Si sientes la
tentación de reconstruir la cartelera o el catálogo en este repositorio, estás violando la decisión
fundacional del proyecto (ADR-001 en `docs/MEMORY.md`).

---

## 1-bis. Registro de esfuerzo

Este proyecto lleva un registro de esfuerzo y costo en `metrics/events/`,
un archivo JSONL por sesión, versionado en git.

**Al cerrar cualquier unidad de trabajo**, invoca `/ai-effort-tracking capture`.

Reglas no negociables:
- Nunca escribas tokens, costo, duraciones ni nivel de esfuerzo de memoria.
  Ejecuta siempre el adaptador de la superficie activa.
- Si un dato no se puede medir, escribe `null` y baja `capture_level`. No lo estimes.
- Los precios salen de `metrics/pricing.json`, jamás de tu conocimiento previo.
  Si el proveedor está `unverified`, deja `cost.usd` en `null`.
- `input_uncached` y `cache_read` son disjuntos; `thinking` va dentro de `output`.
- El registro es append-only y cada sesión escribe solo su archivo.
  Para corregir, emite un evento nuevo con `corrects`.
- Referencia siempre el `trace_id` de la tarea de `docs/TODO.md` (formato `T-NNNN`).

---

## 2. Stack tecnológico y versiones

Versiones verificadas contra el registro de npm el 01/09/2026. **No las cambies sin verificar**;
el criterio del proyecto es "última estable", no "la más nueva que exista".

| Capa | Tecnología | Versión | Por qué esa |
|---|---|---|---|
| Framework | Angular | `~22.1.x` | Última estable. Misma línea que Ágora y Babel |
| SSR | `@angular/ssr` | `~22.1.x` | Requisito duro: sin HTML server-rendered no hay SEO/AEO |
| Lenguaje | TypeScript | `~6.0.x` | La que soporta Angular 22. **No** 7.x: aún no está soportada |
| Estilos | Tailwind CSS | `^4.3.x` | Vía `@tailwindcss/postcss`, sin `tailwind.config.js` (v4 usa `@theme` en CSS) |
| Componentes | — | — | **Ninguna librería.** Solo Tailwind y HTML propio (ADR-004) |
| Pruebas | Vitest | `^4.x` | Vía el builder `@angular/build:unit-test`, con `isolate: true` |
| Runtime | Node.js | `24.x` en Lambda | El de todos los stacks de Le Tiende. **Local también debe ser 24.x** |
| IaC | Serverless Framework | `4.41.x` | Requiere `SERVERLESS_LICENSE_KEY` en CI |
| Cómputo | AWS Lambda + API Gateway (HTTP API) | — | Un solo stack por stage |
| CDN / ruteo | AWS CloudFront | — | Solo en producción. Es lo que hace posible el proxy de ruta |
| Correo | AWS SES | — | Formulario de contacto |
| CI/CD | GitHub Actions | — | PR → `staging`, merge a `main` → `production` |

**Lo que este proyecto NO tiene, a propósito:** base de datos propia, autenticación, roles, sesiones,
manejo de dinero. Todo eso vive en Ágora y en Babel. Si una tarea parece necesitar cualquiera de esas
cosas aquí, deténte y consúltalo antes de escribir código.

---

## 3. Comandos de uso común

```bash
npm start                              # servidor de desarrollo (ng serve)
npm run build -- --configuration=production   # build de producción con SSR
npm run serve:ssr                      # sirve el build SSR localmente
npm test                               # pruebas unitarias (Vitest)
npm run test -- --watch=false          # pruebas en modo CI
npm run lint                           # ESLint
npm run format                         # Prettier

npm run build:infra                    # build completo previo al despliegue
npx serverless package --stage staging # verifica la sintaxis de la infraestructura
npx serverless deploy --stage staging  # despliegue manual (normalmente lo hace CI)
```

---

## 4. Convenciones de código e idioma

**Idioma del proyecto: español colombiano.** Aplica a nombres de archivos, clases, variables, rutas,
comentarios, mensajes de commit y textos de interfaz. Las únicas excepciones son los identificadores
que impone un framework (`ngOnInit`, `canActivate`) y `README.md`, que existe también en inglés.

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case`, en español | `barra-navegacion.component.ts` |
| Clases | `PascalCase`, en español | `BarraNavegacionComponent` |
| Variables y funciones | `camelCase`, en español | `eventosProximos`, `cargarEventos()` |
| Rutas de la app | `kebab-case`, en español | `/nosotros`, `/contacto` |
| Constantes | `SCREAMING_SNAKE_CASE` | `MAXIMO_EVENTOS_INICIO` |

**Angular — reglas obligatorias de este proyecto:**

- Componentes *standalone*. **Nunca** escribas `standalone: true`: es el valor por defecto desde
  Angular 19 y ponerlo es ruido.
- `ChangeDetectionStrategy.OnPush` en todo componente, sin excepción.
- Estado con **signals** (`signal`, `computed`, `linkedSignal`, `resource`/`httpResource`).
  No uses `BehaviorSubject` para estado de componente.
- Inyección con `inject()`, nunca por constructor.
- Control de flujo nuevo en plantillas: `@if`, `@for`, `@switch`, `@defer`.
  **Nunca** `*ngIf`, `*ngFor`, `*ngSwitch`, ni `CommonModule`: importa el pipe puntual que necesites.
- `input()` / `output()` como funciones, no como decoradores.
- Aplicación *zoneless* (`provideZonelessChangeDetection()`).
- Formularios reactivos (`ReactiveFormsModule`); nunca `FormsModule` con `ngModel`.
- Nada de `any`. Si un tipo es desconocido, es `unknown` y se estrecha.

**Angular 22 — trampas de sintaxis verificadas en los repos hermanos:**

- No existe el cierre automático en `<button/>`: siempre `<button …></button>` (error NG5002).
- El carácter `@` en una plantilla se interpreta como bloque de control. Para escribir un literal
  como `@letiende_parkway`, usa la entidad HTML `&#64;`.

**Tailwind 4:** la configuración vive en `src/styles.css`, dentro de un bloque `@theme`.
No crees `tailwind.config.js`: en la versión 4 no es el mecanismo vigente.
Los valores de la paleta salen de `docs/DESIGN.md` y de ningún otro lado.

---

## 5. Seguridad (OWASP)

Este proyecto no autentica, no cobra y no guarda nada: su superficie de riesgo es pequeña **por
diseño**, no por descuido. Eso hace que las pocas superficies que sí existen merezcan atención
desproporcionada, porque son fáciles de pasar por alto justamente por ser pocas.

Las tres superficies reales son: **el formulario de contacto**, **el proxy de CloudFront** y
**el HTML que el servidor construye con datos de terceros**.

### A01 — Control de acceso roto

**Qué está en riesgo.** El proxy sirve *todo* lo que hay detrás de él: `/cartelera/admin`,
`/cartelera/login`, `/cartelera/puerta` y sus equivalentes de Babel quedan alcanzables desde `letiende.co`.

**Regla.** El proxy **no es un control de acceso y no debe usarse como tal.** Quien protege esas
rutas son los guards de Ágora y de Babel, que siguen aplicando igual. Nunca escribas aquí lógica que
"esconda" una ruta de otra aplicación: esconder no es proteger, y crearía la ilusión de que sí lo es.

**Regla.** Este repositorio no crea rutas administrativas propias. Si aparece la necesidad, no va
aquí (`docs/PRD.md` §9, D-4).

### A02 — Fallas criptográficas

**Qué está en riesgo.** `src/environments/*.ts` se compila **dentro del bundle del navegador**.
Cualquier valor puesto ahí es público, aunque el archivo se llame "environment".

**Regla.** En `environments/` solo van direcciones públicas. Ninguna llave, ningún token, ninguna
credencial, jamás — ni siquiera "temporalmente para probar". Los secretos viven en variables de
entorno de la Lambda (`docs/tech-specs.md` §9).

**Regla.** Solo HTTPS. CloudFront redirige HTTP a HTTPS y emite `Strict-Transport-Security`.

### A03 — Inyección y XSS

Tres vectores concretos, ninguno teórico:

**1. Inyección de encabezados de correo.** El formulario de contacto recibe `nombre` y `correo` y los
usa para armar un mensaje. Un salto de línea en esos campos permite inyectar encabezados y convertir
el formulario en un relé de spam a nombre de Le Tiende.

```ts
// server/api/handlers/contacto.ts
// Obligatorio antes de tocar SES: los campos que van a un encabezado no pueden
// contener saltos de línea, y el remitente lo fija el servidor, nunca el usuario.
const limpiar = (v: string) => v.replace(/[\r\n]/g, ' ').trim().slice(0, 200);
```

El `Source` de SES es **siempre** `process.env.SES_REMITENTE`. El correo de quien escribe va en
`ReplyToAddresses`, nunca en `Source`.

**2. JSON-LD.** Los datos estructurados se insertan en un `<script type="application/ld+json">`.
Si ahí se interpola el título de un evento que contenga `</script>`, se rompe el bloque y se ejecuta
lo que siga.

```ts
// Correcto: serializar y neutralizar el cierre de etiqueta.
const jsonLd = JSON.stringify(datos).replace(/</g, '\\u003c');
```

Nunca construyas el JSON-LD concatenando cadenas.

**3. Datos de terceros en la plantilla.** Angular escapa por defecto en interpolación.
**Prohibido** `[innerHTML]`, `bypassSecurityTrustHtml` y cualquier otro `bypassSecurityTrust*` sobre
contenido que venga de Ágora, de Babel o del visitante.

### A05 — Configuración incorrecta

**Regla — encabezados de respuesta.** CloudFront aplica, en todos los behaviors:
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` y `X-Frame-Options: SAMEORIGIN`.

**`Content-Security-Policy` solo en el `DefaultCacheBehavior`** (las páginas propias de este
contenedor: `/`, `/nosotros`, `/contacto`, `/preguntas-frecuentes`, etc.) — **no** en `/cartelera/*`
ni en `/libros/*`. Esas dos rutas sirven páginas renderizadas por Ágora y Babel, con dependencias
externas reales que este repositorio no audita (el checkout de `checkout.bold.co` de Ágora, que
mueve dinero real; Firebase Auth de ambos) — un CSP pensado solo para el contenedor podría romperlas
en silencio. Decisión explícita del humano (04/09/2026): cerrar el CSP de esas dos rutas es una
tarea aparte, coordinada con esos repos, no una extensión automática de esta.

**Orígenes que la CSP del contenedor debe permitir, y ningún otro:** Google Fonts
(`fonts.googleapis.com`/`fonts.gstatic.com`), el mapa embebido (`www.google.com`, iframe de
`/contacto`) y Google Analytics 4 (`www.googletagmanager.com` en `script-src`;
`google-analytics.com`/`analytics.google.com` en `connect-src` — GA4 es funcionalidad real, ADR-015,
sin esto se rompe en silencio apenas se active el CSP). El bucket de imágenes de eventos de Ágora
(`agora-activos-<stage>.s3.us-east-1.amazonaws.com`) va en `img-src`: la portada de este contenedor
muestra imágenes de eventos ajenas, cargadas directo desde ese bucket.

**Regla — la ruta comodín responde 404 de verdad.** Una página de "no encontrada" que devuelve
HTTP 200 hace que los buscadores indexen basura y es un problema de configuración, no de contenido.

**Regla — nada de `Host` hacia el origen** y nada de `OriginPath` en los behaviors del proxy
(`docs/tech-specs.md` §7.2). Equivocarlo produce 403 o un bucle de redirecciones.

**Regla — retención de logs siempre acotada** (`logRetentionInDays: 14`) y etiquetado obligatorio del
stack. Viene de un incidente real de costos, no de una preferencia.

### A07 — Fallas de identificación y autenticación

No hay autenticación, pero sí hay **un endpoint sin autenticar que gasta dinero y quema reputación**:
`POST /api/contacto` dispara un envío por SES. Sin freno, un script lo convierte en un generador de
correo a costa de Le Tiende, y la dirección del dominio termina en listas negras.

**Regla.** El endpoint de contacto no se despliega sin, como mínimo: campo trampa oculto
(*honeypot*), límite por dirección IP en una ventana de tiempo, y tope de longitud por campo.
Esto es parte de la definición de terminado de esa tarea, no una mejora posterior.

### A08 — Fallas de integridad del software y de los datos

**Regla.** Instalación reproducible: `npm ci` contra `package-lock.json`, nunca `npm install` en CI.

**Regla.** Nada de scripts desde CDN de terceros en `index.html`. Si alguna vez fuera inevitable,
va con `integrity` y `crossorigin`.

**Regla.** Los despliegues salen de GitHub Actions. Un `serverless deploy` a producción desde una
máquina local no deja rastro y puede llevar código que no está en `main`.

### A10 — Falsificación de peticiones del lado del servidor (SSRF)

**Qué está en riesgo.** El SSR hace una petición saliente para traer los próximos eventos. Una Lambda
que consulta una URL influida por el visitante es un SSRF con acceso a la red interna de AWS,
incluido el servicio de metadatos de la instancia.

**Regla.** La dirección del API de Ágora es una **constante del entorno del servidor**. Nunca se
arma con nada que venga del `Request`: ni de la query string, ni de un encabezado, ni de la ruta.
Si aparece la necesidad de una URL dinámica, se valida contra una lista blanca explícita.

### Datos personales (Ley 1581 de 2012 — Habeas Data)

El formulario de contacto recoge nombre y correo: son datos personales y aplica la ley colombiana.

- Casilla de **consentimiento explícito**, no marcada por defecto, con enlace a la política de
  tratamiento de datos. Sin ella marcada, el envío se rechaza en el servidor, no solo en el navegador.
- Los mensajes **no se almacenan**: se envían por correo y se acaban ahí. Lo que no se guarda no se
  filtra.
- Nunca escribas nombre, correo ni contenido del mensaje en los logs de CloudWatch.

### Prohibiciones absolutas en el código

| Prohibido | Por qué |
|---|---|
| Cualquier llave, token o credencial en `src/environments/*` | Se compila dentro del bundle del navegador |
| `Source` de SES tomado del cuerpo de la petición | Convierte el formulario en un relé de spam |
| `[innerHTML]` o `bypassSecurityTrust*` con datos de terceros | XSS directo |
| JSON-LD construido por concatenación de cadenas | Escape del bloque `<script>` |
| Desplegar `/api/contacto` sin honeypot ni límite de tasa | Abuso de SES a costa de Le Tiende |
| URL saliente del SSR armada con datos de la petición | SSRF |
| Ruta comodín que responde HTTP 200 | Indexación de páginas inexistentes |
| Escribir datos del formulario en los logs | Incumplimiento de la Ley 1581 |
| `npm install` en CI | Instalación no reproducible |
| Reimplementar la cartelera o el catálogo en este repositorio | Viola la decisión fundacional (ADR-001) |

---

## 6. Git Flow para agentes IA

Reglas **obligatorias** para cualquier agente que opere en este repositorio.
No hay excepción, ni siquiera si el usuario lo pide explícitamente.

### Ramas

La rama `main` está protegida y es la única de larga vida. **No hay rama `develop`**: mismo modelo de
Ágora y Babel. Ningún agente hace commits directos a `main`.

```
main ──●────────────────●──────────────►  producción (cada merge despliega)
        \              /
         ●───●───●────●   feature/lo-que-sea  (cada PR despliega a staging)
```

Prefijos válidos: `feature/`, `fix/`, `hotfix/`, `docs/`, `refactor/`, `chore/`.

### Protocolo obligatorio antes de cualquier cambio de código

**Paso 1 — Verificar la rama actual:**

```bash
git branch --show-current
```

Si el resultado es `main`, ejecutar el Paso 2. Si ya hay una rama de trabajo activa, ir al Paso 3.

**Paso 2 — Crear la rama:**

```bash
git checkout main
git pull origin main
git checkout -b feature/descripcion-corta-en-kebab-case
```

**Paso 3 — Cambios, verificación y commit:**

```bash
npm run build          # Si falla: NO commitear. Resolver primero.
npm test -- --watch=false
npm run lint

git add ruta/exacta/del/archivo.ts    # NUNCA git add . ni git add -A
git commit -m "tipo(alcance): descripción en español colombiano"
```

Tipos de commit: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`.

**Paso 4 — Pull Request:**

```bash
git push -u origin HEAD
gh pr create --base main --title "tipo(alcance): descripción breve" --body "$(cat <<'EOF'
## Cambios realizados
- …

## Cómo probar
- …

## Checklist
- [ ] Build pasa sin errores
- [ ] Pruebas pasan
- [ ] No hay secretos en el código
- [ ] Seguí las convenciones de CLAUDE.md
- [ ] Registré el esfuerzo con /ai-effort-tracking capture
EOF
)"
```

**Paso 5 — Tras la fusión:** verificar por CLI que el despliegue quedó bien, no asumirlo.
Para cualquier Lambda con variables de entorno nuevas:

```bash
aws lambda get-function-configuration \
  --function-name letiende-co-production-contacto \
  --query 'Environment.Variables' --output json
```

Un `${env:X, ''}` sin secreto resuelve a cadena vacía **sin fallar**: la función despliega bien y el
correo nunca llega. Es el fallo más caro de este stack porque no hace ruido.

### Prohibiciones absolutas de Git

| Acción prohibida | Por qué |
|---|---|
| `git push origin main` | Commit directo a producción |
| `git push --force` en cualquier rama | Destruye historial |
| `git merge` de cualquier PR | Solo humanos aprueban y fusionan |
| `--no-verify` en commit o push | Omite los ganchos de seguridad |
| `git add .` o `git add -A` | Puede arrastrar secretos o archivos no deseados |
| Commitear `.env`, `*.pem`, `serviceAccount*.json` | Exposición de credenciales |
| `serverless deploy --stage production` desde local | El despliegue sale de CI, con trazabilidad |

El agente **nunca** fusiona un PR, nunca aprueba su propio PR y nunca lo cierra sin fusionar.
