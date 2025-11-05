# feat(menu): integración completa del menú con API REST desde S3

## 📋 Resumen

Esta PR implementa la integración completa del menú con la arquitectura headless CMS usando Google Sheets → Apps Script → AWS Lambda → S3 → Angular SSR.

## ✨ Cambios Principales

### 1. Frontend Angular - Servicio de Datos y Componentes

**Archivos modificados:**
- `src/app/compartidos/servicios/datos.ts`
- `src/app/vistas/menu/menu.ts`
- `src/app/vistas/menu/menu.html`
- `src/app/compartidos/modulos/primeng/primeng-module.ts`

**Implementación:**
- ✅ Interfaces TypeScript completas según `docs/esquema-contenido.json`:
  - `MenuResponse`, `MenuIdioma`, `MenuCategoria`, `MenuItem`, `MenuOpcion`
- ✅ Servicio de datos apuntando a `https://assets.letiende.co/data/menu.json`
- ✅ Componente Menu con soporte multiidioma (ES/EN)
- ✅ Generación dinámica del menú lateral desde las categorías
- ✅ Visualización de items con precios, descripciones, alérgenos y opciones
- ✅ Filtrado automático por disponibilidad
- ✅ Spinner de carga mientras se obtienen datos
- ✅ Computed signals reactivos para cambios de idioma

### 2. Backend Lambda - Validación de Origen

**Archivos modificados:**
- `external_resources/AWS_Lambda/libs/funciones.mjs`
- `external_resources/Google_Apps_Script/actualizarContenido.gs`

**Problema resuelto:**
- ❌ Google Apps Script no enviaba header `Origin` por defecto
- ❌ Lambda rechazaba con error: "origen no permitido: undefined"

**Solución:**
- ✅ Google Apps Script envía explícitamente `Origin: https://script.google.com`
- ✅ Lambda valida origen de forma dual:
  - Header Origin (soporta origin/Origin por API Gateway)
  - User-Agent con patrón `Google-Apps-Script`
- ✅ Acepta petición si cumple cualquiera de las dos validaciones
- ✅ Logs mejorados para debugging

### 3. Documentación

**Archivos agregados:**
- `docs/fix-google-apps-script-origin.md`

Documentación completa del problema de validación de origen, solución implementada, pruebas y guía de despliegue.

## 🔄 Flujo de Datos Implementado

```
Google Sheets (Menu)
    ↓ (onEdit trigger)
Apps Script (actualizarContenido.gs)
    ↓ (POST /actualizarContenido)
AWS Lambda (index.mjs → funciones.mjs)
    ↓ (S3 PutObject)
S3 Bucket (letiende-assets/data/menu.json)
    ↓ (HTTP GET)
Angular SSR (datos.ts → getMenu())
    ↓ (computed signals)
Componente Menu (menu.ts)
    ↓ (template binding)
Usuario ve menú actualizado
```

## 🧪 Testing

### Para probar la integración:

1. **Actualizar Google Apps Script:**
   ```
   Copiar external_resources/Google_Apps_Script/actualizarContenido.gs
   al proyecto en https://script.google.com
   ```

2. **Ejecutar función de prueba:**
   ```javascript
   testEnviarContenido()
   ```

3. **Verificar respuesta exitosa:**
   ```
   ✅ Contenido de "inicio" actualizado exitosamente
   URL: https://letiende-assets.s3.amazonaws.com/data/inicio.json
   ```

4. **Desplegar Lambda actualizada:**
   ```bash
   cd external_resources/AWS_Lambda
   # Ejecutar comando de despliegue configurado
   ```

## 📦 Commits Incluidos

- `7e38f6b` - feat(menu): integración con API REST desde S3 para datos del menú
- `9e71641` - fix(api): validación de origen para peticiones desde Google Apps Script

## ⚠️ Breaking Changes

Ninguno. Los cambios son aditivos y no afectan funcionalidad existente.

## 🚀 Deployment Checklist

- [ ] Actualizar código en Google Apps Script
- [ ] Desplegar función Lambda actualizada
- [ ] Crear archivo `menu.json` de ejemplo en S3 para pruebas
- [ ] Verificar que Angular SSR carga datos correctamente
- [ ] Probar cambio de idioma ES ↔ EN
- [ ] Validar estructura del menú lateral

## 📝 Notas Adicionales

- El componente Menu está listo pero mostrará spinner hasta que exista `menu.json` en S3
- Las interfaces TypeScript siguen exactamente el esquema definido en `docs/esquema-contenido.json`
- La validación de origen en Lambda es compatible con peticiones desde otros orígenes permitidos (no es breaking change)

## 🔗 Referencias

- Esquema de contenido: `docs/esquema-contenido.json`
- Documentación del fix: `docs/fix-google-apps-script-origin.md`
- Google Apps Script: `external_resources/Google_Apps_Script/actualizarContenido.gs`
- Lambda API: `external_resources/AWS_Lambda/index.mjs`
