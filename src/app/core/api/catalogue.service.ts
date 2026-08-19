import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Item, Paginated } from '../models/api.models';
import { ApiService } from './api.service';

/**
 * The store catalogue — what customers actually see.
 *
 * Backed by `/v1/items`, which is public for reading. Writes are still made
 * with the admin's token attached by the interceptor.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly api = inject(ApiService);

  /** The API rejects a limit above 100, so clamp rather than 422. */
  static readonly MAX_PAGE_SIZE = 100;

  list(skip = 0, limit = 50): Observable<Paginated<Item>> {
    return this.api.get<Paginated<Item>>('/v1/items/', {
      skip,
      limit: Math.min(limit, CatalogueService.MAX_PAGE_SIZE),
    });
  }

  get(uuid: string): Observable<Item> {
    return this.api.get<Item>(`/v1/items/${uuid}`);
  }

  create(item: Partial<Item>): Observable<Item> {
    return this.api.post<Item>('/v1/items/', item);
  }

  update(uuid: string, changes: Partial<Item>): Observable<Item> {
    return this.api.patch<Item>(`/v1/items/${uuid}`, changes);
  }

  remove(uuid: string): Observable<void> {
    return this.api.delete<void>(`/v1/items/${uuid}`);
  }
}
