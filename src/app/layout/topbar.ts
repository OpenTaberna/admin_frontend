import { Component, EventEmitter, Output, inject } from '@angular/core';

import { AuthService } from '../core/auth/auth.service';

/**
 * The bar above the content: drawer toggle on small screens, and who is signed
 * in on the right.
 *
 * Showing the account plainly matters in a back office — actions here are
 * audited, and the operator should never be unsure which account they hold.
 */
@Component({
  selector: 'ot-topbar',
  standalone: true,
  template: `
    <header
      class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6"
    >
      <button
        type="button"
        class="-ml-1 rounded-[var(--radius-control)] p-2 text-ink-muted hover:bg-surface-muted hover:text-ink lg:hidden"
        (click)="menuToggled.emit()"
        aria-label="Toggle navigation"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          class="size-5"
        >
          <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div class="ml-auto flex items-center gap-3">
        @if (auth.user(); as user) {
          <div class="hidden text-right leading-tight sm:block">
            <p class="text-sm font-medium text-ink">{{ user.displayName }}</p>
            <p class="text-xs text-ink-subtle">{{ user.email }}</p>
          </div>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
            aria-hidden="true"
            >{{ initials(user.displayName) }}</span
          >
          <a
            [href]="auth.accountUrl()"
            target="_blank"
            rel="noopener"
            class="rounded-[var(--radius-control)] px-2.5 py-1.5 text-xs text-ink-muted hover:bg-surface-muted hover:text-ink"
            >Account</a
          >
          <button
            type="button"
            class="rounded-[var(--radius-control)] border border-line-strong px-2.5 py-1.5 text-xs text-ink hover:bg-surface-muted"
            (click)="auth.logout()"
          >
            Sign out
          </button>
        }
      </div>
    </header>
  `,
})
export class TopbarComponent {
  @Output() menuToggled = new EventEmitter<void>();
  readonly auth = inject(AuthService);

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
