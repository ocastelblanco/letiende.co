---
name: angular-firebase-authentication
description: Implementacion de autenticacion Firebase en Angular 21.1.x con AngularFire. Usar al crear login, registro, autenticacion social (Google, Facebook, Twitter), auth por telefono, guards de rutas, manejo de sesion, o cualquier flujo de autenticacion en aplicaciones Angular con Firebase. Incluye signals, standalone components, y patrones reactivos modernos.
---

# Angular Firebase Authentication

Implementa autenticacion Firebase en Angular 21.1.x usando AngularFire y patrones modernos.

## Configuracion inicial

### Instalacion

```bash
ng add @angular/fire
```

### Providers en app.config.ts

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: 'tu-api-key',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123'
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
};
```

## APIs principales

### Servicio Auth

```typescript
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

export class AuthService {
  private auth = inject(Auth);
}
```

### Observables de estado

| Observable | Eventos | Uso |
|------------|---------|-----|
| `user(auth)` | sign-in, sign-out, token refresh | Estado completo |
| `authState(auth)` | sign-in, sign-out | Estado basico |
| `idToken(auth)` | cambios de token | Headers API |

### Conversion a Signals (Angular 21)

```typescript
import { toSignal } from '@angular/core/rxjs-interop';
import { user } from '@angular/fire/auth';

export class AuthService {
  private auth = inject(Auth);
  readonly currentUser = toSignal(user(this.auth));
}
```

## Metodos de autenticacion

Para implementacion detallada de cada metodo:

- **Email/Password**: Ver [references/email-password.md](references/email-password.md)
- **Proveedores sociales (Google, Facebook, Twitter)**: Ver [references/social-providers.md](references/social-providers.md)
- **Telefono/SMS**: Ver [references/phone-auth.md](references/phone-auth.md)
- **Anonimo**: Ver [references/anonymous-auth.md](references/anonymous-auth.md)

## Guards de rutas

Para proteccion de rutas con guards:

- **Guards basicos y avanzados**: Ver [references/guards.md](references/guards.md)

## Manejo de errores

Para errores comunes y recovery:

- **Errores y mensajes**: Ver [references/error-handling.md](references/error-handling.md)

## Templates

Para codigo boilerplate listo para usar:

- **Servicio de autenticacion**: Ver [templates/auth.service.ts](templates/auth.service.ts)
- **Componente de login**: Ver [templates/login.component.ts](templates/login.component.ts)
- **Componente de registro**: Ver [templates/register.component.ts](templates/register.component.ts)
- **Guards de autenticacion**: Ver [templates/auth.guard.ts](templates/auth.guard.ts)

## Ejemplo rapido: Login con Google

```typescript
import { Component, inject } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <button (click)="loginWithGoogle()">Login con Google</button>
  `
})
export class LoginComponent {
  private auth = inject(Auth);

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }
}
```

## Reglas criticas

1. **Usar `inject()`** - No constructor injection
2. **Standalone components** - No NgModules
3. **Signals sobre decoradores** - Usar `toSignal()` para estado reactivo
4. **Desuscribirse** - En `ngOnDestroy()` para suscripciones manuales
5. **Imports desde `@angular/fire/auth`** - No desde `firebase/auth`
