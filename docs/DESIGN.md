# DESIGN.md — Sistema de diseño de letiende.co

Fuente de verdad visual del contenedor. Adaptado del `DESIGN.md` de Ágora, con una diferencia
estructural: **aquí no hay Angular Material**. Todo es HTML propio y Tailwind 4 (PRD §9, D-5).

Este documento es **prescriptivo** mientras no existan las páginas. Cuando se construyan, se
actualiza para reflejar los desvíos reales frente a lo aquí escrito — igual que hacen Ágora y Babel.

Este documento es además el **contrato visual entre los tres repositorios**. Ver §8.

---

## 1. Colores

Paleta de marca Le Tiende, la misma de Comandante, Babel y Ágora. Estos hex son la fuente de verdad;
no se inventan variantes.

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#230C00` | Texto principal, fondo de la barra de navegación, botones primarios |
| `secondary` | `#E8630A` | Acentos, precios, enlaces, estado activo del menú |
| `tertiary` | `#00B7A3` | Confirmaciones, mensajes de éxito |
| `neutral` | `#FFE7B3` | Texto sobre fondo `primary` |
| `surface` | `#FFF8F1` | Fondo de página |
| `danger` | `#C0392B` | Errores de validación |

En Tailwind 4 la paleta se declara en `src/styles.css`, **sin `tailwind.config.js`**:

```css
@import "tailwindcss";

@theme {
  --color-primary:   #230C00;
  --color-secondary: #E8630A;
  --color-tertiary:  #00B7A3;
  --color-neutral:   #FFE7B3;
  --color-surface:   #FFF8F1;
  --color-danger:    #C0392B;

  --font-sans: "Poppins", ui-sans-serif, system-ui, sans-serif;
}
```

De ahí salen las clases utilitarias `bg-primary`, `text-neutral`, `border-secondary`, etc.
**Nunca se escribe un hex suelto en una plantilla.**

---

## 2. Tipografía

**Poppins** para toda la interfaz, cargada desde Google Fonts en `src/index.html` con
`rel="preconnect"` hacia `fonts.gstatic.com` y `display=swap`.

Angellya está reservada al logotipo SVG de marca y **no existe como archivo de fuente cargable** en
ningún repositorio de Le Tiende: nunca se integra en desarrollo.

| Uso | Clases |
|---|---|
| Título de página | `text-3xl font-bold tracking-tight sm:text-4xl` |
| Título de sección | `text-xl font-semibold tracking-tight` |
| Cuerpo | `text-base leading-relaxed` |
| Apoyo / metadatos | `text-sm text-primary/70` |
| Etiqueta de botón | `text-sm font-semibold tracking-wider uppercase` |

---

## 3. Contenedor de página

Patrón heredado de Babel y Ágora, probado en producción:

```html
<div class="min-h-screen bg-surface px-4 py-8">
  <div class="mx-auto max-w-3xl">
    <!-- contenido -->
  </div>
</div>
```

`max-w-*` interno según el tipo de página. El contenedor es un sitio de contenido, así que sus anchos
son más generosos que los de Ágora, pensados para flujos en celular:

| Tipo de página | Clase | Ejemplos |
|---|---|---|
| Texto largo | `max-w-3xl` | Quiénes somos, preguntas frecuentes |
| Formulario | `max-w-lg` | Contacto |
| Portada y rejillas | `max-w-6xl` | Inicio, tarjetas de próximos eventos |
| Sección a sangre | sin `max-w-*` | Imagen de cabecera de la portada |

---

## 4. Tarjetas

```html
<div class="rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(35,12,0,0.08)]">
  <!-- contenido -->
</div>
```

Mismo valor exacto que Babel y Ágora: la sombra usa el `primary` de marca al 8% como base
(`rgba(35,12,0,0.08)`), **no un gris genérico**. Es lo que hace que las tres aplicaciones se sientan
del mismo sitio.

---

## 5. Botones

