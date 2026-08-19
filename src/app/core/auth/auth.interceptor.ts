import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Attach the Keycloak access token to API requests.
 *
 * Scoped to `apiBaseUrl` on purpose: a bearer token must never be sent to a
 * third-party host just because some component asked for a URL.
 *
 * The token is fetched per request rather than cached, because
 * `AuthService.getToken` refreshes it when it is close to expiry.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const auth = inject(AuthService);
  return from(auth.getToken()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
  );
};
