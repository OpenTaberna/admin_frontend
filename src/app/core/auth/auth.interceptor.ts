import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Hosts the token may be sent to: the FastAPI service, and Keycloak's own
 * admin API, which user management calls directly.
 */
const trustedPrefixes = [environment.apiBaseUrl, `${environment.keycloak.url}/admin/`];

/**
 * Attach the Keycloak access token to requests aimed at our own services.
 *
 * Scoped by prefix on purpose: a bearer token must never be sent to a
 * third-party host just because some component asked for a URL.
 *
 * The token is fetched per request rather than cached, because
 * `AuthService.getToken` refreshes it when it is close to expiry.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!trustedPrefixes.some((prefix) => req.url.startsWith(prefix))) {
    return next(req);
  }

  const auth = inject(AuthService);
  return from(auth.getToken()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
  );
};
