# MEMORY.md — Memoria del proyecto letiende.co

Documento de rehidratación de estado. **Léelo al inicio de cada sesión.**
Se actualiza al cerrar cada sesión de trabajo relevante.

---

## 1. Estado actual

| | |
|---|---|
| **Versión** | 0.0.0 — andamiaje + barra/pie comunes + `README`/`LICENSE`. Todavía sin portada real ni páginas institucionales |
| **Fase** | T-0001, T-0002 y T-0003 fusionados a `main`; T-0004 y T-0005 activas |
| **Repositorio** | <https://github.com/ocastelblanco/letiende.co> |
| **Rama** | `feature/barra-navegacion-comun` (desde `main`) |
| **Producción** | `https://letiende.co` — todavía sirve el **sitio estático anterior**. Sin cambios: el andamiaje aún no se ha desplegado |
| **Staging** | No existe aún |
| **Última sesión** | 02/09/2026 — T-0003: barra de navegación y pie de página comunes, verificados en SSR real |

La rama `2025` sigue en el remoto con el intento anterior, abandonado.
No se toma nada de ella: el proyecto arranca desde cero por decisión explícita.

---

## 2. Funcionalidades

### Completadas

- [x] Definición del alcance de las etapas 1 y 2
- [x] Decisión de arquitectura de integración (ADR-001)
- [x] Documentación: `CLAUDE.md`, `PRD.md`, `tech-specs.md`, `DESIGN.md`, `MEMORY.md`, `TODO.md`
- [x] Registro de esfuerzo inicializado
- [x] Eliminación del sitio estático anterior (2025)
- [x] Andamiaje Angular 22 + SSR + Tailwind 4 (T-0001)
- [x] `node` global apuntando a v24, CLI de Angular global actualizado
- [x] `README.md`, `README.es.md` y `LICENSE` (T-0002)
- [x] Barra de navegación y pie de página comunes (T-0003)

### Pendientes
- [ ] Portada con próximos eventos
- [ ] Páginas institucionales (nosotros, contacto, preguntas frecuentes)
- [ ] Capa de SEO/AEO
- [ ] Lambda de contacto con SES
- [ ] `serverless.yml` y CI/CD
- [ ] Batería de pruebas y ganchos de pre-commit
- [ ] Certificados ACM (`staging.letiende.co` y `letiende.co`) en `us-east-1`
- [ ] Distribuciones de CloudFront de staging y de producción
- [ ] Cambios en Ágora y en Babel (base href, barra común, mapas del sitio, 301)
- [ ] Cutover de `letiende.co`
- [ ] *Etapa 2:* carta del café bar
- [ ] *Etapa 2:* actualización de `letiende-api`

---

## 3. Decisiones de arquitectura (ADRs)

### ADR-001 — Proxy de ruta, no reimplementación ni iframes

**Fecha:** 01/09/2026 · **Estado:** aceptada

**Decisión.** `letiende.co/cartelera/*` y `letiende.co/libros/*` se sirven por CloudFront desde los
stacks SSR de Ágora y Babel que ya están en producción. Este repositorio no reimplementa la cartelera
ni el catálogo.

**Razón.** Se evaluaron cuatro caminos. Los iframes se descartaron porque el contenedor no aportaría
HTML indexable, y el requisito de SEO/AEO es de primer orden (PRD §8); además el checkout de Bold
dentro de un iframe arrastra problemas de cookies de terceros. Reimplementar las vistas duplicaría el
flujo de compra, que es el código más delicado del ecosistema. Un monorepo unificado obligaría a
migrar dos sistemas en producción antes de poder mostrar nada.

**Consecuencias.**
- Una sola dirección canónica por contenido, y HTML real server-rendered en todas las rutas.
- Cero duplicación de lógica de negocio.
- **A cambio:** cambios coordinados en tres repositorios y un orden de despliegue que importa.
- **A cambio:** la barra de navegación tiene que existir tres veces (ADR-003).

### ADR-002 — Staging con dominio propio: `staging.letiende.co`

**Fecha:** 01/09/2026 · **Estado:** aceptada · **Reemplaza a:** la versión inicial de esta misma ADR

**Decisión.** Staging tiene dominio propio (`staging.letiende.co`), certificado ACM propio en
`us-east-1` y distribución de CloudFront propia, con la misma estructura de behaviors que producción
pero apuntando a los stacks de **staging** de Ágora y Babel.

**Historia de la decisión.** La primera versión de esta ADR copiaba el modelo de Ágora: staging en la
URL cruda de API Gateway, sin dominio. Se descartó al hacer explícita su consecuencia: el proxy de
ruta vive en CloudFront, así que sin CloudFront en staging **el proxy no se podía probar nunca antes
de producción** — y el proxy es justamente la pieza central y más frágil del proyecto.

