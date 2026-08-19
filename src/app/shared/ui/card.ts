import { Component, Input } from '@angular/core';

/**
 * A titled surface. The default container for anything that is not a bare table.
 */
@Component({
  selector: 'ot-card',
  standalone: true,
  template: `
    <section class="card">
      @if (title) {
        <div class="border-b border-line px-5 py-3.5">
          <h2 class="text-sm font-semibold text-ink">{{ title }}</h2>
          @if (description) {
            <p class="mt-0.5 text-xs text-ink-muted">{{ description }}</p>
          }
        </div>
      }
      <div [class]="padded ? 'p-5' : ''">
        <ng-content />
      </div>
    </section>
  `,
})
export class CardComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() padded = true;
}
