# Plan de Migracion: Angular 20 a Angular 21 + PrimeNG 21

## Contexto

### Solicitud Original
Migrar la aplicacion letiende.co de Angular 20.3.x a Angular 21.1.x, PrimeNG 20.x a 21.x, y actualizar todas las dependencias del proyecto.

### Resumen de Investigacion

#### Angular 21 Breaking Changes
- **Test Runner**: Karma reemplazado por Vitest como default (Karma sigue soportado)
- **Zoneless por defecto**: Nuevas apps usan zoneless (apps existentes no se rompen)
- **Signal Forms**: Nueva API de formularios basada en signals
- **TypeScript 5.9**: Requerido para Angular 21

#### PrimeNG 21 Breaking Changes
- **Theming**: `@primeng/themes` migra a `@primeuix/themes` (v2.0.x)
- **Standalone por defecto**: Componentes standalone sin necesidad de NgModules
- **Angular 19+ requerido**: Compatible con Angular 21

#### FontAwesome 7 Breaking Changes
- **Nueva estructura de paquetes**: Reorganizacion por Icon Packs, Families y Styles
- **Sintaxis de clases CSS diferente**: `fa-classic fa-regular` en lugar de `-o`
- **Aliases disponibles**: Nombres antiguos tienen aliases para compatibilidad

#### @angular/fire
- **Version 21.0.0-rc.0**: Unica version disponible para Angular 21 (no hay estable aun)
- **ZoneWrapper ya no es singleton**: Mejor soporte para SSR concurrente

### Estado Actual de Dependencias

#### Dependencias a ELIMINAR
| Paquete | Version Actual | Razon de Eliminacion |
|---------|----------------|----------------------|
| `g` | ^2.0.1 | Instalacion accidental (debugger global), no es dependencia del proyecto |
| `@primeng/themes` | ^19.1.3 | Reemplazado por `@primeuix/themes` (migracion parcial anterior incompleta) |

#### Dependencias que NO Requieren Actualizacion
| Paquete | Version Actual | Justificacion |
|---------|----------------|---------------|
| `rxjs` | ~7.8.0 | Compatible con Angular 21, no hay breaking changes |
| `express` | ^5.1.0 | Version estable reciente, compatible con Node 22.x |
| `@codegenie/serverless-express` | ^4.16.0 | Funciona con Express 5.x, critico para SSR en Lambda |
| `@cloudinary/ng` | ^2.1.5 | SDK de Angular, verificar funcionamiento post-migracion |
| `@cloudinary/url-gen` | ^1.21.0 | Utilidades de URL, sin dependencia directa de Angular |
| `cloudinary` | ^2.7.0 | SDK core de Node.js, sin cambios requeridos |
| `tslib` | ^2.3.0 | Helper de TypeScript, compatible con TS 5.9 |
| `jasmine-core` | ~5.7.0 | Framework de testing, sin cambios (mantenemos Karma) |
| `karma` | ~6.4.0 | Test runner actual, sin cambios (no migramos a Vitest) |
| `karma-chrome-launcher` | ~3.2.0 | Plugin de Karma, sin cambios |
| `karma-coverage` | ~2.2.0 | Plugin de Karma, sin cambios |
| `karma-jasmine` | ~5.1.0 | Plugin de Karma, sin cambios |
| `karma-jasmine-html-reporter` | ~2.1.0 | Plugin de Karma, sin cambios |

#### Situacion de @primeuix/themes
**IMPORTANTE**: El proyecto YA tiene `@primeuix/themes: ^1.2.3` instalado junto con `@primeng/themes: ^19.1.3`. Esto indica una migracion parcial anterior. Los imports actuales en `lt-tema.ts` apuntan a `@primeng/themes`, no a `@primeuix/themes`.

**Accion requerida**:
1. ACTUALIZAR `@primeuix/themes` de 1.2.3 a 2.0.3
2. ELIMINAR `@primeng/themes` (obsoleto)
3. MIGRAR imports en `lt-tema.ts` de `@primeng/themes` a `@primeuix/themes`

