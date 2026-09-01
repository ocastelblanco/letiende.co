# TODO.md — Motor de Planificación JIT

> **Principio:** Este archivo contiene únicamente las **dos siguientes tareas atómicas**.
> Cada vez que se completa una tarea, se elimina de aquí, se marca en `MEMORY.md`, y el motor
> recalcula las dos nuevas siguientes comparando `PRD.md` (objetivo final) con `MEMORY.md` (estado real).
>
> **Motor JIT:** `PRD.md` (qué falta) ∩ `MEMORY.md` (qué hay hecho + riesgos abiertos) → 2 tareas.
> Regla de prioridad: seguridad en producción > features de alta prioridad > features de media prioridad.

---

## Cómo actualizar este archivo

Al completar la tarea 1:
1. Mover la tarea 1 al historial (al final de este archivo).
2. Promover la tarea 2 a posición 1.
3. Calcular la nueva tarea 2 comparando `PRD.md` con `MEMORY.md` actualizado.
4. Actualizar la sección "Contexto de la sesión actual" en `MEMORY.md`.

---

## Tarea 1 · [FEATURE] `AdminMenu` — edición inline de ítems

**Origen:** PRD Roadmap — Admin de Menú (continuación directa de T1)
**Prioridad:** Alta — convierte la vista de solo lectura en un editor funcional
**Archivos a modificar:**
- `src/app/vistas/admin/menu/admin-menu.ts`
- `src/app/vistas/admin/menu/admin-menu.html`
- `src/app/vistas/admin/menu/admin-menu.scss`

### Contexto

Después de crear la vista base (T1), este paso agrega la capacidad de editar los campos de cada ítem del menú directamente en la tabla: nombre (ES/EN), descripción (ES/EN), precio y disponibilidad. Seguir el patrón de `admin-eventos` que usa `p-dialog` de PrimeNG para el formulario de edición.

### Qué hacer

1. Agregar signal `itemEditando = signal<MenuItem | null>(null)` y `dialogVisible = signal(false)`.
2. Crear un `p-dialog` en el template con un `ReactiveForm` que tenga los campos: `nombreEs`, `nombreEn`, `descripcionEs`, `descripcionEn`, `precio`, `disponible`.
3. Al hacer clic en "Editar" en una fila, poblar el form con el ítem seleccionado y abrir el diálogo.
4. Al guardar el diálogo, actualizar la señal del menú con el ítem modificado (inmutable con spread).
5. El botón "Guardar cambios" principal llama a `AdminMenuService.guardarMenu()` con el estado completo actualizado y muestra `p-toast`.

### Definición de done

- [ ] Diálogo de edición abre con los datos del ítem seleccionado.
- [ ] Cambios en el diálogo se reflejan en la lista al confirmar.
- [ ] `AdminMenuService.guardarMenu()` recibe el payload actualizado al presionar "Guardar cambios".
- [ ] Toast de confirmación/error visible.
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Build SSR pasa: `npm run build:ssr`.

---

## Tarea 2 · [SEGURIDAD] `X-API-Key` en `/actualizarContenido`

**Origen:** ADR-011 (OWASP A01) · Riesgo activo — el endpoint escribe en S3 sin autenticación
**Prioridad:** Alta seguridad — cualquier actor puede sobrescribir el JSON del sitio
**Archivo:** `external_resources/AWS_Lambda/index.mjs` (case `actualizarContenido`)

### Contexto

El endpoint `POST /actualizarContenido` guarda el contenido del sitio en S3. No verifica ningún token ni credencial — cualquiera que conozca la URL puede sobrescribir el menú, los eventos, o cualquier sección. La solución es un header secreto `X-API-Key` almacenado en AWS SSM, verificado antes de procesar el payload.

### Qué hacer

**Paso 1 — Leer el secreto desde variables de entorno en `index.mjs`:**
```javascript
const API_KEY_SECRETA = process.env.api_key_interna ?? null;
```

**Paso 2 — Agregar función de validación:**
```javascript
const validaApiKey = (event) => {
  const keyRecibida = event.headers?.['x-api-key'] ?? event.headers?.['X-API-Key'] ?? null;
  if (!API_KEY_SECRETA || !keyRecibida) return false;
  return keyRecibida === API_KEY_SECRETA;
};
```

**Paso 3 — Aplicar en el case `actualizarContenido` antes de `leeJSON`:**
```javascript
case 'actualizarContenido': {
  if (!validaApiKey(event)) {
    salida({ error: 'No autorizado.' }, 403);
    break;
  }
  // ... resto del handler
}
```

