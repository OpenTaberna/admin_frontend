import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ErrorsService } from '../../core/api/errors.service';
import { ErrorGroup, FrontendErrors } from '../../core/models/errors.models';
import { BadgeComponent, CardComponent, SpinnerComponent } from '../../shared/ui';

type AppFilter = 'all' | 'storefront' | 'admin';

/**
 * Uncaught frontend errors, from both applications.
 *
 * Grouped by the API, because one bug produces thousands of identical rows.
 *
 * The storefront's errors are shown here rather than anywhere else: this is
 * where an administrator looks, and commercially a broken storefront matters
 * more than a broken back office.
 *
 * What this screen cannot show is the important caveat, and it is stated on the
 * page rather than left to be inferred: an error that breaks a page badly
 * enough to stop the reporter never arrives. Silence is no news, not no errors.
 */
@Component({
  selector: 'ot-errors-page',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, SpinnerComponent],
  templateUrl: './errors.page.html',
})
export class ErrorsPage {
  private readonly errors = inject(ErrorsService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly data = signal<FrontendErrors | null>(null);
  readonly filter = signal<AppFilter>('all');
  readonly expanded = signal<string | null>(null);

  readonly disabled = computed(() => this.data()?.enabled === false);
  readonly groups = computed<ErrorGroup[]>(() => this.data()?.groups ?? []);

  /**
   * Errors seen in the last hour, which is what "is something broken right
   * now?" means. A large total with nothing recent is a fixed bug.
   */
  readonly recent = computed(() => {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return this.groups().filter((g) => new Date(g.last_seen).getTime() > hourAgo);
  });

  readonly storefrontCount = computed(
    () => this.groups().filter((g) => g.app === 'storefront').length,
  );

  constructor() {
    this.load();
  }

  select(filter: AppFilter): void {
    this.filter.set(filter);
    this.load();
  }

  toggle(group: ErrorGroup): void {
    const key = this.key(group);
    this.expanded.set(this.expanded() === key ? null : key);
  }

  key(group: ErrorGroup): string {
    return `${group.app}::${group.name}::${group.message}`;
  }

  isExpanded(group: ErrorGroup): boolean {
    return this.expanded() === this.key(group);
  }

  toneFor(group: ErrorGroup): 'danger' | 'warn' | 'neutral' {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (new Date(group.last_seen).getTime() > hourAgo) {
      return group.occurrences > 10 ? 'danger' : 'warn';
    }
    return 'neutral';
  }

  private load(): void {
    this.loading.set(true);
    this.failed.set(false);

    const selected = this.filter();
    const app = selected === 'all' ? undefined : selected;
    this.errors
      .list(app, 50)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (!result) {
          this.failed.set(true);
        }
        this.data.set(result);
        this.loading.set(false);
      });
  }
}
