import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * A filter bar combining free-text search with any number of multi-select
 * facets, all applied together.
 *
 * Multi-select rather than a single dropdown because the questions an operator
 * actually asks are compound — "paid or ready to ship", "low or out of stock" —
 * and a one-at-a-time filter forces them to look twice and hold the result in
 * their head.
 *
 * Active selections are shown as removable chips, so what is being filtered is
 * never hidden inside a collapsed control.
 */
@Component({
  selector: 'ot-filter-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card p-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-56 flex-1">
          <label class="field-label" [attr.for]="searchId">{{ searchLabel }}</label>
          <input
            [id]="searchId"
            type="search"
            class="field-control"
            [ngModel]="search"
            (ngModelChange)="searchChange.emit($event)"
            [placeholder]="searchPlaceholder"
          />
        </div>

        @for (facet of facets; track facet.key) {
          <div class="relative">
            <span class="field-label">{{ facet.label }}</span>
            <button
              type="button"
              class="field-control flex min-w-44 items-center justify-between gap-2 text-left"
              (click)="toggleOpen(facet.key)"
              [attr.aria-expanded]="openFacet() === facet.key"
            >
              <span class="truncate">
                {{ summary(facet.key) }}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="size-3.5 shrink-0"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            @if (openFacet() === facet.key) {
              <div
                class="absolute z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-[var(--radius-control)] border border-line bg-surface p-1 shadow-[var(--shadow-raised)]"
              >
                @for (option of facet.options; track option.value) {
                  <label
                    class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    <input
                      type="checkbox"
                      class="size-3.5 accent-[var(--color-brand-600)]"
                      [checked]="isSelected(facet.key, option.value)"
                      (change)="toggleValue(facet.key, option.value)"
                    />
                    <span class="truncate">{{ option.label }}</span>
                  </label>
                }
              </div>
            }
          </div>
        }

        @if (hasAnyFilter) {
          <button
            type="button"
            class="rounded-[var(--radius-control)] px-2.5 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
            (click)="cleared.emit()"
          >
            Clear all
          </button>
        }
      </div>

      @if (chips.length > 0) {
        <div class="mt-3 flex flex-wrap gap-1.5">
          @for (chip of chips; track chip.key + chip.value) {
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 hover:bg-brand-100"
              (click)="toggleValue(chip.key, chip.value)"
            >
              {{ chip.label }}
              <span aria-hidden="true">×</span>
              <span class="sr-only">Remove filter</span>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class FilterBarComponent {
  @Input() searchLabel = 'Search';
  @Input() searchPlaceholder = '';
  @Input() searchId = 'filter-search';
  @Input() search = '';
  @Input() facets: { key: string; label: string; options: FilterOption[] }[] = [];
  /** Selected values per facet key. */
  @Input() selected: Record<string, string[]> = {};

  @Output() searchChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<Record<string, string[]>>();
  @Output() cleared = new EventEmitter<void>();

  readonly openFacet = signal<string | null>(null);

  toggleOpen(key: string): void {
    this.openFacet.update((current) => (current === key ? null : key));
  }

  isSelected(key: string, value: string): boolean {
    return (this.selected[key] ?? []).includes(value);
  }

  toggleValue(key: string, value: string): void {
    const current = this.selected[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.selectionChange.emit({ ...this.selected, [key]: next });
  }

  summary(key: string): string {
    const facet = this.facets.find((f) => f.key === key);
    const chosen = this.selected[key] ?? [];
    if (chosen.length === 0) return `Any ${facet?.label.toLowerCase() ?? ''}`.trim();
    if (chosen.length === 1) {
      return facet?.options.find((o) => o.value === chosen[0])?.label ?? chosen[0];
    }
    return `${chosen.length} selected`;
  }

  get chips(): { key: string; value: string; label: string }[] {
    return this.facets.flatMap((facet) =>
      (this.selected[facet.key] ?? []).map((value) => ({
        key: facet.key,
        value,
        label: facet.options.find((o) => o.value === value)?.label ?? value,
      })),
    );
  }

  get hasAnyFilter(): boolean {
    return this.search.length > 0 || this.chips.length > 0;
  }
}
