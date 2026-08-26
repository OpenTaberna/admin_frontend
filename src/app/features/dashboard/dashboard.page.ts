import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AnalyticsService } from '../../core/api/analytics.service';
import { CatalogueService } from '../../core/api/catalogue.service';
import { InventoryService } from '../../core/api/inventory.service';
import { OrdersService } from '../../core/api/orders.service';
import { CurrencyTotals } from '../../core/models/analytics.models';
import { InventoryItem, Item, OrderSummary } from '../../core/models/api.models';
import { rangeEndingToday } from '../../core/date-range';
import { BadgeComponent, CardComponent, MoneyPipe, SpinnerComponent } from '../../shared/ui';

/** Window the money tiles report on. Deep analysis lives on /analytics. */
const MONEY_WINDOW_DAYS = 30;

/**
 * The operational picture: money, payments, shipping and stock.
 *
 * Money comes from `/v1/admin/analytics/summary`, computed in SQL over the
 * whole order history. It used to be summed here from the most recent 100
 * orders, which meant the headline revenue silently stopped being the shop's
 * revenue at order 101.
 *
 * The work queues below still read the orders list, and that is the right
 * source for them: they are "what needs doing now", and the newest orders are
 * exactly the ones that need doing.
 *
 * Each panel degrades on its own — one failing endpoint must not blank the
 * page, so a partial view is shown with a warning instead.
 */
@Component({
  selector: 'ot-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, BadgeComponent, SpinnerComponent, MoneyPipe],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly analytics = inject(AnalyticsService);
  private readonly catalogue = inject(CatalogueService);
  private readonly inventory = inject(InventoryService);
  private readonly orders = inject(OrdersService);

  readonly loading = signal(true);
  readonly partial = signal(false);
  readonly items = signal<Item[]>([]);
  readonly stock = signal<InventoryItem[]>([]);
  readonly allOrders = signal<OrderSummary[]>([]);
  readonly totals = signal<CurrencyTotals[]>([]);

  readonly moneyWindowDays = MONEY_WINDOW_DAYS;

  /**
   * The currency the tiles are shown in: whichever earned most.
   *
   * Falls back to the newest order's currency when the analytics call failed,
   * so the page still renders something sensible rather than a bare number.
   */
  readonly currency = computed(() => {
    const ranked = [...this.totals()].sort((a, b) => b.gross_revenue - a.gross_revenue);
    return ranked[0]?.currency ?? this.allOrders()[0]?.currency ?? 'EUR';
  });

  /** Headline block for the displayed currency, if analytics answered. */
  private readonly primaryTotals = computed<CurrencyTotals | undefined>(() =>
    this.totals().find((entry) => entry.currency === this.currency()),
  );

  /**
   * True when more than one currency traded, so the tiles can say they show
   * one of them. Summing across currencies is never correct.
   */
  readonly multiCurrency = computed(() => this.totals().length > 1);

  /** Money taken in the window, net of refunds. */
  readonly revenue = computed(() => this.primaryTotals()?.net_revenue ?? 0);

  readonly revenueOrders = computed(() => this.primaryTotals()?.orders ?? 0);

  /** Checkouts started but not paid — revenue at risk, not revenue earned. */
  readonly awaitingPayment = computed(() =>
    this.allOrders().filter((o) => o.status === 'pending_payment'),
  );

  readonly awaitingPaymentValue = computed(() =>
    this.awaitingPayment().reduce((sum, o) => sum + o.total_amount, 0),
  );

  /** Paid but not yet handed to a carrier — the work queue. */
  readonly awaitingShipment = computed(() =>
    this.allOrders().filter((o) => o.status === 'paid' || o.status === 'ready_to_ship'),
  );

  readonly awaitingShipmentValue = computed(() =>
    this.awaitingShipment().reduce((sum, o) => sum + o.total_amount, 0),
  );

  readonly shipped = computed(() => this.allOrders().filter((o) => o.status === 'shipped'));

  readonly refunded = computed(() =>
    this.allOrders().filter((o) => o.status === 'refunded' || o.status === 'cancelled'),
  );

  readonly refundedValue = computed(() =>
    this.refunded().reduce((sum, o) => sum + o.total_amount, 0),
  );

  /** Average order value across orders that produced money. */
  readonly averageOrder = computed(() => this.primaryTotals()?.average_order_value ?? 0);

  readonly activeCount = computed(() => this.items().filter((i) => i.status === 'active').length);
  readonly hiddenCount = computed(() => this.items().filter((i) => i.status !== 'active').length);

  readonly outOfStock = computed(() => this.stock().filter((s) => s.on_hand - s.reserved <= 0));

  readonly lowStock = computed(() =>
    this.stock().filter((s) => {
      const available = s.on_hand - s.reserved;
      return available > 0 && available <= 5;
    }),
  );

  /** Units held by checkouts in progress — unsellable until they settle. */
  readonly reservedUnits = computed(() => this.stock().reduce((sum, s) => sum + s.reserved, 0));

  readonly recentOrders = computed(() =>
    [...this.allOrders()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6),
  );

  /** Order counts by status, largest first, for the mix bar. */
  readonly statusMix = computed(() => {
    const counts = new Map<string, number>();
    for (const o of this.allOrders()) {
      counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    }
    const total = this.allOrders().length || 1;
    return [...counts.entries()]
      .map(([status, count]) => ({
        status,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  });

  constructor() {
    forkJoin({
      items: this.catalogue.list(0, 100).pipe(catchError(() => of(null))),
      stock: this.inventory.list(0, 200).pipe(catchError(() => of(null))),
      orders: this.orders.list(undefined, 0, 100).pipe(catchError(() => of(null))),
      summary: this.analytics
        .summary(rangeEndingToday(MONEY_WINDOW_DAYS))
        .pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      if (!res.items || !res.stock || !res.orders || !res.summary) {
        this.partial.set(true);
      }
      this.items.set(res.items?.items ?? []);
      this.stock.set(res.stock?.items ?? []);
      this.allOrders.set(res.orders?.orders ?? []);
      this.totals.set(res.summary?.currencies ?? []);
      this.loading.set(false);
    });
  }

  readable(status: string): string {
    return status.replace(/_/g, ' ');
  }

  toneFor(status: string): 'ok' | 'warn' | 'danger' | 'info' | 'neutral' {
    if (status === 'shipped') return 'ok';
    if (status === 'pending_payment') return 'warn';
    if (status === 'cancelled' || status === 'refunded') return 'danger';
    if (status === 'paid' || status === 'ready_to_ship') return 'info';
    return 'neutral';
  }
}
