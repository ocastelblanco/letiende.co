import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { APP_BASE_HREF } from '@angular/common'; // Importa APP_BASE_HREF
import { serverRoutes } from './app.routes.server';
import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } from '@servicios/cloudinary-config';
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_APP_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_MEASUREMENT_ID
} from '@servicios/firebase-config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: CLOUDINARY_API_KEY, useValue: process.env['CLOUDINARY_API_KEY'] },
    { provide: CLOUDINARY_CLOUD_NAME, useValue: process.env['CLOUDINARY_CLOUD_NAME'] },
    { provide: APP_BASE_HREF, useValue: process.env['APP_BASE_HREF'] || '/' }, // Provee APP_BASE_HREF para el router en SSR
    { provide: FIREBASE_PROJECT_ID, useValue: process.env['FIREBASE_PROJECT_ID'] },
    { provide: FIREBASE_APP_ID, useValue: process.env['FIREBASE_APP_ID'] },
    { provide: FIREBASE_STORAGE_BUCKET, useValue: process.env['FIREBASE_STORAGE_BUCKET'] },
    { provide: FIREBASE_API_KEY, useValue: process.env['FIREBASE_API_KEY'] },
    { provide: FIREBASE_AUTH_DOMAIN, useValue: process.env['FIREBASE_AUTH_DOMAIN'] },
    { provide: FIREBASE_MESSAGING_SENDER_ID, useValue: process.env['FIREBASE_MESSAGING_SENDER_ID'] },
    { provide: FIREBASE_MEASUREMENT_ID, useValue: process.env['FIREBASE_MEASUREMENT_ID'] },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
