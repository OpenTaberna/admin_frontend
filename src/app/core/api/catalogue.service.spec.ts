import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { CatalogueService } from './catalogue.service';

/**
 * The catalogue endpoint rejects a page size above 100 with a 422. Clamping in
 * the service means no caller can trip it — a real bug found while driving the
 * dashboard, which had asked for 200.
 */
describe('CatalogueService page size', () => {
  let calls: Array<Record<string, unknown>>;
  let service: CatalogueService;

  beforeEach(() => {
    calls = [];
    const apiStub = {
      get: (_path: string, params: Record<string, unknown>) => {
        calls.push(params);
        return { subscribe: () => undefined };
      },
    };
    TestBed.configureTestingModule({
      providers: [CatalogueService, { provide: ApiService, useValue: apiStub }],
    });
    service = TestBed.inject(CatalogueService);
  });

  it('caps the page size the API accepts', () => {
    expect(CatalogueService.MAX_PAGE_SIZE).toBe(100);
  });

  it('clamps a larger request rather than letting it 422', () => {
    service.list(0, 500);
    expect(calls[0]['limit']).toBe(100);
  });

  it('leaves a smaller request untouched', () => {
    service.list(0, 25);
    expect(calls[0]['limit']).toBe(25);
  });
});
