import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ErrorsService } from '../../core/api/errors.service';
import { ErrorGroup } from '../../core/models/errors.models';
import { ErrorsPage } from './errors.page';

/**
 * The screen's job is to distinguish three states that look alike if you are
 * careless: nothing broken, nothing collected, and nothing loaded.
 */
describe('ErrorsPage', () => {
  const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

  const recent: ErrorGroup = {
    app: 'storefront',
    name: 'TypeError',
    message: "Cannot read properties of undefined (reading 'price')",
    occurrences: 42,
    affected_paths: 3,
    browsers: ['Chrome 140', 'Safari 18'],
    first_seen: minutesAgo(90),
    last_seen: minutesAgo(2),
    sample_stack: 'at ProductComponent.render',
  };

  const stale: ErrorGroup = {
    ...recent,
    name: 'RangeError',
    message: 'old and fixed',
    occurrences: 100,
    last_seen: minutesAgo(60 * 24 * 3),
    app: 'admin',
  };

  function build(
    response: unknown = { enabled: true, total_occurrences: 142, groups: [recent, stale] },
  ) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ErrorsService,
          useValue: {
            list: () => (response === 'fail' ? throwError(() => new Error('down')) : of(response)),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ErrorsPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('renders and lists the groups it was given', () => {
    const page = build();
    expect(page.loading()).toBe(false);
    expect(page.groups()).toHaveLength(2);
  });

  it('counts only errors still happening as active', () => {
    // A large total with nothing recent is a bug that has already been fixed.
    const page = build();
    expect(page.recent()).toHaveLength(1);
    expect(page.recent()[0].name).toBe('TypeError');
  });

  it('marks a busy recent error as dangerous and an old one as neutral', () => {
    const page = build();
    expect(page.toneFor(recent)).toBe('danger');
    expect(page.toneFor(stale)).toBe('neutral');
  });

  it('counts storefront errors separately, since those cost sales', () => {
    const page = build();
    expect(page.storefrontCount()).toBe(1);
  });

  it('distinguishes "not collecting" from "no errors"', () => {
    // Both render an empty list unless the page says which it is.
    const page = build({ enabled: false, total_occurrences: 0, groups: [] });
    expect(page.disabled()).toBe(true);
  });

  it('does not claim collection is off merely because there are no errors', () => {
    const page = build({ enabled: true, total_occurrences: 0, groups: [] });
    expect(page.disabled()).toBe(false);
    expect(page.groups()).toHaveLength(0);
  });

  it('reports a failed load rather than showing an empty list', () => {
    const page = build('fail');
    expect(page.failed()).toBe(true);
    expect(page.loading()).toBe(false);
  });

  it('expands one group at a time', () => {
    const page = build();
    page.toggle(recent);
    expect(page.isExpanded(recent)).toBe(true);
    expect(page.isExpanded(stale)).toBe(false);

    page.toggle(stale);
    expect(page.isExpanded(recent)).toBe(false);

    page.toggle(stale);
    expect(page.isExpanded(stale)).toBe(false);
  });
});
