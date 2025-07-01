import { Injectable, InjectionToken, PLATFORM_ID, inject, makeStateKey, TransferState, StateKey } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { FirebaseOptions } from '@angular/fire/app'; // Importa el tipo FirebaseOptions

// Define InjectionTokens para cada credencial de Firebase
export const FIREBASE_PROJECT_ID: InjectionToken<string> = new InjectionToken<string>('FIREBASE_PROJECT_ID');
export const FIREBASE_APP_ID: InjectionToken<string> = new InjectionToken<string>('FIREBASE_APP_ID');
export const FIREBASE_STORAGE_BUCKET: InjectionToken<string> = new InjectionToken<string>('FIREBASE_STORAGE_BUCKET');
export const FIREBASE_API_KEY: InjectionToken<string> = new InjectionToken<string>('FIREBASE_API_KEY');
export const FIREBASE_AUTH_DOMAIN: InjectionToken<string> = new InjectionToken<string>('FIREBASE_AUTH_DOMAIN');
export const FIREBASE_MESSAGING_SENDER_ID: InjectionToken<string> = new InjectionToken<string>('FIREBASE_MESSAGING_SENDER_ID');
export const FIREBASE_MEASUREMENT_ID: InjectionToken<string> = new InjectionToken<string>('FIREBASE_MEASUREMENT_ID');

// Define StateKey para TransferState
const FIREBASE_OPTIONS_STATE_KEY: StateKey<FirebaseOptions> = makeStateKey<FirebaseOptions>('firebaseOptions');

@Injectable({
  providedIn: 'root'
})
export class FirebaseConfig {
  private platformId: any = inject(PLATFORM_ID);
  private transferState: TransferState = inject(TransferState);

  // Inyectamos los valores del servidor (opcionales, ya que solo existirán en el servidor)
  private serverProjectId: string | null = inject(FIREBASE_PROJECT_ID, { optional: true });
  private serverAppId: string | null = inject(FIREBASE_APP_ID, { optional: true });
  private serverStorageBucket: string | null = inject(FIREBASE_STORAGE_BUCKET, { optional: true });
  private serverApiKey: string | null = inject(FIREBASE_API_KEY, { optional: true });
  private serverAuthDomain: string | null = inject(FIREBASE_AUTH_DOMAIN, { optional: true });
  private serverMessagingSenderId: string | null = inject(FIREBASE_MESSAGING_SENDER_ID, { optional: true });
  private serverMeasurementId: string | null = inject(FIREBASE_MEASUREMENT_ID, { optional: true });

  public readonly firebaseOptions: FirebaseOptions | null | undefined;

  constructor() {
    if (isPlatformServer(this.platformId)) {
      // En el servidor: recopilamos los valores y los almacenamos en TransferState
      const options: FirebaseOptions = {
        projectId: this.serverProjectId || undefined,
        appId: this.serverAppId || undefined,
        storageBucket: this.serverStorageBucket || undefined,
        apiKey: this.serverApiKey || undefined,
        authDomain: this.serverAuthDomain || undefined,
        messagingSenderId: this.serverMessagingSenderId || undefined,
        measurementId: this.serverMeasurementId || undefined,
      };

      // Solo establecemos las opciones si al menos un valor está presente
      if (Object.values(options).some(val => val !== undefined)) {
        this.firebaseOptions = options;
        this.transferState.set(FIREBASE_OPTIONS_STATE_KEY, options);
      } else {
        this.firebaseOptions = null;
      }
    } else {
      // En el cliente: recuperamos las opciones desde TransferState
      this.firebaseOptions = this.transferState.get(FIREBASE_OPTIONS_STATE_KEY, null);
    }
  }
}
