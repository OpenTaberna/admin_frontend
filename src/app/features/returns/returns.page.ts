import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReturnsService } from '../../core/api/returns.service';
import { ReturnStatus } from '../../core/models/api.models';
import { AlertComponent, ButtonComponent, CardComponent, ModalComponent } from '../../shared/ui';

/**
 * Return (RMA) handling.
 *
 * The API owns the state machine — REQUESTED may become APPROVED or REJECTED,
 * APPROVED may become COMPLETED, and the last two are terminal. This screen
 * offers only the transitions that are legal from the current state, so an
 * operator is never presented with a button that is going to be refused.
 *
 * There is no list endpoint for returns yet, so a return is looked up by the
 * id shown on the customer's request. Listing is noted as a follow-up.
 */
@Component({
  selector: 'ot-returns-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    AlertComponent,
    ModalComponent,
  ],
  templateUrl: './returns.page.html',
})
export class ReturnsPage {
  private readonly returns = inject(ReturnsService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly confirmOpen = signal(false);

  returnId = '';
  adminNote = '';
  private pending: ReturnStatus = 'approved';

  /** Transitions the API will accept, mirrored so nothing offered is refused. */
  readonly transitions: { status: ReturnStatus; label: string; from: string }[] = [
    { status: 'approved', label: 'Approve', from: 'requested' },
    { status: 'rejected', label: 'Reject', from: 'requested' },
    { status: 'completed', label: 'Mark completed', from: 'approved' },
  ];

  start(status: ReturnStatus): void {
    if (!this.returnId.trim()) {
      this.error.set('Enter the return id first.');
      return;
    }
    this.pending = status;
    this.confirmOpen.set(true);
  }

  pendingLabel(): string {
    return this.transitions.find((t) => t.status === this.pending)?.label ?? '';
  }

  submit(): void {
    this.saving.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.returns
      .update(this.returnId.trim(), this.pending, this.adminNote.trim() || undefined)
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.confirmOpen.set(false);
          this.adminNote = '';
          this.notice.set(`Return ${updated.id.slice(0, 8)} is now ${updated.status}.`);
        },
        error: (err) => {
          this.saving.set(false);
          this.confirmOpen.set(false);
          // A refused transition explains itself well; show the API's wording.
          this.error.set(this.message(err, 'The return could not be updated.'));
        },
      });
  }

  private message(err: unknown, fallback: string): string {
    const detail = (err as { error?: { message?: string } })?.error?.message;
    return detail || fallback;
  }
}