### Archivos a Modificar
| Archivo | Cambios |
|---------|---------|
| `package.json` | Actualizar dependencias Angular/PrimeNG/FA, ELIMINAR `g` y `@primeng/themes`, ACTUALIZAR `@primeuix/themes` |
| `src/tema/lt-tema.ts` | Cambiar imports de `@primeng/themes` a `@primeuix/themes` |
| `src/app/app.config.ts` | Sin cambios requeridos (providePrimeNG compatible) |
| `src/app/compartidos/modulos/iconos/iconos-module.ts` | Posibles ajustes para FA 7 |
| `.claude/CLAUDE.md` | Actualizar versiones en tabla de Tecnologias (Angular 21.x, PrimeNG 21.x) |
| `angular.json` | Sin cambios requeridos |
| `tsconfig.json` | Sin cambios requeridos |

### Archivos a Verificar (sin modificar)
| Archivo | Verificacion |
|---------|--------------|
| `src/app/compartidos/servicios/cloudinary-api.ts` | Confirmar compatibilidad con Angular 21 |
| `src/app/compartidos/servicios/cloudinary-config.ts` | Confirmar inyeccion de dependencias funciona |
| Componentes con `<advanced-image>` | Confirmar imagenes cargan correctamente |

---

## Objetivos de Trabajo

### Objetivo Principal
Migrar letiende.co a Angular 21.1.x con PrimeNG 21.x manteniendo funcionalidad completa.

### Entregables
1. `package.json` actualizado con todas las dependencias en sus versiones objetivo
2. Tema PrimeNG funcionando con `@primeuix/themes`
3. Componentes FontAwesome funcionando con FA 7
4. Build SSR exitoso sin errores
5. Aplicacion funcionando en `ng serve`

### Definicion de Hecho
- [ ] `npm install` completa sin errores
- [ ] `ng build` compila sin errores ni warnings criticos
- [ ] `ng serve` inicia la aplicacion correctamente
- [ ] Navegacion funciona (navbar, rutas)
- [ ] Tema glassmorphism se aplica correctamente
- [ ] Iconos (Prime, FontAwesome, Material) se renderizan

---

## Guardrails

### DEBE Incluir
- Actualizacion de TODAS las dependencias de Angular a 21.1.x
- Actualizacion de PrimeNG a 21.x
- Actualizacion de @primeuix/themes a 2.0.x
- Migracion de imports de theming
- Verificacion de build SSR

### NO DEBE Incluir
- Migracion a Vitest (mantener Karma)
- Refactorizacion de logica de negocio
- Cambios en estructura de carpetas
- Nuevas funcionalidades
- Migracion a Signal Forms (fuera de alcance)

---

## Flujo de Tareas y Dependencias

```
FASE 1: Preparacion
    |
    v
FASE 2: Core Angular (21.1.x)
    |
    v
FASE 3: PrimeNG + Theming
    |
    v
FASE 4: FontAwesome
    |
    v
FASE 5: Dependencias Secundarias
    |
    v
FASE 6: Verificacion Final
```

---

## TODOs Detallados

### FASE 1: Preparacion [BLOQUEA: Fase 2-6]

#### TODO 1.1: Backup y Branch
**Descripcion**: Crear rama de migracion y backup del estado actual
**Archivos**: N/A (git)
**Comandos**:
```bash
git checkout -b feature/migracion-angular-21
git push -u origin feature/migracion-angular-21
```
**Criterio de Aceptacion**: Rama creada y pusheada

