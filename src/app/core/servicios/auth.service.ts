import {
  Injectable,
  ApplicationRef,
  inject,
  signal,
  computed,
  Signal,
  WritableSignal
} from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface UsuarioAuth {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth: Auth = inject(Auth);
  private readonly appRef: ApplicationRef = inject(ApplicationRef);
  private readonly platformId: object = inject(PLATFORM_ID);

  private readonly _usuario: WritableSignal<UsuarioAuth | null> = signal<UsuarioAuth | null>(null);
  private readonly _cargando: WritableSignal<boolean> = signal<boolean>(true);
  private readonly _error: WritableSignal<string | null> = signal<string | null>(null);

  readonly usuario: Signal<UsuarioAuth | null> = this._usuario.asReadonly();
  readonly cargando: Signal<boolean> = this._cargando.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();
  readonly estaAutenticado: Signal<boolean> = computed(() => this._usuario() !== null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.inicializarAuthListener();
    } else {
      this._cargando.set(false);
    }
  }

  private inicializarAuthListener(): void {
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        this._usuario.set({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        this._usuario.set(null);
      }
      this._cargando.set(false);
      this.appRef.tick();
    });
  }

  async loginConGoogle(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this._error.set('La autenticación solo está disponible en el navegador');
      return;
    }

    this._cargando.set(true);
    this._error.set(null);

    try {
      const provider: GoogleAuthProvider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (err: unknown) {
      const mensaje: string = err instanceof Error ? err.message : 'Error desconocido al iniciar sesión';
      this._error.set(mensaje);
      console.error('Error en login con Google:', err);
    } finally {
      this._cargando.set(false);
      this.appRef.tick();
    }
  }

  async logout(): Promise<void> {
    this._cargando.set(true);
    this._error.set(null);

    try {
      await signOut(this.auth);
    } catch (err: unknown) {
      const mensaje: string = err instanceof Error ? err.message : 'Error desconocido al cerrar sesión';
      this._error.set(mensaje);
      console.error('Error en logout:', err);
    } finally {
      this._cargando.set(false);
      this.appRef.tick();
    }
  }

  limpiarError(): void {
    this._error.set(null);
  }
}
