import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnalyticsService } from '../../core/api/analytics.service';
import { isoDate, rangeEndingToday } from '../../core/date-range';
import { AnalyticsPage } from './analytics.page';

/**
 * The window helpers decide which period every figure on the page describes,
 * so an off-by-one here misreports the shop's takings rather than merely
 * looking wrong.
 */
describe('rangeEndingToday', () => {
  it('includes both ends, so seven days spans today and the six before', () => {
    const range = rangeEndingToday(7, new Date(2026, 7, 26));

    expect(range.to).toBe('2026-08-26');
    expect(range.from).toBe('2026-08-20');
  });

  it('treats a one day window as today only', () => {
    const range = rangeEndingToday(1, new Date(2026, 7, 26));

    expect(range.from).toBe('2026-08-26');
    expect(range.to).toBe('2026-08-26');
  });

  it('crosses a month boundary correctly', () => {
    const range = rangeEndingToday(7, new Date(2026, 8, 3));

    expect(range.from).toBe('2026-08-28');
    expect(range.to).toBe('2026-09-03');
  });
});

describe('isoDate', () => {
  it('uses local calendar date, not UTC', () => {
    // 1 March 2026 at 00:30 local. Formatting via toISOString() would emit
    // the previous day for any timezone ahead of UTC.
    expect(isoDate(new Date(2026, 2, 1, 0, 30))).toBe('2026-03-01');
  });

  it('zero-pads month and day', () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

const EUR = {
  currency: 'EUR',
  gross_revenue: 50000,
  refunded_revenue: 10000,
  net_revenue: 40000,
  orders: 4,
  units: 9,
  average_order_value: 12500,
  previous: {
    gross_revenue: 25000,
    refunded_revenue: 0,
    net_revenue: 25000,
    orders: 2,
    units: 4,
    average_order_value: 12500,
  },
  change: {
    net_revenue_pct: 60,
    gross_revenue_pct: 100,
    orders_pct: 100,
    units_pct: 125,
    average_order_value_pct: 0,
  },
};

const USD = { ...EUR, currency: 'USD', gross_revenue: 1000, net_revenue: 900 };

function buildPage(overrides: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AnalyticsService,
        useValue: {
          summary: () => of({ currencies: [EUR], period: {}, previous_period: {} }),
          timeseries: () =>
            of({
              interval: 'day',
              series: [
                {
                  currency: 'EUR',
                  points: [
                    {
                      bucket: '2026-08-01',
                      gross_revenue: 20000,
                      refunded_revenue: 0,
                      net_revenue: 20000,
                      orders: 2,
                      units: 4,
                    },
                    {
                      bucket: '2026-08-02',
                      gross_revenue: 0,
                      refunded_revenue: 0,
                      net_revenue: 0,
                      orders: 0,
                      units: 0,
                    },
                  ],
                },
              ],
            }),
          products: () => of({ sort: 'revenue', products: [], never_sold: [] }),
          storefront: () =>
            of({
              enabled: true,
              page_views: 40,
              steps: [
                {
                  step: 'sessions',
                  label: 'Visited the shop',
                  sessions: 100,
                  conversion_from_start: 1,
                  drop_off_from_previous: null,
                },
                {
                  step: 'viewed_product',
                  label: 'Viewed a product',
                  sessions: 60,
                  conversion_from_start: 0.6,
                  drop_off_from_previous: 40,
                },
                {
                  step: 'added_to_cart',
                  label: 'Added to cart',
                  sessions: 20,
                  conversion_from_start: 0.2,
                  drop_off_from_previous: 40,
                },
                {
                  step: 'started_checkout',
                  label: 'Started checkout',
                  sessions: 12,
                  conversion_from_start: 0.12,
                  drop_off_from_previous: 8,
                },
                {
                  step: 'paid',
                  label: 'Paid',
                  sessions: 10,
                  conversion_from_start: 0.1,
                  drop_off_from_previous: 2,
                },
              ],
              top_paths: [{ path: '/shop', views: 30, sessions: 25 }],
              product_interest: [
                {
                  sku: 'LEAK-1',
                  name: 'Ignored Red',
                  sessions_viewed: 20,
                  sessions_added: 1,
                  add_to_cart_rate: 0.05,
                },
                {
                  sku: 'GOOD-1',
                  name: 'Popular White',
                  sessions_viewed: 20,
                  sessions_added: 18,
                  add_to_cart_rate: 0.9,
                },
                {
                  sku: 'RARE-1',
                  name: 'Barely Seen',
                  sessions_viewed: 1,
                  sessions_added: 0,
                  add_to_cart_rate: 0,
                },
              ],
            }),
          funnel: () =>
            of({
              steps: [
                {
                  step: 'created',
                  label: 'Order created',
                  orders: 10,
                  conversion_from_start: 1,
                  drop_off_from_previous: null,
                },
                {
                  step: 'checkout_started',
                  label: 'Checkout started',
                  orders: 6,
                  conversion_from_start: 0.6,
                  drop_off_from_previous: 4,
                },
                {
                  step: 'paid',
                  label: 'Payment confirmed',
                  orders: 5,
                  conversion_from_start: 0.5,
                  drop_off_from_previous: 1,
                },
              ],
              never_checked_out: 4,
              payment_failed: 1,
              payment_unresolved: 0,
              cancelled: 2,
            }),
          ...overrides,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AnalyticsPage);
  fixture.detectChanges();
  return fixture.componentInstance;
}

/**
 * Renders the page against stubbed responses.
 *
 * This is a smoke test with teeth: it compiles the template, runs every
 * computed and builds real Chart.js configurations, so a mistyped field or a
 * null that reaches an arithmetic path fails here rather than on the operator's
 * screen.
 */
describe('AnalyticsPage', () => {
  it('renders without throwing and finishes loading', () => {
    const page = buildPage();
    expect(page.loading()).toBe(false);
    expect(page.partial()).toBe(false);
  });

  it('builds chart configurations from the series', () => {
    const page = buildPage();
    const revenue = page.revenueChart();

    expect(revenue?.type).toBe('line');
    expect(revenue?.data.labels).toEqual(['2026-08-01', '2026-08-02']);
    expect(revenue?.data.datasets[0].data).toEqual([20000, 0]);
  });

  it('picks the currency that earned most for the charts', () => {
    const page = buildPage({
      summary: () => of({ currencies: [USD, EUR], period: {}, previous_period: {} }),
    });

    expect(page.primaryCurrency()).toBe('EUR');
    expect(page.multiCurrency()).toBe(true);
  });

  it('names the step where most orders are lost', () => {
    const page = buildPage();
    expect(page.worstDropOff()?.step).toBe('checkout_started');
  });

  it('flags a partial view when one panel fails', () => {
    const page = buildPage({ funnel: () => of(null) });
    expect(page.partial()).toBe(true);
  });

  it('shows an em dash rather than an arrow when there is no baseline', () => {
    const page = buildPage();
    // Change from zero is undefined; an arrow would assert a direction the
    // data cannot support.
    expect(page.trend(null)).toBe('—');
    expect(page.trendTone(null)).toBe('neutral');
    expect(page.trend(12)).toBe('↑');
    expect(page.trend(-12)).toBe('↓');
  });

  it('renders a null conversion as an em dash, not 0%', () => {
    const page = buildPage();
    expect(page.percent(null)).toBe('—');
    expect(page.percent(0.6)).toBe('60.0%');
  });
});

/**
 * The shopper funnel (S2). Its job is to be honest about where the numbers come
 * from, so these pin the parts that could quietly mislead.
 */
describe('AnalyticsPage shopper funnel', () => {
  it('draws the funnel and marks the paid step differently from the rest', () => {
    const page = buildPage();
    const chart = page.storefrontChart();

    expect(chart?.data.labels).toHaveLength(5);
    expect(chart?.data.datasets[0].data).toEqual([100, 60, 20, 12, 10]);

    // The paid step is exact; every step before it is a floor. Drawing them
    // identically would imply one continuous measurement.
    const colours = chart?.data.datasets[0].backgroundColor as string[];
    expect(colours[4]).not.toBe(colours[0]);
  });

  it('surfaces products that are looked at but not taken', () => {
    const page = buildPage();
    const leaking = page.leakingProducts();

    expect(leaking.map((p) => p.sku)).toContain('LEAK-1');
    // Converts well, so it is not a problem to surface.
    expect(leaking.map((p) => p.sku)).not.toContain('GOOD-1');
    // Only one viewer: too little evidence to call it a leak.
    expect(leaking.map((p) => p.sku)).not.toContain('RARE-1');
  });

  it('ranks the worst converter first', () => {
    const page = buildPage();
    expect(page.leakingProducts()[0].sku).toBe('LEAK-1');
  });

  it('does not claim collection is off when it is on', () => {
    expect(buildPage().storefrontOff()).toBe(false);
  });

  it('distinguishes "not collecting" from "nobody visited"', () => {
    // An empty funnel and a disabled one look identical unless the page says so.
    const page = buildPage({
      storefront: () =>
        of({
          enabled: false,
          page_views: 0,
          steps: [],
          top_paths: [],
          product_interest: [],
        }),
    });

    expect(page.storefrontOff()).toBe(true);
    expect(page.storefrontChart()).toBeNull();
  });

  it('flags a partial view when the storefront panel fails', () => {
    const page = buildPage({ storefront: () => of(null) });
    expect(page.partial()).toBe(true);
  });
});
