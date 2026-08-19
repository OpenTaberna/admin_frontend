import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { OrdersService } from '../../core/api/orders.service';
import { FilterBarComponent } from '../../shared/filters/filter-bar';
import { RowLinkDirective, SortHeaderComponent, createSort, sortRows } from '../../shared/table';
import { AdminOrderDetail, OrderStatus, OrderSummary } from '../../core/models/api.models';
import {
  AlertComponent,
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  ModalComponent,
  MoneyPipe,
  SpinnerComponent,
} from '../../shared/ui';

const STATUS_TONES: Record<OrderStatus, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  draft: 'neutral',
  pending_payment: 'warn',
  paid: 'info',
  ready_to_ship: 'info',
  shipped: 'ok',
  cancelled: 'danger',
  refunded: 'danger',
};

/**
 * Order administration: review, inspect and correct.
 *
 * A status override demands a reason because the API records it in the audit
 * log — it is the only trace of why someone moved an order by hand.
 */
@Component({
  selector: 'ot-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    SpinnerComponent,
    ModalComponent,
    AlertComponent,
    MoneyPipe,
    FilterBarComponent,
    SortHeaderComponent,
    RowLinkDirective,
  ],
  templateUrl: './orders.page.html',
})
export class OrdersPage {
  private readonly orders = inject(OrdersService);

  readonly rows = signal<OrderSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly detail = signal<AdminOrderDetail | null>(null);
  readonly detailOpen = signal(false);
  readonly detailLoading = signal(false);
  readonly overrideOpen = signal(false);
  readonly saving = signal(false);

  readonly statuses: OrderStatus[] = [
    'draft',
    'pending_payment',
    'paid',
    'ready_to_ship',
    'shipped',
    'cancelled',
    'refunded',
  ];

  readonly search = signal('');
  readonly selected = signal<Record<string, string[]>>({ status: [] });
  readonly sort = createSort<'placed' | 'status' | 'total' | 'order'>({
    key: 'placed',
    direction: 'desc',
  });

  readonly facets = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_payment', label: 'Pending payment' },
        { value: 'paid', label: 'Paid' },
        { value: 'ready_to_ship', label: 'Ready to ship' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
      ],
    },
  ];

  /**
   * Filtering happens client-side so several statuses can be combined at once —
   * the API's status parameter takes only one.
   */
  readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.selected()['status'] ?? [];

    const filtered = this.rows().filter((order) => {
      if (term && !order.id.toLowerCase().includes(term)) return false;
      if (statuses.length > 0 && !statuses.includes(order.status)) return false;
      return true;
    });

    return sortRows(filtered, this.sort.state(), (order, key) => {
      switch (key) {
        case 'placed':
          return order.created_at;
        case 'status':
          return order.status;
        case 'total':
          return order.total_amount;
        case 'order':
          return order.id;
      }
    });
  });

  clearFilters(): void {
    this.search.set('');
    this.selected.set({ status: [] });
  }
  overrideStatus: OrderStatus = 'paid';
  overrideReason = '';
  private overrideTarget: string | null = null;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orders.list(undefined, 0, 100).subscribe({
      next: (res) => {
        this.rows.set(res.orders ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.message(err, 'Could not load orders.'));
        this.loading.set(false);
      },
    });
  }

  tone(status: OrderStatus) {
    return STATUS_TONES[status] ?? 'neutral';
  }

  readable(status: string): string {
    return status.replace(/_/g, ' ');
  }

  open(order: OrderSummary): void {
    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.detail.set(null);
    this.orders.detail(order.id).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailLoading.set(false);
        this.error.set(this.message(err, 'Could not load the order.'));
        this.detailOpen.set(false);
      },
    });
  }

  packingSlip(orderId: string): string {
    return `${environment.apiBaseUrl}${this.orders.packingSlipUrl(orderId)}`;
  }

  startOverride(orderId: string, current: OrderStatus): void {
    this.overrideTarget = orderId;
    this.overrideStatus = current;
    this.overrideReason = '';
    this.overrideOpen.set(true);
  }

  submitOverride(): void {
    if (!this.overrideTarget || !this.overrideReason.trim()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.orders
      .overrideStatus(this.overrideTarget, this.overrideStatus, this.overrideReason.trim())
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.overrideOpen.set(false);
          this.detailOpen.set(false);
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(this.message(err, 'The status change was refused.'));
        },
      });
  }

  private message(err: unknown, fallback: string): string {
    const detail = (err as { error?: { message?: string } })?.error?.message;
    return detail || fallback;
  }
}
