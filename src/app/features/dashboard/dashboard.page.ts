import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CatalogueService } from '../../core/api/catalogue.service';
import { InventoryService } from '../../core/api/inventory.service';
import { OrdersService } from '../../core/api/orders.service';
import { AuthService } from '../../core/auth/auth.service';
import { Item, InventoryItem, OrderSummary } from '../../core/models/api.models';
import {
  BadgeComponent,
  CardComponent,
  PageHeaderComponent,
  SpinnerComponent,
} from '../../shared/ui';

/**
 * Landing screen: what needs attention right now.
 *
 * Deliberately not a metrics wall. It answers three questions an operator has
 * on opening the back office — is anything unsellable, is anything waiting to
 * be shipped, and is the catalogue actually visible.
 *
 * Each panel degrades on its own: one failing endpoint must not blank the page.
 */
@Component({
  selector: 'ot-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    SpinnerComponent,
  ],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly catalogue = inject(CatalogueService);
  private readonly inventory = inject(InventoryService);
  private readonly orders = inject(OrdersService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly items = signal<Item[]>([]);
  readonly stock = signal<InventoryItem[]>([]);
  readonly openOrders = signal<OrderSummary[]>([]);
  readonly partial = signal(false);

  constructor() {
    forkJoin({
      // /v1/items caps limit at 100; /v1/admin/inventory allows 200.
      items: this.catalogue.list(0, 100).pipe(catchError(() => of(null))),
      stock: this.inventory.list(0, 200).pipe(catchError(() => of(null))),
      paid: this.orders.list('paid', 0, 100).pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      if (!res.items || !res.stock || !res.paid) {
        this.partial.set(true);
      }
      this.items.set(res.items?.items ?? []);
      this.stock.set(res.stock?.items ?? []);
      this.openOrders.set(res.paid?.orders ?? []);
      this.loading.set(false);
    });
  }

  get activeCount(): number {
    return this.items().filter((i) => i.status === 'active').length;
  }

  get hiddenCount(): number {
    return this.items().filter((i) => i.status !== 'active').length;
  }

  get outOfStock(): InventoryItem[] {
    return this.stock().filter((s) => s.on_hand - s.reserved <= 0);
  }

  get lowStock(): InventoryItem[] {
    return this.stock().filter((s) => {
      const available = s.on_hand - s.reserved;
      return available > 0 && available <= 5;
    });
  }
}
