import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { FrontendErrors } from '../models/errors.models';
import { ApiService } from './api.service';

/**
 * Frontend error reports, under `/v1/admin/telemetry`.
 *
 * Covers both applications: the storefront's errors are read here because that
 * is where an administrator looks, and commercially they matter most.
 */
@Injectable({ providedIn: 'root' })
export class ErrorsService {
  private readonly api = inject(ApiService);

  list(app?: 'storefront' | 'admin', limit = 25): Observable<FrontendErrors> {
    return this.api.get<FrontendErrors>('/v1/admin/telemetry/errors', {
      ...(app ? { app } : {}),
      limit,
    });
  }
}