#### TODO 1.2: Limpiar node_modules y cache
**Descripcion**: Eliminar instalacion actual para evitar conflictos
**Archivos**: `node_modules/`, `package-lock.json`
**Comandos**:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
```
**Criterio de Aceptacion**: Directorios eliminados

---

### FASE 2: Core Angular [BLOQUEA: Fase 3-6]

#### TODO 2.1: Actualizar dependencias Angular core
**Descripcion**: Actualizar todos los paquetes @angular/* a 21.1.x
**Archivo**: `package.json`
**Cambios**:
```json
{
  "dependencies": {
    "@angular/animations": "^21.1.3",
    "@angular/cdk": "^21.1.3",
    "@angular/common": "^21.1.3",
    "@angular/compiler": "^21.1.3",
    "@angular/core": "^21.1.3",
    "@angular/forms": "^21.1.3",
    "@angular/platform-browser": "^21.1.3",
    "@angular/platform-server": "^21.1.3",
    "@angular/router": "^21.1.3",
    "@angular/ssr": "^21.1.3"
  },
  "devDependencies": {
    "@angular/build": "^21.1.3",
    "@angular/cli": "^21.1.3",
    "@angular/compiler-cli": "^21.1.3",
    "typescript": "~5.9.3"
  }
}
```
**Criterio de Aceptacion**: Versiones actualizadas en package.json

#### TODO 2.2: Actualizar @angular/fire
**Descripcion**: Actualizar AngularFire a version compatible con Angular 21
**Archivo**: `package.json`
**Cambios**:
```json
{
  "dependencies": {
    "@angular/fire": "^21.0.0-rc.0"
  }
}
```
**IMPORTANTE**: Usar `^21.0.0-rc.0` ya que la version estable 21.0.0 NO existe al momento de este plan. Solo esta disponible el Release Candidate.
**Criterio de Aceptacion**: Version RC instalada sin errores de peer dependencies

#### TODO 2.3: Instalar y verificar Angular core
**Descripcion**: Ejecutar npm install y verificar que no hay errores de peer dependencies
**Comandos**:
```bash
npm install
ng version
```
**Criterio de Aceptacion**:
- `npm install` sin errores criticos
- `ng version` muestra Angular 21.1.x

---

### FASE 3: PrimeNG + Theming [BLOQUEA: Fase 5-6]

#### TODO 3.1: Actualizar PrimeNG y themes
**Descripcion**: Actualizar PrimeNG a 21.x, actualizar @primeuix/themes existente, y eliminar @primeng/themes obsoleto
**Archivo**: `package.json`

**Estado actual**:
- `primeng`: ^20.0.1 (actualizar a 21.x)
- `@primeuix/themes`: ^1.2.3 (YA EXISTE, actualizar a 2.0.3)
- `@primeng/themes`: ^19.1.3 (ELIMINAR - obsoleto)

**Cambios a realizar**:
```json
{
  "dependencies": {
    "primeng": "^21.1.1",
    "@primeuix/themes": "^2.0.3"
  }
}
```

**ELIMINAR estas lineas del package.json**:
```json
"@primeng/themes": "^19.1.3",
"g": "^2.0.1",
```

**Secuencia de edicion**:
1. Cambiar version de `primeng` de `^20.0.1` a `^21.1.1`
2. Cambiar version de `@primeuix/themes` de `^1.2.3` a `^2.0.3`
3. Eliminar linea completa de `@primeng/themes`
4. Eliminar linea completa de `g` (instalacion accidental)

**Criterio de Aceptacion**:
- `primeng` en ^21.1.1
- `@primeuix/themes` en ^2.0.3
- `@primeng/themes` NO existe en package.json
- `g` NO existe en package.json

#### TODO 3.2: Migrar imports del tema
**Descripcion**: Cambiar imports de @primeng/themes a @primeuix/themes
**Archivo**: `src/tema/lt-tema.ts`
**Cambios**:
```typescript
// ANTES:
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { $dt } from '@primeng/themes';

