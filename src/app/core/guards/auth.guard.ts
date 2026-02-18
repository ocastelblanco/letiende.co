import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../servicios/auth.service';

/**
 * Guard que protege rutas para usuarios autenticados.
 * En SSR retorna true directamente. En cliente espera a que el estado
 * de auth esté resuelto antes de evaluar si el usuario está autenticado.
 * Redirige a /inicio si el usuario no está autenticado.
 */
export const authGuard: CanActivateFn = () => {
  const platformId: object = inject(PLATFORM_ID);

  // En el servidor no hay Firebase auth; permitir acceso para que SSR funcione
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  // Si el estado ya está resuelto, evaluar síncronamente
  if (!authService.cargando()) {
    return authService.estaAutenticado() ? true : router.createUrlTree(['/inicio']);
  }

  // Si aún está cargando, esperar a que resuelva antes de decidir
  return toObservable(authService.cargando).pipe(
    filter((cargando: boolean) => !cargando),
    take(1),
    map(() => authService.estaAutenticado() ? true : router.createUrlTree(['/inicio']))
  );
};

/**
 * Guard que protege rutas públicas (solo para usuarios NO autenticados).
 * En SSR retorna true directamente. En cliente espera a que el estado
 * de auth esté resuelto antes de evaluar.
 * Redirige a /admin si el usuario ya está autenticado.
 */
export const publicGuard: CanActivateFn = () => {
  const platformId: object = inject(PLATFORM_ID);

  // En el servidor no hay Firebase auth; permitir acceso para que SSR funcione
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  // Si el estado ya está resuelto, evaluar síncronamente
  if (!authService.cargando()) {
    return !authService.estaAutenticado() ? true : router.createUrlTree(['/admin']);
  }

  // Si aún está cargando, esperar a que resuelva antes de decidir
  return toObservable(authService.cargando).pipe(
    filter((cargando: boolean) => !cargando),
    take(1),
    map(() => !authService.estaAutenticado() ? true : router.createUrlTree(['/admin']))
  );
};
