import { Component, Input } from '@angular/core';

/** Loading indicator with an accessible label. */
@Component({
  selector: 'ot-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center gap-2 py-10 text-ink-muted" role="status">
      <span
        class="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      ></span>
      <span class="text-sm">{{ label }}</span>
    </div>
  `,
})
export class SpinnerComponent {
  @Input() label = 'Loading…';
}