**Razón.** El costo es un certificado (gratis), un registro DNS y una distribución (se paga por uso,
y staging casi no tiene). A cambio se puede verificar de punta a punta lo que de otro modo solo se
descubriría en producción: el proxy, las canónicas, `hreflang` si algún día lo hay, Open Graph, las
redirecciones 301 y los datos estructurados.

**Consecuencias.**
- El punto de mayor riesgo del proyecto deja de ser el cutover y pasa a ser una prueba repetible.
- Staging **debe** llevar `robots.txt` con `Disallow: /`. Un staging indexable compite contra
  producción por las mismas palabras.
- Staging apunta a Ágora y Babel de staging, no de producción: probar el contenedor no puede escribir
  sobre boletería ni inventario reales.
- Habilita el orden correcto de trabajo: T-13 (distribuciones) antes que T-11 y T-12 (cambios en los
  repos hermanos), porque el `--base-href` solo se puede validar detrás de un CloudFront.

### ADR-003 — La barra de navegación se reemplaza, no se oculta

**Fecha:** 01/09/2026 · **Estado:** aceptada · **Deriva de:** ADR-001

**Contexto.** El humano autorizó modificar Ágora y Babel «al mínimo» para que oculten su barra al ser
abiertas desde `letiende.co`.

**Decisión.** No se ocultan: se **reemplazan**. Ágora y Babel renderizan la barra común de
`DESIGN.md` §7 en el mismo punto donde hoy renderizan la suya.

**Razón.** Ocultar y no poner nada deja al visitante dentro de la cartelera sin forma de volver al
resto del sitio. El HTML bajo `/cartelera` lo genera Ágora, y este proyecto no puede inyectarle su
barra desde afuera — hacerlo exigiría una función en el borde que reescriba HTML ajeno, que es más
frágil y menos mínimo que cambiar el contenido de un componente que ya existe. Reemplazar es, de
hecho, el diff más pequeño que produce el resultado buscado: mismo componente, mismo punto de
montaje, distinto contenido.

**Consecuencias.**
- La barra existe **tres veces**, una por repositorio. `DESIGN.md` §8 es el contrato que las mantiene
  idénticas y `tech-specs.md` §7.3 tiene el diff exacto autorizado.
- Todo cambio a la barra obliga a un cambio en tres repositorios.
- Si ese costo se vuelve molesto, la salida es extraer la barra a un paquete compartido — **no**
  dejar que se desincronicen en silencio.
- Verificación: navegar de `/` a `/cartelera` y a `/libros` no debe producir ningún salto visual en
  la barra. Si se mueve, cambia de alto o cambia de color, el trabajo no está terminado.

### ADR-004 — Solo Tailwind, sin librería de componentes

**Fecha:** 01/09/2026 · **Estado:** aceptada

**Decisión.** Ni Angular Material (como Ágora) ni PrimeNG (como el intento de 2025).

**Razón.** El contenedor es contenido y navegación. No tiene tablas ordenables, ni selectores de
fecha, ni diálogos complejos: lo que justifica a Material en Ágora aquí no existe. Menos peso y menos
dependencias.

**Consecuencia.** Si en el futuro aparece un componente complejo de verdad, se reevalúa. Mientras
tanto, todo componente se construye a mano siguiendo `DESIGN.md`.

### ADR-005 — Solo español

**Fecha:** 01/09/2026 · **Estado:** aceptada

**Decisión.** Sin rutas por idioma, sin `hreflang`, un solo mapa del sitio. El `README` sí es
bilingüe, por ser material de desarrollo.

**Consecuencia.** Una versión en inglés después obligaría a reestructurar rutas y canónicas. Está en
el roadmap como prioridad baja, a la espera de evidencia de demanda.

### ADR-006 — Distribución de CloudFront nueva, cutover por Route 53

**Fecha:** 01/09/2026 · **Estado:** aceptada

**Decisión.** No se reconfigura la distribución `E33QAN86FY24JZ` que sirve el sitio estático actual.
Se crea una nueva y, cuando esté verificada, se cambia el registro de Route 53.

**Razón.** El sitio actual sigue vivo durante todo el desarrollo y revertir es cambiar un registro.
Reconfigurar la distribución en vivo haría del rollback una propagación de CloudFront.

### ADR-007 — `letiende-api` no se toca en la etapa 1

**Fecha:** 01/09/2026 · **Estado:** aceptada

