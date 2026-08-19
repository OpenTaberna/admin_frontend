import { Component, Input } from '@angular/core';

/**
 * The title block at the top of every screen.
 *
 * Exists so page titles share one rhythm rather than each screen choosing its
 * own heading size and spacing. Actions are projected on the right.
 */
@Component({
  selector: 'ot-page-header',
  standalone: true,
  template: `
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-ink">{{ title }}</h1>
        @if (description) {
          <p class="mt-1 max-w-2xl text-sm text-ink-muted">{{ description }}</p>
        }
      </div>
      <div class="flex items-center gap-2">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}
