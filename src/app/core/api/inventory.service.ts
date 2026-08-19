import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { InventoryItem, Paginated } from '../models/api.models';
import { ApiService } from './api.service';

/**
 * Stock levels, under `/v1/admin/inventory`.
 *
 * `reserved` is managed by the checkout flow and is read-only here; only
 * `on_hand` can be corrected by an administrator, and the API refuses a value
 * below what is currently reserved.
 */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly api = inject(ApiService);

  list(skip = 0, limit = 50): Observable<Paginated<InventoryItem>> {
    return this.api.get<Paginated<InventoryItem>>('/v1/admin/inventory/', { skip, limit });
  }

  create(sku: string, onHand: number): Observable<InventoryItem> {
    return this.api.post<InventoryItem>('/v1/admin/inventory/', {
      sku,
      on_hand: onHand,
    });
  }

  updateStock(id: string, onHand: number): Observable<InventoryItem> {
    return this.api.patch<InventoryItem>(`/v1/admin/inventory/${id}`, {
      on_hand: onHand,
    });
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/v1/admin/inventory/${id}`);
  }
}
