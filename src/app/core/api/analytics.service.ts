import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AnalyticsFunnel,
  AnalyticsStorefront,
  AnalyticsProducts,
  AnalyticsSummary,
  AnalyticsTimeseries,
  DateRange,
  ProductSort,
  SeriesInterval,
} from '../models/analytics.models';
import { ApiService } from './api.service';

/**
 * Commercial reporting, under `/v1/admin/analytics`.
 *
 * Every figure is computed by the API in SQL over the whole order history, so
 * nothing here aggregates — that was the previous dashboard's mistake, and it
 * capped the shop's numbers at the most recent 100 orders.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(ApiService);

  /** Largest window the API accepts, in days. Beyond this it returns 422. */
  static readonly MAX_RANGE_DAYS = 366 * 5;

  summary(range: DateRange): Observable<AnalyticsSummary> {
    return this.api.get<AnalyticsSummary>('/v1/admin/analytics/summary', { ...range });
  }

  timeseries(range: DateRange, interval: SeriesInterval = 'day'): Observable<AnalyticsTimeseries> {
    return this.api.get<AnalyticsTimeseries>('/v1/admin/analytics/timeseries', {
      ...range,
      interval,
    });
  }

  products(
    range: DateRange,
    sort: ProductSort = 'revenue',
    limit = 20,
  ): Observable<AnalyticsProducts> {
    return this.api.get<AnalyticsProducts>('/v1/admin/analytics/products', {
      ...range,
      sort,
      limit,
    });
  }

  funnel(range: DateRange): Observable<AnalyticsFunnel> {
    return this.api.get<AnalyticsFunnel>('/v1/admin/analytics/funnel', { ...range });
  }

  storefront(range: DateRange): Observable<AnalyticsStorefront> {
    return this.api.get<AnalyticsStorefront>('/v1/admin/analytics/storefront', { ...range });
  }
}
