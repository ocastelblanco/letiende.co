import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';

/**
 * Guard que protege rutas para usuarios autenticados.
 * Redirige a /inicio si el usuario no está autenticado.
 */
export const authGuard: CanActivateFn = () => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  if (authService.cargando()) {
    // Si aún está cargando el estado de auth, permitir acceso temporalmente
    // El componente puede mostrar un spinner mientras carga
    return true;
  }

  if (authService.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};

/**
 * Guard que protege rutas públicas (solo para usuarios NO autenticados).
 * Redirige a /admin si el usuario ya está autenticado.
 */
export const publicGuard: CanActivateFn = () => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  if (authService.cargando()) {
    return true;
  }

  if (!authService.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/admin']);
};
