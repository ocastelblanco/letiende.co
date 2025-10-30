# Actualización de la API externa
## Incorporación de API
* Añadí el contenido de la API que creé en AWS Lambda Node.js 20.x, que se enruta por https://api.letiende.co; está en la ruta ./external_resources/AWS_Lambda/ con la siguiente estructura:
.
├── index.mjs
└── lib
    ├── discogs.js
    ├── funciones.js
    └── googlebooks.js
* En esta API he añadidido todos los procesos que requiera este proyecto; cosas como:
  - Usar la API de Discogs para obtener datos y portadas de discos.
  - Usar la API de Google Books para obtener datos y portadas de libros.
  - Enrutar emails que entren por info@letiende.co a cuentas validadas en AWS SES.
  - Validar el recaptcha en formularios.
* Quiero usarla, además, para:
  - Que el script de Apps Script de la hoja de cálculo de Google Workspace inicie el flujo indicado en ./.claude/CLAUDE.md en Descripción de la aplicación letiende.co > Contenido.
  - Cualquier otro proceso backend requerido por Cloudinary, Firebase, etc.

## Instrucciones
Necesito que me ayudes a actualizar esta API a Node.js 22.x, apoyándote en el [blog de AWS](https://aws.amazon.com/es/blogs/compute/node-js-22-runtime-now-available-in-aws-lambda/) y en cualquier otro documento sobre buenas prácticas para este motor de Lambda.

Sigue las siguientes instrucciones:
1. Revisa detalladamente los contenidos de los archivos en ./external_resources/AWS_Lambda/.
2. Modifícalos según sea necesario.
3. Actualiza AWS CLI a su última versión.
4. Actualiza lo necesario en AWS Lambda usando el CLI de AWS; el arn de esa función es arn:aws:lambda:us-east-1:696912647258:function:generica
5. Escribe las instrucciones adicionales que requieras que yo ejecute, a través de la Consola de AWS o del medio que consideres necesario, en los productos AWS que consideres necesarios, en ./.claude/respuestas/2025-10-28-InstruccionesActualizacionAPI.md.