**Decisión.** El sitio nuevo declara sus propias funciones en su `serverless.yml`. La Lambda heredada
`letiende-api` se aborda en la etapa 2, con revisión de seguridad y de estilo.

**Razón.** Está fuera de control de versiones, usa un rol compartido y tiene variables
(`discogs_token`, `google_API_KEY`) que delatan **otro consumidor sin identificar**. Redesplegarla a
ciegas lo rompería.

**Pendiente antes de la etapa 2:** averiguar quién la consume.

### ADR-008 — Rutas `/cartelera` y `/libros`

**Fecha:** 01/09/2026 · **Estado:** aceptada · **Reemplaza a:** la versión inicial, que usaba `/agora`

**Decisión.** Las rutas del proxy son `/cartelera` y `/libros`.

**Razón.** La primera versión usaba `/agora`, el nombre interno del sistema de boletería. Para
buscadores y para el visitante, `/cartelera` describe el contenido en vez de nombrar una pieza de la
arquitectura que nadie afuera conoce. `/libros` ya cumplía ese criterio y no cambió.

**Por qué se decidió ahora y no después.** Antes del cutover el cambio cuesta una línea en CloudFront
y una en el `--base-href` de Ágora. Después habría costado redirecciones permanentes y reindexación
de todo lo que ya estuviera posicionado.

**Consecuencia.** `agora.letiende.co` redirige con 301 a `letiende.co/cartelera`
(`tech-specs.md` §7.3, cambio 4).

### ADR-009 — Sin autenticación

**Fecha:** 01/09/2026 · **Estado:** aceptada

**Decisión.** El contenedor no tiene login, ni roles, ni sesiones. Todo lo que requiere identificarse
ya vive dentro de Ágora y de Babel, y sus guards siguen aplicando a través del proxy.

**Consecuencia.** El proxy **no es un control de acceso** y no debe usarse como tal (`CLAUDE.md` §5,
A01).

### ADR-010 — `PaginaPendiente`: un placeholder de ruta compartido, no una por página

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0003

**Contexto.** T-0003 necesitaba que `/nosotros` y `/contacto` fueran rutas reales de Angular (para
poder probar `routerLinkActive`) antes de que existieran sus páginas de verdad (T-5). Además, al
agregar esas dos rutas, `/` dejó de tener una entrada `path: ''` y el build dejó de prerenderizarla
— el servidor SSR respondía **404** en la raíz. Regresión encontrada y corregida en la misma tarea.

**Decisión.** Un único componente `PaginaPendiente` (`src/app/shared/pagina-pendiente/`), montado en
las tres rutas (`''`, `/nosotros`, `/contacto`) mientras T-4 y T-5 no existen, en vez de tres
componentes-cáscara casi idénticos.

**Razón.** Es exactamente el mismo contenido ("página en construcción") repetido tres veces; una
abstención prematura de crear tres archivos donde uno basta. T-5 lo reemplaza por las páginas reales,
sin que este componente sobreviva más allá de esa tarea.

**Consecuencia.** Cualquier tarea que agregue una ruta nueva a `app.routes.ts` debe recordar que
**`path: ''` es obligatorio** para que la raíz siga prerenderizando — no es opcional solo porque
"ya estaba así". Es la lección concreta de esta ADR, no solo el placeholder en sí.

---

## 4. Dependencias

**Instaladas** (T-0001, 01/09/2026). Versiones leídas de `node_modules/*/package.json` tras
`npm install`, no de memoria — el rango declarado en `package.json` es el que dejó el generador del
CLI (`^22.1.0`, `^4.1.12`, etc.); la columna "resuelta" es lo que realmente trajo `npm install` el
mismo día, dentro de ese rango:

| Paquete | Rango en `package.json` | Resuelta el 01/09/2026 |
|---|---|---|
| `@angular/core` | `^22.1.0` | 22.1.4 |
| `@angular/cli` | `^22.1.2` | 22.1.6 |
| `@angular/ssr` | `^22.1.2` | 22.1.6 |
| `@angular/build` | `^22.1.2` | 22.1.6 |
| `typescript` | `~6.0.2` | 6.0.3 — **no 7.x**: Angular 22 aún no la soporta |
| `tailwindcss` + `@tailwindcss/postcss` | `^4.1.12` | 4.3.3 |
| `vitest` | `^4.0.8` | 4.1.11 |
| `express` | `^5.1.0` | 5.2.1 |
| `serverless` | — | **aún no instalado**, se agrega en T-8. Ágora y Babel están en 4.39.0; objetivo 4.41.x |
| `@aws-sdk/client-ses` | — | **aún no instalado**, se agrega en T-7 |

