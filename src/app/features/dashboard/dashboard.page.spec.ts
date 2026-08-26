import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AnalyticsService } from '../../core/api/analytics.service';
import { CatalogueService } from '../../core/api/catalogue.service';
import { InventoryService } from '../../core/api/inventory.service';
import { OrdersService } from '../../core/api/orders.service';
import { DashboardPage } from './dashboard.page';

/**
 * The dashboard used to sum revenue from the orders list, which meant it only
 * ever saw the most recent 100 orders. These pin the figures to the analytics
 * endpoint instead — the whole point of OpenTaberna/admin_frontend#7.
 *
 * The orders stub deliberately carries values that would produce a *different*
 * total if anything went back to adding them up, so a regression cannot pass
 * by coincidence.
 */
describe('DashboardPage money figures', () => {
  function configure(summaryCurrencies: unknown[]) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AnalyticsService,
          useValue: {
            summary: () => of({ currencies: summaryCurrencies }),
          },
        },
        {
          provide: OrdersService,
          useValue: {
            list: () =>
              of({
                orders: [
                  // 999999 would dominate any client-side sum.
                  {
                    status: 'paid',
                    total_amount: 999999,
                    currency: 'EUR',
                    created_at: '2026-08-01T00:00:00Z',
                  },
                  {
                    status: 'pending_payment',
                    total_amount: 5000,
                    currency: 'EUR',
                    created_at: '2026-08-02T00:00:00Z',
                  },
                ],
              }),
          },
        },
        { provide: CatalogueService, useValue: { list: () => of({ items: [] }) } },
        { provide: InventoryService, useValue: { list: () => of({ items: [] }) } },
      ],
    });
    return TestBed.createComponent(DashboardPage).componentInstance;
  }

  const EUR = {
    currency: 'EUR',
    gross_revenue: 50000,
    refunded_revenue: 10000,
    net_revenue: 40000,
    orders: 4,
    units: 9,
    average_order_value: 12500,
    previous: null,
    change: null,
  };

  it('reports net revenue from the API, not from the orders list', () => {
    const page = configure([EUR]);

    expect(page.revenue()).toBe(40000);
    expect(page.revenue()).not.toBe(999999);
  });

  it('takes average order value from the API rather than recomputing it', () => {
    const page = configure([EUR]);

    expect(page.averageOrder()).toBe(12500);
  });

  it('reports how many orders the revenue covers', () => {
    const page = configure([EUR]);

    expect(page.revenueOrders()).toBe(4);
  });

  it('shows the currency that earned the most, never a sum across them', () => {
    const page = configure([
      { ...EUR, currency: 'USD', gross_revenue: 10000, net_revenue: 9000 },
      EUR,
    ]);

    expect(page.currency()).toBe('EUR');
    expect(page.multiCurrency()).toBe(true);
    // 40000, not 49000 — currencies are never added together.
    expect(page.revenue()).toBe(40000);
  });

  it('degrades to zero and flags a partial view when analytics fails', () => {
    const page = configure([]);

    expect(page.revenue()).toBe(0);
    expect(page.multiCurrency()).toBe(false);
  });

  it('still derives work queues from the orders list', () => {
    const page = configure([EUR]);

    // Operational panels are meant to read the newest orders.
    expect(page.awaitingPayment().length).toBe(1);
    expect(page.awaitingPaymentValue()).toBe(5000);
  });
});