// DESPUES:
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { $dt } from '@primeuix/themes';
```
**Criterio de Aceptacion**:
- Imports actualizados
- No hay errores de TypeScript en el archivo

#### TODO 3.3: Verificar providePrimeNG
**Descripcion**: Confirmar que la configuracion en app.config.ts sigue funcionando
**Archivo**: `src/app/app.config.ts`
**Verificacion**: El import `providePrimeNG` de `primeng/config` debe seguir funcionando sin cambios
**Criterio de Aceptacion**: No hay errores de compilacion

#### TODO 3.4: Verificar build con PrimeNG
**Descripcion**: Compilar para verificar que los componentes PrimeNG funcionan
**Comandos**:
```bash
ng build --configuration development
```
**Criterio de Aceptacion**: Build exitoso sin errores de PrimeNG

---

### FASE 4: FontAwesome [BLOQUEA: Fase 6]

#### TODO 4.1: Actualizar paquetes FontAwesome
**Descripcion**: Actualizar angular-fontawesome y paquetes de iconos a v7
**Archivo**: `package.json`
**Cambios**:
```json
{
  "dependencies": {
    "@fortawesome/angular-fontawesome": "^4.0.0",
    "@fortawesome/free-brands-svg-icons": "^7.1.0",
    "@fortawesome/free-regular-svg-icons": "^7.1.0",
    "@fortawesome/free-solid-svg-icons": "^7.1.0"
  }
}
```
**Criterio de Aceptacion**: Paquetes actualizados

#### TODO 4.2: Verificar compatibilidad de iconos
**Descripcion**: Revisar que los iconos usados existen en FA 7
**Archivo**: `src/app/compartidos/modulos/iconos/iconos-module.ts`
**Iconos usados actualmente**:
- `faMugHot` de `@fortawesome/free-solid-svg-icons`
**Nota**: FA 7 tiene aliases para nombres antiguos, pero verificar que `faMugHot` existe
**Criterio de Aceptacion**: Iconos importan sin errores

#### TODO 4.3: Verificar componente Icono
**Descripcion**: Confirmar que el componente lt-icono renderiza FA icons correctamente
**Archivo**: `src/app/compartidos/componentes/icono.ts`
**Verificacion**: El template usa `<fa-icon [icon]="[icono().tipo, icono().nombre]" />` que deberia seguir funcionando
**Criterio de Aceptacion**: Iconos se renderizan en la app

---

### FASE 5: Dependencias Secundarias [BLOQUEA: Fase 6]

#### TODO 5.1: Actualizar Serverless
**Descripcion**: Actualizar serverless a ultima version
**Archivo**: `package.json`
**Cambios**:
```json
{
  "devDependencies": {
    "serverless": "^4.31.2"
  }
}
```
**Criterio de Aceptacion**: Version actualizada

#### TODO 5.2: Actualizar @types/node
**Descripcion**: Actualizar tipos de Node.js
**Archivo**: `package.json`
**Cambios**:
```json
{
  "devDependencies": {
    "@types/node": "^22.13.4"
  }
}
```
**Criterio de Aceptacion**: Version actualizada

#### TODO 5.3: Reinstalar todas las dependencias
**Descripcion**: Limpiar e instalar todo desde cero
**Comandos**:
```bash
rm -rf node_modules package-lock.json
npm install
```
**Criterio de Aceptacion**: `npm install` exitoso sin errores de peer dependencies

---

### FASE 6: Verificacion Final

#### TODO 6.1: Build de produccion
**Descripcion**: Ejecutar build completo de produccion
**Comandos**:
```bash
npm run build:ssr:prod
```
**Criterio de Aceptacion**: Build exitoso, bundles generados en `dist/`

#### TODO 6.2: Verificar servidor de desarrollo
**Descripcion**: Iniciar la aplicacion en modo desarrollo
**Comandos**:
```bash
ng serve
```
**Criterio de Aceptacion**:
- Aplicacion inicia sin errores
- Navegacion funciona
- Tema glassmorphism se aplica
- Iconos se muestran

#### TODO 6.3: Verificar Cloudinary SDK
**Descripcion**: Confirmar que @cloudinary/ng funciona correctamente con Angular 21
**Archivos a verificar**:
- `src/app/compartidos/servicios/cloudinary-api.ts`
- `src/app/compartidos/servicios/cloudinary-config.ts`
- Cualquier componente que use `<advanced-image>`

**Verificacion**:
1. Navegar a una pagina que muestre imagenes de Cloudinary
2. Confirmar que las imagenes cargan correctamente
3. Verificar consola del navegador por errores relacionados con Cloudinary

**Criterio de Aceptacion**:
- Imagenes de Cloudinary se cargan sin errores
- Transformaciones (resize, quality, blur) funcionan
- No hay errores en consola relacionados con @cloudinary/ng

#### TODO 6.4: Verificar SSR local
**Descripcion**: Probar el servidor SSR localmente
**Comandos**:
```bash
npm run build:ssr:prod
npm run serve:ssr:letiende.co
```
**Criterio de Aceptacion**: Aplicacion sirve contenido pre-renderizado

#### TODO 6.5: Documentar cambios
**Descripcion**: Actualizar documentacion si es necesario
**Archivo**: `CLAUDE.md` (si hay cambios en versiones documentadas)
**Cambios requeridos en tabla de Tecnologias**:
- Angular: 20.x → 21.x
- PrimeNG: 20.x → 21.x
**Criterio de Aceptacion**: Documentacion refleja nuevas versiones

---

## Estrategia de Commits

| Fase | Mensaje de Commit |
|------|-------------------|
| Fase 1 | `chore: preparar migracion Angular 21` |
| Fase 2 | `chore(deps): actualizar Angular core a 21.1.x` |
| Fase 3 | `chore(deps): actualizar PrimeNG a 21.x y migrar theming` |
| Fase 4 | `chore(deps): actualizar FontAwesome a 7.x` |
| Fase 5 | `chore(deps): actualizar dependencias secundarias` |
| Fase 6 | `docs: actualizar versiones en documentacion` |

---

## Criterios de Exito

### Funcionales
- [ ] Aplicacion compila sin errores
- [ ] SSR funciona correctamente
- [ ] Navegacion entre rutas funciona
- [ ] Tema glassmorphism se aplica (menubar, botones, menu)
- [ ] Iconos Prime, FontAwesome y Material se renderizan
- [ ] Firebase se inicializa correctamente (usando @angular/fire RC)
- [ ] Cloudinary carga imagenes (@cloudinary/ng compatible con Angular 21)
- [ ] Transformaciones de Cloudinary funcionan (resize, blur, quality)

### Tecnicos
- [ ] `ng version` muestra Angular 21.1.x
- [ ] No hay warnings de peer dependencies criticos
- [ ] Bundle size no aumenta significativamente (< 10%)
- [ ] Build time razonable (< 2 minutos)
- [ ] Paquetes eliminados: `g`, `@primeng/themes` NO existen en package.json
- [ ] `@primeuix/themes` en version ^2.0.3

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| @angular/fire RC inestable | Media | Alto | Usar `^21.0.0-rc.0`, monitorear issues en GitHub, fallback a 20.x si hay problemas criticos |
| Breaking changes en theming PrimeNG | Baja | Medio | Imports migran de `@primeng/themes` a `@primeuix/themes`, ajustar definePreset si es necesario |
| Iconos FA cambiaron nombre | Baja | Bajo | FA 7 tiene aliases, solo `faMugHot` usado actualmente |
| SSR incompatible | Baja | Alto | Verificar serverless-express sigue funcionando con Angular 21 SSR |
| @cloudinary/ng incompatible | Baja | Medio | SDK no depende directamente de Angular internals, verificar post-migracion |
| Dependencias huerfanas post-limpieza | Baja | Bajo | Verificar que eliminar `g` y `@primeng/themes` no rompe nada |

---

## Referencias

- [Angular Update Guide](https://angular.dev/update-guide)
- [Angular 21 Announcement](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- [PrimeNG v21 Migration](https://primeng.org/migration/v21)
- [FontAwesome 7 Upgrade Guide](https://docs.fontawesome.com/upgrade/upgrade-from-older-versions/)
- [angular-fontawesome UPGRADING.md](https://github.com/FortAwesome/angular-fontawesome/blob/main/UPGRADING.md)
- [AngularFire Releases](https://github.com/angular/angularfire/releases)