| Variante | Clases | Uso |
|---|---|---|
| Primario | `h-12 rounded-2xl bg-primary px-4 text-sm font-semibold tracking-wider text-neutral uppercase` | Acción principal (enviar, comprar, ver cartelera) |
| Secundario | `h-12 rounded-2xl border border-primary/20 px-4 text-sm font-semibold tracking-wider text-primary uppercase` | Acción alternativa (volver, ver más) |
| Acento | `h-12 rounded-2xl bg-secondary px-4 text-sm font-semibold tracking-wider text-white uppercase` | Llamada a la acción destacada de la portada |
| Pequeño | `h-9 rounded-xl px-3 text-xs font-semibold tracking-wider uppercase` + variante de color | Acciones dentro de una tarjeta |

Angular 22 **no permite** `<button ... />` con cierre automático (error NG5002).
Siempre `<button ...></button>`.

Todo botón necesita un estado de foco visible: `focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-secondary`. No es opcional — el sitio debe ser navegable por teclado (PRD §8).

---

## 6. Inputs

```html
<label class="block text-sm font-medium text-primary" for="correo">Correo</label>
<input id="correo"
       class="mt-1 w-full rounded-xl border border-primary/20 px-3 py-2 text-sm text-primary
              focus-visible:outline-2 focus-visible:outline-secondary" />
<p class="mt-1 text-xs text-danger">El correo no es válido.</p>
```

Mismo valor exacto que Babel. El mensaje de error va debajo, en `text-danger text-xs`, y solo cuando
el control es inválido **y** ha sido tocado. Todo input lleva su `<label>` asociado por `for`/`id`:
un `placeholder` no es una etiqueta.

---

## 7. Barra de navegación y pie de página

La barra superior es **el elemento que define el proyecto**: es lo único que el visitante ve
constante mientras se mueve entre tres aplicaciones distintas.

```html
<header class="sticky top-0 z-50 bg-primary text-neutral">
  <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
       aria-label="Navegación principal">
    <a href="/" class="shrink-0" aria-label="Le Tiende — inicio">
      <img src="/logo_blanco_sin_fondo.svg" alt="Le Tiende" class="h-8 w-auto" />
    </a>
    <ul class="flex items-center gap-6 text-sm font-semibold tracking-wider uppercase">
      <li><a href="/cartelera">Cartelera</a></li>
      <li><a href="/libros">Librería</a></li>
      <li><a href="/nosotros">Nosotros</a></li>
      <li><a href="/contacto">Contacto</a></li>
    </ul>
  </nav>
</header>
```

Reglas:

- **Enlace activo** en `text-secondary`; el resto hereda `text-neutral`.
- En celular el listado colapsa en un botón de menú. El panel desplegado usa `bg-primary` a pantalla
  completa, cierra con `Escape` y devuelve el foco al botón que lo abrió.
- Los enlaces a `/cartelera` y `/libros` son **`<a href>` normales, no `routerLink`**. Apuntan a otra
  aplicación: un `routerLink` intentaría resolverlos en el router de este proyecto y fallaría.
- El pie de página repite dirección, horarios y redes, y es donde vive el `LocalBusiness` visible que
  acompaña al JSON-LD.

---

## 8. La costura: el contrato con Ágora y Babel

Consecuencia directa de servir por proxy: **cuando el visitante está en `/cartelera` o en `/libros`, el
HTML lo genera esa otra aplicación, no esta.** Este proyecto no puede inyectarle su barra.

Por lo tanto, la barra de navegación de §7 tiene que existir **tres veces**: aquí, en Ágora y en
Babel. Cada una reemplaza al menú propio que esas aplicaciones tienen hoy.

| Qué | Dónde vive | Regla |
|---|---|---|
| El marcado de referencia | Este documento, §7 | Es la fuente de verdad. Se copia desde aquí |
| La implementación del contenedor | `src/app/shared/navegacion/` | — |
| La implementación de Ágora | repo `agora`, reemplaza su menú actual | Debe coincidir píxel a píxel |
| La implementación de Babel | repo `babel`, reemplaza su menú actual | Debe coincidir píxel a píxel |