No se fijó ninguna versión a mano: todas llegaron dentro del rango `^` que dejó
`npx @angular/cli@22 new`, que ya apunta a "última estable" por sí solo.

---

## 5. Configuraciones vigentes

Todo lo de esta tabla fue **verificado por API el 01/09/2026**, no recordado.

| Recurso | Identificador |
|---|---|
| Cuenta AWS | `696912647258` |
| Región | `us-east-1` |
| Zona de Route 53 | `Z010633738KAGFIPOZVEW` (`letiende.co.`) |
| CloudFront del sitio **actual** | `E33QAN86FY24JZ` → `letiende.co.s3-website-us-east-1.amazonaws.com` |
| CloudFront de activos | `E3RUGH3MUSR7PS` → `assets.letiende.co` → bucket `letiende-assets` |
| Ágora producción | HTTP API `qe36b86eb7` · dominio `agora.letiende.co` → `d-v5mzh62yrl.execute-api.us-east-1.amazonaws.com` |
| Ágora staging | HTTP API `ttukw9i82m` — origen del behavior `/cartelera/*` en staging |
| Babel producción | HTTP API `aav553hwx4` · dominio `babel.letiende.co` → `d-4npztcyk1j.execute-api.us-east-1.amazonaws.com` |
| Babel staging | HTTP API `oyzau0c910` — origen del behavior `/libros/*` en staging |
| `letiende-api` (heredada) | REST API `uklz2j4u38` · dominio `api.letiende.co` · Lambda `nodejs22.x`, 128 MB, rol `generica-role-o1869of8` |

**Nombres de stack esperados:** `letiende-co-staging` y `letiende-co-production`.

**Por crear** (no existen todavía; se anotan aquí sus identificadores en cuanto existan):

| Recurso | Estado |
|---|---|
| Certificado ACM `staging.letiende.co` (us-east-1) | por crear |
| Certificado ACM `letiende.co` (us-east-1) | por crear |
| Distribución CloudFront de staging | por crear |
| Distribución CloudFront de producción | por crear |
| Registro `A` alias `staging.letiende.co` | por crear |

**Registro de esfuerzo.** `metrics/pricing.json` tiene `as_of: 2026-06-24` para Anthropic — 69 días
al 01/09/2026. **Vence el 22/09/2026**: pasado ese punto hay que reverificar las tarifas contra
<https://docs.claude.com/en/docs/about-claude/pricing> antes de calcular ningún costo nuevo.
Plan declarado: Claude Pro, régimen `flat_rate`, cuota US$20/mes. Tarifa humana: US$50/hora.

**Defecto conocido de la skill de tracking.** El guard `import.meta.url === \`file://${process.argv[1]}\``
de `claude-code-transcript.mjs` y de `ledger.mjs` no dispara en este entorno: invocarlos por CLI
termina en silencio con código 0 y sin salida. Se usan importando sus funciones desde un script de
Node, que sí funciona. Verificado el 01/09/2026.

---

## 6. Patrones de código establecidos

Todavía no hay código propio. Estos patrones vienen de Ágora y Babel y son los que este proyecto
debe seguir desde el primer archivo:

**Vista (patrón de componente de página):**

```ts
@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.component.html',
})
export class InicioComponent {
  private readonly meta = inject(MetaService);
  private readonly eventos = inject(EventosPublicosService);

  protected readonly proximos = computed(() => this.eventos.cartelera()?.slice(0, 3) ?? []);
}
```

**Encadenamiento opcional obligatorio sobre datos remotos.** Un `computed()` sobre un recurso HTTP
se evalúa antes de que llegue la respuesta: `datos()?.eventos ?? []`, nunca `datos().eventos`.

**Pruebas aisladas.** `angular.json` lleva `"test": { "options": { "isolate": true } }`.
Sin eso, un `vi.mock` de un archivo se filtra a los demás y las pruebas fallan según el orden.

**Degradación de la portada.** Si el API de Ágora no responde, la portada se renderiza sin la sección
de eventos. Nunca se cae entera por un tercero.

---

## 7. Gotchas conocidos

Heredados de Ágora y Babel, **verificados en producción**, no teoría:

