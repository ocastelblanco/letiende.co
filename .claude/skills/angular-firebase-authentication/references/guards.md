# Guards de Rutas para Autenticacion

## Guard basico de autenticacion

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

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
```

## Guard para rutas publicas (redirigir si ya esta logueado)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

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
```

## Guard con verificacion de email

```typescript
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
```

## Guard basado en roles (con Firestore)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { switchMap, map, take, from, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    switchMap(currentUser => {
      if (!currentUser) {
        return of(router.createUrlTree(['/login']));
      }

      const userDoc = doc(firestore, `users/${currentUser.uid}`);
      return from(getDoc(userDoc)).pipe(
        map(snapshot => {
          const userData = snapshot.data();
          if (userData?.['role'] === 'admin') {
            return true;
          }
          return router.createUrlTree(['/unauthorized']);
        })
      );
    })
  );
};
```

## Guard basado en claims personalizados

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { switchMap, map, take, from, of } from 'rxjs';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    return user(auth).pipe(
      take(1),
      switchMap(currentUser => {
        if (!currentUser) {
          return of(router.createUrlTree(['/login']));
        }

        return from(currentUser.getIdTokenResult()).pipe(
          map(tokenResult => {
            const userRole = tokenResult.claims['role'] as string;
            if (allowedRoles.includes(userRole)) {
              return true;
            }
            return router.createUrlTree(['/unauthorized']);
          })
        );
      })
    );
  };
};

// Uso en rutas
const routes = [
  {
    path: 'admin',
    canActivate: [roleGuard(['admin', 'superadmin'])],
    loadComponent: () => import('./admin/admin.component')
  }
];
```

## Guard con Signal (Angular 21)

```typescript
import { inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

// Servicio compartido para estado de auth
export class AuthStateService {
  private auth = inject(Auth);

  readonly user = toSignal(user(this.auth), { initialValue: null });
  readonly isAuthenticated = computed(() => !!this.user());
  readonly isAnonymous = computed(() => this.user()?.isAnonymous ?? false);
}

// Guard usando el servicio
export const authGuardWithSignal: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  // Aun usamos observable para el guard porque necesita resolver async
  const auth = inject(Auth);
  return user(auth).pipe(
    take(1),
    map(u => u ? true : router.createUrlTree(['/login']))
  );
};
```

## Guard para usuarios no anonimos

```typescript
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
```

## Configuracion de rutas

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Rutas publicas
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/register.component')
      .then(m => m.RegisterComponent)
  },

  // Rutas protegidas
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },

  // Rutas de admin
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  },

  // Redirect
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
```

## Guard con loading state

```typescript
import { inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { filter, map, take, tap } from 'rxjs/operators';

// Servicio para estado de loading
export class AuthLoadingService {
  readonly isLoading = signal(true);
}

export const authGuardWithLoading: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const loadingService = inject(AuthLoadingService);

  loadingService.isLoading.set(true);

  return user(auth).pipe(
    // Esperar hasta que auth este inicializado (user puede ser null pero definido)
    filter(() => auth.currentUser !== undefined),
    take(1),
    tap(() => loadingService.isLoading.set(false)),
    map(currentUser => {
      if (currentUser) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
```

## Resolver para cargar datos de usuario

```typescript
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Auth, user, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { switchMap, take, from, map } from 'rxjs';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  createdAt: Date;
}

export const userProfileResolver: ResolveFn<UserProfile | null> = () => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);

  return user(auth).pipe(
    take(1),
    switchMap(currentUser => {
      if (!currentUser) {
        return [null];
      }

      const userDoc = doc(firestore, `users/${currentUser.uid}`);
      return from(getDoc(userDoc)).pipe(
        map(snapshot => ({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          ...snapshot.data()
        } as UserProfile))
      );
    })
  );
};

// Uso en rutas
const routes = [
  {
    path: 'profile',
    canActivate: [authGuard],
    resolve: { userProfile: userProfileResolver },
    loadComponent: () => import('./profile/profile.component')
  }
];
```
