import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SortDirection } from './sort';

/**
 * A sortable column heading.
 *
 * Renders a real button inside the `th` so the control is reachable by
 * keyboard and announced as such, and sets `aria-sort` so a screen reader
 * conveys the current ordering rather than leaving it as visual-only.
 */
@Component({
  selector: '[ot-sort-header]',
  standalone: true,
  host: {
    '[attr.aria-sort]': 'ariaSort',
    '[class.text-ink]': 'active',
  },
  template: `
    <button
      type="button"
      class="group -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-ink"
      (click)="sorted.emit()"
    >
      <ng-content />
      <span class="inline-flex w-3 justify-center" aria-hidden="true">
        @if (active) {
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="size-3"
          >
            @if (direction === 'asc') {
              <path stroke-linecap="round" stroke-linejoin="round" d="m6 15 6-6 6 6" />
            } @else {
              <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
            }
          </svg>
        } @else {
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="size-3 opacity-0 transition-opacity group-hover:opacity-40"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m6 15 6-6 6 6" />
          </svg>
        }
      </span>
    </button>
  `,
})
export class SortHeaderComponent {
  @Input() active = false;
  @Input() direction: SortDirection = 'asc';
  @Output() sorted = new EventEmitter<void>();

  get ariaSort(): string {
    if (!this.active) return 'none';
    return this.direction === 'asc' ? 'ascending' : 'descending';
  }
}
