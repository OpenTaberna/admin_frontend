import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AnalyticsService } from '../../core/api/analytics.service';
import { rangeEndingToday } from '../../core/date-range';
import {
  AnalyticsFunnel,
  AnalyticsProducts,
  AnalyticsSummary,
  AnalyticsTimeseries,
  CurrencyTotals,
  ProductSort,
  SeriesInterval,
} from '../../core/models/analytics.models';
import { BRAND, BRAND_SOFT, ChartComponent, DANGER, MUTED, baseOptions } from '../../shared/charts';
import { BadgeComponent, CardComponent, MoneyPipe, SpinnerComponent } from '../../shared/ui';

/** Selectable windows, in days. */
const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '12 months', days: 365 },
] as const;

/**
 * Commercial analytics: what the shop took, what sold, and where orders stop.
 *
 * Every figure comes from `/v1/admin/analytics`, computed in SQL over the whole
 * order history. Nothing is aggregated here — the previous dashboard did that
 * client-side and could only ever see the most recent 100 orders.
 *
 * Money is shown per currency and never summed across them. The API returns a
 * list keyed by currency precisely because a cross-currency total is
 * meaningless; adding them up in the UI would put the bug back.
 *
 * Each panel degrades on its own, so one failing request leaves the rest of the
 * page readable.
 */
@Component({
  selector: 'ot-analytics-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    BadgeComponent,
    SpinnerComponent,
    ChartComponent,
    MoneyPipe,
  ],
  templateUrl: './analytics.page.html',
})
export class AnalyticsPage {
  private readonly analytics = inject(AnalyticsService);

  readonly ranges = RANGES;
  readonly selectedDays = signal<number>(30);
  readonly interval = signal<SeriesInterval>('day');
  readonly sort = signal<ProductSort>('revenue');

  readonly loading = signal(true);
  readonly partial = signal(false);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly series = signal<AnalyticsTimeseries | null>(null);
  readonly products = signal<AnalyticsProducts | null>(null);
  readonly funnel = signal<AnalyticsFunnel | null>(null);

  /** Currency the charts are drawn in — the one with the most revenue. */
  readonly primaryCurrency = computed(() => {
    const totals = this.summary()?.currencies ?? [];
    if (totals.length === 0) {
      return 'EUR';
    }
    return [...totals].sort((a, b) => b.gross_revenue - a.gross_revenue)[0].currency;
  });

  readonly currencies = computed<CurrencyTotals[]>(() => this.summary()?.currencies ?? []);

  /**
   * True when more than one currency traded. The charts show one currency, so
   * the page has to say so rather than let a reader assume it is everything.
   */
  readonly multiCurrency = computed(() => this.currencies().length > 1);

  readonly hasRevenue = computed(() => this.currencies().some((entry) => entry.gross_revenue > 0));

  readonly revenueChart = computed<ChartConfiguration<'line'> | null>(() => {
    const currency = this.primaryCurrency();
    const points = this.series()?.series.find((s) => s.currency === currency)?.points;
    if (!points?.length) {
      return null;
    }
    return {
      type: 'line',
      data: {
        labels: points.map((point) => point.bucket),
        datasets: [
          {
            label: 'Net revenue',
            data: points.map((point) => point.net_revenue),
            borderColor: BRAND,
            backgroundColor: BRAND_SOFT,
            fill: true,
            tension: 0.25,
            pointRadius: points.length > 60 ? 0 : 2,
          },
        ],
      },
      options: baseOptions(currency) as ChartConfiguration<'line'>['options'],
    };
  });

  readonly ordersChart = computed<ChartConfiguration<'bar'> | null>(() => {
    const currency = this.primaryCurrency();
    const points = this.series()?.series.find((s) => s.currency === currency)?.points;
    if (!points?.length) {
      return null;
    }
    const options = baseOptions(currency) as ChartConfiguration<'bar'>['options'];
    return {
      type: 'bar',
      data: {
        labels: points.map((point) => point.bucket),
        datasets: [
          {
            label: 'Orders',
            data: points.map((point) => point.orders),
            backgroundColor: BRAND,
            borderRadius: 3,
          },
          {
            label: 'Units',
            data: points.map((point) => point.units),
            backgroundColor: MUTED,
            borderRadius: 3,
          },
        ],
      },
      options: {
        ...options,
        scales: {
          ...options?.scales,
          // Counts, not money — the shared money formatter must not apply.
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    };
  });

  readonly funnelChart = computed<ChartConfiguration<'bar'> | null>(() => {
    const steps = this.funnel()?.steps;
    if (!steps?.length) {
      return null;
    }
    return {
      type: 'bar',
      data: {
        labels: steps.map((step) => step.label),
        datasets: [
          {
            label: 'Orders',
            data: steps.map((step) => step.orders),
            backgroundColor: [BRAND, BRAND, BRAND, BRAND].slice(0, steps.length),
            borderRadius: 3,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };
  });

  readonly worstDropOff = computed(() => {
    const steps = this.funnel()?.steps ?? [];
    const withDrop = steps.filter((step) => (step.drop_off_from_previous ?? 0) > 0);
    if (withDrop.length === 0) {
      return null;
    }
    return withDrop.reduce((worst, step) =>
      (step.drop_off_from_previous ?? 0) > (worst.drop_off_from_previous ?? 0) ? step : worst,
    );
  });

  constructor() {
    this.load();
  }

  selectRange(days: number): void {
    this.selectedDays.set(days);
    // Daily buckets over a year are unreadable and slow to draw.
    this.interval.set(days > 120 ? 'week' : 'day');
    this.load();
  }

  selectSort(sort: ProductSort): void {
    this.sort.set(sort);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.partial.set(false);

    const range = rangeEndingToday(this.selectedDays());

    forkJoin({
      summary: this.analytics.summary(range).pipe(catchError(() => of(null))),
      series: this.analytics.timeseries(range, this.interval()).pipe(catchError(() => of(null))),
      products: this.analytics.products(range, this.sort(), 15).pipe(catchError(() => of(null))),
      funnel: this.analytics.funnel(range).pipe(catchError(() => of(null))),
    }).subscribe((result) => {
      if (!result.summary || !result.series || !result.products || !result.funnel) {
        this.partial.set(true);
      }
      this.summary.set(result.summary);
      this.series.set(result.series);
      this.products.set(result.products);
      this.funnel.set(result.funnel);
      this.loading.set(false);
    });
  }

  /**
   * Arrow for a percentage change, or an em dash when there is no baseline.
   *
   * Change from zero is undefined; showing 0% or an arrow would assert
   * something the data does not support.
   */
  trend(pct: number | null | undefined): '↑' | '↓' | '—' {
    if (pct === null || pct === undefined || pct === 0) {
      return '—';
    }
    return pct > 0 ? '↑' : '↓';
  }

  trendTone(pct: number | null | undefined, higherIsBetter = true): 'ok' | 'danger' | 'neutral' {
    if (pct === null || pct === undefined || pct === 0) {
      return 'neutral';
    }
    const good = higherIsBetter ? pct > 0 : pct < 0;
    return good ? 'ok' : 'danger';
  }

  percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${(value * 100).toFixed(1)}%`;
  }
}
