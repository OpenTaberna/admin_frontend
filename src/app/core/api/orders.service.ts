import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminOrderDetail, AdminOrderList, OrderStatus } from '../models/api.models';
import { ApiService } from './api.service';

/**
 * Order administration, under `/v1/admin/orders`.
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly api = inject(ApiService);

  list(status?: OrderStatus, skip = 0, limit = 50): Observable<AdminOrderList> {
    return this.api.get<AdminOrderList>('/v1/admin/orders/', {
      ...(status ? { status } : {}),
      skip,
      limit,
    });
  }

  detail(orderId: string): Observable<AdminOrderDetail> {
    return this.api.get<AdminOrderDetail>(`/v1/admin/orders/${orderId}`);
  }

  /**
   * Override an order's status.
   *
   * A reason is mandatory — the API writes it to the audit log, which is the
   * only record of why a human moved an order by hand.
   */
  overrideStatus(
    orderId: string,
    status: OrderStatus,
    reason: string,
  ): Observable<AdminOrderDetail> {
    return this.api.patch<AdminOrderDetail>(`/v1/admin/orders/${orderId}/status`, {
      status,
      reason,
    });
  }

  packingSlipUrl(orderId: string): string {
    return `/v1/admin/orders/${orderId}/packing-slip`;
  }
}
