import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ReturnRequest, ReturnStatus } from '../models/api.models';
import { ApiService } from './api.service';

/**
 * Return (RMA) administration, under `/v1/admin/returns`.
 *
 * The API enforces the state machine: REQUESTED may become APPROVED or
 * REJECTED, APPROVED may become COMPLETED, and the last two are terminal.
 */
@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private readonly api = inject(ApiService);

  update(returnId: string, status: ReturnStatus, adminNote?: string): Observable<ReturnRequest> {
    return this.api.patch<ReturnRequest>(`/v1/admin/returns/${returnId}`, {
      status,
      ...(adminNote ? { admin_note: adminNote } : {}),
    });
  }
}
