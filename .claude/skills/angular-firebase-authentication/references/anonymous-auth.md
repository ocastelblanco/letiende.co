# Autenticacion Anonima

Permite a usuarios interactuar con la app sin crear cuenta, con opcion de vincular cuenta permanente despues.

## Configuracion

1. Firebase Console > Authentication > Sign-in method
2. Habilitar "Anonymous"

## Login anonimo

```typescript
import { inject } from '@angular/core';
import { Auth, signInAnonymously, User } from '@angular/fire/auth';

export class AuthService {
  private auth = inject(Auth);

  async loginAnonymously(): Promise<User> {
    const credential = await signInAnonymously(this.auth);
    return credential.user;
  }
}
```

## Verificar si usuario es anonimo

```typescript
import { user } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';

export class AuthService {
  private auth = inject(Auth);

  readonly currentUser = toSignal(user(this.auth));
  readonly isAnonymous = computed(() => this.currentUser()?.isAnonymous ?? false);
}
```

## Convertir cuenta anonima a permanente

### Con Email/Password

```typescript
import {
  linkWithCredential,
  EmailAuthProvider,
  updateProfile
} from '@angular/fire/auth';

async convertToEmailAccount(email: string, password: string, displayName?: string) {
  const user = this.auth.currentUser;
  if (!user || !user.isAnonymous) {
    throw new Error('No hay usuario anonimo activo');
  }

  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(user, credential);

  if (displayName) {
    await updateProfile(result.user, { displayName });
  }

  return result.user;
}
```

### Con proveedor social

```typescript
import { linkWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

async convertToGoogleAccount() {
  const user = this.auth.currentUser;
  if (!user || !user.isAnonymous) {
    throw new Error('No hay usuario anonimo activo');
  }

  const provider = new GoogleAuthProvider();
  const result = await linkWithPopup(user, provider);
  return result.user;
}
```

## Componente de conversion de cuenta

```typescript
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Auth,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
  updateProfile
} from '@angular/fire/auth';

@Component({
  selector: 'app-convert-account',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (isAnonymous()) {
      <div class="convert-prompt">
        <h3>Guarda tu progreso</h3>
        <p>Crea una cuenta para no perder tus datos</p>

        <form (ngSubmit)="convertWithEmail()">
          <input
            type="email"
            [(ngModel)]="email"
            name="email"
            placeholder="Email"
            required
          />
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            placeholder="Password"
            minlength="6"
            required
          />
          <button type="submit" [disabled]="loading()">
            Crear cuenta
          </button>
        </form>

        <div class="divider">o</div>

        <button (click)="convertWithGoogle()" [disabled]="loading()">
          Continuar con Google
        </button>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </div>
    }
  `
})
export class ConvertAccountComponent {
  private auth = inject(Auth);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  isAnonymous = signal(false);

  constructor() {
    // Verificar estado inicial
    this.isAnonymous.set(this.auth.currentUser?.isAnonymous ?? false);
  }

  async convertWithEmail() {
    const user = this.auth.currentUser;
    if (!user) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const credential = EmailAuthProvider.credential(this.email, this.password);
      await linkWithCredential(user, credential);
      this.isAnonymous.set(false);
    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  async convertWithGoogle() {
    const user = this.auth.currentUser;
    if (!user) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(user, provider);
      this.isAnonymous.set(false);
    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este email ya esta registrado',
      'auth/credential-already-in-use': 'Esta cuenta ya esta vinculada a otro usuario',
      'auth/provider-already-linked': 'Este proveedor ya esta vinculado',
    };
    return messages[code] || 'Error al convertir cuenta';
  }
}
```

## Flujo tipico de autenticacion anonima

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { Auth, signInAnonymously, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  private auth = inject(Auth);

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        // Auto-login anonimo si no hay usuario
        await signInAnonymously(this.auth);
      }
    });
  }
}
```

## Limpieza de usuarios anonimos

Firebase automaticamente puede limpiar usuarios anonimos no usados. Configurar en:

Firebase Console > Authentication > Settings > User account linking

- Automatic clean-up: elimina usuarios anonimos despues de 30 dias de inactividad

## Consideraciones

1. **Datos persistentes**: Los datos de Firestore/Realtime DB asociados al UID anonimo se mantienen al convertir
2. **Sin recuperacion**: Si el usuario cierra sesion antes de convertir, pierde acceso
3. **Multiples dispositivos**: Cada dispositivo crea un usuario anonimo diferente
4. **Seguridad**: Usar reglas de seguridad apropiadas en Firestore/Storage
