import { TestBed } from '@angular/core/testing';

import { AnalyticsService } from './analytics.service';
import { ApiService } from './api.service';

/**
 * The analytics endpoints take `from`/`to` as inclusive calendar dates and
 * reject an inverted or over-long range with a 422. These check the service
 * passes through exactly what each endpoint expects, since a silently dropped
 * parameter would widen the window to the API's 30-day default and quietly
 * report the wrong period.
 */
describe('AnalyticsService', () => {
  let calls: Array<{ path: string; params: Record<string, unknown> }>;
  let service: AnalyticsService;

  beforeEach(() => {
    calls = [];
    const apiStub = {
      get: (path: string, params: Record<string, unknown>) => {
        calls.push({ path, params });
        return { subscribe: () => undefined };
      },
    };
    TestBed.configureTestingModule({
      providers: [AnalyticsService, { provide: ApiService, useValue: apiStub }],
    });
    service = TestBed.inject(AnalyticsService);
  });

  it('passes the requested window to the summary endpoint', () => {
    service.summary({ from: '2026-08-01', to: '2026-08-31' }).subscribe();

    expect(calls[0].path).toBe('/v1/admin/analytics/summary');
    expect(calls[0].params['from']).toBe('2026-08-01');
    expect(calls[0].params['to']).toBe('2026-08-31');
  });

  it('sends the bucket interval for the time series', () => {
    service.timeseries({ from: '2026-01-01', to: '2026-12-31' }, 'week').subscribe();

    expect(calls[0].path).toBe('/v1/admin/analytics/timeseries');
    expect(calls[0].params['interval']).toBe('week');
  });

  it('defaults the series interval to day', () => {
    service.timeseries({ from: '2026-08-01', to: '2026-08-07' }).subscribe();

    expect(calls[0].params['interval']).toBe('day');
  });

  it('sends sort and limit for product performance', () => {
    service.products({ from: '2026-08-01', to: '2026-08-31' }, 'units', 15).subscribe();

    expect(calls[0].path).toBe('/v1/admin/analytics/products');
    expect(calls[0].params['sort']).toBe('units');
    expect(calls[0].params['limit']).toBe(15);
  });

  it('requests the funnel for the same window', () => {
    service.funnel({ from: '2026-08-01', to: '2026-08-31' }).subscribe();

    expect(calls[0].path).toBe('/v1/admin/analytics/funnel');
    expect(calls[0].params['to']).toBe('2026-08-31');
  });
});