Modificar Ágora y Babel está **autorizado explícitamente**, con la instrucción de hacerlo al mínimo.
El diff exacto y acotado está en `tech-specs.md` §7.3; este documento manda solo sobre el marcado.
La barra **se reemplaza, no se oculta**: ocultarla dejaría al visitante dentro de la cartelera sin
forma de volver al resto del sitio (ADR-003).

**Cualquier cambio a §7 obliga a un cambio en los tres repositorios.** Es el costo consciente de la
arquitectura elegida (ADR-001). Si esto se vuelve una carga, la salida es extraer la barra a un
paquete compartido — no dejar que las tres se desincronicen en silencio.

Regla de oro para verificarlo: navegar de `/` a `/cartelera` y a `/libros` **no debe producir ningún
salto visual** en la barra. Si la barra se mueve, cambia de alto o cambia de color al cruzar, la
costura quedó visible y el trabajo no está terminado.

---

## 9. Íconos y activos de marca

Los mismos archivos de Ágora y Babel (`public/`), servidos desde este repositorio y desde
`assets.letiende.co` según el caso:

| Archivo | Uso |
|---|---|
| `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png` | Ícono de pestaña |
| `apple-touch-icon.png` | Ícono en pantalla de inicio de iOS |
| `icon-192.png`, `icon-512.png` | Íconos referenciados desde `manifest.webmanifest` |
| `logo_negro_sin_fondo.svg` | Logotipo sobre fondos claros (`surface`, blanco) |
| `logo_blanco_sin_fondo.svg` | Logotipo sobre fondos oscuros (`primary`) — el de la barra |

`src/index.html` referencia el favicon, el apple-touch-icon y el manifest;
`meta[name=theme-color]` va fijado a `#230C00`.

---

## 10. Accesibilidad

No es una sección de cortesía: parte del público llega por búsqueda por voz y lectores de pantalla
(PRD §8), y el mismo trabajo que lo hace accesible lo hace legible para los asistentes de IA.