| Situación | Solución |
|---|---|
| `${env:X, ''}` en `serverless.yml` sin el secreto en CI | Resuelve a cadena vacía **sin fallar**. Verificar por CLI tras cada despliegue con `aws lambda get-function-configuration` |
| El resumen de `serverless deploy` no siempre sale por stdout en Serverless 4 | Leer el endpoint del Output de CloudFormation con `aws cloudformation describe-stacks`, no parsear la salida del comando |
| Dos despliegues simultáneos sobre el mismo stack | Grupos de `concurrency` en GitHub Actions: `cancel-in-progress: true` en staging, `false` en producción |
| `vi.mock` que se filtra entre archivos de prueba | `isolate: true` en el builder de pruebas |
| `<button ... />` con cierre automático | Angular 22 no lo permite (NG5002). Siempre `<button></button>` |
| `@` literal en una plantilla | Angular lo lee como bloque de control. Usar `&#64;` |
| Retención de logs infinita en CloudWatch | `logRetentionInDays: 14`. Viene de un incidente de costos real |

Propios de este proyecto, **a verificar durante la implementación**:

| Situación | Solución esperada |
|---|---|
| Origen del behavior `/cartelera/*` apuntando a `agora.letiende.co` | Bucle infinito de 301. El origen debe ser el `execute-api` crudo |
| Encabezado `Host` reenviado a API Gateway | 403. Usar política *AllViewerExceptHostHeader* |
| `OriginPath` definido en el behavior del proxy | Ágora recibe la ruta sin prefijo y su router falla. No definirlo |
| Certificado ACM creado fuera de `us-east-1` | CloudFront no lo acepta, sin importar dónde viva el stack. Siempre `us-east-1` |
| Staging indexable | `robots.txt` con `Disallow: /` en staging. Si no, compite contra producción por las mismas palabras |
| Ágora compilada con `--base-href /cartelera/` abierta por su URL cruda | Los activos se piden bajo el prefijo y la página se ve rota. A partir de T-11 se prueba por `staging.letiende.co/cartelera` |
| Copiar un directorio de skill con `cp -RL` desde `~/.claude/skills/` | Arrastra `.omc/state/` (estado de sesión de **otra** sesión) y `__pycache__/`. Ninguno de los dos debe versionarse. Se podó a mano tras copiar y se reforzó `.gitignore` con `**/.omc/`, `**/__pycache__/`, `**/*.pyc` |
| Mapa del sitio de Ágora emitiendo direcciones de `agora.letiende.co` | Debe emitirlas con el prefijo `/cartelera` tras el cutover |
| Babel no tiene mapa del sitio | Hay que agregárselo (T-12) |

Encontrado durante T-0003 (barra de navegación):

| Situación | Solución |
|---|---|
| Agregar rutas a `app.routes.ts` sin una entrada `path: ''` | El build deja de prerenderizar la raíz (`ng build` reporta menos rutas de las esperadas) y el servidor SSR responde **404 en `/`**, no un error visible en el build. Ver ADR-010 |

Encontrados durante T-0001 (andamiaje), **verificados en esta máquina**:

| Situación | Solución |
|---|---|
| ~~`node` global resolvía a v22.23.2 (`~/.hermes/node/bin/node`, antepuesto en `PATH` por Hermes, otra herramienta de IA instalada en la máquina)~~ | **Resuelto (02/09/2026).** Se agregó `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` al final de `~/.zshrc` — gana sobre `~/.local/bin` (Hermes) y sobre el `node` sin versionar de Homebrew (v26.8.1) por ser el último `PATH=` que se ejecuta al abrir la shell. No se tocaron los symlinks de Hermes: es un cambio de orden en `PATH`, reversible quitando esa línea. `node --version` en una shell nueva ya da 24.20.0 |
| Dos instalaciones globales de Angular CLI en la máquina, con distinto *prefix* de npm (`~/.local` y `/opt/homebrew`), una de ellas (`/opt/homebrew`) desactualizada a 20.3.5 | **Actualizada (02/09/2026)** a 22.1.6, junto con `@angular-devkit/architect`, `@angular-devkit/core`, `@angular-devkit/schematics` y `@schematics/angular` — estaban instalados como paquetes globales sueltos, no solo como dependencia interna de `@angular/cli`. La de `~/.local` (la que gana en `PATH`) ya estaba en 22.1.6. No se eliminó ninguna de las dos instalaciones, solo se actualizaron ambas; consolidarlas en una sola es una decisión de la máquina, no de este proyecto |

Encontrado durante T-0002 (README y `LICENSE`), en el repositorio de **Ágora**, no en este:

