# PRD — letiende.co

Documento de requisitos de producto del sitio principal de Le Tiende.
Escrito en lenguaje de negocio: las decisiones técnicas viven en [`tech-specs.md`](tech-specs.md).

---

## 1. Visión del producto

| | |
|---|---|
| **Nombre** | letiende.co — sitio principal de Le Tiende |
| **Tipo** | Sitio público de un centro cultural, que reúne bajo un solo techo tres servicios ya existentes |
| **Público** | Visitantes de Bogotá y turistas que buscan qué hacer, qué leer o dónde tomarse algo |
| **Idioma** | Español (único). El material de desarrollo tiene versión en inglés |
| **Dirección** | `https://letiende.co` |
| **Estado** | En construcción. El sitio actual es una página estática que será reemplazada |

**Una frase:** *Le Tiende tiene tres cosas buenas repartidas en tres direcciones distintas; este
proyecto las pone en una sola puerta de entrada.*

---

## 2. Contexto y problema que resuelve

Le Tiende ya opera tres servicios digitales, y los tres funcionan bien por separado:

- La **boletería** de los espectáculos del teatro, con su propia dirección.
- El **catálogo de la librería**, con su propia dirección.
- La **lista de precios del café bar**, hoy solo de uso interno.

El problema no es que falten funcionalidades: es que **el visitante no tiene por dónde entrar**.
Quien busca "Le Tiende" en internet llega a una página estática que no le dice qué hay en cartelera
esta semana, ni qué libros hay, ni cómo llegar. Para encontrar cualquiera de esas cosas tiene que
saber de antemano que existen direcciones separadas — algo que solo sabe quien ya es cliente.

El costo de esto es doble:

1. **Comercial.** Cada servicio compite solo por atención. Quien viene por un concierto nunca se
   entera de que hay librería, y viceversa.
2. **De visibilidad.** El posicionamiento en buscadores y la presencia en asistentes de IA se
   reparten entre tres direcciones débiles en vez de concentrarse en una fuerte.

La solución **no es construir un cuarto sistema**. Es poner una fachada común encima de los tres,
de modo que el visitante navegue todo sin cambiar de dirección y sin notar la costura.

---

## 3. Usuarios y audiencias

| Perfil | Qué necesita | Cómo llega |
|---|---|---|
| **Visitante curioso** | Saber qué es Le Tiende, qué hay esta semana, dónde queda y a qué hora abre | Búsqueda en internet, asistente de IA, redes sociales |
| **Asistente a un espectáculo** | Ver la cartelera, elegir función y comprar su boleta sin crear cuenta | Enlace de la promoción del evento, o desde la portada |
| **Lector** | Buscar si un título está disponible y en qué parte del local encontrarlo | Búsqueda del título, o desde la portada |
| **Cliente del café bar** *(etapa 2)* | Ver la carta y los precios antes de sentarse o desde la mesa | Código QR en la mesa, o desde la portada |
| **Productor externo** | Entender qué es el espacio y cómo contactar para programar algo | Búsqueda, referencia de un tercero |

Ninguno de estos perfiles necesita crear una cuenta para hacer lo que vino a hacer.
El sitio **no tiene área privada**: el personal de Le Tiende sigue trabajando dentro de Ágora y Babel.

---

## 4. Objetivos

| # | Objetivo | Métrica de éxito | Estado |
|---|---|---|---|
| OBJ-1 | Una sola puerta de entrada a los tres servicios | El visitante navega cartelera, catálogo y carta sin cambiar de dirección | Pendiente |
| OBJ-2 | Que el sitio aparezca cuando alguien busca qué hacer en la zona | Las páginas de inicio, cartelera y catálogo quedan indexadas y aparecen en resultados | Pendiente |
| OBJ-3 | Que un asistente de IA pueda responder correctamente sobre Le Tiende | Preguntas de horario, ubicación, cartelera y catálogo se responden con datos del sitio | Pendiente |
| OBJ-4 | Que la fachada no le quite velocidad a lo que ya funciona | Comprar una boleta y consultar un libro no se vuelven más lentos que hoy | Pendiente |
| OBJ-5 | No romper lo que ya está en producción | Ágora y Babel siguen operando durante toda la transición, sin ventana de caída | Pendiente |
| OBJ-6 | Sostener el costo de operación de la fachada | El sitio no agrega un gasto mensual perceptible al de los servicios existentes | Pendiente |

---

## 5. Funcionalidades

### Etapa 1

