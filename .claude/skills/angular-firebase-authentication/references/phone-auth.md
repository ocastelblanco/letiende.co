# Autenticacion por Telefono/SMS

## Configuracion previa

1. Habilitar Phone en Firebase Console > Authentication > Sign-in method
2. Configurar reCAPTCHA (automatico o invisible)
3. Para testing, agregar numeros de prueba en Firebase Console

## Setup del verificador reCAPTCHA

```typescript
import { inject, signal } from '@angular/core';
import { Auth, RecaptchaVerifier } from '@angular/fire/auth';

export class PhoneAuthService {
  private auth = inject(Auth);
  private recaptchaVerifier = signal<RecaptchaVerifier | null>(null);

  initRecaptcha(buttonId: string) {
    const verifier = new RecaptchaVerifier(this.auth, buttonId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA resuelto
      },
      'expired-callback': () => {
        // reCAPTCHA expirado
      }
    });
    this.recaptchaVerifier.set(verifier);
    return verifier;
  }

  destroyRecaptcha() {
    const verifier = this.recaptchaVerifier();
    if (verifier) {
      verifier.clear();
      this.recaptchaVerifier.set(null);
    }
  }
}
```

## Enviar codigo de verificacion

```typescript
import { signInWithPhoneNumber, ConfirmationResult } from '@angular/fire/auth';

export class PhoneAuthService {
  private confirmationResult = signal<ConfirmationResult | null>(null);

  async sendVerificationCode(phoneNumber: string) {
    const verifier = this.recaptchaVerifier();
    if (!verifier) {
      throw new Error('reCAPTCHA no inicializado');
    }

    // Formato E.164: +1234567890
    const result = await signInWithPhoneNumber(this.auth, phoneNumber, verifier);
    this.confirmationResult.set(result);
    return result;
  }

  async confirmCode(code: string) {
    const confirmation = this.confirmationResult();
    if (!confirmation) {
      throw new Error('No hay codigo pendiente de confirmar');
    }

    const credential = await confirmation.confirm(code);
    return credential.user;
  }
}
```

## Componente completo de autenticacion por telefono

```typescript
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from '@angular/fire/auth';
import { Router } from '@angular/router';

type Step = 'phone' | 'code';

@Component({
  selector: 'app-phone-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (step() === 'phone') {
      <form (ngSubmit)="sendCode()">
        <label>Numero de telefono</label>
        <input
          type="tel"
          [(ngModel)]="phoneNumber"
          name="phone"
          placeholder="+573001234567"
          required
        />
        <button id="send-code-btn" type="submit" [disabled]="loading()">
          @if (loading()) {
            Enviando...
          } @else {
            Enviar codigo
          }
        </button>
      </form>
    }

    @if (step() === 'code') {
      <form (ngSubmit)="verifyCode()">
        <label>Codigo de verificacion</label>
        <input
          type="text"
          [(ngModel)]="verificationCode"
          name="code"
          placeholder="123456"
          maxlength="6"
          required
        />
        <button type="submit" [disabled]="loading()">
          @if (loading()) {
            Verificando...
          } @else {
            Verificar
          }
        </button>
        <button type="button" (click)="resendCode()" [disabled]="loading()">
          Reenviar codigo
        </button>
      </form>
    }

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `
})
export class PhoneLoginComponent implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);

  phoneNumber = '';
  verificationCode = '';
  step = signal<Step>('phone');
  loading = signal(false);
  error = signal<string | null>(null);

  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  async sendCode() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Inicializar reCAPTCHA si no existe
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(
          this.auth,
          'send-code-btn',
          { size: 'invisible' }
        );
      }

      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        this.phoneNumber,
        this.recaptchaVerifier
      );

      this.step.set('code');
    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  async verifyCode() {
    if (!this.confirmationResult) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.confirmationResult.confirm(this.verificationCode);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  async resendCode() {
    this.step.set('phone');
    this.verificationCode = '';
    await this.sendCode();
  }

  ngOnDestroy() {
    this.recaptchaVerifier?.clear();
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/invalid-phone-number': 'Numero de telefono invalido',
      'auth/missing-phone-number': 'Ingresa un numero de telefono',
      'auth/quota-exceeded': 'Demasiados intentos. Intenta mas tarde',
      'auth/invalid-verification-code': 'Codigo incorrecto',
      'auth/code-expired': 'El codigo ha expirado. Solicita uno nuevo',
    };
    return messages[code] || 'Error en autenticacion';
  }
}
```

## Vincular telefono a cuenta existente

```typescript
import { linkWithPhoneNumber, PhoneAuthProvider } from '@angular/fire/auth';

async linkPhoneNumber(phoneNumber: string) {
  const user = this.auth.currentUser;
  if (!user || !this.recaptchaVerifier()) {
    throw new Error('Usuario o reCAPTCHA no disponible');
  }

  const confirmation = await linkWithPhoneNumber(
    user,
    phoneNumber,
    this.recaptchaVerifier()!
  );

  return confirmation;
}
```

## Reautenticacion con telefono

```typescript
import { reauthenticateWithPhoneNumber } from '@angular/fire/auth';

async reauthenticateWithPhone(phoneNumber: string) {
  const user = this.auth.currentUser;
  if (!user || !this.recaptchaVerifier()) {
    throw new Error('Usuario o reCAPTCHA no disponible');
  }

  const confirmation = await reauthenticateWithPhoneNumber(
    user,
    phoneNumber,
    this.recaptchaVerifier()!
  );

  return confirmation;
}
```

## Numeros de prueba (testing)

En Firebase Console > Authentication > Sign-in method > Phone:

1. Agregar numero de prueba (ej: +1 650-555-1234)
2. Asignar codigo de verificacion fijo (ej: 123456)
3. Usar en desarrollo sin enviar SMS reales

```typescript
// Solo para testing - usar numeros registrados en Firebase Console
const testPhoneNumber = '+16505551234';
const testVerificationCode = '123456';
```

## Consideraciones de seguridad

1. **Rate limiting**: Firebase aplica limites automaticos
2. **Numeros bloqueados**: Algunos numeros VoIP pueden estar bloqueados
3. **Costos**: SMS tiene costo por mensaje enviado
4. **Verificacion de dominio**: Configurar dominios autorizados en Firebase Console
