import {
  ApplicationConfig,
  ErrorHandler,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { ErrorReportingService, TelemetryErrorHandler } from './core/error-reporting.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Keycloak must finish before the first route resolves, otherwise the
    // admin guard runs against an empty session and bounces a legitimate
    // administrator to the forbidden page.
    provideAppInitializer(() => inject(AuthService).init()),
    { provide: ErrorHandler, useClass: TelemetryErrorHandler },
    provideAppInitializer(() => {
      const reporter = inject(ErrorReportingService);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') reporter.flushNow();
        });
      }
    }),
  ],
};
