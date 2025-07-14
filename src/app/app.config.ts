import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FirebaseOptions, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { Cloudinary } from '@cloudinary/url-gen'; // Importa Cloudinary para crear la instancia y como token de inyección
import { CloudinaryConfig } from '@servicios/cloudinary-config';
import { FirebaseConfig } from '@servicios/firebase-config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { LTPreset } from '../tema/lt-tema';


let localSecrets: any | undefined = undefined;
try {
  localSecrets = require('../secrets').localSecrets;
} catch (e) {
  // No existe localSecrets porque este es un entorno de producción
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // Usamos una función de fábrica para inyectar FirebaseConfigService
    // e inicializar Firebase con las opciones obtenidas de él.
    provideFirebaseApp(() => {
      const firebaseConfigService: FirebaseConfig = inject(FirebaseConfig);
      if (!firebaseConfigService.firebaseOptions) {
        if (localSecrets) {
          const options: FirebaseOptions = {
            projectId: localSecrets.FIREBASE_PROJECT_ID,
            appId: localSecrets.FIREBASE_APP_ID,
            storageBucket: localSecrets.FIREBASE_STORAGE_BUCKET,
            apiKey: localSecrets.FIREBASE_API_KEY,
            authDomain: localSecrets.FIREBASE_AUTH_DOMAIN,
            messagingSenderId: localSecrets.FIREBASE_MESSAGING_SENDER_ID,
            measurementId: localSecrets.FIREBASE_MEASUREMENT_ID,
          };
          return initializeApp(options);
        }
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
    provideStorage(() => getStorage()),
    // Provee la instancia de Cloudinary configurada globalmente.
    // Esto permite inyectar 'Cloudinary' en cualquier componente/servicio.
    {
      provide: Cloudinary,
      useFactory: () => {
        let cloudinaryConfigService: CloudinaryConfig = inject(CloudinaryConfig);
        if (!cloudinaryConfigService.cloudName) {
          if (localSecrets) {
            return new Cloudinary({ cloud: { cloudName: localSecrets.CLOUDINARY_CLOUD_NAME } });
          }
          console.error('Cloudinary Cloud Name no está disponible. El SDK de Cloudinary podría no funcionar correctamente.');
          return new Cloudinary({ cloud: { cloudName: 'letiende' } }); // Fallback o manejo de error
        }
        return new Cloudinary({ cloud: { cloudName: cloudinaryConfigService.cloudName } });
      },
      deps: [CloudinaryConfig] // Declara la dependencia para la función de fábrica
    },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: LTPreset,
        options: {
          prefix: 'lt',
          darkModeSelector: '.tema-oscuro',
        },
      },
    }),
  ]
};