- Un solo `<h1>` por página, y jerarquía de encabezados sin saltos.
- Puntos de referencia semánticos: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`.
- Contraste mínimo 4.5:1 para texto normal. `neutral` sobre `primary` y `primary` sobre `surface`
  cumplen; `secondary` sobre `surface` **no cumple para texto pequeño** — úsalo en texto grande,
  en bordes o en fondos, nunca en un párrafo.
- Foco visible en todo elemento interactivo (§5).
- Toda imagen con `alt` real; `alt=""` solo si es decorativa.
- Objetivos táctiles de 44×44 px como mínimo en celular.

---

## 11. Carta del café bar (`/carta`)

Especificación de datos y reglas de armado en `tech-specs.md` §4.6. Esta sección manda solo sobre la
presentación. Contenedor de página: `max-w-3xl` (es una lista para leer, no una rejilla), con un margen
izquierdo reservado para el menú lateral en pantallas medianas en adelante.

### 11.1 Menú lateral flotante

- `position: fixed`, a la izquierda, centrado en vertical, **debajo** de la barra superior (que es
  `sticky top-0 z-50` y mide `h-16`): el menú lateral usa `z-40` y nunca la tapa.
- Fondo `bg-primary`, íconos en `text-neutral`, esquinas `rounded-2xl`, la misma sombra de marca de §4.
- **Colapsado por defecto: solo íconos**, un botón por card, en el mismo orden de la página. Cada botón
  es un `<a href="#seccion-…">` con `aria-label` igual a la etiqueta de la sección — el ícono es
  decorativo (`aria-hidden="true"`).
- **Botón de expandir** al pie del menú (ícono `chevron_right` / `chevron_left`), con
  `aria-expanded` y `aria-controls`. Expandido, cada entrada muestra ícono + etiqueta
  (`text-sm font-semibold`), y el menú se superpone al contenido, sin empujarlo.
- **Sección activa** (la card visible en pantalla, detectada con `IntersectionObserver` solo en el
  navegador): fondo `bg-secondary` en su botón y `aria-current="true"`.
- Al elegir una sección: desplazamiento suave hasta la card (`scroll-behavior: smooth`, respetando
  `prefers-reduced-motion: reduce`) y, si el menú estaba expandido en celular, se colapsa. Cada card
  lleva `scroll-margin-top` suficiente (`scroll-mt-20`) para que la barra superior no tape su título.
- **Celular:** el mismo menú, más angosto (íconos de 44×44 px, §10), pegado al borde izquierdo; el
  contenido reserva ese ancho a la izquierda para que ningún precio quede debajo del menú.
- Las secciones `destacada` también se distinguen en el menú: un punto `bg-secondary` junto al ícono.

### 11.2 Cards de sección

Una card por sección, con el patrón de §4 (`rounded-2xl bg-white p-4` + sombra de marca) y
`id="seccion-<categoria>[-<subcategoria>]"`.

```
┌──────────────────────────────────────────────┐
│  ☕  BEBIDAS DE CAFÉ                          │  ← <h2>, text-xl font-semibold
│  Café arábigo, acidez media, notas a         │  ← descripción, text-sm text-primary/70
│  chocolate, caramelo y madera                │
│                                              │
│  Espresso ·························· $6.600  │
│  Cappuccino* †                       $9.900  │
│  Latte* †                            $8.400  │
│  Macchiato sencillo*                 $6.600  │
│                                              │
│  * Pídelo en leche vegetal por $3.500        │  ← notas al pie, text-xs text-primary/70
│  † Añade licor por $8.700                    │
└──────────────────────────────────────────────┘
```

- **Producto:** nombre a la izquierda (`text-base font-medium`), precio a la derecha
  (`font-semibold tabular-nums`, alineado a la derecha). Los precios van en `text-primary`, **no** en
  `secondary`: `secondary` sobre blanco no cumple contraste para texto de este tamaño (§10).
- Las **marcas** de nota al pie (`*`, `†`, `‡`…) van pegadas al nombre, en `text-secondary`
  `font-semibold`, dentro de un `<sup>`; cada marca lleva un `aria-describedby` a su nota, para que
  el lector de pantalla lea la nota junto al producto.
- **Descripción del producto** (cocteles, sobre todo): debajo del nombre, `text-sm text-primary/70`.
- **Variantes:** una línea debajo del nombre, `text-xs text-primary/60`, separadas por ` · `.
- **Notas al pie:** al final de la card, tras un separador `border-t border-primary/10`, una línea
  por marca, en el orden de las marcas.
- La lista de productos es una `<ul>`; cada producto, un `<li>`. Nada de tablas para maquetar.

### 11.3 Cards destacadas (promociones)

Las secciones con `destacada: true` en la hoja (hoy `ofertas/promociones` y `ofertas/combos`) son
promociones que se quieren empujar, y se ven distintas **sin salirse de la paleta**:

- Fondo `bg-primary` y texto `text-neutral` (la inversa de una card normal, contraste de sobra); los
  precios en `text-neutral`, las marcas y el ícono en `text-secondary`.
- Borde `border-2 border-secondary` y una etiqueta pequeña **"Promoción"** sobre el título
  (`h-6 rounded-full bg-secondary px-2 text-xs font-semibold uppercase text-white`), con
  `text-white` sobre `secondary` en texto grande y en negrita solamente.
- Si su `orden` en la hoja las pone primero, además quedan en la parte de arriba de la página; la
  posición la deciden los socios en la hoja, no el código.

### 11.4 Íconos de Material Symbols

Excepción acotada a §9 y a ADR-004 (ADR-025): los íconos de las secciones usan **Material Symbols
Outlined** desde Google Fonts (`fonts.googleapis.com`, ya permitido en la CSP), pidiendo solo los
íconos que usa la carta publicada con el parámetro `icon_names` (lista ordenada alfabéticamente),
más los fijos de la interfaz (`chevron_left`, `chevron_right`, `restaurant_menu`). El enlace a la
hoja de estilos lo arma el SSR a partir de los datos publicados, y solo en `/carta` — el resto del
sitio no descarga esa fuente. Siempre con `aria-hidden="true"`: el significado lo lleva la etiqueta.
