# Manejo de Errores de Autenticacion

## Codigos de error comunes

### Errores de Email/Password

| Codigo | Descripcion | Accion sugerida |
|--------|-------------|-----------------|
| `auth/email-already-in-use` | Email ya registrado | Sugerir login o recuperar password |
| `auth/invalid-email` | Formato de email invalido | Validar formato antes de enviar |
| `auth/user-disabled` | Cuenta deshabilitada | Contactar soporte |
| `auth/user-not-found` | Usuario no existe | Sugerir registro |
| `auth/wrong-password` | Password incorrecto | Permitir reintentos, ofrecer reset |
| `auth/weak-password` | Password muy debil | Mostrar requisitos |
| `auth/too-many-requests` | Demasiados intentos | Esperar o usar captcha |

### Errores de proveedores sociales

| Codigo | Descripcion | Accion sugerida |
|--------|-------------|-----------------|
| `auth/popup-closed-by-user` | Usuario cerro popup | Permitir reintentar |
| `auth/popup-blocked` | Popup bloqueado | Instruir desbloqueo |
| `auth/account-exists-with-different-credential` | Email existe con otro proveedor | Vincular cuentas |
| `auth/cancelled-popup-request` | Multiples popups | Ignorar, usar ultimo |
| `auth/operation-not-allowed` | Proveedor no habilitado | Verificar Firebase Console |

### Errores de telefono

| Codigo | Descripcion | Accion sugerida |
|--------|-------------|-----------------|
| `auth/invalid-phone-number` | Numero invalido | Validar formato E.164 |
| `auth/missing-phone-number` | Numero no proporcionado | Requerir campo |
| `auth/quota-exceeded` | Limite de SMS alcanzado | Esperar o contactar Firebase |
| `auth/invalid-verification-code` | Codigo incorrecto | Permitir reintentos |
| `auth/code-expired` | Codigo expirado | Reenviar codigo |
| `auth/captcha-check-failed` | reCAPTCHA fallido | Reiniciar verificador |

### Errores de red/generales

| Codigo | Descripcion | Accion sugerida |
|--------|-------------|-----------------|
| `auth/network-request-failed` | Error de red | Verificar conexion |
| `auth/internal-error` | Error interno | Reintentar |
| `auth/invalid-api-key` | API key invalida | Verificar configuracion |
| `auth/app-deleted` | App eliminada | Verificar inicializacion |

## Servicio de manejo de errores

```typescript
import { Injectable, signal } from '@angular/core';

interface AuthError {
  code: string;
  message: string;
  action?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthErrorService {
  readonly currentError = signal<AuthError | null>(null);

  private errorMessages: Record<string, { message: string; action?: string }> = {
    // Email/Password
    'auth/email-already-in-use': {
      message: 'Este email ya esta registrado',
      action: 'Intenta iniciar sesion o recuperar tu contraseña'
    },
    'auth/invalid-email': {
      message: 'El formato del email es invalido'
    },
    'auth/user-disabled': {
      message: 'Esta cuenta ha sido deshabilitada',
      action: 'Contacta a soporte para mas informacion'
    },
    'auth/user-not-found': {
      message: 'No existe una cuenta con este email',
      action: 'Verifica el email o crea una nueva cuenta'
    },
    'auth/wrong-password': {
      message: 'Contraseña incorrecta',
      action: 'Intenta de nuevo o recupera tu contraseña'
    },
    'auth/weak-password': {
      message: 'La contraseña es muy debil',
      action: 'Usa al menos 6 caracteres con letras y numeros'
    },
    'auth/too-many-requests': {
      message: 'Demasiados intentos fallidos',
      action: 'Espera unos minutos antes de intentar de nuevo'
    },

    // Social providers
    'auth/popup-closed-by-user': {
      message: 'Inicio de sesion cancelado'
    },
    'auth/popup-blocked': {
      message: 'El navegador bloqueo la ventana emergente',
      action: 'Permite ventanas emergentes para este sitio'
    },
    'auth/account-exists-with-different-credential': {
      message: 'Ya existe una cuenta con este email usando otro metodo',
      action: 'Inicia sesion con el metodo original y vincula las cuentas'
    },

    // Phone
    'auth/invalid-phone-number': {
      message: 'Numero de telefono invalido',
      action: 'Usa el formato internacional (ej: +573001234567)'
    },
    'auth/invalid-verification-code': {
      message: 'Codigo de verificacion incorrecto',
      action: 'Verifica el codigo e intenta de nuevo'
    },
    'auth/code-expired': {
      message: 'El codigo ha expirado',
      action: 'Solicita un nuevo codigo'
    },

    // Network
    'auth/network-request-failed': {
      message: 'Error de conexion',
      action: 'Verifica tu conexion a internet'
    },

    // Default
    'default': {
      message: 'Ocurrio un error inesperado',
      action: 'Intenta de nuevo'
    }
  };

  handleError(error: any): AuthError {
    const code = error?.code || 'default';
    const errorConfig = this.errorMessages[code] || this.errorMessages['default'];

    const authError: AuthError = {
      code,
      message: errorConfig.message,
      action: errorConfig.action
    };

    this.currentError.set(authError);
    return authError;
  }

  clearError() {
    this.currentError.set(null);
  }
}
```