| Situación | Solución |
|---|---|
| El badge y el README de Ágora dicen `license-MIT`, pero su archivo `LICENSE` real es Apache License 2.0 (201 líneas, encabezado `Apache License Version 2.0` — verificado leyendo el archivo, no el badge) | No se copió el `LICENSE` de Ágora como decía la tarea original. Se usó el de Babel, que sí es MIT de verdad (21 líneas, coincide con su propio badge). La inconsistencia de Ágora **no se corrigió** — es un repositorio distinto, fuera del alcance de esta tarea — pero queda anotada aquí por si alguien la resuelve más adelante |
| TypeScript 6.x deprecó `baseUrl` (error TS5101) | Los `paths` de `tsconfig.json` van **sin** `baseUrl`, con rutas relativas explícitas (`"./src/app/core/*"`, no `"src/app/core/*"`) — si no, TS5090 |
| `security.allowedHosts` de `angular.json` se hornea en el bundle del **servidor** SSR, no solo en el dev-server | `AngularNodeAppEngine` responde "Header host... is not allowed" incluso en `node dist/.../server.mjs`. Con `[]` (default del CLI) rechaza todo. Se fijó `["localhost"]` para desarrollo local. **Pendiente antes de T-13/T-15:** el mismo artefacto de build se despliega a `staging.letiende.co` y a `letiende.co` (ADR-002) — falta decidir cómo esta lista static-en-build-time cubre ambos hosts sin rebuildear por stage |
| Angular CLI 22 genera el script `serve:ssr:<nombre-del-proyecto>` | Se renombró a `serve:ssr` a secas en `package.json`, para que coincida con `CLAUDE.md` §3 y con la convención de Ágora |
| `--ai-config` del `ng new` de Angular 22 no acepta el valor `agents` que documenta la skill `angular-new-app` | Los valores reales son `claude-code\|cursor\|gemini-cli\|none\|open-ai-codex\|vscode`. Se usó `none`: ya existe un `CLAUDE.md`/`AGENTS.md` curado a mano, y un generador genérico lo habría pisado o entrado en conflicto |
| `ng new --directory .` sobre un repositorio no vacío | Falla con "merge conflicted" en cualquier archivo que ya exista (`.gitignore` en este caso). Se generó en un directorio temporal y se fusionó a mano — exactamente lo que T-0001 ya anticipaba |

---

## 8. Documentos de referencia

| Documento | Contenido |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Instrucciones para agentes: stack, convenciones, OWASP, git flow |
| [`PRD.md`](PRD.md) | Producto: visión, usuarios, objetivos, roadmap |
| [`tech-specs.md`](tech-specs.md) | Arquitectura, rutas, infraestructura, endpoints |
| [`DESIGN.md`](DESIGN.md) | Sistema de diseño y contrato visual entre los tres repos |
| [`TODO.md`](TODO.md) | Las 2 tareas atómicas activas |
| `../metrics/` | Registro de esfuerzo y costo |

**Repositorios hermanos**, referencia constante:

| Repositorio | Para qué consultarlo |
|---|---|
| `~/Documents/LeTiende/letiende.co/agora/` | Referencia principal de UX/UI, CI/CD, `serverless.yml`, estructura |
| `~/Documents/LeTiende/letiende.co/babel/` | `README` bilingüe con insignias, patrones de catálogo público |
| `~/Documents/LeTiende/letiende.co/comandante/` | Etapa 2: origen de la lista de precios |
| `agora/docs/advertencia-urgente-costos-aws.md` | **Lectura obligatoria antes de tocar infraestructura** |

---

## 9. Contexto de la sesión actual

**01/09/2026 — Planteamiento del proyecto.**

Qué se hizo:

- Se exploraron los tres repositorios hermanos y se verificó por API el estado real de la
  infraestructura en AWS (distribuciones, APIs, dominios, Lambdas, zonas de Route 53).
- Se resolvieron con el humano seis decisiones de arquitectura: integración por proxy, idioma,
  librería de componentes, staging sin dominio, alcance de la etapa 1 y trato de `letiende-api`.
- Se escribió la documentación completa: `CLAUDE.md` (con OWASP y git flow), `PRD.md`,
  `tech-specs.md`, `DESIGN.md`, `MEMORY.md` y `TODO.md`.
- Se inicializó el registro de esfuerzo en `metrics/`.

Tres ajustes pedidos por el humano tras leer el planteamiento, ya incorporados:

1. **Autorización para modificar Ágora y Babel** al mínimo. Se aprovechó para acotar el diff exacto
   en `tech-specs.md` §7.3 y para corregir ADR-003: la barra no se oculta, se reemplaza — ocultarla
   dejaría al visitante sin salida dentro de la cartelera.
2. **`staging.letiende.co`** con dominio, certificado y distribución propios (ADR-002 reescrita).
   Es el cambio de mayor impacto de la sesión: convierte el proxy de un salto de fe en producción a
   una prueba repetible.
3. **`/cartelera` en vez de `/agora`** (ADR-008 reescrita), decidido antes del cutover, que es cuando
   el cambio todavía es barato.

