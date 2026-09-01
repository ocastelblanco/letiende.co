# Autenticacion Email/Password

## Registro de usuario

```typescript
import { inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';

export class AuthService {
  private auth = inject(Auth);

  async register(email: string, password: string, displayName?: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);

    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }

    return credential.user;
  }
}
```

## Login

```typescript
import { signInWithEmailAndPassword } from '@angular/fire/auth';

async login(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(this.auth, email, password);
  return credential.user;
}
```

## Logout

```typescript
import { signOut } from '@angular/fire/auth';

async logout() {
  await signOut(this.auth);
}
```

## Recuperacion de password

```typescript
import { sendPasswordResetEmail } from '@angular/fire/auth';

async resetPassword(email: string) {
  await sendPasswordResetEmail(this.auth, email);
}
```

## Verificacion de email

```typescript
import { sendEmailVerification } from '@angular/fire/auth';

async sendVerificationEmail() {
  const user = this.auth.currentUser;
  if (user) {
    await sendEmailVerification(user);
  }
}
```

## Cambio de password

```typescript
import { updatePassword } from '@angular/fire/auth';

async changePassword(newPassword: string) {
  const user = this.auth.currentUser;
  if (user) {
    await updatePassword(user, newPassword);
  }
}
```

## Reautenticacion (para operaciones sensibles)

```typescript
import { reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';

async reauthenticate(password: string) {
  const user = this.auth.currentUser;
  if (user && user.email) {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  }
}
```

## Componente de registro completo

```typescript
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="register()">
      <input
        type="text"
        [(ngModel)]="name"
        name="name"
        placeholder="Nombre"
        required
      />
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
        @if (loading()) {
          Registrando...
        } @else {
          Registrar
        }
      </button>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </form>
  `
})
export class RegisterComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async register() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      await updateProfile(credential.user, { displayName: this.name });
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este email ya esta registrado',
      'auth/invalid-email': 'Email invalido',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    };
    return messages[code] || 'Error al registrar';
  }
}
```

## Validacion de password fuerte

```typescript
function isStrongPassword(password: string): boolean {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial
  );
}
```
