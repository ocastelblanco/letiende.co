import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';

// Sin esto, DatePipe usa el locale por defecto de Angular (en-US) — los
// nombres de mes/día de `evento.fechaHora | date` (portada, `inicio.html`)
// salían en inglés pese a que CLAUDE.md §4 exige español colombiano en
// toda la interfaz.
registerLocaleData(localeEsCO);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Bloqueante también en el navegador: `App` decide si pinta barra y pie
    // según los datos de la ruta (`sinMarco`), y sin esperar la navegación
    // inicial el primer render difiere del HTML del servidor (hidratación).
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideClientHydration(),
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ],
};
