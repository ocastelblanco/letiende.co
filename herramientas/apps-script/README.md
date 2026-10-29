# Apps Script de la carta del café bar

T-0036 (`docs/TODO.md`), contrato completo en `docs/tech-specs.md` §4.6, decisión en
`docs/MEMORY.md` ADR-023.

`carta.gs` es el código fuente versionado del script ligado a la hoja maestra del café bar. Su
despliegue real es manual, en el editor de Apps Script — este archivo documenta el procedimiento
exacto para que sea repetible.

## Antes de desplegar

- **Dueño del documento y del proyecto de Apps Script: `ocastelblanco@gmail.com`.**
  `letiende.co@gmail.com` es editora del documento — permiso suficiente para poder ejecutar
  "Publicar carta", no hace falta que sea dueña de nada (corrección de ADR-023, 22/09/2026).
- La hoja debe tener las pestañas `carta_secciones` y `carta_diccionario`, con las columnas exactas
  de `tech-specs.md` §4.6.

## Procedimiento

1. Abrir la hoja con la cuenta `ocastelblanco@gmail.com` → **Extensiones → Apps Script**.
2. Pegar el contenido de `carta.gs` en `Code.gs` (o el archivo que cree el editor por defecto).
   Guardar.
3. **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo** (`ocastelblanco@gmail.com`).
   - Quién tiene acceso: **Cualquier usuario**.
4. Al implementar por primera vez, Google pide autorizar el script (accede a la hoja y hace
   peticiones salientes a `comandante.letiende.co`). Es la cuenta dueña quien autoriza — nadie más
   puede hacerlo por ella.
5. Copiar la URL `.../exec` que entrega el asistente. Esa URL:
   - se prueba con `curl -L` (la Web App redirige a `script.googleusercontent.com`; seguir la
     redirección es parte de la prueba, no un paso opcional);
   - se anota en `tech-specs.md` §4.6 y en `MEMORY.md` §5;
   - se usa como constante en `environments/` de este repositorio (T-0037).

## Volver a desplegar tras un cambio en `carta.gs`

**Gestionar implementaciones → editar el lápiz de la implementación activa → Nueva versión.**
Nunca "Nueva implementación": eso generaría una URL `.../exec` distinta, y el SSR de letiende.co
tiene la URL actual como constante. Un cambio de URL sin coordinar rompe `/carta` en producción.

## Probar antes de dar por hecho T-0036

- Publicar con datos válidos: el diálogo debe confirmar cuántas secciones/adiciones/variantes
  quedaron publicadas.
- Publicar con un error deliberado (por ejemplo, un ícono con mayúsculas): debe bloquear la
  publicación y la copia anterior debe seguir siendo la que sirve `doGet()`.
- Confirmar que una cuenta con acceso de solo lectura al documento (o sin ningún acceso) no ve el
  menú "Le Tiende" — Apps Script ya lo hace por defecto porque `onOpen` no expone nada a quien no
  puede abrir el editor de scripts, pero conviene verificarlo una vez en vivo.

---

# Apps Script de la página de enlaces (`/enlaces`)

T-0041 (`docs/TODO.md`), contrato en `docs/tech-specs.md` §4.7, decisión en `docs/MEMORY.md` ADR-026.

`enlaces.gs` es el código fuente versionado del script ligado a la **hoja de enlaces** (no a la hoja
maestra de la carta: los dos definen `onOpen` y `doGet`, y en un mismo proyecto uno pisaría al otro).
No usa ningún secreto ni escribe hacia AWS; el procedimiento es el mismo de la carta.

## Antes de desplegar

- Dueño del documento y del proyecto de Apps Script: `ocastelblanco@gmail.com`.
- La pestaña se llama **`enlaces`** (constante `HOJA_ENLACES` al inicio del script). Columnas, en
  cualquier orden y sin importar mayúsculas ni tildes: `Categoría`, `Subcategoría`, `Icono`, `Link`
  (obligatorias) y `Descripción`, `Etiqueta`, `Visible`, `Logo` (opcionales). El logo del Pódbar se activa escribiendo
  `podbar` en la columna `Logo` de **una** de sus filas. La `Descripción` del panel (hasta ~12 palabras,
  máximo 160 caracteres) también se escribe en **una** de sus filas.

## Procedimiento

1. Abrir la hoja de enlaces con `ocastelblanco@gmail.com` → **Extensiones → Apps Script**.
2. Pegar el contenido de `enlaces.gs` en `Code.gs`. Guardar.
3. **Implementar → Nueva implementación** → tipo **Aplicación web** → ejecutar como **Yo** → acceso
   **Cualquier usuario**.
4. Google pide autorizar el script. Solo necesita acceso a la hoja (no hace peticiones salientes).
5. Recargar la hoja: aparece el menú **Le Tiende → Publicar enlaces**. Oprimirlo.
6. Copiar la URL `.../exec` y probarla con `curl -L <url>`: debe responder el JSON del contrato.
   Esa URL va en `urlContenidoEnlacesWebApp` de `src/environments/environment*.ts`.

## Volver a desplegar tras un cambio en `enlaces.gs`

**Gestionar implementaciones → lápiz de la implementación activa → Nueva versión.** Nunca "Nueva
implementación": cambiaría la URL `.../exec`, que el SSR tiene como constante.

## Probar

- Publicar con las filas válidas: el diálogo cuenta paneles, barras y enlaces.
- Publicar con un error deliberado (un Link `http://…`, un Icono con espacios, una fila sin
  Categoría): no publica, y `curl -L` sigue devolviendo la copia anterior.
- Una fila con `Visible = FALSE` no aparece en el JSON.
- La publicación admite unos 8.500 caracteres de JSON (límite de ~9 KB por propiedad de Apps Script).