## Componente de error

```typescript
import { Component, inject } from '@angular/core';
import { AuthErrorService } from './auth-error.service';

@Component({
  selector: 'app-auth-error',
  standalone: true,
  template: `
    @if (errorService.currentError(); as error) {
      <div class="error-container" role="alert">
        <p class="error-message">{{ error.message }}</p>
        @if (error.action) {
          <p class="error-action">{{ error.action }}</p>
        }
        <button (click)="errorService.clearError()">Cerrar</button>
      </div>
    }
  `,
  styles: [`
    .error-container {
      padding: 1rem;
      background: #fee;
      border: 1px solid #f00;
      border-radius: 4px;
      margin: 1rem 0;
    }
    .error-message { font-weight: bold; }
    .error-action { font-size: 0.9em; color: #666; }
  `]
})
export class AuthErrorComponent {
  readonly errorService = inject(AuthErrorService);
}
```

## Wrapper para operaciones de auth

```typescript
import { inject } from '@angular/core';
import { AuthErrorService } from './auth-error.service';

export function withAuthErrorHandling<T>(
  operation: () => Promise<T>
): () => Promise<T | null> {
  const errorService = inject(AuthErrorService);

  return async () => {
    errorService.clearError();
    try {
      return await operation();
    } catch (error) {
      errorService.handleError(error);
      return null;
    }
  };
}

// Uso en componente
@Component({...})
export class LoginComponent {
  private auth = inject(Auth);
  private errorService = inject(AuthErrorService);

  async login(email: string, password: string) {
    this.errorService.clearError();

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      this.errorService.handleError(error);
    }
  }
}
```

## Manejo de cuenta existente con diferente proveedor

```typescript
import {
  Auth,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthCredential
} from '@angular/fire/auth';

async handleExistingAccount(email: string, pendingCredential: OAuthCredential) {
  // 1. Obtener metodos de login existentes
  const methods = await fetchSignInMethodsForEmail(this.auth, email);

  if (methods.includes('google.com')) {
    // 2. Login con el proveedor existente
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ login_hint: email });
    const result = await signInWithPopup(this.auth, provider);

    // 3. Vincular el nuevo proveedor
    await linkWithCredential(result.user, pendingCredential);

    return result.user;
  }

  throw new Error('Inicia sesion con: ' + methods.join(', '));
}
```

## Retry automatico para errores de red

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Solo reintentar errores de red
      if (error.code !== 'auth/network-request-failed') {
        throw error;
      }

      // Esperar antes de reintentar (exponential backoff)
      await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}

// Uso
const user = await withRetry(() =>
  signInWithEmailAndPassword(auth, email, password)
);
```

## Logging de errores (produccion)

```typescript
import { ErrorHandler, Injectable, inject } from '@angular/core';

@Injectable()
export class AuthErrorHandler implements ErrorHandler {
  handleError(error: any) {
    // Log a servicio de monitoreo (Sentry, LogRocket, etc.)
    if (error?.code?.startsWith('auth/')) {
      console.error('Auth Error:', {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      // Enviar a servicio de analytics
      // analytics.logEvent('auth_error', { code: error.code });
    }
  }
}

// Registrar en providers
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: AuthErrorHandler }
  ]
};
```
