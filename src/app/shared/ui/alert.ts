import { Component, Input } from '@angular/core';

/**
 * Inline feedback after an action, or an error that a screen must explain.
 *
 * Errors are shown rather than swallowed: an admin needs to know a save failed
 * and why, not watch a row silently fail to change.
 */
@Component({
  selector: 'ot-alert',
  standalone: true,
  template: `
    <div [class]="classes" role="status">
      <p class="text-sm">
        <ng-content />
      </p>
    </div>
  `,
})
export class AlertComponent {
  @Input() tone: 'ok' | 'danger' | 'info' | 'warn' = 'info';

  get classes(): string {
    const base = 'rounded-[var(--radius-control)] border px-3.5 py-2.5';
    const tones: Record<string, string> = {
      ok: 'border-ok/30 bg-ok-soft text-ok',
      danger: 'border-danger/30 bg-danger-soft text-danger',
      warn: 'border-warn/30 bg-warn-soft text-warn',
      info: 'border-info/30 bg-info-soft text-info',
    };
    return `${base} ${tones[this.tone]}`;
  }
}
