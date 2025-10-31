# Flujo de creación JSON en arn:aws:s3:::letiende-assets
## Antecedentes
- Ya creé una opción dentro del esquema `switch - case` de `external_resources_AWS_Lambda/index.mjs` para recibir, vía POST, un JSON desde Google Apps Script.
- En el bucket de S3 creé una carpeta `data`, en la raíz, para almacenar todos los archivos .json con información proveniente de Google Apps Script.

## Instrucciones
- Crea un modelo JSON (sin schema, algo simple, con ejemplos) para implementarlo en Google Apps Script, y que lo envíe a la API https://api.letiende.co. Crea el modelo en `./docs/esquema-contenido.json`. Debe tener los siguientes puntos:
  - Sección de donde proviene: puede ser `inicio`, `menu`, `eventos`, `auditorio` y otras más.
  - Contenido estructurado, tanto en español como en inglés, con la posibilidad de que se puedan añadir, después, otros idiomas si es del caso.
  - Algún otro metadato que consideres importante obtener desde la hoja de cálculo de Google Workspace / Apps Script.
- Crea una función en `external_resources_AWS_Lambda/libs/funciones.mjs` que reciba ese JSON y lo almacene como un archivo .json en S3.
- Complementa `external_resources_AWS_Lambda/index.mjs` para que use la función anterior y que devuelva una respuesta de ok o error a Apps Script.