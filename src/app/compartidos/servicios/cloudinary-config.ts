import {
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  inject,
  makeStateKey,
  TransferState,
  StateKey
} from '@angular/core';
import { isPlatformServer } from '@angular/common';

// StateKey para transferir el estado del servidor al cliente.
const CLOUDINARY_API_KEY_STATE: StateKey<string> = makeStateKey<string>('cloudinaryApiKey');
const CLOUDINARY_CLOUD_NAME_STATE: StateKey<string> = makeStateKey<string>('cloudinaryCloudName');

// InjectionToken para inyectar la variable de entorno del servidor a la app Angular.
export const CLOUDINARY_API_KEY: InjectionToken<string> = new InjectionToken<string>('CLOUDINARY_API_KEY');
export const CLOUDINARY_CLOUD_NAME: InjectionToken<string> = new InjectionToken<string>('CLOUDINARY_CLOUD_NAME');

@Injectable({
  providedIn: 'root'
})
export class CloudinaryConfig {
  private platformId: any = inject(PLATFORM_ID);
  private transferState: TransferState = inject(TransferState);
  // Inyectamos el token de forma opcional, ya que solo existirá en el servidor.
  private serverApiKey: string | null = inject(CLOUDINARY_API_KEY, { optional: true });
  private serverCloudName: string | null = inject(CLOUDINARY_CLOUD_NAME, { optional: true });

  public readonly apiKey: string | null;
  public readonly cloudName: string | null;

  constructor() {
    if (isPlatformServer(this.platformId)) {
      // En el servidor: obtenemos la clave del token y la guardamos en TransferState.
      this.apiKey = this.serverApiKey || null;
      this.cloudName = this.serverCloudName || null;
      if (this.apiKey) {
        this.transferState.set(CLOUDINARY_API_KEY_STATE, this.apiKey);
      }
      if (this.cloudName) {
        this.transferState.set(CLOUDINARY_CLOUD_NAME_STATE, this.cloudName);
      }
    } else {
      // En el cliente: obtenemos la clave desde TransferState.
      this.apiKey = this.transferState.get(CLOUDINARY_API_KEY_STATE, null);
      this.cloudName = this.transferState.get(CLOUDINARY_CLOUD_NAME_STATE, null);
    }
  }
}
