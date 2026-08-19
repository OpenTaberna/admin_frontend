import { Component, Input } from '@angular/core';

/**
 * Shown when a list has nothing in it.
 *
 * A dedicated component because "no data" and "still loading" look identical
 * otherwise, which is the single most common way an admin screen confuses the
 * person using it.
 */
@Component({
  selector: 'ot-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div
        class="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-sunken text-ink-subtle"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="size-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0-2.5 6.5a1 1 0 0 1-.94.5H7.44a1 1 0 0 1-.94-.5L4 13m16 0H4"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-ink">{{ title }}</p>
      @if (description) {
        <p class="mt-1 max-w-sm text-sm text-ink-muted">{{ description }}</p>
      }
      <div class="mt-4"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}
