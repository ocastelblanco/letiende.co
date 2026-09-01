import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from '@angular/fire/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <h1>Crear Cuenta</h1>

      <form (ngSubmit)="register()" class="auth-form">
        <div class="form-group">
          <label for="name">Nombre</label>
          <input
            id="name"
            type="text"
            [(ngModel)]="displayName"
            name="name"
            placeholder="Tu nombre"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            [(ngModel)]="email"
            name="email"
            placeholder="tu@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            type="password"
            [(ngModel)]="password"
            name="password"
            placeholder="Minimo 6 caracteres"
            minlength="6"
            required
            autocomplete="new-password"
          />
          @if (password.length > 0 && password.length < 6) {
            <span class="hint">La contraseña debe tener al menos 6 caracteres</span>
          }
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            [(ngModel)]="confirmPassword"
            name="confirmPassword"
            placeholder="Repite tu contraseña"
            required
            autocomplete="new-password"
          />
          @if (confirmPassword && password !== confirmPassword) {
            <span class="hint error">Las contraseñas no coinciden</span>
          }
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="loading() || !isFormValid()"
        >
          @if (loading()) {
            <span class="spinner"></span>
            Creando cuenta...
          } @else {
            Crear Cuenta
          }
        </button>
      </form>

      @if (error()) {
        <div class="error-message" role="alert">
          <p>{{ error() }}</p>
        </div>
      }

      @if (success()) {
        <div class="success-message" role="status">
          <p>{{ success() }}</p>
        </div>
      }

      <p class="login-link">
        ¿Ya tienes cuenta?
        <a routerLink="/login">Inicia sesion</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
    }

    h1 {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-weight: 500;
    }

    input {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    input:focus {
      outline: none;
      border-color: #4285f4;
      box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
    }

    .hint {
      font-size: 0.85rem;
      color: #666;
    }

    .hint.error {
      color: #c00;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s;
      margin-top: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #4285f4;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3367d6;
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
      color: #c00;
    }

    .success-message {
      background: #efe;
      border: 1px solid #cfc;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
      color: #060;
    }

    .login-link {
      text-align: center;
      margin-top: 1.5rem;
      color: #666;
    }

    .login-link a {
      color: #4285f4;
      font-weight: 500;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RegisterComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  isFormValid(): boolean {
    return (
      this.displayName.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.password.length >= 6 &&
      this.password === this.confirmPassword
    );
  }

  async register() {
    if (!this.isFormValid()) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      // Crear usuario
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );

      // Actualizar perfil con nombre
      await updateProfile(credential.user, {
        displayName: this.displayName
      });

      // Enviar email de verificacion
      await sendEmailVerification(credential.user);

      this.success.set(
        'Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta.'
      );

      // Redirigir despues de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);

    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este email ya esta registrado',
      'auth/invalid-email': 'El formato del email es invalido',
      'auth/operation-not-allowed': 'El registro con email no esta habilitado',
      'auth/weak-password': 'La contraseña es muy debil. Usa al menos 6 caracteres',
      'auth/network-request-failed': 'Error de conexion. Verifica tu internet',
    };
    return messages[code] || 'Error al crear la cuenta';
  }
}
