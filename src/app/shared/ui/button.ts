import { Component, Input, booleanAttribute } from '@angular/core';

/**
 * The application's only button.
 *
 * Variants exist so intent is expressed once and rendered consistently: a
 * destructive action looks the same everywhere, and nobody re-derives a colour
 * in a template.
 */
@Component({
  selector: 'ot-button',
  standalone: true,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="classes"
      [attr.aria-busy]="loading ? 'true' : null"
    >
      @if (loading) {
        <span
          class="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        ></span>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' = 'md';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;

  get classes(): string {
    const base =
      'inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium ' +
      'transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap';
    const sizing = this.size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm';
    const variants: Record<string, string> = {
      primary: 'bg-brand-600 text-ink-inverse hover:bg-brand-700 shadow-[var(--shadow-card)]',
      secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-muted',
      ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
      danger: 'bg-danger text-ink-inverse hover:opacity-90',
    };
    return `${base} ${sizing} ${variants[this.variant]}`;
  }
}
