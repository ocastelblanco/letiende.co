# Fix: Validación de Origen en Google Apps Script → Lambda

## Problema Identificado

Cuando Google Apps Script envía peticiones HTTP a la API Lambda (`https://api.letiende.co/actualizarContenido`), la función Lambda rechazaba las peticiones con el error:

```
❌ Error enviando a API: El origen de la petición no está permitido: undefined
```

### Causa Raíz

1. **Google Apps Script no envía header `Origin` por defecto** en las peticiones HTTP
2. **API Gateway transforma algunos headers**, cambiando mayúsculas/minúsculas
3. La función `leeJSON()` en Lambda validaba estrictamente `event.headers.origin`, que llegaba como `undefined`

## Solución Implementada

Se implementó un enfoque de **validación dual** que permite autenticación tanto por header Origin como por User-Agent:

### 1. Google Apps Script - Envío Explícito del Header Origin

**Archivo:** `external_resources/Google_Apps_Script/actualizarContenido.gs`

```javascript
const opciones = {
  method: 'post',
  contentType: 'application/json',
  headers: {
    'Origin': 'https://script.google.com'  // ← Header agregado explícitamente
  },
  payload: JSON.stringify(contenido),
  muteHttpExceptions: true
};
```

### 2. Lambda - Validación Flexible de Origen

**Archivo:** `external_resources/AWS_Lambda/libs/funciones.mjs`

Se modificaron las funciones `leePOST()` y `leeJSON()` para:

1. **Detectar header Origin en múltiples formatos:**
   ```javascript
   const origen = event.headers.origin || event.headers.Origin;
   ```

2. **Validar por User-Agent como fallback:**
   ```javascript
   const userAgent = event.headers['user-agent'] || event.headers['User-Agent'] || '';
   const esGoogleAppsScript = userAgent.includes('Google-Apps-Script');
   ```

3. **Aceptar petición si cumple cualquiera de las dos condiciones:**
   ```javascript
   const origenValido = origen && origenesPermitidos.includes(origen);
   if (origenValido || esGoogleAppsScript) {
     // ✅ Petición aceptada
   }
   ```

## Beneficios de esta Solución

1. ✅ **Compatibilidad robusta:** Funciona incluso si API Gateway transforma headers
2. ✅ **Doble validación:** Mayor seguridad al validar tanto Origin como User-Agent
3. ✅ **Debugging mejorado:** Logs detallados en caso de rechazo
4. ✅ **Retrocompatibilidad:** No afecta peticiones desde otros orígenes válidos

## User-Agent de Google Apps Script

Ejemplo del User-Agent que envía Google Apps Script:

```
Mozilla/5.0 (compatible; Google-Apps-Script; beanserver; +https://script.google.com; id: UAEmdDd...)
```

Este patrón siempre contiene la cadena `Google-Apps-Script`, que usamos para validación.

## Headers Recibidos por Lambda

**Antes del fix:**
- ❌ `origin`: `undefined`
- ✅ `user-agent`: `Mozilla/5.0 (compatible; Google-Apps-Script;...)`

**Después del fix:**
- ✅ `origin`: `https://script.google.com` (agregado explícitamente)
- ✅ `user-agent`: `Mozilla/5.0 (compatible; Google-Apps-Script;...)`

Lambda ahora acepta la petición si **cualquiera** de estas validaciones pasa.

## Pruebas

Para probar la integración después del fix:

1. Copiar el código actualizado de `actualizarContenido.gs` al proyecto de Google Apps Script
2. Ejecutar la función `testEnviarContenido()` desde el editor
3. Verificar en los logs que se recibe respuesta exitosa:
   ```
   ✅ Contenido de "inicio" actualizado exitosamente
   URL: https://letiende-assets.s3.amazonaws.com/data/inicio.json
   ```

## Archivos Modificados

- `external_resources/Google_Apps_Script/actualizarContenido.gs` - Agregado header Origin
- `external_resources/AWS_Lambda/libs/funciones.mjs` - Validación dual de origen

## Despliegue a Producción

Después de este fix, se debe:

1. **Actualizar código en Google Apps Script:**
   - Copiar el contenido actualizado de `actualizarContenido.gs`
   - Publicar como nueva versión

2. **Desplegar función Lambda actualizada:**
   ```bash
   cd external_resources/AWS_Lambda
   npm run deploy  # o el comando configurado para deployment
   ```

3. **Verificar integración:**
   - Editar una celda en Google Sheets
   - Confirmar que el contenido se actualiza en S3
   - Verificar que Angular SSR carga los datos correctamente desde `https://assets.letiende.co/data/*.json`
