import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NAV_ITEMS } from './nav.model';

/**
 * Primary navigation.
 *
 * Permanent from `lg` upward; below that it becomes an overlay drawer, because
 * a fixed 16rem column leaves nothing usable on a laptop split-screen or a
 * tablet.
 */
@Component({
  selector: 'ot-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        (click)="closed.emit()"
        aria-hidden="true"
      ></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-[var(--sidenav-width)] flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0"
      [class.translate-x-0]="open"
      [class.-translate-x-full]="!open"
    >
      <div class="flex h-14 items-center gap-2.5 border-b border-line px-5">
        <span
          class="flex size-7 items-center justify-center rounded-[var(--radius-control)] bg-brand-600 text-sm font-bold text-ink-inverse"
          aria-hidden="true"
          >OT</span
        >
        <div class="leading-tight">
          <p class="text-sm font-semibold text-ink">OpenTaberna</p>
          <p class="text-[0.6875rem] text-ink-subtle">Administration</p>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-3" aria-label="Main">
        <ul class="space-y-0.5">
          @for (item of navItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-brand-50 text-brand-700 font-medium"
                #rla="routerLinkActive"
                [attr.aria-current]="rla.isActive ? 'page' : null"
                (click)="closed.emit()"
                class="group flex items-start gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                >
                  <path [attr.d]="item.icon" />
                </svg>
                <span class="min-w-0">
                  <span class="block truncate">{{ item.label }}</span>
                  <span class="block truncate text-[0.6875rem] text-ink-subtle">{{
                    item.description
                  }}</span>
                </span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <p class="border-t border-line px-5 py-3 text-[0.6875rem] text-ink-subtle">
        Admin access only
      </p>
    </aside>
  `,
})
export class SidenavComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  readonly navItems = NAV_ITEMS;
}