Además, `.claude/skills/ai-effort-tracking` y `.claude/skills/project-docs-bootstrap` se copiaron
dentro del repositorio (antes eran symlinks a `~/Documents/AgentesIA/...`), para que los hooks del
registro de esfuerzo funcionen en cualquier entorno, incluidas las sesiones cloud. Al copiar se
arrastraron `.omc/state/` de otra sesión y `__pycache__/`; se podaron a mano y `.gitignore` quedó
reforzado para que no vuelva a pasar (§7).

**Próxima tarea sugerida:** T-0001 de `TODO.md` — andamiaje de la aplicación Angular 22 con SSR y
Tailwind 4.

**Decisiones pendientes:** ninguna abierta. La única pregunta viva es la de la etapa 2 (cómo publica
Comandante su lista de precios), y no bloquea nada de la etapa 1.

---

**01/09/2026 (tarde) — T-0001: andamiaje.**

En rama `feature/andamiaje-angular-ssr` (desde `main`), en dos commits:

1. `chore`: elimina los ~290 archivos del intento de 2025 que quedaban sin commitear (era el
   *wipeout* local previo a esta sesión), y copia dentro del repo las 6 skills que aún eran symlinks
   (`angular-developer`, `angular-new-app`, `seo-aeo-best-practices`, `slim-badges`,
   `slim-continuous-testing`, `slim-readme`) — mismo tratamiento que las dos anteriores.
2. `feat`: `npx @angular/cli@22 new` generado en un directorio temporal y fusionado a mano
   (`--style=tailwind --ssr --routing --zoneless --test-runner=vitest --ai-config=none`), más los
   ajustes manuales de T-0001: `@theme` con la paleta de `DESIGN.md` en `styles.css`, Poppins en
   `index.html`, alias de rutas en `tsconfig.json`, `isolate: true` en el target `test`,
   `provideZonelessChangeDetection()` explícito, y una plantilla mínima en `app.html` (reemplaza el
   "Welcome to Angular" del CLI) que sirve de prueba de humo visual para la paleta.

Verificado localmente, no asumido: `tsc --noEmit` limpio, `npm run build -- --configuration=production`
genera SSR + prerender, `node dist/letiende-co/server/server.mjs` responde HTTP 200 con HTML ya
renderizado (`<h1>Le Tiende</h1>` presente en la respuesta, no un `<app-root>` vacío), el CSS
compilado resuelve `.bg-primary` a `#230c00`, y `npm test -- --watch=false` pasa (2/2).

Cinco gotchas nuevos, todos en la tabla de §7: el `node` global de esta máquina no es el de Homebrew,
`tsconfig.json` no admite `baseUrl` en TS 6.x, `security.allowedHosts` se hornea en el servidor SSR
(no solo en el dev-server) y queda **pendiente de resolver antes de T-13/T-15** para que el mismo
artefacto sirva a `staging.letiende.co` y a `letiende.co`, el script de `serve:ssr` se renombró, y
`--ai-config` de Angular 22 no admite el valor que documenta la skill (se usó `none`).

**Próxima tarea sugerida:** abrir el PR de esta rama; motor JIT recalculado en `TODO.md` — T-0002
(README) sigue activa y se agrega T-0003 (barra de navegación y pie de página comunes, sin tocar aún
Ágora ni Babel).

---

**02/09/2026 — Tooling de máquina + T-0002.**

Antes de arrancar T-0002, dos tareas de tooling pedidas explícitamente (PR fusionado por separado):
`node` global apuntado a v24 vía `PATH` en `~/.zshrc` (el culpable era Hermes, otra herramienta de IA
en la máquina), y el CLI global de Angular actualizado en las dos instalaciones que había en la
máquina. Detalle completo en §7.

**T-0002 — README bilingüe y `LICENSE`.** En rama `docs/readme-bilingue` (desde `main`):

- `README.md` (inglés) y `README.es.md` (español), siguiendo `/slim-readme`, con la estructura de
  Babel como referencia pero **mucho más corto** — proporcional a un proyecto que todavía no tiene
  páginas propias ni está en producción. Sin tablas de Pareto ni historia de incidentes: eso es lo
  que Babel ganó por ser un proyecto maduro y entregado; replicarlo aquí habría sido relleno, no
  información real.
- Insignias según `/slim-badges`: estado ("en desarrollo", no "en producción"), licencia, Angular 22,
  AWS (Lambda · CloudFront · API Gateway — **sin DynamoDB**, a diferencia de Ágora/Babel, porque este
  proyecto no tiene base de datos propia), Serverless, SLIM, idioma recíproco, y autoría.
