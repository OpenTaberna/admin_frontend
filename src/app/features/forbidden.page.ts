import { Component, inject } from '@angular/core';

import { AuthService } from '../core/auth/auth.service';
import { ButtonComponent } from '../shared/ui';

/**
 * Shown to a signed-in account without the admin role.
 *
 * Explains the situation rather than bouncing the visitor between login and a
 * blank screen, and names the remedy: an existing admin grants the role.
 */
@Component({
  selector: 'ot-forbidden-page',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="mx-auto max-w-md py-20 text-center">
      <div
        class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
          />
        </svg>
      </div>
      <h1 class="text-lg font-semibold text-ink">This account is not an administrator</h1>
      <p class="mt-2 text-sm text-ink-muted">
        You are signed in as
        <span class="font-medium text-ink">{{ auth.user()?.email }}</span
        >, which has the customer role only. Administration requires the
        <code class="text-xs">admin</code> role, which an existing administrator grants in Keycloak.
      </p>
      <div class="mt-6 flex justify-center gap-2">
        <ot-button variant="secondary" size="sm" (click)="auth.logout()">
          Sign in as someone else
        </ot-button>
      </div>
    </div>
  `,
})
export class ForbiddenPage {
  readonly auth = inject(AuthService);
}
