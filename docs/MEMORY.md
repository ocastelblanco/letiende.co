# MEMORY.md — Memoria del proyecto letiende.co

Documento de rehidratación de estado. **Léelo al inicio de cada sesión.**
Se actualiza al cerrar cada sesión de trabajo relevante.

---

## 1. Estado actual

| | |
|---|---|
| **Versión** | 0.0.0 — andamiaje + barra/pie comunes + `README`/`LICENSE` + pruebas continuas + portada con eventos reales de Ágora + páginas institucionales + preguntas frecuentes + íconos/manifest + Google Maps + GA4 + capa de SEO/AEO + `serverless.yml` (SSR + contacto) + CI/CD + ACM/CloudFront/DNS de staging desplegados de verdad |
| **Fase** | T-0001 a T-0012 completadas y en `main`; T-0011 (ACM + CloudFront + staging.letiende.co) completada y verificada en vivo — ver historial de `docs/TODO.md`. Próximas: T-0013/T-0014 (cambios en Ágora y Babel) |
| **Repositorio** | <https://github.com/ocastelblanco/letiende.co> |
| **Rama** | `fix/assets-prefijo-cloudfront` (desde `main`), PR #18 |
| **Producción** | `https://letiende.co` (CloudFront `E33QAN86FY24JZ`) — todavía sirve el **sitio estático anterior**. `letiende-co-production` despliega de verdad (T-0010) y ya tiene su propia distribución de CloudFront (`ER22S2WADMM83`, T-0011), pero sin alias — nada de DNS apunta a él todavía, eso es el cutover de T-14/T-15 |
| **Staging** | `letiende-co-staging` despliega de verdad, con dominio propio real: `https://staging.letiende.co` (ACM `ISSUED`, CloudFront `EQW683KP4VXIV`, T-0011) — verificado en vivo por el humano y por `curl` |
| **Última sesión** | 03/09/2026 — T-0011: certificado ACM + CloudFront + DNS de staging, verificado en vivo (PR #17 fusionado, PR #18 con el fix del prefijo `/assets` en curso) |

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
- [x] Batería de pruebas y ganchos de pre-commit (T-0004)
- [x] Portada con próximos eventos (T-0005)

- [x] Páginas institucionales: Nosotros y Contacto (T-0006), con íconos/manifest, Google Maps Embed
      y Google Analytics 4
- [x] Capa de SEO/AEO (T-0008): `MetaService`, JSON-LD, `robots.txt`/`sitemap.xml` dinámicos, 404 real
- [x] `serverless.yml` del contenedor, solo la función `ssr` (T-0007) — `npx serverless package` sin
      errores, verificado invocando el handler con eventos de API Gateway simulados
- [x] Lambda de contacto con SES y antiabuso (T-0009): honeypot, límite de tasa en memoria,
      `Source` siempre `SES_REMITENTE`, `ContactoComponent.enviar()` hace el `POST` real
- [x] CI/CD con GitHub Actions (T-0010): despliegue real verificado a `staging` y a `producción`
- [x] Preguntas frecuentes (T-0012): `esquemaFaqPage()`, contenido confirmado por el humano
- [x] Certificado ACM, distribuciones de CloudFront (staging y producción) y DNS de `staging.letiende.co`
      (T-0011): verificado en vivo, incluido el fix del prefijo `/assets` no anticipado en la planeación

### Pendientes
- [ ] Cambios en Ágora y en Babel (base href, barra común, mapas del sitio, 301) — T-0013/T-0014
- [ ] Cutover de `letiende.co` (T-14/T-15: mover el alias de la distribución vieja a la nueva)
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

### ADR-011 — Pre-commit con `husky` + `lint-staged`, escáner de secretos propio

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0004

**Contexto.** La skill `/slim-continuous-testing` que originó T-0004 trae, por defecto, la plantilla
del framework `pre-commit` de Python (`pip install pre-commit`). `tech-specs.md` §10 documentaba
"GitGuardian / `detect-secrets`" para el escaneo de secretos, sin comprometerse a cuál.

**Decisión.** Ganchos con `husky` + `lint-staged` (el estándar del ecosistema Node, no el framework
Python), y un escáner de secretos propio (`scripts/verificar-secretos.mjs`) en vez de GitGuardian o
`detect-secrets`.

**Razón.**
- Este proyecto —y Ágora y Babel— son puramente Node/TypeScript. El framework `pre-commit` de Python
  habría metido un segundo lenguaje de tooling solo para un gancho de git.
- **GitGuardian no es una decisión de código.** Al revisar Ágora se encontró que su `.gitguardian.
  yaml` es únicamente su lista de falsos positivos ignorados — la protección real es una GitHub App
  instalada a nivel de cuenta/organización, algo que un commit en este repositorio no puede activar.
  Instalarla para `letiende.co` sigue disponible como mejora, pero es una decisión del humano en la
  configuración de GitHub, no de un agente escribiendo archivos.
- `detect-secrets` también es Python, con el mismo problema del framework `pre-commit`.

**Consecuencia.** El escaneo de secretos local es más angosto que GitGuardian: cubre patrones
conocidos (llaves de AWS, encabezados de llave privada, tokens de OpenAI/Stripe/GitHub/Slack/Google),
no escaneo de entropía genérico ni la base de datos de GitGuardian. Es una red local mientras la
decisión de la GitHub App no se tome, no un reemplazo permanente pensado como equivalente.

### ADR-012 — La portada usa `RenderMode.Server`, no `RenderMode.Prerender`

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0005

**Contexto.** T-0001 dejó `{ path: '**', renderMode: RenderMode.Prerender }` como única regla de
`app.routes.server.ts`. Al agregar la portada real con eventos de Ágora, el build (`ng build
--configuration=production`) **hizo una llamada real a `https://agora.letiende.co/api/eventos-
publicos` en tiempo de build** — verificado con `curl` contra la API real de producción antes y
comparando con el contenido servido — y ese resultado quedó congelado en el HTML estático de `/`
hasta el próximo despliegue. Un evento publicado en Ágora entre despliegues nunca habría aparecido.

**Decisión.** `/` pasa a `RenderMode.Server` (SSR dinámico, por petición); el resto de las rutas
(`/nosotros`, `/contacto` — contenido estático, sin datos remotos) siguen bajo `RenderMode.Prerender`
vía el comodín `'**'`. El orden en el arreglo importa: la regla específica de `''` va **antes** del
comodín.

**Consecuencia.** El build de producción ya no depende de que Ágora esté arriba para completarse
(antes de este cambio, una Ágora caída durante un despliegue habría fallado o colgado el build — no
se llegó a probar ese caso límite porque se corrigió antes). La portada sí hace una petición real a
Ágora en cada visita, en el servidor — el patrón de degradación de ADR anterior (§ debajo) es lo que
evita que una Ágora caída en producción rompa la página.

### ADR-013 — `hasValue()` antes de `value()`, no `?.`/`??`, para degradar sin romper

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0005

**Contexto.** `MEMORY.md` §6 y `tech-specs.md` §4.1 documentaban, desde la sesión de planeación
original, que un `computed()` sobre un recurso remoto debía usar encadenamiento opcional
(`datos()?.campo ?? []`) para no romper el render mientras la respuesta no ha llegado. Al escribir
`InicioComponent` y probar el caso de Ágora caída con `HttpTestingController` (`peticion.error(...)`,
`tech-specs.md` §5), la prueba **lanzó una excepción real** dentro de la evaluación del `computed()`.

**Hallazgo.** `resource.value()` (y por lo tanto `httpResource(...).value()`) **relanza el error
subyacente cuando el recurso está en estado de error** — no devuelve `undefined`. El encadenamiento
opcional no alcanza a proteger nada: la excepción salta al evaluar `.value()`, antes de que `?.` o
`??` puedan actuar sobre el resultado. Esto no estaba mal documentado por descuido — era un supuesto
nunca verificado contra el comportamiento real de la API, escrito durante la planeación inicial antes
de que existiera código real que lo ejercitara.

**Decisión.** Toda lectura de un recurso que pueda fallar usa `resource.hasValue()` como guardia
antes de `resource.value()`:

```ts
protected readonly proximosEventos = computed(() => {
  const recurso = this.eventosPublicos.cartelera;
  return recurso.hasValue() ? recurso.value().slice(0, 3) : [];
});
```

**Consecuencia.** `MEMORY.md` §6 y `tech-specs.md` §4.1 quedaron corregidos con el patrón real. El
encadenamiento opcional (`?.`, `??`) sigue siendo válido y necesario para el estado *previo a la
primera respuesta* (`value()` en `undefined`, eso no lanza) — la corrección es que **no basta** para
el estado de error; hace falta `hasValue()` además. Verificado con una prueba que fuerza el estado de
error real vía `HttpTestingController`, no solo inferido de la documentación de Angular.

### ADR-014 — `HttpClient` funciona sin `provideHttpClient()` explícito en Angular 22

**Fecha:** 02/09/2026 · **Estado:** registrado (no es una decisión, es un hallazgo)

**Contexto.** `EventosPublicosService` usa `httpResource()`, que internamente inyecta `HttpClient` de
forma obligatoria (`injector.get(HttpClient)`, sin `optional: true` — verificado leyendo
`node_modules/@angular/common/fesm2022/http.mjs`). `app.config.ts` (T-0001) **nunca llamó
`provideHttpClient()`**. La expectativa razonable era que esto fallara con `NullInjectorError` al
construir `InicioComponent`.

**Verificado, no asumido.** Se armó un servicio de diagnóstico desechable que inyectaba `HttpClient`
directamente y lo registraba por consola, montado temporalmente en `App`; se compiló, se sirvió el
build de producción, y se confirmó por consola: `HttpClient` se inyecta sin error. El diagnóstico se
descartó (`git checkout -- src/app/app.ts`, `rm` del archivo) antes de continuar — nunca llegó a un
commit.

**Explicación probable, no confirmada al 100%:** el mensaje de deprecación de XHR en
`@angular/platform-server` menciona "the HttpClient fetch backend... is the default since Angular
22", lo que sugiere que `HttpClient` pasó a proveerse por defecto en la raíz en esta versión. No se
rastreó el proveedor exacto dentro del código fuente de Angular — el hallazgo que importa para este
proyecto es el comportamiento observado, no la implementación interna.

**Consecuencia.** No se agregó `provideHttpClient()` a `app.config.ts`: hacerlo habría sido writing
código redundante para "arreglar" algo que no estaba roto. Si una versión futura de Angular deja de
proveerlo por defecto, el build fallaría de forma ruidosa (`NullInjectorError`) — no en silencio — así
que no hace falta una prueba centinela para esto.

### ADR-015 — GA4 solo carga en el host `letiende.co`, nunca en staging

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0006

**Contexto.** `environment.production.ts` documenta desde T-0001/T-0005 que **el mismo artefacto** de
build sirve a `staging.letiende.co` y a `letiende.co` (solo cambia el stage de Serverless). Si
Google Analytics 4 se cargara sin condición, cada visita de prueba a staging —de quien revisa un PR,
de QA, de un agente que verifica un despliegue— contaría como una sesión real en la propiedad de GA4,
contaminando permanentemente las métricas de negocio.

**Decisión.** `AnalyticsService` (`core/analytics/analytics.service.ts`) comprueba
`window.location.hostname` en tiempo de ejecución y solo inserta el script de `gtag.js` cuando el host
es exactamente `letiende.co`. La función pura `debeCargarAnalytics(hostname)` queda exportada y
probada por separado, sin depender del DOM.

**Razón.** Es la única forma de distinguir staging de producción sin un segundo build ni una segunda
propiedad de GA4 — ninguna de las dos opciones existía y ambas habrían costado más que un chequeo de
host. Coherente con el precedente de ADR-002/ADR-012: el mismo artefacto sirve a los dos stages, y las
piezas sensibles al stage se resuelven en tiempo de ejecución, no en tiempo de build.

**Consecuencia.** `AnalyticsService` también ignora el marcador `__GOOGLE_ANALYTICS_ID__` sin
sustituir (ver ADR-017): si un despliegue se hiciera sin la variable de entorno configurada, no carga
un ID inválido, simplemente no carga nada. Verificado con una prueba (`analytics.service.spec.ts`) que
confirma que, en el `localhost` de las pruebas, el script de `googletagmanager` nunca se inserta en el
DOM.

### ADR-016 — Se descarta la API de Google Business Profile para esta tarea

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0006

**Contexto.** El humano preguntó si convenía sincronizar horarios y dirección desde Google Business
Profile vía API. Investigación contra la documentación oficial de Google for Developers (prerequisitos
de la API de Business Profile): requiere un perfil verificado y activo **60+ días**, una solicitud
formal de acceso que Google aprueba en días a semanas (cuota en 0 solicitudes/minuto hasta entonces), y
OAuth2 con almacenamiento seguro de refresh token — es decir, una Lambda nueva y un flujo de
autenticación que hoy no existen en este proyecto.

**Decisión.** No se integra la API de Google Business Profile. El humano dio la dirección y los
horarios directamente como texto (verificados por él, no adivinados), centralizados en
`core/negocio/datos-negocio.ts`. Se documenta como opción futura si algún día hace falta que los
horarios cambien con frecuencia y se reflejen sin un despliegue nuevo.

**Razón.** Un centro cultural no cambia su horario todos los días; el costo de la aprobación de Google
y de la infraestructura OAuth no se justifica frente a editar una constante cuando el horario cambie de
verdad. La alternativa evaluada y también descartada fue la API de Places (Place Details) — más
simple, solo con llave, sin OAuth—, pero el campo `regularOpeningHours` factura contra el SKU
Enterprise (de pago) y de todas formas requeriría que Le Tiende tuviera ya un Place ID público
verificado, que no se confirmó que exista.

**Consecuencia.** El mapa de `/contacto` sí usa una API de Google (Maps Embed, con llave pública
restringida por dominio, sin OAuth) — es una integración de solo lectura del lado del cliente, sin
infraestructura nueva, y fue la que el humano eligió explícitamente frente a las alternativas
planteadas.

### ADR-017 — La llave de Maps y el ID de GA4 no se versionan, ni siquiera siendo públicas

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0006

**Contexto.** La primera versión de esta tarea puso la llave real de Google Maps Embed y el
Measurement ID de GA4 directamente en `environment.ts`/`environment.production.ts`, con el
razonamiento de que son públicas por diseño de Google (se restringen por dominio, no por secreto, y de
todas formas terminan visibles en el HTML servido). El gancho de pre-commit
(`scripts/verificar-secretos.mjs`, ADR-011) bloqueó el commit al detectar el patrón `AIza...`: "posible
Clave de API de Google". Puesto en decisión, el humano no aceptó documentar una excepción a
`CLAUDE.md` §5 (que prohíbe **cualquier** llave en `environments/`, sin matices) ni forzar el commit
con `--no-verify` — eligió una tercera vía.

**Decisión.** Ninguna de las dos llaves se versiona. `environment.ts` y `environment.production.ts`
llevan los marcadores `__GOOGLE_ANALYTICS_ID__` y `__GOOGLE_MAPS_API_KEY__`.
`scripts/inyectar-llaves-publicas.mjs`, cableado como script `postbuild` de npm, los sustituye sobre
`dist/letiende-co/` (bundles de JS/SSR y HTML ya prerenderizado — `/contacto` prerenderiza con el
marcador dentro, así que el reemplazo tiene que tocar también el HTML, no solo el JS) leyendo
`GOOGLE_ANALYTICS_ID` y `GOOGLE_MAPS_API_KEY` del entorno. Sin esas variables, el script no falla: solo
avisa que no hay nada que sustituir y deja el marcador tal cual.

**Razón.** Evita la ambigüedad de reinterpretar una regla de seguridad escrita en términos absolutos, y
mantiene intacto el escáner de secretos existente (el marcador no coincide con ningún patrón de la
lista, así que no hace falta tocar `scripts/verificar-secretos.mjs` ni añadirle una lista de
excepciones). El costo es infraestructura que todavía no existe del todo: T-9 (CI/CD, en la cola) es
quien realmente va a exportar `GOOGLE_ANALYTICS_ID`/`GOOGLE_MAPS_API_KEY` en el paso de build. Mientras
tanto, ambos valores ya quedaron guardados como *secrets* de GitHub Actions del repositorio (no en
ningún archivo de este repositorio ni en ningún documento), listos para que T-9 los use.

**Consecuencia.** En desarrollo local (`ng serve`, que no corre `postbuild`) el mapa de `/contacto`
muestra el error de llave inválida de Google en vez de un mapa real, y `AnalyticsService` nunca carga
gtag.js (por el marcador sin sustituir, además del chequeo de host de ADR-015) — comportamiento
esperado, no un bug. Quien necesite probar el mapa real en local puede exportar `GOOGLE_MAPS_API_KEY`
antes de `npm run build` y servir el `dist/` resultante con `npm run serve:ssr`.

### ADR-018 — SEO/AEO: sin `SearchAction`, sin `geo`, sitemap reducido a las rutas propias

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0008

**Contexto.** `tech-specs.md` §4.5, escrito en la sesión de planeación original, daba por hechas tres
cosas nunca verificadas contra el estado real del proyecto — el mismo patrón de error que T-0005 ya
encontró con los nombres de campo de Ágora (ADR de esa tarea): (1) `WebSite` con `potentialAction`
(`SearchAction`), pero el sitio no tiene ninguna función de búsqueda real; (2) `LocalBusiness` con
`geo`, pero nunca se dieron coordenadas verificadas, solo una dirección de calle; (3) `/sitemap.xml`
como "índice que agrega los tres: contenedor, Ágora y Babel", verificado ahora con `curl` real contra
`agora.letiende.co/sitemap.xml` (200, `<urlset>` vacío) — Ágora sí tiene sitemap, pero **todavía bajo
su propio subdominio**, no bajo `/cartelera` (eso es T-11); Babel **no tiene sitemap propio** en
absoluto (T-12, `find` en el repo no encontró nada).

**Decisión.**
1. `esquemaSitioWeb()` no declara `potentialAction`. Se agrega el día que exista una búsqueda real.
2. `esquemaLocalBusiness()` no declara `geo`. `geo` es opcional en schema.org — omitirlo es correcto;
   inventar coordenadas no lo sería (CLAUDE.md, "no inventar hechos").
3. `/sitemap.xml` (servido dinámicamente desde `server.ts`, no `public/`) lista **solo** las tres
   rutas propias del contenedor (`/`, `/nosotros`, `/contacto`). Se convierte en el índice de los tres
   cuando T-11 (Ágora bajo `/cartelera`) y T-12 (sitemap de Babel) existan — antes de eso, agregar los
   otros dos enviaría a los buscadores una entrada rota y una con el dominio equivocado.
4. `/robots.txt` también se sirve dinámicamente desde `server.ts` (no `public/robots.txt`, que es
   estático y no puede variar por stage): comprueba `req.hostname` y responde `Disallow: /` en
   cualquier host que no sea exactamente `letiende.co` — mismo problema y mismo patrón de solución que
   `AnalyticsService` (ADR-015): un solo artefacto sirve a los dos stages.

**Razón.** Declarar datos estructurados que no corresponden a una funcionalidad real (búsqueda,
coordenadas, un sitemap agregado que en la práctica está roto) no ayuda al SEO/AEO — lo perjudica: un
validador de datos estructurados o un asistente de IA que confíe en el JSON-LD terminaría con
información falsa o enlaces rotos. Mejor un JSON-LD más chico y cierto que uno completo y falso.

**Consecuencia.** `tech-specs.md` §4.5 corregido con las tres decisiones, no solo el código. Cuando
T-11/T-12 avancen, `/sitemap.xml` de este repo pasa a ser un `<sitemapindex>` real — apuntado como
trabajo pendiente, no implementado a medias hoy.

### ADR-019 — Límite de tasa de `/api/contacto` en memoria de la Lambda, no DynamoDB ni WAF

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0009

**Contexto.** `CLAUDE.md` §5, A07 exige un límite por IP en el endpoint de contacto antes de
desplegarlo. Dos alternativas reales, ninguna gratis: una tabla nueva de DynamoDB con TTL (choca de
frente con PRD §9/D-1, "sin base de datos propia" — una decisión fundacional del proyecto), o una
regla de tasa de AWS WAF (vive en CloudFront, T-13, que no existe todavía — no se puede adelantar sin
inventar infraestructura que no está montada).

**Decisión.** Un `Map<string, number[]>` a nivel de módulo dentro de `contacto.ts`, con una ventana de
10 minutos y un tope de 5 peticiones por IP.

**Razón.** Es la única opción de las tres que no exige infraestructura nueva ni contradice una
decisión ya tomada. El costo es honesto, no oculto: el contador vive en la memoria del contenedor de
la Lambda — no se comparte entre invocaciones concurrentes (dos peticiones simultáneas en contenedores
distintos no se ven una a la otra) ni sobrevive un cold start (un contenedor reciclado empieza en
cero). Es una mitigación parcial contra un script simple de fuerza bruta, no una garantía contra un
ataque distribuido — eso sí necesitaría WAF.

**Consecuencia.** Cuando T-13 monte CloudFront, evaluar si una regla de tasa de WAF reemplaza o
complementa este límite en memoria (probablemente lo segundo: WAF protege contra volumen agregado,
la memoria de la Lambda sigue sirviendo de segunda capa barata). No se documenta como "pendiente de
arreglar" — es la decisión correcta para el tamaño de este proyecto hoy, revisable cuando la
infraestructura cambie, no un parche temporal.

### Hallazgo T-0009 — Lambdas con dependencias reales de `node_modules` necesitan esbuild, no `tsc` a secas

**Fecha:** 02/09/2026 · **Estado:** registrado (no es una decisión, es la aplicación de un hallazgo ya
verificado en Ágora)

**Contexto.** `contacto.ts` importa `@aws-sdk/client-ses`. Ágora ya documentó, verificado dos veces en
staging (`agora/server/bundle-lambdas.mjs`), que empaquetar una Lambda con `tsc` a secas y copiar un
subconjunto de `node_modules/**` a mano en `serverless.yml` dejaba algo fuera del paquete — la función
fallaba en el arranque con un 500 genérico de API Gateway, antes de que corriera el handler.

**Decisión.** Mismo patrón que Ágora: `server/bundle-lambdas.mjs` empaqueta `contacto.ts` con esbuild
en un único archivo autocontenido (`dist-server-bundle/contacto.js`, ~1.1 MB), sin depender de que
`node_modules/` viaje en el paquete. `package.json` gana `build:api` (`tsc -p server/tsconfig.json`),
`bundle:api` (`node server/bundle-lambdas.mjs`) y `test:api` (`vitest run`, contra un
`vitest.config.ts` nuevo en la raíz que solo mira `server/**/*.spec.ts` — separado de `ng test`, que
solo mira `src/**/*.spec.ts`, mismo patrón que `agora/vitest.config.ts`). `build:infra` ahora
encadena `build && build:api && bundle:api`.

**Consecuencia.** `npm run lint` amplió su alcance: `angular.json` restringía `lintFilePatterns` a
`src/**/*.ts` y `src/**/*.html` (de T-0004, cuando `server/` todavía no existía) — se agregó
`server/**/*.ts`, para que el backend también pase por ESLint. Verificado: `npm run build:infra` +
`npx serverless package --stage staging` sin errores, con `contacto.zip` conteniendo un solo archivo
(el bundle), y el CloudFormation generado con el rol IAM de SES acotado (`ses:SendEmail`/
`SendRawEmail`, `Resource: arn:...:identity/letiende.co`, verificado con `aws sesv2
list-email-identities` que `letiende.co` es en efecto un dominio verificado en la cuenta real).

**Incidente durante la verificación, ya cerrado con el humano:** para confirmar que el bundle
funcionaba de verdad, se invocó `dist-server-bundle/contacto.js` directamente con `node -e`, y este
entorno tenía credenciales reales de AWS configuradas (cuenta `696912647258`, la misma de
producción) — el envío de SES se completó de verdad, probablemente entregando un correo de prueba
obvio ("Visitante de prueba") a `contacto@letiende.co` (una dirección inventada para la prueba, no
configurada en el proyecto; `letiende.co` es dominio verificado en SES, así que cualquier alias bajo
él es válido para enviar/recibir del lado de SES). El humano decidió no investigar más allá de
confirmar que el dominio está verificado. **Lección para la próxima verificación de un handler con
efectos secundarios reales (SES, cualquier API externa):** usar las direcciones simulador de AWS
(`success@simulator.amazonses.com`) o quedarse con las pruebas mockeadas (`vitest`) — nunca invocar
el código real contra un servicio externo en un entorno con credenciales de producción sin
confirmarlo antes.

### ADR-020 — reCAPTCHA v3 en `/api/contacto`, agregado tras revisar el legado abandonado

**Fecha:** 02/09/2026 · **Estado:** aceptada · **Surgida en:** T-0009 (ampliación pedida por el
humano tras cerrar la tarea, mismo PR)

**Contexto.** El humano preguntó si el honeypot + límite de tasa (ADR-019) bastaban, o si hacía falta
reCAPTCHA. Antes de responder solo con criterio propio, se revisó el historial completo de git
(`git log --all -S"recaptcha" -i`) — el humano recordaba que una versión anterior ya lo tenía.
Hallazgo real, no en la versión de 2023 (la que sigue en producción hoy: cero menciones de
reCAPTCHA en esos commits), sino **dentro de la propia rama `2025`, ya abandonada**:
`external_resources/AWS_Lambda/libs/funciones.mjs` tenía una función real `validaReCAPTCHA` que
llamaba a `siteverify`, y un commit de seguridad (`a6937cf`, "fix: push de seguridad", 01/09/2026 —
el día antes de que este proyecto arrancara desde cero) decía explícitamente: *"el endpoint
`POST /mensaje` nunca debe ejecutarse sin un token reCAPTCHA válido previamente verificado"*.

**Pero ese hallazgo tenía un matiz importante**, verificado leyendo el código real, no solo el
commit de la nota: la verificación **nunca llegó a conectarse** con el envío del correo — eran dos
endpoints separados (`/recaptcha` y `/mensaje`), y `/mensaje` nunca llamaba a `validaReCAPTCHA`. La
nota de seguridad describía un arreglo pendiente, no algo que ya funcionara.

**Decisión.** Agregar reCAPTCHA v3 (invisible, sin fricción — developers.google.com/recaptcha/docs/v3,
verificado el 02/09/2026) a `/api/contacto`, esta vez sí en la misma petición que el envío, como la
nota de 2025 pedía y nunca llegó a implementar:
- `RecaptchaService` (`core/recaptcha/`) carga `api.js` con la site key y pide un token nuevo justo
  antes de cada envío (un token vale ~2 minutos y es de un solo uso).
- El handler verifica el token contra `POST https://www.google.com/recaptcha/api/siteverify` con la
  secret key del servidor, y rechaza si `success` es falso, si el puntaje es menor a 0.5 (el umbral
  recomendado por la documentación oficial) o si `action` no es `'contacto'` (evita reciclar un token
  de otro formulario). Se verifica **después** del honeypot (para no gastar la cuota de Google en un
  bot que ya se detectó gratis) y **antes** del consentimiento.
- Igual que Maps/GA4/SES: la site key (pública) va con marcador en `environments/` y se sustituye
  post-build (ADR-017); la secret key (privada, real) vive solo como `RECAPTCHA_SECRET_KEY` en el
  entorno de la Lambda — nunca en el bundle del navegador ni en ningún archivo versionado.

**Razón.** El honeypot solo atrapa bots que llenan cualquier campo del formulario visible; no hace
nada contra un script que ataque `/api/contacto` directamente. El límite de tasa en memoria (ADR-019)
es débil frente a IPs distribuidas. reCAPTCHA v3 sí pone una señal real de Google contra tráfico
automatizado, sin pedirle nada al visitante — y ya había precedente de que alguien, en este mismo
proyecto, había llegado a la misma conclusión y la había dejado como requisito de seguridad sin
terminar de implementar.

**Consecuencia.** Las tres capas de antiabuso (honeypot, límite de tasa, reCAPTCHA) ahora son
complementarias, no redundantes: cada una atrapa un tipo de abuso distinto que las otras dos no
cubren. El par de llaves ya lo dio el humano el mismo día (02/09/2026) — guardado como los secrets
`RECAPTCHA_SITE_KEY`/`RECAPTCHA_SECRET_KEY` de GitHub Actions (§5), verificado en vivo contra la API
real de `siteverify` con un token deliberadamente inválido: rechazó con 400 antes de llegar a SES.

### ADR-021 — Credenciales de AWS en CI: llaves de larga duración, no OIDC

**Contexto.** T-0010 (`docs/TODO.md`) dejaba el mecanismo de credenciales de AWS para el despliegue
desde GitHub Actions como decisión abierta, marcando OIDC hacia un rol de IAM como "preferible" a
llaves de acceso de larga duración, pero exigiendo verificar contra la documentación oficial de
`aws-actions/configure-aws-credentials` antes de implementar.

**Decisión.** Llaves de larga duración (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` como secrets del
repositorio), no OIDC. Decisión explícita del humano, consultada durante la tarea: se verificó primero
que la cuenta de AWS compartida (`696912647258`) no tiene ningún proveedor OIDC configurado todavía
(`aws iam list-open-id-connect-providers` → lista vacía, 02/09/2026) — adoptar OIDC aquí habría sido
el primer uso de ese mecanismo en la cuenta, y habría exigido crear un proveedor OIDC y un rol IAM
nuevos en una cuenta compartida con Ágora y Babel, dos proyectos que ya funcionan con el patrón de
llaves de larga duración.

**Por qué.** Consistencia operativa con Ágora y Babel (`.github/workflows/deploy.yml` de ambos,
verificado antes de escribir el de este proyecto) pesó más que la ventaja de seguridad de OIDC para
una cuenta que ya trae ese riesgo aceptado en dos stacks hermanos — introducir un segundo patrón de
autenticación (y un recurso IAM nuevo con alcance sobre toda la cuenta) solo para este repositorio
habría sido inconsistencia, no mejora, mientras Ágora y Babel sigan como están.

**Consecuencia.** Si en el futuro se decide migrar a OIDC, debe ser un cambio de los tres repositorios
a la vez (Ágora, Babel, letiende.co), no uno aislado — de lo contrario la cuenta termina con dos
mecanismos de autenticación de CI conviviendo sin necesidad.

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

**Agregadas en T-0004** (02/09/2026), pruebas continuas y ganchos de pre-commit:

| Paquete | Rango en `package.json` | Resuelta el 02/09/2026 |
|---|---|---|
| `eslint` | `^10.9.0` | 10.9.1 |
| `angular-eslint` | `22.2.0` | 22.2.0 — instalado con `ng add @angular-eslint/schematics`, la vía oficial |
| `typescript-eslint` | `8.67.0` | 8.67.0 |
| `husky` | `^9.1.7` | 9.1.7 |
| `lint-staged` | `^17.4.1` | 17.4.1 |
| `prettier` | `^3.8.1` (ya estaba) | 3.9.6 |

No se fijó ninguna versión a mano: todas llegaron dentro del rango `^` que dejó
`npx @angular/cli@22 new`, que ya apunta a "última estable" por sí solo.

**Agregadas en T-0007** (02/09/2026), `serverless.yml` (solo `ssr`):

| Paquete | Rango en `package.json` | Resuelta el 02/09/2026 |
|---|---|---|
| `@codegenie/serverless-express` | `^5.0.0` | 5.0.0 — mismo mayor que Ágora, que sigue en 4.x. `engines.node: ">=24"` de la 5.x expuso que el `PATH` de este `Bash` no interactivo resolvía a Node 22, no 24 (ver el gotcha "Hallazgo T-0007" en §7) — la primera instalación, sin fijar versión, trajo silenciosamente la 4.17.1 |
| `serverless` (Serverless Framework) | `^4.41.1` | 4.41.1 — Ágora y Babel siguen en 4.39.0; CLAUDE.md §2 ya apuntaba a 4.41.x como objetivo |

**Agregadas en T-0009** (02/09/2026), Lambda de contacto:

| Paquete | Rango en `package.json` | Resuelta el 02/09/2026 |
|---|---|---|
| `@aws-sdk/client-ses` | `^3.1125.0` | 3.1125.0 |
| `@types/aws-lambda` | `^8.10.163` | 8.10.163 — mismo paquete que Ágora, versión más reciente |
| `esbuild` | `^0.28.2` | 0.28.2 — mismo mayor que Ágora (`^0.28.1`), ya estaba presente de forma transitiva (Angular/Serverless lo traen), se agregó explícito porque `server/bundle-lambdas.mjs` lo importa directamente |

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
| `letiende-co-staging` (T-0010) | Stack real desplegado el 03/09/2026 vía CI (PR #14) — HTTP API `dhffew1x85` → `https://dhffew1x85.execute-api.us-east-1.amazonaws.com`. Sin dominio propio todavía (eso es T-0011/T-13) |
| `letiende-co-production` (T-0010) | Stack real desplegado el 03/09/2026 al fusionar el PR #14 a `main` (`desplegar-produccion`, disparado solo por `push` a `main`, confirmado con `gh run view --json jobs`: `build-y-test`/`desplegar-staging` quedaron `skipped` en ese run) — HTTP API `uvnookbox7` → `https://uvnookbox7.execute-api.us-east-1.amazonaws.com`. El sitio real de producción sigue siendo el CloudFront actual (`E33QAN86FY24JZ`, ADR-006); este stack existe pero **nada apunta a él todavía** — eso es el cutover de T-0011/T-14/T-15. `robots.txt` responde `Disallow: /` al pegarle directo a la URL cruda de `execute-api` (el guard de host la trata como no-canónica, mismo patrón que Analytics — no es un bug, es la razón exacta por la que hay que probar por `staging.letiende.co` una vez exista, no por la URL cruda) |
| Certificado ACM `staging.letiende.co` (T-0011) | `arn:aws:acm:us-east-1:696912647258:certificate/24668c16-bc5b-420b-ab17-9a7f6b5ac8ce` — `ISSUED`, emitido el 03/09/2026, validación DNS automática por CloudFormation contra la zona `Z010633738KAGFIPOZVEW`. Verificado con `aws acm describe-certificate`, no solo con el estado del stack |
| CloudFront de staging (T-0011) | `EQW683KP4VXIV` → `d2hrzsuw04322v.cloudfront.net`, alias `staging.letiende.co` (registro `A` alias en Route 53, mismo cambio). Verificado con `curl` real: `/` → 200 HTML, `/robots.txt` → `Disallow: /`, `/cartelera/` y `/libros/` llegan de verdad a los orígenes reales de Ágora/Babel staging (404/302 desde esos backends, no desde CloudFront — esperado, T-11/T-12 todavía no existen), `/assets/*` → 200 tras el fix del prefijo (ver más abajo) |
| CloudFront de producción — nueva (T-0011) | `ER22S2WADMM83` → `d1o48r8wylv3sh.cloudfront.net`. **Sin alias todavía** (`letiende.co`/`www.letiende.co` siguen en la distribución actual `E33QAN86FY24JZ` — CloudFront no permite el mismo alias en dos distribuciones a la vez; el alias se mueve en el cutover real de T-14/T-15, ADR-006). Usa el certificado ya existente de `letiende.co` (`ca9cd231-…`) cuando se le asigne el alias — no se creó uno nuevo, el que ya había estaba `ISSUED` y no exclusivo de una distribución |
| Bucket `letiende-assets` — política (T-0011) | Ampliada el 03/09/2026 (autorizado explícitamente por el humano) para permitir `s3:GetObject` vía Origin Access Control a las tres distribuciones: la actual de `assets.letiende.co` (`E3RUGH3MUSR7PS`) y las dos nuevas de este stack (`EQW683KP4VXIV`, `ER22S2WADMM83`). El bucket solo tiene contenido viejo de la rama `2025` abandonada (carpetas `data/`, `flags/`, `logos/`, 97 objetos, confirmado con `s3 ListObjectsV2`) — el humano confirmó que se puede limpiar y reutilizar sin problema; la limpieza en sí queda pendiente, no se hizo en esta tarea |
| Google Analytics 4 | Measurement ID dado por el humano el 02/09/2026, reemplaza la integración legacy (Universal Analytics). **No versionado** (ADR-017): vive como secreto `GOOGLE_ANALYTICS_ID` en GitHub Actions del repositorio. Solo dispara en el host `letiende.co` (ADR-015) |
| Google Maps Embed API | Llave dada por el humano el 02/09/2026, pública por diseño y restringida por dominio del lado de Google Cloud. **No versionada** (ADR-017): vive como secreto `GOOGLE_MAPS_API_KEY` en GitHub Actions del repositorio. **Pendiente de verificar por el humano:** que la restricción de referrer HTTP en Google Cloud Console cubra `letiende.co`, `staging.letiende.co` y `localhost` — no se puede confirmar desde este entorno |
| reCAPTCHA v3 (`/api/contacto`) | Par de llaves dado por el humano el 02/09/2026 (registrado en `google.com/recaptcha/admin`, dominios `letiende.co`/`staging.letiende.co`/`localhost`). Site key: secreto `RECAPTCHA_SITE_KEY` en GitHub Actions (pública por diseño, mismo mecanismo de marcador que Maps/GA4 — ADR-017). Secret key: secreto `RECAPTCHA_SECRET_KEY`, **nunca en el bundle**, solo en el entorno de la Lambda `contacto`. Verificado en vivo contra la API real de Google (`siteverify`) con un token deliberadamente inválido: rechazó con 400 antes de llegar a SES — confirma que la integración real funciona sin arriesgar un envío de correo de prueba |

**Nombres de stack esperados:** `letiende-co-staging` y `letiende-co-production` — confirmado
(T-0007): `serverless.yml` declara `service: letiende-co`, y Serverless Framework arma el nombre del
stack como `${service}-${stage}`. Todavía no desplegado, solo empaquetado.

**Secrets de GitHub Actions (T-0010, `.github/workflows/deploy.yml`), verificado con
`gh secret list` el 03/09/2026 — los 8 ya están configurados:**

| Secret | Estado | Uso |
|---|---|---|
| `GOOGLE_ANALYTICS_ID` | ✅ configurado (T-0006) | `postbuild`, ambos stages |
| `GOOGLE_MAPS_API_KEY` | ✅ configurado (T-0006) | `postbuild`, ambos stages |
| `RECAPTCHA_SITE_KEY` | ✅ configurado (T-0009) | `postbuild`, ambos stages |
| `RECAPTCHA_SECRET_KEY` | ✅ configurado (T-0009) | entorno de la Lambda `contacto`, ambos stages |
| `SERVERLESS_LICENSE_KEY` | ✅ configurado por el humano el 03/09/2026 | `serverless package`/`deploy`, todos los jobs |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | ✅ configurados el 03/09/2026 — access key del usuario IAM personal `@ocastelblanco` (mismo patrón que Ágora/Babel, ADR-021) | `serverless package`/`deploy`, todos los jobs |
| `SES_REMITENTE` | ✅ configurado el 03/09/2026 — `info@letiende.co`, identidad de correo ya verificada en SES (`aws sesv2 list-email-identities`) | entorno de la Lambda `contacto`, ambos stages |

**Nota de seguridad sobre `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`:** el usuario `@ocastelblanco`
pertenece al grupo IAM `Administrador` — es decir, estos dos secrets son credenciales de **admin
completo** sobre la cuenta compartida (Ágora, Babel, Comandante), no credenciales acotadas al
despliegue de este stack. Decisión explícita del humano tras conocer ese detalle (mismo riesgo que ya
existe hoy en Ágora y Babel, que usan el mismo patrón) — ver ADR-021. Si algún día se decide acotar
esto, tendría que ser un usuario IAM dedicado con una política de solo lo que `serverless deploy`
necesita, migrado en los tres repositorios a la vez.

Antes de tener los 8 secrets, se verificó con un PR real (T-0010, `docs/TODO.md`) que su ausencia hace
fallar `build-y-test` en "Verificar sintaxis de infraestructura" y que, por `needs: build-y-test`,
ningún job de despliegue se dispara (comportamiento correcto). **Con los 8 secrets ya configurados, se
volvió a correr el mismo workflow (PR #14) y esta vez el despliegue real a staging se completó**: los
tres jobs (`build-y-test`, `desplegar-staging`) en verde, `serverless deploy --stage staging` creó el
stack `letiende-co-staging` de verdad. Verificado además con `curl` real, no solo con el resultado del
job: `GET /` → 200 HTML, `GET /robots.txt` → `Disallow: /`, `GET /ruta-inventada` → 404 real. Y el
gotcha de `${env:X, ''}` (tech-specs.md §9) se descartó por CLI, no por fe:
`aws lambda get-function-configuration --function-name letiende-co-staging-contacto` confirma
`SES_REMITENTE`/`RECAPTCHA_SECRET_KEY` con su valor real, no cadena vacía.

**Corrección a `tech-specs.md` §9:** la tabla de esa sección listaba también `SES_DESTINATARIO` y
`URL_BASE_APP` como secrets necesarios. Ninguno de los dos se usa en el código real: `contacto.ts`
envía el correo a `remitente` mismo (`Destination: { ToAddresses: [remitente] }`, no a un buzón
distinto), y la URL canónica del sitio es la constante `DOMINIO` de `src/app/core/seo/dominio.ts`
(`'https://letiende.co'`), no una variable de entorno. Corregido en `tech-specs.md` — no se agregaron
al workflow para no cablear secretos que ningún código lee.

**Por crear — T-0011 completada, todo lo de esta lista ya existe** (ver la tabla de arriba). Lo único
que sigue pendiente, y no es parte de T-0011, es el alias de producción (`letiende.co`/
`www.letiende.co` → distribución nueva `ER22S2WADMM83`) y la limpieza del contenido viejo del bucket
`letiende-assets` — ambos quedan para el cutover real (T-14/T-15) y para una tarea de limpieza aparte.

**Hallazgo real de T-0011, no anticipado en `tech-specs.md` §7.2:** el bucket `letiende-assets` no
tiene prefijo `assets/` en sus keys (son `logos/…`, `data/…`, `flags/…`), pero el proxy expone ese
contenido bajo `/assets/*`. Sin quitar el prefijo antes de reenviar a S3, la petición
`/assets/logos/x.svg` buscaba la key `assets/logos/x.svg` (no existe) y S3 respondía **403** (no 404:
comportamiento esperado de S3 cuando el solicitante no tiene `s3:ListBucket`, para no revelar la
estructura del bucket — se confirmó que no era un problema de permisos antes de escribir el fix).
Corregido con una `AWS::CloudFront::Function` (`FuncionQuitarPrefijoAssets`, evento `viewer-request`)
asociada al behavior `/assets/*`, que quita el prefijo antes de reenviar al origen. Mismo patrón de
"la planeación asumía algo nunca verificado contra el comportamiento real" que ADR-005/012/013/018.

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

**Vista (patrón de componente de página):** `InicioComponent` (T-0005,
`src/app/features/inicio/inicio.ts`) es la referencia real, no un ejemplo inventado:

```ts
@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html',
})
export class InicioComponent {
  private readonly eventosPublicos = inject(EventosPublicosService);

  protected readonly proximosEventos = computed(() => {
    const recurso = this.eventosPublicos.cartelera;
    return recurso.hasValue() ? recurso.value().slice(0, 3) : [];
  });
}
```

**`resource.value()` lanza en estado de error — verificado en vivo en T-0005, no solo documentado
por Angular.** El patrón original de esta memoria (`datos()?.campo ?? []`) era **insuficiente**: el
encadenamiento opcional protege el estado previo a la primera respuesta (`value()` en `undefined`,
no lanza), pero no el estado de error, donde `value()` relanza el error subyacente antes de que
`?.`/`??` puedan actuar. La única lectura no explosiva es `hasValue()` primero, como en el ejemplo de
arriba. `GET /api/eventos-publicos` de Ágora devuelve el arreglo sin envoltorio (verificado en su
handler), así que aquí `hasValue() ? recurso.value() : []` — sin un `.campo` intermedio.

**Pruebas aisladas.** `angular.json` lleva `"test": { "options": { "isolate": true } }`.
Sin eso, un `vi.mock` de un archivo se filtra a los demás y las pruebas fallan según el orden.

**Degradación de la portada.** Si el API de Ágora no responde, la portada se renderiza sin la sección
de eventos. Nunca se cae entera por un tercero.

**SEO por página (T-0008, `core/seo/`):** todo componente de página llama `MetaService.actualizar()` y
`JsonLdService.establecer()` en su propio constructor — nunca en `ngOnInit` ni en `afterNextRender`.
Tienen que correr durante el SSR para que el HTML que ve un buscador ya traiga el título, la
descripción y el JSON-LD reales; `afterNextRender` (como usa `AnalyticsService`, a propósito) solo se
ejecuta en el navegador y llegaría tarde para esto. Si la página depende de un recurso asíncrono (la
portada, con los eventos de Ágora), el JSON-LD se actualiza dentro de un `effect()`, no de una llamada
única en el constructor — si no, se congela con el valor que había antes de que el recurso resolviera.

```ts
constructor() {
  this.meta.actualizar({ titulo: '…', descripcion: '…', ruta: '/…' });
  this.jsonLd.establecer('ld-pagina', [esquemaX(), esquemaY()]);
}
```

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
| ~~Staging indexable~~ | **Resuelto (T-0008).** `GET /robots.txt` en `server.ts` responde `Disallow: /` en cualquier host que no sea `letiende.co` — ver ADR-018 |
| Ágora compilada con `--base-href /cartelera/` abierta por su URL cruda | Los activos se piden bajo el prefijo y la página se ve rota. A partir de T-11 se prueba por `staging.letiende.co/cartelera` |
| Copiar un directorio de skill con `cp -RL` desde `~/.claude/skills/` | Arrastra `.omc/state/` (estado de sesión de **otra** sesión) y `__pycache__/`. Ninguno de los dos debe versionarse. Se podó a mano tras copiar y se reforzó `.gitignore` con `**/.omc/`, `**/__pycache__/`, `**/*.pyc` |
| Mapa del sitio de Ágora emitiendo direcciones de `agora.letiende.co` | Debe emitirlas con el prefijo `/cartelera` tras el cutover |
| Babel no tiene mapa del sitio | Hay que agregárselo (T-12) |

Encontrado durante T-0003 (barra de navegación):

| Situación | Solución |
|---|---|
| Agregar rutas a `app.routes.ts` sin una entrada `path: ''` | El build deja de prerenderizar la raíz (`ng build` reporta menos rutas de las esperadas) y el servidor SSR responde **404 en `/`**, no un error visible en el build. Ver ADR-010 |

Encontrado durante T-0004 (ESLint):

| Situación | Solución |
|---|---|
| `ng add @angular-eslint/schematics` sobre el panel del menú móvil de T-0003 reportó `interactive-supports-focus`: un `<div>` con `(keydown.escape)` pero sin ser focuseable | No se silenció la regla — el hallazgo era real. Se agregó `role="dialog"`, `aria-modal="true"`, `aria-label` y `tabindex="-1"` al panel: el patrón correcto de diálogo modal, no un parche para pasar el linter |

Encontrado durante T-0005 (portada):

| Situación | Solución |
|---|---|
| Los nombres de campo de `EventoEnCartelera` en `tech-specs.md` (`titulo`, `fechaInicio`, `imagenAfiche`, `lugar`) eran adivinados de la sesión de planeación original, no verificados | Ninguno existe en la respuesta real de Ágora. Corregidos contra `agora/src/app/core/models/evento.model.ts` (interfaz `EventoPublico`): son `nombre`, `fechaHora`, `imagenUrl` — y `lugar` no existe, Ágora no rastrea un lugar por evento. Ver ADR (docs/tech-specs.md §4.3) |
| `resource.value()` de `httpResource()` **lanza** cuando el recurso está en estado de error, en vez de devolver `undefined` | El encadenamiento opcional (`?.`, `??`) no protege nada aquí — la excepción salta antes. Usar `resource.hasValue()` como guardia primero. Ver ADR-013 |
| `RenderMode.Prerender` en una ruta que depende de datos remotos (la portada, con eventos de Ágora) | El `ng build` hace la llamada real en tiempo de build y la congela en el HTML hasta el próximo despliegue — verificado con `curl` contra la API real. Esa ruta necesita `RenderMode.Server`. Ver ADR-012 |
| `HttpClient` se inyecta sin `provideHttpClient()` explícito en `app.config.ts` | No es un descuido ni hace falta agregarlo: verificado con un diagnóstico desechable que la inyección funciona igual (Angular 22 parece proveerlo por defecto). Ver ADR-014 |

Encontrado durante T-0006 (páginas institucionales), en revisión humana tras el PR:

| Situación | Solución |
|---|---|
| `public/favicon.ico` seguía siendo el genérico de `ng new` (T-0001) — nunca se detectó como faltante porque el archivo ya existía en `public/`, así que la tarea de íconos (T-0006) copió el resto de los archivos de Ágora pero pasó por alto reemplazar este | Reemplazado por el `favicon.ico` real de Ágora (`bef745f6b7cac5d3465f7887d37c0256` vs. el anterior `05bcfe9a02b93e1c5a5da14bfda8c41f`). **Lección:** que un archivo ya exista en el repo no significa que sea el correcto — hay que comparar contenido, no solo presencia |

Encontrado durante T-0008 (capa de SEO/AEO):

| Situación | Solución |
|---|---|
| Necesitábamos que la ruta comodín (`NoEncontradaComponent`) respondiera HTTP 404 real, no 200 | `@angular/ssr` sí lo soporta oficialmente: `ServerRoute` tiene un campo `status?: number` (verificado leyendo `node_modules/@angular/ssr/types/ssr.d.ts`, no asumido). En `app.routes.server.ts`: `{ path: '**', renderMode: RenderMode.Server, status: 404 }`. Verificado con `curl` real contra una ruta inventada tras `npm run build` + `serve:ssr` |
| El comodín de `app.routes.server.ts` era `RenderMode.Prerender` desde T-0005 (ADR-012) y ahí caían `nosotros` y `contacto` sin querer | Con `NoEncontradaComponent` agregado a `app.routes.ts`, el comodín pasó a significar "ruta no encontrada" — tiene que ser `RenderMode.Server` (no se puede prerenderizar un `**` con caminos infinitos). `nosotros` y `contacto` ahora tienen su propia entrada explícita en `app.routes.server.ts`, en vez de caer en el comodín |
| `tech-specs.md` §4.2 documentaba `/contacto` como `SSR` desde la planeación original | Nunca fue cierto en el código: desde T-0006, `/contacto` ya caía bajo el comodín `Prerender` (el build ya reportaba "Prerendered 2 static routes"). Nadie lo notó hasta ahora porque funcionaba igual — corregido en la documentación, no en el código |

Encontrados durante T-0001 (andamiaje), **verificados en esta máquina**:

| Situación | Solución |
|---|---|
| ~~`node` global resolvía a v22.23.2 (`~/.hermes/node/bin/node`, antepuesto en `PATH` por Hermes, otra herramienta de IA instalada en la máquina)~~ | **Resuelto (02/09/2026).** Se agregó `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` al final de `~/.zshrc` — gana sobre `~/.local/bin` (Hermes) y sobre el `node` sin versionar de Homebrew (v26.8.1) por ser el último `PATH=` que se ejecuta al abrir la shell. No se tocaron los symlinks de Hermes: es un cambio de orden en `PATH`, reversible quitando esa línea. `node --version` en una shell nueva ya da 24.20.0 |
| **Hallazgo T-0007:** la línea de `~/.zshrc` de arriba no cubre **todas** las formas de invocar un comando en esta máquina — `zsh` solo lee `~/.zshrc` en shells interactivas. Un `Bash` no interactivo (como el que usa este mismo agente para ejecutar comandos) seguía resolviendo `node --version` a v22.23.2, y eso hizo que `npm install @codegenie/serverless-express` sin versión fijada instalara silenciosamente la v4.x en vez de la v5.x (`engines.node: ">=24"` de la v5 no se cumplía) — sin error, sin aviso, solo una versión distinta a la que después se usó en el resto del proyecto | Se agregó la misma línea de `PATH` a `~/.zshenv` (no existía), que sí se lee en **toda** invocación de `zsh`, interactiva o no. Verificado con `zsh -c 'node --version'` antes y después. Curiosidad sin resolver: una shell de **login** (`zsh -lc`) resuelve a v26.8.1 (otro `node` de Homebrew, sin versión fijada) — algo en `~/.zprofile` gana sobre `~/.zshenv` en ese caso específico; no se tocó porque no bloqueaba esta tarea, pero puede volver a morder si algún flujo futuro invoca una shell de login. Mientras tanto, cualquier instalación de un paquete con requisito de versión de Node se hizo con `PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm install …` explícito, no confiando en el `PATH` del entorno |
| Dos instalaciones globales de Angular CLI en la máquina, con distinto *prefix* de npm (`~/.local` y `/opt/homebrew`), una de ellas (`/opt/homebrew`) desactualizada a 20.3.5 | **Actualizada (02/09/2026)** a 22.1.6, junto con `@angular-devkit/architect`, `@angular-devkit/core`, `@angular-devkit/schematics` y `@schematics/angular` — estaban instalados como paquetes globales sueltos, no solo como dependencia interna de `@angular/cli`. La de `~/.local` (la que gana en `PATH`) ya estaba en 22.1.6. No se eliminó ninguna de las dos instalaciones, solo se actualizaron ambas; consolidarlas en una sola es una decisión de la máquina, no de este proyecto |

Encontrado durante T-0002 (README y `LICENSE`), en el repositorio de **Ágora**, no en este:

| Situación | Solución |
|---|---|
| El badge y el README de Ágora dicen `license-MIT`, pero su archivo `LICENSE` real es Apache License 2.0 (201 líneas, encabezado `Apache License Version 2.0` — verificado leyendo el archivo, no el badge) | No se copió el `LICENSE` de Ágora como decía la tarea original. Se usó el de Babel, que sí es MIT de verdad (21 líneas, coincide con su propio badge). La inconsistencia de Ágora **no se corrigió** — es un repositorio distinto, fuera del alcance de esta tarea — pero queda anotada aquí por si alguien la resuelve más adelante |
| TypeScript 6.x deprecó `baseUrl` (error TS5101) | Los `paths` de `tsconfig.json` van **sin** `baseUrl`, con rutas relativas explícitas (`"./src/app/core/*"`, no `"src/app/core/*"`) — si no, TS5090 |
| ~~`security.allowedHosts` de `angular.json` se hornea en el bundle del servidor SSR — pendiente antes de T-13/T-15~~ | **Resuelto (T-0007).** `@angular/ssr` sí soporta una variable de entorno para esto en tiempo de ejecución: `NG_ALLOWED_HOSTS` (verificado leyendo `node_modules/@angular/ssr/fesm2022/node.mjs`, función `getAllowedHostsFromEnv()`, que gana sobre el `allowedHosts` horneado de `angular.json`). `serverless.yml` la fija por función, con el host `execute-api` de cada stage — verificado invocando `server/ssr/handler.mjs` con un evento de API Gateway simulado: sin la variable, 400 "Header host... is not allowed"; con ella, 200. El dominio propio (`letiende.co`/`staging.letiende.co`) se agrega recién en T-13, en el mismo cambio que lo monte |
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

---

**02/09/2026 — T-0004: pruebas continuas y ganchos de pre-commit.**

En rama `feature/pruebas-continuas-pre-commit` (desde `main`):

- **ESLint** vía `ng add @angular-eslint/schematics` — la vía oficial del propio equipo de Angular,
  no una configuración manual. Generó `eslint.config.js`, el target `lint` en `angular.json`, y el
  script `npm run lint` en `package.json` (ya venía incluido por el schematic, no hubo que agregarlo
  a mano).
- **Un hallazgo real de accesibilidad**, no ruido: el linter marcó el panel del menú móvil de T-0003
  (`interactive-supports-focus` — un `<div>` con `(keydown.escape)` pero sin ser focuseable). Se
  corrigió con `role="dialog"`, `aria-modal="true"`, `aria-label` y `tabindex="-1"` — el patrón
  correcto de diálogo modal, no un `eslint-disable` para pasar el linter.
- **Prettier** ya estaba en el andamiaje de T-0001; se agregaron los scripts `format`/`format:check`
  y se reformateó todo `src/**` una vez (10 archivos, la mayoría generados por el CLI que nunca
  habían pasado por Prettier).
- **Pre-commit con `husky` + `lint-staged`**, no el framework Python `pre-commit` que trae por
  defecto `/slim-continuous-testing` — decisión documentada en ADR-011, junto con la de no usar
  GitGuardian/`detect-secrets` para el escaneo de secretos. En su lugar,
  `scripts/verificar-secretos.mjs`: sin dependencias, cubre los patrones de token que se han usado
  a mano toda la sesión (AWS, llaves privadas, OpenAI/Stripe, GitHub, Slack, Google).
- **El DoD se verificó de punta a punta, no se dio por sentado por la configuración:** se creó un
  archivo con un error real de `tsc`, se intentó commitear, el gancho lo rechazó (`husky - pre-commit
  script failed`), se confirmó con `git log`/`git status` que el commit **no existía**; se corrigió
  el archivo, se volvió a commitear, y esta vez pasó. El archivo de prueba se descartó después
  (`git reset --soft` + borrar el archivo), nunca llegó a la rama real.
- El escáner de secretos también se probó con un hallazgo real plantado (`AKIA...` falso): lo detectó
  y bloqueó, antes de confiar en que "sin hallazgos" significaba que el script funcionaba.

Verificado: `npm run lint` limpio, `npm run format:check` limpio, `npm run build --
configuration=production` sin errores, `npm test -- --watch=false` 9/9, `tsc --noEmit` limpio en
`app` y `spec`.

**Próxima tarea sugerida:** abrir el PR de `feature/pruebas-continuas-pre-commit`; motor JIT
recalculado — T-0005 (portada) sigue activa, se agrega **T-0006** (páginas institucionales: Nosotros
y Contacto, T-5 del roadmap) — su contenido debe salir estrictamente de `PRD.md`, sin inventar
dirección, horarios ni cifras.

---

**02/09/2026 — T-0005: portada con próximos eventos.**

En rama `feature/portada-proximos-eventos` (desde `main`). Antes de escribir nada, se verificó contra
el código real de Ágora en vez de confiar en lo que `tech-specs.md` ya documentaba — y ese chequeo
encontró que la documentación estaba mal:

1. **Los nombres de campo de `EventoEnCartelera` eran adivinados**, escritos en la sesión de
   planeación original sin leer el código de Ágora. `nombre`/`fechaHora`/`imagenUrl` reemplazan a
   `titulo`/`fechaInicio`/`imagenAfiche`; `lugar` se eliminó por completo, no existe (Ágora no
   rastrea un lugar por evento). Corregido en `tech-specs.md` §4.3, no solo en el código nuevo.

2. **`resource.value()` lanza en estado de error.** La prueba que simula Ágora caída
   (`HttpTestingController`, `peticion.error(...)`) hizo explotar el `computed()` con el patrón de
   encadenamiento opcional que `MEMORY.md`/`tech-specs.md` ya recomendaban desde la planeación
   original. `hasValue()` como guardia antes de `value()` es el patrón correcto — ADR-013, con la
   guía de ambos documentos corregida.

3. **`RenderMode.Prerender` en la portada era el modo equivocado.** El build hacía una llamada real
   a `https://agora.letiende.co/api/eventos-publicos` en tiempo de compilación (confirmado con
   `curl` directo contra la API de producción — sí hay salida a internet desde este entorno) y
   congelaba ese resultado en el HTML hasta el siguiente despliegue. Cambiado a `RenderMode.Server`
   para `''`, manteniendo `Prerender` para el resto vía el comodín — ADR-012.

4. **Hallazgo colateral:** `HttpClient` se inyecta sin `provideHttpClient()` en `app.config.ts`,
   verificado con un servicio de diagnóstico desechable montado temporalmente en `App` y descartado
   antes de commitear nada (`git checkout -- src/app/app.ts`) — ADR-014.

Verificado en vivo, no solo con mocks: `curl` contra la API real de Ágora confirmó que hoy no hay
eventos publicados (arreglo vacío), y la portada respondió 200 sin la sección de eventos —
comportamiento correcto, no un bug. `npm run lint`, `format:check`, build de producción, 13/13
pruebas y `tsc --noEmit` (app y spec), todos limpios tras las tres correcciones.

**Próxima tarea sugerida:** abrir el PR de `feature/portada-proximos-eventos`; motor JIT
recalculado — T-0006 (páginas institucionales) sigue activa, se agrega **T-0007** (`serverless.yml`
del contenedor, solo la función `ssr` — T-7/contacto queda para después, sin handler que empaquetar
todavía).

---

**02/09/2026 — T-0006: páginas institucionales + íconos/manifest + Google Maps + GA4.**

En rama `feature/paginas-institucionales-nosotros-contacto` (desde `main`). El humano pidió ampliar
T-0006 con tres cosas dentro de la misma tarea: íconos y `manifest.webmanifest`, una integración con
información de Le Tiende de Google (Business Profile o Maps), y Google Analytics 4 en reemplazo de la
integración legacy. Antes de escribir código se investigó contra documentación oficial y actualizada
de Google (`developers.google.com`), y se le hicieron tres preguntas de decisión al humano — sin esas
respuestas no se podía avanzar sin inventar datos, algo que `CLAUDE.md` prohíbe explícitamente:

1. **Dirección y horarios** — el humano los dio directamente como texto verificado, en vez de esperar
   una sincronización automática. Ver ADR-016 sobre por qué se descartó la API de Business Profile.
2. **Mapa** — Google Maps Embed API con llave pública, la opción recomendada dado que ya había
   dirección real.
3. **GA4** — el humano ya tenía un Measurement ID, no hizo falta crear la propiedad.

Trabajo real:

- **Íconos y `manifest.webmanifest`**: copiados de `agora/public/` (`favicon-16x16.png`,
  `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
  `logo_negro_sin_fondo.svg`) — ya documentados como contrato en `DESIGN.md` §9 desde la planeación
  original, solo faltaba ejecutarlos. `manifest.webmanifest` adaptado con nombre y descripción propios
  de Le Tiende, no los de Ágora.
- **`core/negocio/datos-negocio.ts`**: única fuente de verdad de dirección y horarios, consumida por
  `PiePagina` (que ya no dice "por confirmar" para esos dos campos — sí sigue así para redes sociales,
  que el humano no dio), `ContactoComponent` y el `<iframe>` del mapa.
- **`NosotrosComponent`**: contenido derivado estrictamente de `PRD.md` §1 (la frase "tres cosas
  buenas..."), §2 (los tres servicios bajo un techo), §3 (audiencia) y §10 (glosario) — sin inventar
  nada que no estuviera ahí. Enlaces `<a href>` planos a `/cartelera` y `/libros` (no `routerLink`,
  mismo patrón que la barra de navegación de T-0003).
- **`ContactoComponent`**: formulario reactivo completo con las tres validaciones bloqueantes exigidas
  por el DoD original, mapa incrustado (`DomSanitizer.bypassSecurityTrustResourceUrl` sobre una URL
  construida solo con constantes propias — nunca con datos de la petición o del visitante, así que no
  es el caso que prohíbe `CLAUDE.md` §5 A03), y un `signal<EstadoEnvio>` que muestra en pantalla,
  después de un envío válido, que `POST /api/contacto` (T-7) todavía no existe.
- **`AnalyticsService`** (`core/analytics/`): carga `gtag.js` con `afterNextRender` (nunca en el SSR)
  y solo en el host `letiende.co` — ver ADR-015 sobre por qué hacía falta esa guarda.
- **`PaginaPendiente` eliminado por completo** (`git rm`): ADR-010 ya avisaba que no debía sobrevivir
  más allá de esta tarea, y con `/nosotros` y `/contacto` apuntando a componentes reales, ninguna ruta
  volvía a usarlo.

Verificado en vivo, no solo con pruebas unitarias: build de producción (`ng build
--configuration=production`, prerenderiza `/nosotros` y `/contacto`), servidor SSR real
(`node dist/letiende-co/server/server.mjs`) con `curl` 200 en `/`, `/nosotros`, `/contacto`,
`manifest.webmanifest` y los íconos nuevos, el mapa embebido con la dirección real codificada
correctamente en el HTML servido por el servidor, y cero rastro de `googletagmanager` en el HTML del
SSR (correcto: `AnalyticsService` solo actúa en el navegador). Además, con el navegador real (Chrome,
`ng serve`): el mapa renderiza el punto correcto de Bogotá, las cuatro validaciones del formulario
bloquean el envío una por una (nombre vacío, correo vacío, correo inválido, consentimiento sin marcar),
el envío válido muestra el aviso de "backend pendiente", y la consola queda limpia (0 errores, 0
componentes de hidratación saltados). `npm run lint`, `tsc --noEmit` (app y spec) y 25/25 pruebas,
todos limpios.

**Pendiente para el humano, fuera del alcance de esta sesión:** verificar en Google Cloud Console que
la llave de Maps tenga restricción de referrer HTTP cubriendo `letiende.co`, `staging.letiende.co` y
`localhost` — no se puede confirmar ni configurar desde este entorno. También queda sin resolver, a
propósito, si GA4 necesita un banner de consentimiento de cookies: `tech-specs.md` §6 ya traía la nota
"evaluar alternativa sin rastreo" para Maps, y esta sesión no construyó ningún mecanismo de consentimiento
porque no se pidió — es una decisión de producto pendiente, no un olvido técnico.

**Próxima tarea sugerida:** abrir el PR de `feature/paginas-institucionales-nosotros-contacto`; motor
JIT recalculado — T-0007 (`serverless.yml`) sigue activa, se agrega **T-0008** (capa de SEO/AEO, T-6
del roadmap: `MetaService`, JSON-LD, `robots.txt`, mapa del sitio), que ahora sí tiene datos reales de
`core/negocio/datos-negocio.ts` para el `LocalBusiness` de la portada y de `/contacto`.

---

**02/09/2026 (más tarde) — Cierre de T-0006: fuga real de secreto en el PR, historial reescrito.**

El PR de T-0006 se fusionó (`#10`) y la rama remota se borró — limpieza local hecha (`git branch -d`,
`git fetch --prune`). Antes de eso, un incidente real que vale la pena que quede escrito para quien
retome el proyecto:

- GitGuardian marcó `environment.ts`/`environment.production.ts` con una posible llave de Google API.
  **El hallazgo era real, no un falso positivo:** el commit `feat(contacto)` incluyó por error las
  llaves reales de Maps/GA4 (archivos que habían quedado en stage de un intento de commit anterior,
  bloqueado por el escáner local, y que no se sacaron del índice antes de volver a commitear). El
  commit siguiente las reemplazó por marcadores, pero el historial de git conservaba el commit viejo
  — y el repositorio es **público**.
- Reescrito el historial de la rama con `git filter-branch --tree-filter` (sustituyendo las llaves
  reales por los marcadores en cada commit del rango `main..HEAD`) y `git push --force-with-lease`,
  con autorización explícita del humano — `CLAUDE.md` prohíbe `--force` sin ella.
- **Hallazgo importante:** incluso después de reescribir y hacer force-push, el commit viejo (SHA
  `30a7d3e`) siguió siendo recuperable por URL directa en GitHub (`/commit/<sha>` y la API) — GitHub no
  borra objetos colgantes de inmediato. Reescribir el historial **no** neutraliza una llave ya
  expuesta en un repo público; solo rotarla lo hace.
- El humano decidió **no rotar** la llave de Maps por ahora, con el riesgo explicado dos veces
  (restringida por dominio, pero técnicamente recuperable y ya vista por GitGuardian). **Pendiente,
  cuando el humano lo pida:** rotar `GOOGLE_MAPS_API_KEY` en Google Cloud Console y actualizar el
  *secret* de GitHub Actions con `gh secret set`.
- Hallazgo aparte, **no de esta sesión, ya en `main` desde antes:** una llave real de Firebase
  sigue expuesta en commits viejos del sitio 2025 (`1d24f8b feat: Firebase Storage`, entre otros —
  buscar `apiKey:` en esos commits para el valor exacto, deliberadamente no reproducido aquí para no
  crear una segunda copia del secreto en un archivo que sí queda limpio), heredados de cuando se
  "eliminó" el sitio estático anterior sin purgar el historial de git. No se tocó — reescribir `main`
  es mucho más disruptivo que reescribir una rama sin fusionar, y no se pidió. Queda anotado para
  cuando se decida atenderlo.

---

**02/09/2026 (más tarde) — T-0008: capa de SEO/AEO.**

En rama `feature/seo-aeo-capa` (desde `main`, creada **después** de escribir el código por error
directamente sobre `main` — corregido antes de commitear nada; `git status` en ese punto no mostraba
ningún commit nuevo en `main`, solo cambios sin confirmar, así que `git checkout -b` bastó).

- **`core/negocio/datos-negocio.ts` ampliado**, no solo el texto para mostrar: cada bloque de horario
  ahora también trae `diasSchemaOrg`/`abre`/`cierra` (formato que exige `OpeningHoursSpecification`
  de schema.org), y la dirección se partió en `calle`/`ciudad`/`paisCodigoIso` para `PostalAddress`.
  Una sola fuente de verdad, nunca dos formas del mismo dato escritas por separado.
- **`core/seo/`**: `MetaService` (título, descripción, canónica, Open Graph, Twitter Card — todo en un
  solo método, `actualizar()`), `JsonLdService` (inserta/reemplaza `<script type="application/ld+json">`
  por `id`, con el escape de `<` que exige CLAUDE.md §5 A03), y `esquemas.ts` con los constructores de
  cada tipo. Cada página llama a los dos servicios en su propio constructor — nunca en
  `afterNextRender`, que solo corre en el navegador y llegaría tarde para el SSR (a diferencia de
  `AnalyticsService`, que sí necesita `afterNextRender` a propósito).
- **Tres correcciones a la planeación original de `tech-specs.md` §4.5**, mismo patrón que las tres
  de T-0005: `WebSite` sin `SearchAction` (el sitio no tiene búsqueda real), `LocalBusiness` sin `geo`
  (nunca hubo coordenadas verificadas), y `/sitemap.xml` reducido a las tres rutas propias del
  contenedor en vez del "índice de los tres" planeado — verificado con `curl` real que Ágora expone su
  sitemap pero todavía bajo su propio subdominio (no `/cartelera`, eso es T-11) y que Babel no tiene
  sitemap propio en absoluto (T-12). Ver ADR-018.
- **`robots.txt` y `sitemap.xml` dejaron de ser archivos estáticos** (`public/`) y pasaron a rutas de
  Express en `server.ts`: el mismo artefacto sirve a los dos stages, así que necesitan leer el host de
  la petición en tiempo real para que staging responda `Disallow: /` y producción no — mismo patrón que
  `AnalyticsService` (ADR-015).
- **`NoEncontradaComponent` real**, con HTTP 404 de verdad: se encontró que `@angular/ssr` soporta un
  campo `status` en `ServerRoute` (`node_modules/@angular/ssr/types/ssr.d.ts`, verificado leyendo el
  tipo, no asumido) — `{ path: '**', renderMode: RenderMode.Server, status: 404 }`. Esto también
  obligó a mover `nosotros` y `contacto` a entradas explícitas en `app.routes.server.ts`: el comodín
  ya no podía seguir siendo `Prerender` para todo lo no listado, porque ahora significa "ruta no
  encontrada" y un `**` con `Prerender` no tiene sentido (caminos infinitos). De paso se encontró que
  `tech-specs.md` documentaba `/contacto` como `SSR` desde la planeación original, pero en el código
  ya era `Prerender` desde T-0006 — nadie lo había notado. Corregido en la documentación.
- Se quitó la propiedad `title` de las rutas en `app.routes.ts`: `MetaService` es ahora el único punto
  que fija el título, junto con todo lo demás, en vez de repartirlo entre el router y los componentes.

Verificado en vivo, no solo con pruebas unitarias: build de producción, servidor SSR real con `curl` —
`/`, `/nosotros`, `/contacto` en 200, una ruta inventada en **404** real, `robots.txt` con
`Disallow: /` en `localhost` (correcto: solo `letiende.co` lo permite), `sitemap.xml` con las tres
rutas propias, y el JSON-LD de las tres páginas extraído del HTML servido y verificado con
`JSON.parse()` real (no solo mirado). En el navegador (Chrome, `ng serve`): la página 404 se ve bien
con la barra de navegación intacta, cero errores de consola, cero componentes de hidratación
saltados. Un clic simulado por coordenadas de la herramienta de automatización pareció no navegar al
principio — se verificó con `location.pathname`/`document.title` reales (no la apariencia de la
captura de pantalla) y resultó ser el clic del emulador fallando el objetivo exacto, no un bug de la
aplicación: un `.click()` real sobre el elemento navegó y actualizó el título correctamente. 39/39
pruebas, `tsc --noEmit` (app y spec) y `lint`, todos limpios.

**Próxima tarea sugerida:** abrir el PR de `feature/seo-aeo-capa`; motor JIT recalculado — T-0007
(`serverless.yml`) sigue activa, se agrega **T-0009** (Lambda de contacto con SES y antiabuso, T-7 del
roadmap — el formulario de `/contacto` ya existe y valida, pero `POST /api/contacto` sigue sin
backend real).

---

**02/09/2026 (más tarde) — T-0007: `serverless.yml`, solo la función `ssr`.**

PR de T-0008 fusionado (#11) y rama remota borrada — limpieza local hecha. Antes de escribir código
para T-0009 (el borrador original, escrito en una sesión anterior), un hallazgo real al releer
`tech-specs.md` §1: el diagrama de arquitectura muestra `contacto` como una **Lambda separada**,
hermana de `ssr`, con su propia flecha a SES — no una ruta de Express dentro de `src/server.ts` como
decía el borrador de T-0009. Mismo patrón que Ágora (`server/api/handlers/*.ts`, cada handler su
propia Lambda con `APIGatewayProxyHandlerV2`, nunca montada en el Express del SSR). Corregido en
`TODO.md` **antes** de escribir código, no después — y como T-0009 necesita que `serverless.yml`
exista para agregarle la función `contacto`, se invirtió el orden: T-0007 primero.

En rama `feature/serverless-ssr` (desde `main`):

- `src/server.ts` ahora exporta `app` (antes era una `const` local) — lo necesita
  `server/ssr/handler.mjs`, el wrapper de Lambda que envuelve esa misma instancia de Express con
  `@codegenie/serverless-express`, mismo patrón exacto que `agora/server/ssr/handler.mjs` (JavaScript
  plano, no TypeScript, a propósito: compilarlo con `tsc` introduciría una dependencia circular con
  el artefacto de build que él mismo importa).
- **`NG_ALLOWED_HOSTS` resuelve un gotcha que esta memoria traía pendiente desde T-0001** ("falta
  decidir cómo esta lista static-en-build-time cubre ambos hosts sin rebuildear por stage"): resultó
  que `@angular/ssr` sí soporta una variable de entorno para esto (`node_modules/@angular/ssr/
  fesm2022/node.mjs`, `getAllowedHostsFromEnv()`), verificada en vivo invocando
  `server/ssr/handler.mjs` con un evento de API Gateway simulado — 400 sin la variable, 200 con ella.
  `serverless.yml` la fija por función con el host `execute-api` de cada stage; el dominio propio se
  agrega recién en T-13, en el mismo cambio que lo monte (mismo principio que ya aplicó Ágora: nunca
  "permitir" un host que todavía no resuelve a esta Lambda).
- **Hallazgo aparte, de infraestructura de la máquina, no del proyecto:** instalar
  `@codegenie/serverless-express` sin fijar versión trajo silenciosamente la 4.x en vez de la 5.x
  (que exige Node ≥24) — el `PATH` con el que este agente ejecuta comandos (`Bash` no interactivo)
  no pasaba por `~/.zshrc`, así que seguía resolviendo Node 22 pese al fix de T-0001. Se agregó la
  misma línea de `PATH` a `~/.zshenv` (no existía) — sí se lee en toda invocación de `zsh`. Detalle y
  el caso sin resolver de las shells de login en la tabla de gotchas, §7.
- `serverless.yml`: una sola función `ssr`, `nodejs24.x`, sin DynamoDB ni ningún otro recurso de
  estado — el rol IAM solo tiene `AWSLambdaBasicExecutionRole` (el SSR no toca ningún recurso de AWS
  propio, la lectura de Ágora es una petición HTTP saliente que no requiere permiso IAM). Comodín
  `/{proxy+}` `ANY` hacia `ssr` — sin las rutas de `/cartelera/*` ni `/libros/*`, que viven en
  CloudFront (T-13). `logRetentionInDays: 14`, `stackTags`/`tags` con `Proyecto: letiende-co`,
  `deploymentBucket.maxPreviousDeploymentArtifacts: 5` — verificados por lectura del YAML y, los dos
  primeros, también en el CloudFormation generado por `serverless package`.
- `package.json`: `build:infra` nuevo (`npm run build` a secas por ahora — no hay `server/api/` con
  lógica propia todavía, eso llega con T-0009).

Verificado en vivo, no solo con `serverless package`: el handler de Lambda invocado directamente con
eventos de API Gateway v2 simulados (sin pasar por API Gateway real, que no existe todavía) —
`/`, `/nosotros`, `/robots.txt`, `/sitemap.xml` en 200, `/ruta-inventada` en **404** (la ruta comodín
de T-0008 funciona igual a través del wrapper de Lambda que a través de Express directo). El paquete
generado (`.serverless/ssr.zip`) inspeccionado a mano: trae `dist/letiende-co/**`,
`server/ssr/handler.mjs` y `node_modules/@codegenie/serverless-express/**` — nada de `node_modules`
completo, nada de DynamoDB en el CloudFormation resultante (solo API Gateway, IAM, Lambda, LogGroup).
39/39 pruebas, `tsc --noEmit` (app y spec) y `lint`, todos limpios.

**Próxima tarea sugerida:** abrir el PR de `feature/serverless-ssr`; motor JIT recalculado — T-0009
(Lambda de contacto con SES y antiabuso, ahora con su dependencia de T-0007 correctamente resuelta)
sigue activa, se agrega la siguiente de la cola priorizada como segunda tarea.

---

**02/09/2026 (más tarde) — T-0009: Lambda de contacto con SES y antiabuso.**

PR de T-0007 fusionado (#12), rama remota borrada, limpieza local hecha. En rama
`feature/lambda-contacto-ses` (desde `main`):

- `server/api/handlers/contacto.ts`: handler `APIGatewayProxyHandlerV2` separado de `ssr` (la
  corrección de arquitectura ya documentada en T-0007). Limpia `\r\n` de cada campo de texto antes de
  armar el correo (CLAUDE.md §5, A03), rechaza si `consentimientoDatos !== true` aunque el navegador
  ya haya validado lo mismo, valida el formato del correo con una expresión regular simple. `Source`
  de SES es siempre `process.env.SES_REMITENTE`; el correo de quien escribe va en
  `ReplyToAddresses`, nunca en `Source`. Nunca escribe `nombre`/`correo`/`mensaje` en los logs — solo
  el mensaje de error de SES si el envío falla.
- Antiabuso, los tres a la vez (ver ADR-019 para el trade-off completo del límite de tasa):
  honeypot (`sitioWeb`, un campo que un bot autocompleta y un humano nunca ve — oculto de verdad en
  `contacto.html`: fuera de pantalla, `aria-hidden`, `tabindex="-1"`, no `display:none` a secas),
  límite de 5 peticiones por IP cada 10 minutos en memoria de la Lambda, tope de longitud por campo.
- `server/tsconfig.json` y `vitest.config.ts` (raíz, `include: ['server/**/*.spec.ts']`) — mismo
  patrón exacto que Ágora, con su propio script `test:api` separado de `ng test`.
  `server/bundle-lambdas.mjs` empaqueta `contacto.ts` con esbuild (ver el hallazgo de esta sesión en
  §3): sin eso, la función habría fallado en el arranque igual que ya le pasó a Ágora dos veces.
- `serverless.yml`: función `contacto` nueva, rol IAM propio con `ses:SendEmail`/`SendRawEmail`
  acotado a `identity/letiende.co` (verificado con la cuenta real que ese dominio está verificado en
  SES) — sin ninguna otra política, esta función no toca DynamoDB, S3 ni nada más.
- `ContactoComponent.enviar()` ahora hace `HttpClient.post('/api/contacto', …)` de verdad.
  `EstadoEnvio` ganó los estados `'enviando'`/`'enviado'`/`'error'` (ya no existe
  `'backend-pendiente'`); el botón se deshabilita mientras envía y cambia de texto.
- `angular.json`: `lintFilePatterns` ampliado con `server/**/*.ts` — antes solo miraba `src/`, de
  cuando `server/` todavía no existía (T-0004).

**Incidente durante la verificación, ya cerrado con el humano:** invocar el bundle real con `node -e`
para confirmar que esbuild lo había empaquetado bien terminó enviando un correo real por SES (este
entorno tiene credenciales reales de la cuenta de producción) a una dirección inventada para la
prueba. Detalle completo, lección para la próxima vez, y qué se verificó después
(`aws sesv2 list-email-identities`) en ADR-019/§3.

Verificado en vivo, no solo con pruebas mockeadas: `npm run build:infra` (build + `build:api` +
`bundle:api`) y `npx serverless package --stage staging` sin errores; el `.zip` de `contacto`
inspeccionado a mano (un solo archivo, el bundle de ~1.1 MB); el CloudFormation generado con el rol
de SES correcto. El bundle cargado con `require()` sin invocar el envío real. En el navegador
(`ng serve`, sin backend local para `/api/contacto`): el formulario válido dispara el `POST`, y como
no hay backend en local, se ve el aviso de error genérico — confirma el camino de error de verdad, no
solo en un mock. 41/41 pruebas de Angular (2 nuevas: honeypot oculto, envío real con éxito/error) y
8/8 del handler (`test:api`), `tsc --noEmit` (app, spec y `server/tsconfig.json`) y `lint`
(ahora cubre `server/`), todos limpios.

**Próxima tarea sugerida:** abrir el PR de `feature/lambda-contacto-ses`; motor JIT recalculado —
T-0010 (CI/CD con GitHub Actions) sigue activa, se agrega la siguiente de la cola priorizada como
segunda tarea (T-13, certificados ACM y CloudFront).

---

**02/09/2026 (más tarde) — Ampliación de T-0009: reCAPTCHA v3, mismo PR (#13).**

El PR de T-0009 seguía abierto cuando el humano preguntó si el honeypot + límite de tasa bastaban.
Se investigó el historial completo de git antes de opinar solo con criterio propio — hallazgo real
en la rama `2025` (abandonada): reCAPTCHA ya se había considerado necesario para este mismo endpoint,
con una nota de seguridad explícita que nunca se conectó de verdad con el envío del correo. Detalle
completo, y qué se implementó distinto esta vez (verificación en la misma petición que el envío,
puntaje mínimo 0.5, chequeo de `action`), en ADR-020.

`RecaptchaService` (`core/recaptcha/`), el handler ampliado con `tokenReCaptchaValido()` (llama a
`fetch` nativo de Node 24 contra `siteverify`, sin dependencia nueva), `RECAPTCHA_SECRET_KEY` en
`serverless.yml` y `recaptchaSiteKey` con marcador en `environments/` (mismo mecanismo de ADR-017).
15/15 pruebas del handler (7 nuevas de reCAPTCHA) y 44/44 de Angular (3 nuevas), `tsc --noEmit`,
`lint` y `serverless package` limpios. Verificado en navegador real que, con el marcador sin
sustituir (sin llaves reales todavía), el fallo se maneja con gracia — aviso de error genérico, cero
errores de consola.

**Cerrado el mismo día:** el humano ya creó el par de llaves y las dio; guardadas como los secrets
`RECAPTCHA_SITE_KEY`/`RECAPTCHA_SECRET_KEY` de GitHub Actions (nunca en el repositorio). Verificado en
vivo contra la API real de `siteverify` con un token deliberadamente inválido — rechazó con 400 antes
de llegar a SES, sin riesgo de un envío de correo de prueba (la lección de ADR-019/§7 sobre no
invocar servicios externos reales sin cuidado, aplicada esta vez desde el principio).