- **La insignia de autoría se calculó, no se adivinó.** Se leyeron los 8 eventos de
  `metrics/events/`, separando labor (`agent_active_s` + `human_review_s`) de espera entre sesiones
  (`human_wait_s`, excluida del cálculo). Resultado: **73,4% humano / 26,6% agente** sobre el tiempo
  de labor medido — el reparto opuesto al de Babel (20/80), esperable en la etapa de especificación e
  interview de un proyecto que recién arranca. Badge elegido: **AI-assisted**.
- `LICENSE`: **no se copió el de Ágora como decía la tarea original.** Al leerlo se encontró que,
  pese a que el badge y el README de Ágora dicen "MIT", el archivo real es Apache License 2.0. Se usó
  el de Babel en su lugar (MIT de verdad, coincide con su propio badge). Inconsistencia de Ágora
  anotada en §7, no corregida — es un repositorio ajeno a esta tarea.
- Los tres comandos de la sección de arranque rápido (`npm run build -- --configuration=production`,
  `npm run serve:ssr`, `npm test`) se ejecutaron y verificaron antes de documentarlos. Se dejaron
  fuera, a propósito, los de `CLAUDE.md` §3 que hoy no funcionan todavía (`npm run lint`, `npm run
  format`, `npm run build:infra`, los de `serverless`): documentar un comando roto es peor que no
  documentarlo, y esas piezas llegan con T-0004 y T-8.

**Próxima tarea sugerida:** abrir el PR de `docs/readme-bilingue`; motor JIT recalculado — T-0003
(barra de navegación) sigue activa, se agrega T-0004 (pruebas continuas y ganchos de pre-commit,
`/slim-continuous-testing`).

---

**02/09/2026 — T-0003: barra de navegación y pie de página comunes.**

En rama `feature/barra-navegacion-comun` (desde `main`):

- `BarraNavegacion` (`src/app/shared/navegacion/`), con el marcado exacto de `DESIGN.md` §7. Colapso
  móvil implementado a mano, sin librería: `signal<boolean>` para el estado, `@if` para el panel,
  `effect()` + `viewChild()` para mover el foco al botón de cierre cuando el panel se abre y de
  regreso al botón de menú cuando se cierra (por clic o por `Escape`, capturado con
  `(keydown.escape)` en el contenedor del panel — el evento burbujea desde cualquier enlace enfocado
  dentro).
- `PiePagina`, con contenido placeholder marcado explícitamente como tal en un comentario (dirección,
  horarios y redes reales llegan en T-5).
- Dos cosas fuera de la lista de archivos original de T-0003, ambas necesarias:
  - `public/logo_blanco_sin_fondo.svg`, copiado de Ágora — el header de `DESIGN.md` §7 lo referencia
    y no existía ningún activo de marca en el repo todavía (`DESIGN.md` §9 ya lo documentaba como
    activo canónico; no fue una decisión nueva, solo ejecutar una ya tomada).
  - Rutas placeholder para `''`, `/nosotros` y `/contacto` con un componente compartido
    `PaginaPendiente` (ADR-010) — necesarias para poder probar `routerLinkActive` de verdad, tal
    como T-0003 ya autorizaba ("con rutas placeholder si hace falta").
- **Regresión encontrada y corregida en la misma tarea:** al agregar `/nosotros` y `/contacto` sin
  una entrada `path: ''`, el build dejó de prerenderizar la raíz y el servidor SSR respondía **404
  en `/`** — nada en el build lo advertía, solo se vio al servir y curlear de verdad. Ver ADR-010 y
  el gotcha nuevo en §7.

Verificado, no solo en pruebas unitarias sino sirviendo el build real: `curl` contra `/`, `/nosotros`,
`/contacto` y el SVG del logo, los cuatro HTTP 200; `/nosotros` trae `text-secondary` en su propio
enlace y no en el de `/contacto` (y viceversa al navegar); `/cartelera` y `/libros` son `<a href>`
planos en el HTML, ausentes del árbol de rutas de Angular. 9/9 pruebas pasan, incluida una que
simula clic en el botón de menú → `Escape` → verifica que `document.activeElement` vuelve a ser ese
mismo botón. `tsc --noEmit` limpio en `app` y `spec`.

**Próxima tarea sugerida:** abrir el PR de `feature/barra-navegacion-comun`; motor JIT recalculado —
T-0004 (pruebas continuas) sigue activa, se agrega **T-0005** (portada con próximos eventos, T-4 del
roadmap), que introduce `src/environments/` por primera vez — verificar las URLs de Ágora contra
`MEMORY.md` §5 antes de escribirlas, no de memoria.
