import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

/**
 * Guard que permite acceso solo a usuarios autenticados.
 * Redirige a /login si no hay usuario.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    map(currentUser => {
      if (currentUser) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};

/**
 * Guard que permite acceso solo a usuarios NO autenticados.
 * Redirige a /dashboard si ya hay usuario.
 * Usar en rutas publicas como login y register.
 */
export const publicGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    map(currentUser => {
      if (currentUser) {
        return router.createUrlTree(['/dashboard']);
      }
      return true;
    })
  );
};

/**
 * Guard que requiere email verificado.
 * Redirige a /verify-email si el email no esta verificado.
 */
export const verifiedEmailGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    map(currentUser => {
      if (!currentUser) {
        return router.createUrlTree(['/login']);
      }
      if (!currentUser.emailVerified) {
        return router.createUrlTree(['/verify-email']);
      }
      return true;
    })
  );
};

/**
 * Guard que excluye usuarios anonimos.
 * Redirige a /upgrade-account si el usuario es anonimo.
 */
export const nonAnonymousGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    map(currentUser => {
      if (!currentUser) {
        return router.createUrlTree(['/login']);
      }
      if (currentUser.isAnonymous) {
        return router.createUrlTree(['/upgrade-account']);
      }
      return true;
    })
  );
};

/**
 * Guard basado en roles usando custom claims.
 * @param allowedRoles - Array de roles permitidos
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    return user(auth).pipe(
      take(1),
      map(async currentUser => {
        if (!currentUser) {
          return router.createUrlTree(['/login']);
        }

        const tokenResult = await currentUser.getIdTokenResult();
        const userRole = tokenResult.claims['role'] as string;

        if (allowedRoles.includes(userRole)) {
          return true;
        }

        return router.createUrlTree(['/unauthorized']);
      })
    );
  };
};

// ============================================
// EJEMPLO DE USO EN RUTAS
// ============================================

/*
import { Routes } from '@angular/router';
import { authGuard, publicGuard, verifiedEmailGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Rutas publicas (solo para no autenticados)
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/register.component').then(m => m.RegisterComponent)
  },

  // Rutas protegidas (requieren autenticacion)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Rutas que requieren email verificado
  {
    path: 'settings',
    canActivate: [authGuard, verifiedEmailGuard],
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
  },

  // Rutas de admin (requieren rol especifico)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin', 'superadmin'])],
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // Redirects
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
*/
