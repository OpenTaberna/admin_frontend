import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * A centred dialog used for create and edit forms.
 *
 * Dismissable by backdrop click and by Escape, because a dialog that traps the
 * user is worse than no dialog.
 */
@Component({
  selector: 'ot-modal',
  standalone: true,
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-ink/40" (click)="closed.emit()" aria-hidden="true"></div>
        <div
          class="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-overlay)]"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start justify-between border-b border-line px-5 py-3.5">
            <h2 class="text-sm font-semibold text-ink">{{ title }}</h2>
            <button
              type="button"
              class="-m-1 rounded p-1 text-ink-subtle hover:bg-surface-muted hover:text-ink"
              (click)="closed.emit()"
              aria-label="Close dialog"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                class="size-4"
              >
                <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div class="max-h-[70vh] overflow-y-auto p-5">
            <ng-content />
          </div>
          <div class="flex justify-end gap-2 border-t border-line px-5 py-3.5">
            <ng-content select="[modalActions]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input({ required: true }) title!: string;
  @Output() closed = new EventEmitter<void>();

  onEscape(): void {
    if (this.open) {
      this.closed.emit();
    }
  }
}