**Paso 4 — Crear el secreto en SSM:**
```bash
aws ssm put-parameter \
  --name "/letiende/prod/api_key_interna" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" --overwrite
```

**Paso 5 — Agregar la variable al entorno de la Lambda `letiende-api` desde la consola AWS o via CLI.**

### Definición de done

- [ ] Variable `API_KEY_SECRETA` leída desde `process.env.api_key_interna`.
- [ ] Función `validaApiKey()` valida el header `X-API-Key`.
- [ ] Verificación aplicada **antes** de `leeJSON()` en `actualizarContenido`.
- [ ] Secreto creado en SSM: `/letiende/prod/api_key_interna`.
- [ ] Prueba: `POST /actualizarContenido` sin header → HTTP 403.
- [ ] Prueba: `POST /actualizarContenido` con header correcto → HTTP 200.
- [ ] Redesplegar Lambda: `aws lambda update-function-code`.
- [ ] `MEMORY.md` actualizado: marcar `X-API-Key /actualizarContenido` como ✅ en ADR-011.
- [ ] Actualizar Google Apps Script para enviar el header en cada request.

---

## Historial de tareas completadas

### ✅ T1 completada — 2026-04-13
**[SEGURIDAD] Headers HTTP en `src/server.ts`** (OWASP A05)
- Middleware con `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP completo.
- Ajustes posteriores al CSP: agregados `cdn.jsdelivr.net` y `fonts.cdnfonts.com` a `style-src`, `font-src` y `connect-src` tras verificación en staging.
- Build verificado y deploy a dev confirmado funcional.

### ✅ T2 → T1 completada — 2026-04-13
**[FEATURE] `AdminMenuService`** en `src/app/core/servicios/admin-menu.service.ts`
- Servicio creado siguiendo el patrón de `AdminEventosService`.
- Tipado con `MenuResponse['idiomas']` desde `@servicios/datos`.
- `npx tsc --noEmit` sin errores.

### ✅ T1 completada — 2026-04-14
**[FEATURE] Vista `AdminMenu` — componente base**
- `src/app/vistas/admin/menu/admin-menu.ts|html|scss` creados.
- Carga menú desde CDN con `toSignal(datos.getMenu())`.
- Muestra categorías con tabla de ítems por cada una.
- Botón "Guardar cambios" llama a `AdminMenuService.guardarMenu()` con toast.
- Ruta `/admin/menu` con lazy load y `canActivate: [authGuard]` en `app.routes.ts`.
- `npx tsc --noEmit` sin errores · Build SSR exitoso (exit 0).

### ✅ T1 completada — 2026-04-13
**[SEGURIDAD] Validación anti-SSRF en `/coverDiscogs`** (OWASP A10)
- Función `esUrlDiscogSegura()` agregada en `external_resources/AWS_Lambda/index.mjs`.
- Valida protocolo `https:` y hostname `*.discogs.com` antes del fetch.
- Prueba: `curl "…/coverDiscogs?cover=http://169.254.169.254"` → HTTP 400 ✅
- Prueba: `curl "…/coverDiscogs?cover=https://i.discogs.com/test.jpg"` → pasa a Discogs ✅
- Redesplegado en `letiende-api` (us-east-1). ADR-011 actualizado.

---

## Log del motor JIT

| Fecha | Comparación realizada | Resultado |
|---|---|---|
| 2026-04-13 | PRD O-01..O-05 ✅ · O-06..O-08 🔲 · ADR-011 gaps abiertos | T1=Headers HTTP (seguridad) · T2=AdminMenuService (feature Alta) |
| 2026-04-13 | Headers HTTP ✅ · Admin Menú pendiente · SSRF abierto | T1=AdminMenuService · T2=SSRF /coverDiscogs |
| 2026-04-13 | AdminMenuService ✅ · SSRF abierto · Vista AdminMenu pendiente | T1=SSRF /coverDiscogs (seguridad crítica) · T2=Vista AdminMenu (feature Alta) |
| 2026-04-13 | SSRF ✅ · Vista AdminMenu pendiente · edición inline pendiente | T1=Vista AdminMenu (feature Alta) · T2=Edición inline ítems AdminMenu (feature Alta) |
| 2026-04-14 | Vista AdminMenu ✅ · Edición inline pendiente · X-API-Key abierto (A01) | T1=Edición inline AdminMenu (feature Alta) · T2=X-API-Key /actualizarContenido (seguridad A01) |
