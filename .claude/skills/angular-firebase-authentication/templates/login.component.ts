import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider
} from '@angular/fire/auth';

type AuthProvider = 'google' | 'facebook' | 'github';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <h1>Iniciar Sesion</h1>

      <form (ngSubmit)="loginWithEmail()" class="auth-form">
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
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner"></span>
            Iniciando sesion...
          } @else {
            Iniciar Sesion
          }
        </button>

        <a routerLink="/forgot-password" class="forgot-link">
          ¿Olvidaste tu contraseña?
        </a>
      </form>

      <div class="divider">
        <span>o continua con</span>
      </div>

      <div class="social-buttons">
        <button
          type="button"
          class="btn btn-social btn-google"
          (click)="loginWithProvider('google')"
          [disabled]="loading()"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <button
          type="button"
          class="btn btn-social btn-facebook"
          (click)="loginWithProvider('facebook')"
          [disabled]="loading()"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>

        <button
          type="button"
          class="btn btn-social btn-github"
          (click)="loginWithProvider('github')"
          [disabled]="loading()"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </button>
      </div>

      @if (error()) {
        <div class="error-message" role="alert">
          <p>{{ error() }}</p>
        </div>
      }

      <p class="register-link">
        ¿No tienes cuenta?
        <a routerLink="/register">Registrate</a>
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

    .btn-social {
      background: white;
      border: 1px solid #ddd;
      color: #333;
    }

    .btn-social:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .forgot-link {
      text-align: center;
      color: #666;
      font-size: 0.9rem;
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 1.5rem 0;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #ddd;
    }

    .divider span {
      padding: 0 1rem;
      color: #666;
      font-size: 0.9rem;
    }

    .social-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
      color: #c00;
    }

    .register-link {
      text-align: center;
      margin-top: 1.5rem;
      color: #666;
    }

    .register-link a {
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
export class LoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  private providers = {
    google: () => new GoogleAuthProvider(),
    facebook: () => new FacebookAuthProvider(),
    github: () => new GithubAuthProvider(),
  };

  async loginWithEmail() {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(this.getErrorMessage(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithProvider(providerName: AuthProvider) {
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
      'auth/invalid-email': 'Email invalido',
      'auth/user-disabled': 'Cuenta deshabilitada',
      'auth/user-not-found': 'No existe una cuenta con este email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos. Intenta mas tarde',
      'auth/popup-closed-by-user': 'Login cancelado',
      'auth/popup-blocked': 'Permite ventanas emergentes para este sitio',
      'auth/account-exists-with-different-credential':
        'Ya existe una cuenta con este email usando otro metodo de login',
      'auth/network-request-failed': 'Error de conexion. Verifica tu internet',
    };
    return messages[code] || 'Error al iniciar sesion';
  }
}