| # | Funcionalidad | Origen del contenido |
|---|---|---|
| F-1 | **Página de inicio** con presentación del espacio, próximos eventos y accesos a cada servicio | Propio + boletería |
| F-2 | **Menú superior común**, presente en todas las páginas, incluidas las de los servicios embebidos | Propio |
| F-3 | **Cartelera y compra de boletas** | Boletería (Ágora) |
| F-4 | **Catálogo de libros y su ubicación en el local** | Librería (Babel) |
| F-5 | **Quiénes somos** — qué es Le Tiende, qué pasa ahí | Propio |
| F-6 | **Contacto y ubicación** — dirección, mapa, horarios, formulario, redes | Propio |
| F-7 | **Preguntas frecuentes** — horarios, parqueadero, accesibilidad, cómo programar | Propio |

### Etapa 2

| # | Funcionalidad | Origen del contenido |
|---|---|---|
| F-8 | **Carta del café bar** con precios vigentes | Café bar (Comandante) |
| F-9 | Actualización de seguridad y estilo de la interfaz de datos heredada | Propio |

### Flujo principal — el visitante que llega a comprar

```
  Busca "teatro Bogotá" o "Le Tiende"
              │
              ▼
     Llega a la portada  ────────────► ve próximos eventos, librería y ubicación
              │
              ▼
   Entra a la cartelera desde el menú
              │
              ▼
      Elige un evento y una función
              │
              ▼
   Compra su boleta  ── sin crear cuenta, sin salir del sitio ──►  recibe su boleta
```

El punto de este flujo: **la dirección en la barra del navegador nunca cambia de dominio**.
El visitante entra a Le Tiende y se queda en Le Tiende, aunque por debajo esté usando la boletería.

### Flujo del contenido que ya existe

```
   Boletería  ──┐
                │
   Librería  ───┼──►  letiende.co  ──►  visitante
                │      (fachada)
   Café bar  ───┘      un menú, un dominio

   Las tres siguen siendo dueñas de sus datos y de sus reglas.
   La fachada no guarda nada y no decide nada sobre ellos.
```

---

## 6. Roadmap

| Prioridad | Funcionalidad | Etapa |
|---|---|---|
| **Alta** | Fachada con menú común e integración de cartelera y catálogo (F-1 a F-4) | 1 |
| **Alta** | Páginas institucionales: quiénes somos, contacto, ubicación (F-5, F-6) | 1 |
| **Alta** | Visibilidad en buscadores y asistentes de IA (OBJ-2, OBJ-3) | 1 |
| **Alta** | Reemplazo del sitio actual sin ventana de caída (OBJ-5) | 1 |
| **Media** | Preguntas frecuentes (F-7) | 1 |
| **Media** | Carta del café bar (F-8) | 2 |
| **Media** | Actualización de la interfaz de datos heredada (F-9) | 2 |
| **Baja** | Agenda unificada: eventos, novedades de la librería y del café en un solo lugar | 3 |
| **Baja** | Boletín de correo y suscripción desde la portada | 3 |
| **Baja** | Versión en inglés del sitio | 3 |

**Pregunta abierta de la etapa 2:** la lista de precios del café bar vive hoy en un sistema con una
tecnología distinta a la de los otros dos servicios. Antes de empezar F-8 hay que decidir cómo se
publica esa lista hacia afuera. Se documenta al abordar la etapa 2, no antes.

---

## 7. Casos de uso

| # | Actor | Acción | Resultado esperado |
|---|---|---|---|
| CU-1 | Visitante | Entra a la portada | Ve qué es Le Tiende, los próximos eventos y cómo llegar, sin desplazarse mucho |
| CU-2 | Visitante | Abre la cartelera desde el menú | Ve los eventos vigentes sin cambiar de dominio y con el mismo menú arriba |
| CU-3 | Asistente a un espectáculo | Compra una boleta | Completa la compra y recibe su boleta, sin crear cuenta y sin salir del sitio |
| CU-4 | Lector | Busca un título | Sabe si está disponible y en qué parte del local está |
| CU-5 | Visitante | Quiere saber si hoy está abierto | Encuentra el horario en la página de contacto y también en el resultado del buscador |
| CU-6 | Productor externo | Quiere programar algo | Encuentra el formulario de contacto y su mensaje llega al correo del equipo |
| CU-7 | Asistente de IA | Le preguntan por Le Tiende | Responde con horario, dirección y cartelera correctos, citando el sitio |
| CU-8 | Visitante | Llega por un enlace viejo a la dirección separada de un servicio | Termina en la página equivalente dentro del sitio, sin ver un error |
| CU-9 | Cliente del café *(etapa 2)* | Escanea el código de la mesa | Ve la carta con precios vigentes en su teléfono |

