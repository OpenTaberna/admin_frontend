import { Component, Input } from '@angular/core';

export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

/**
 * A small status pill.
 *
 * Tone is separated from label so the same state maps to the same colour
 * across orders, stock and returns — the reader learns the palette once.
 */
@Component({
  selector: 'ot-badge',
  standalone: true,
  template: `
    <span [class]="classes">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';

  get classes(): string {
    const base =
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize';
    const tones: Record<BadgeTone, string> = {
      neutral: 'bg-surface-sunken text-ink-muted',
      ok: 'bg-ok-soft text-ok',
      warn: 'bg-warn-soft text-warn',
      danger: 'bg-danger-soft text-danger',
      info: 'bg-info-soft text-info',
    };
    return `${base} ${tones[this.tone]}`;
  }
}
