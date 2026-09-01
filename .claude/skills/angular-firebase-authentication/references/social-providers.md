# Autenticacion con Proveedores Sociales

## Google

### Configuracion en Firebase Console

1. Ir a Firebase Console > Authentication > Sign-in method
2. Habilitar Google
3. Configurar OAuth consent screen en Google Cloud Console

### Implementacion

```typescript
import { inject } from '@angular/core';
import { Auth, signInWithPopup, signInWithRedirect, GoogleAuthProvider } from '@angular/fire/auth';

export class AuthService {
  private auth = inject(Auth);

  // Login con popup (mejor UX en desktop)
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  // Login con redirect (mejor para mobile)
  async loginWithGoogleRedirect() {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(this.auth, provider);
  }
}
```

### Obtener token de acceso Google

```typescript
import { getRedirectResult, GoogleAuthProvider } from '@angular/fire/auth';

async getGoogleAccessToken() {
  const result = await getRedirectResult(this.auth);
  if (result) {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return credential?.accessToken;
  }
  return null;
}
```

## Facebook

### Configuracion

1. Crear app en Facebook Developers
2. Obtener App ID y App Secret
3. Configurar en Firebase Console > Authentication > Sign-in method > Facebook

### Implementacion

```typescript
import { Auth, signInWithPopup, FacebookAuthProvider } from '@angular/fire/auth';

async loginWithFacebook() {
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');

  const result = await signInWithPopup(this.auth, provider);
  return result.user;
}
```

## Twitter/X

### Configuracion

1. Crear app en Twitter Developer Portal
2. Obtener API Key y API Secret
3. Configurar callback URL en Twitter y Firebase

### Implementacion

```typescript
import { Auth, signInWithPopup, TwitterAuthProvider } from '@angular/fire/auth';

async loginWithTwitter() {
  const provider = new TwitterAuthProvider();

  const result = await signInWithPopup(this.auth, provider);
  return result.user;
}
```

## GitHub

### Configuracion

1. Crear OAuth App en GitHub Settings > Developer settings
2. Obtener Client ID y Client Secret
3. Configurar Authorization callback URL

### Implementacion

```typescript
import { Auth, signInWithPopup, GithubAuthProvider } from '@angular/fire/auth';

async loginWithGitHub() {
  const provider = new GithubAuthProvider();
  provider.addScope('read:user');
  provider.addScope('user:email');

  const result = await signInWithPopup(this.auth, provider);
  return result.user;
}
```

## Microsoft

```typescript
import { Auth, signInWithPopup, OAuthProvider } from '@angular/fire/auth';

async loginWithMicrosoft() {
  const provider = new OAuthProvider('microsoft.com');
  provider.setCustomParameters({
    prompt: 'consent',
    tenant: 'your-tenant-id' // opcional para Azure AD
  });

  const result = await signInWithPopup(this.auth, provider);
  return result.user;
}
```

## Apple

```typescript
import { Auth, signInWithPopup, OAuthProvider } from '@angular/fire/auth';

async loginWithApple() {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  const result = await signInWithPopup(this.auth, provider);
  return result.user;
}
```

## Componente multi-proveedor

```typescript
import { Component, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider
} from '@angular/fire/auth';
import { Router } from '@angular/router';

type Provider = 'google' | 'facebook' | 'github';

@Component({
  selector: 'app-social-login',
  standalone: true,
  template: `
    <div class="social-buttons">
      <button (click)="login('google')" [disabled]="loading()">
        <span class="icon">G</span> Google
      </button>
      <button (click)="login('facebook')" [disabled]="loading()">
        <span class="icon">f</span> Facebook
      </button>
      <button (click)="login('github')" [disabled]="loading()">
        <span class="icon">GH</span> GitHub
      </button>
    </div>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `
})
export class SocialLoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  private providers = {
    google: () => new GoogleAuthProvider(),
    facebook: () => new FacebookAuthProvider(),
    github: () => new GithubAuthProvider(),
  };

  async login(providerName: Provider) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const provider = this.providers[providerName]();
      await signInWithPopup(this.auth, provider);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/popup-closed-by-user': 'Login cancelado',
      'auth/popup-blocked': 'Popup bloqueado. Permite popups para este sitio',
      'auth/account-exists-with-different-credential':
        'Ya existe una cuenta con este email usando otro proveedor',
    };
    return messages[code] || 'Error al iniciar sesion';
  }
}
```

## Vincular multiples proveedores

```typescript
import { linkWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

async linkGoogleAccount() {
  const user = this.auth.currentUser;
  if (user) {
    const provider = new GoogleAuthProvider();
    await linkWithPopup(user, provider);
  }
}
```

## Desvincular proveedor

```typescript
import { unlink } from '@angular/fire/auth';

async unlinkProvider(providerId: string) {
  const user = this.auth.currentUser;
  if (user) {
    await unlink(user, providerId);
  }
}
```

## Obtener proveedores vinculados

```typescript
function getLinkedProviders(user: User): string[] {
  return user.providerData.map(p => p.providerId);
}
```
