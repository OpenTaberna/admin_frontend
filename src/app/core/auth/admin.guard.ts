import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Keep non-administrators out of the application shell.
 *
 * This is a usability guard, not a security boundary — the API refuses the
 * request regardless. Its job is to show a signed-in customer a clear
 * explanation instead of a screen of failed calls.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/forbidden']);
};
