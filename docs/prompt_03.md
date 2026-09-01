# Respuestas
## 1. Rutas de imports en index.mjs
Cometí un error al crear la carpeta en este proyecto: es `libs`. Así está en AWS Lambda, así debe ser. Aplica tu propuesta b) Renombrar la carpeta `lib/` a `libs/`.

## 2. Módulos CommonJS vs ES Modules
Ejecuta la opción a) Convertir todos los archivos a ES Modules (.mjs).

## 3. Bug en autenticaOrigen
Tienes razón. La línea debería ser `!== null`; pero lo hice así, porque estamos trabajando en mi configuración local `localhost:4200`y necesitamos poder probar la API desde mi proyecto local; si encuentras una mejor manera de hacerlo, aplícala.

## 4. Variables de entorno
Las variables de entorno están en Lambda; como son tokens de autenticación, prefiero dejarlos ahí, sin que estén en mi proyecto local, ni que, por supuesto, vayan a dar a Github o algo similar.

## 5. Package.json
No hay `package.json` en esa función porque (me acabo de acordar) lo que hice fue incluirlas todas en una 'capa'.

Creo que, antes que nada, deberías bajar la función completa usando AWS CLI (recuerda que el arn de esa función es arn:aws:lambda:us-east-1:696912647258:function:letiende-api) para que tengas todo el material a mano. Reemplaza, si es necesario, el contenido de la carpeta `./external_resources/AWS_Lambda/`.

Además, veo algo que podría afectar mi respuesta a la pregunta 2: parece que 'disconnect', la librería de Discogs para Node.js solo es CommonJS. Revisa la documentación en https://github.com/bartve/disconnect

Si necesitas hacer pruebas, puedes hacer un cURL con la ruta `https://api.letiende.co/discogs?barcode=14470085`, aprovechando que cualquier origen es válido por ahora.

## 6. Actualización del despliegue
Prefiero AWS CLI para todas las operaciones.