---

## 8. Requisitos no funcionales

**Rendimiento.** La portada debe ser utilizable en un teléfono de gama media con conexión móvil.
La fachada no puede agregar demoras perceptibles a la compra de boletas ni a la consulta del catálogo:
si integrarlas las vuelve más lentas que hoy, la integración está mal hecha (OBJ-4).

**Visibilidad (SEO/AEO).** Requisito de primer orden, no un acabado:

- Toda página pública debe entregarse ya construida desde el servidor. Una página que solo se arma
  en el navegador es invisible para buena parte de los buscadores y para los asistentes de IA.
- Un solo mapa del sitio, que incluya también las páginas de cartelera y catálogo.
- Cada contenido tiene una única dirección canónica. Las direcciones separadas que existen hoy
  redirigen a la nueva, para no competir contra sí mismas.
- Los datos del negocio —qué es, dónde queda, horarios, eventos, libros— se publican en formato
  legible por máquina, para que un asistente de IA pueda responder sin adivinar.
- Cada página tiene título, descripción e imagen propios al compartirse.

**Seguridad.** El sitio no guarda contraseñas, no cobra y no administra nada: su superficie de riesgo
es pequeña por diseño. Lo que sí maneja son **datos personales de quien escribe por el formulario de
contacto**, sujetos a la Ley 1581 de 2012 (Habeas Data). Las reglas están en `CLAUDE.md`.

**Accesibilidad.** Navegable por teclado, con estructura semántica y contraste suficiente.
No es un adorno: parte del público llega desde búsquedas por voz y lectores de pantalla.

**Costo.** El sitio debe operar dentro del mismo orden de gasto de los servicios existentes.
No se aprovisiona capacidad fija para tráfico que no existe.

**Continuidad.** El sitio actual sigue en línea hasta que el nuevo esté verificado. El cambio debe
poder revertirse en minutos.

---

## 9. Restricciones y decisiones de diseño

| # | Decisión | Razón |
|---|---|---|
| D-1 | **El contenido de la cartelera y del catálogo no se reimplementa.** Se sirve desde los mismos sistemas que ya lo hacen | Reimplementarlo duplicaría el flujo de compra —lo más delicado y lo que más caro sale equivocar— y crearía dos versiones de la verdad |
| D-2 | Los servicios embebidos **reemplazan su propio menú** por el menú común | El visitante debe ver un solo menú; dos son una costura visible, y ninguno lo deja sin salida |
| D-3 | Las direcciones separadas actuales **redirigen** a la nueva en vez de coexistir | Dos direcciones con el mismo contenido compiten entre sí en los buscadores |
| D-4 | **Sin autenticación en el sitio** | Todo lo que requiere identificarse ya vive dentro de los otros servicios |
| D-5 | **Sin librería de componentes visuales** | El sitio es contenido y navegación; no necesita tablas ordenables ni selectores de fecha |
| D-6 | **Solo español** en esta etapa | El público es local. El inglés se evalúa cuando haya evidencia de demanda |
| D-7 | El sistema heredado de datos **no se toca en la etapa 1** | Está fuera de control de versiones y hay algo más colgando de él; se aborda en la etapa 2 con calma |
| D-8 | El sitio actual **no se apaga** hasta que el nuevo esté verificado | El cambio debe ser reversible |
| D-9 | Existe un **entorno de pruebas con dirección propia**, equivalente al real | Sin él, la integración entre los tres servicios solo se podría probar en producción |

---

## 10. Glosario

| Término | Qué significa aquí |
|---|---|
| **Le Tiende** | Centro cultural en Bogotá: teatro, librería y café bar en un mismo local |
| **Ágora** | La aplicación de boletería del teatro. Ya está en producción |
| **Babel** | La aplicación de catálogo e inventario de la librería. Ya está en producción |
| **Comandante** | El sistema del café bar, del que sale la lista de precios. Ya está en producción |
| **Fachada / contenedor** | Este proyecto: la capa que une los tres bajo un dominio y un menú |
| **Cartelera** | La lista de espectáculos programados con función vigente |
| **Etapa 1 / Etapa 2** | Los dos cortes de alcance definidos al arrancar el proyecto |
| **AEO** | *Answer Engine Optimization*: que un asistente de IA pueda responder bien sobre el negocio |
| **Cutover** | El momento en que la dirección `letiende.co` deja de apuntar al sitio viejo y apunta al nuevo |
