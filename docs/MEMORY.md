# MEMORY.md — Memoria del proyecto letiende.co

Documento de rehidratación de estado. **Léelo al inicio de cada sesión.**
Se actualiza al cerrar cada sesión de trabajo relevante.

---

## 1. Estado actual

| | |
|---|---|
| **Versión** | 0.0.0 — sin código todavía |
| **Fase** | Documentación completa; andamiaje pendiente |
| **Repositorio** | <https://github.com/ocastelblanco/letiende.co> |
| **Rama** | `main` (limpia tras el borrado del intento de 2025) |
| **Producción** | `https://letiende.co` — todavía sirve el **sitio estático anterior** |
| **Staging** | No existe aún |
| **Última sesión** | 01/09/2026 — planteamiento del proyecto y documentación inicial |

La rama `2025` sigue en el remoto con el intento anterior, abandonado.
No se toma nada de ella: el proyecto arranca desde cero por decisión explícita.

---

## 2. Funcionalidades

### Completadas

- [x] Definición del alcance de las etapas 1 y 2
- [x] Decisión de arquitectura de integración (ADR-001)
- [x] Documentación: `CLAUDE.md`, `PRD.md`, `tech-specs.md`, `DESIGN.md`, `MEMORY.md`, `TODO.md`
- [x] Registro de esfuerzo inicializado

### Pendientes

- [ ] Andamiaje Angular 22 + SSR + Tailwind 4
- [ ] `README.md` y `README.es.md`
- [ ] Barra de navegación y pie de página comunes
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

---

## 4. Dependencias

Ninguna instalada todavía. Versiones objetivo, verificadas contra el registro de npm el 01/09/2026:

| Paquete | Versión objetivo | Nota |
|---|---|---|
| `@angular/*` | `~22.1.x` | CLI publicado: 22.1.6; core: 22.1.4 |
| `@angular/ssr` | `~22.1.x` | — |
| `typescript` | `~6.0.x` | **No 7.0.2**, aunque sea la última publicada: Angular 22 aún no la soporta |
| `tailwindcss` + `@tailwindcss/postcss` | `^4.3.3` | Última estable |
| `vitest` | `^4.1.x` | Publicada: 4.1.11 |
| `serverless` | `4.41.1` | Ágora y Babel están en 4.39.0 |
| `express` | `^5.x` | — |
| `@codegenie/serverless-express` | `^5.x` | — |
| `@aws-sdk/client-ses` | `^3.x` | — |

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
| Node local en 22.x mientras Lambda corre 24.x | Alinear local a 24.x. Hoy la máquina tiene v22.23.2 |
| Certificado ACM creado fuera de `us-east-1` | CloudFront no lo acepta, sin importar dónde viva el stack. Siempre `us-east-1` |
| Staging indexable | `robots.txt` con `Disallow: /` en staging. Si no, compite contra producción por las mismas palabras |
| Ágora compilada con `--base-href /cartelera/` abierta por su URL cruda | Los activos se piden bajo el prefijo y la página se ve rota. A partir de T-11 se prueba por `staging.letiende.co/cartelera` |
| Copiar un directorio de skill con `cp -RL` desde `~/.claude/skills/` | Arrastra `.omc/state/` (estado de sesión de **otra** sesión) y `__pycache__/`. Ninguno de los dos debe versionarse. Se podó a mano tras copiar y se reforzó `.gitignore` con `**/.omc/`, `**/__pycache__/`, `**/*.pyc` |
| Mapa del sitio de Ágora emitiendo direcciones de `agora.letiende.co` | Debe emitirlas con el prefijo `/cartelera` tras el cutover |
| Babel no tiene mapa del sitio | Hay que agregárselo (T-12) |

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
