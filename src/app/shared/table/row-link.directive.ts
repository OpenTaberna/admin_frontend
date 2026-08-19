import { Directive, EventEmitter, Output } from '@angular/core';

/**
 * Makes a table row behave like a control.
 *
 * A row that only responds to a mouse click is invisible to keyboard and
 * screen-reader users, so this adds the button role, a tab stop, and Enter and
 * Space handling alongside the pointer cursor.
 *
 * Buttons inside the row still work: their own click handlers stop the event
 * before it reaches the row, so "Delete" never also opens the editor.
 */
@Directive({
  selector: '[otRowLink]',
  standalone: true,
  host: {
    role: 'button',
    tabindex: '0',
    class: 'cursor-pointer',
    '(click)': 'activate($event)',
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class RowLinkDirective {
  @Output() activated = new EventEmitter<void>();

  activate(event: Event): void {
    // Ignore activity that started on a nested control - a click on an action
    // button is about that button, not the row.
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea')) {
      return;
    }
    event.preventDefault();
    this.activated.emit();
  }
}
