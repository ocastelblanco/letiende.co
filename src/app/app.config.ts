import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { Cloudinary } from '@cloudinary/url-gen'; // Importa Cloudinary para crear la instancia y como token de inyección
import { CloudinaryConfig } from '@servicios/cloudinary-config';
import { FirebaseConfig } from '@servicios/firebase-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // Usamos una función de fábrica para inyectar FirebaseConfigService
    // e inicializar Firebase con las opciones obtenidas de él.
    provideFirebaseApp(() => {
      const firebaseConfigService = inject(FirebaseConfig);
      if (!firebaseConfigService.firebaseOptions) {
        // Manejar el caso en que las opciones de Firebase no estén disponibles.
        // Esto podría indicar una configuración incorrecta de las variables de entorno.
        console.error('Firebase configuration options are not available. Check environment variables.');
        // Retornar una configuración vacía o lanzar un error, dependiendo de la criticidad.
        // Una configuración vacía puede causar errores posteriores si Firebase es esencial.
        return initializeApp({});
      }
      return initializeApp(firebaseConfigService.firebaseOptions);
    }),
    provideAuth(() => getAuth()),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
    ,
    // Provee la instancia de Cloudinary configurada globalmente.
    // Esto permite inyectar 'Cloudinary' en cualquier componente/servicio.
    {
      provide: Cloudinary,
      useFactory: () => {
        const cloudinaryConfigService = inject(CloudinaryConfig);
        if (!cloudinaryConfigService.cloudName) {
          console.error('Cloudinary Cloud Name no está disponible. El SDK de Cloudinary podría no funcionar correctamente.');
          return new Cloudinary({ cloud: { cloudName: 'dummy_cloud_name' } }); // Fallback o manejo de error
        }
        return new Cloudinary({ cloud: { cloudName: cloudinaryConfigService.cloudName } });
      },
      deps: [CloudinaryConfig] // Declara la dependencia para la función de fábrica
    }
  ]
};
