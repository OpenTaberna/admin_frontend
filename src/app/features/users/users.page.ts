import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { ManagedUser, UsersService } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { FilterBarComponent } from '../../shared/filters/filter-bar';
import { RowLinkDirective, SortHeaderComponent, createSort, sortRows } from '../../shared/table';
import {
  AlertComponent,
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  ModalComponent,
  PageHeaderComponent,
  SpinnerComponent,
} from '../../shared/ui';

type SortKey = 'name' | 'username' | 'email' | 'role' | 'created';
type PendingAction = 'promote' | 'demote' | 'delete';

/**
 * Account administration.
 *
 * Two things guard against the most damaging mistake here — an administrator
 * removing their own access, or the last one removing everyone's. Self-actions
 * are refused outright, and demoting the final remaining admin is blocked,
 * because a realm with no administrator can only be recovered from the
 * Keycloak console.
 */
@Component({
  selector: 'ot-users-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    SpinnerComponent,
    ModalComponent,
    AlertComponent,
    FilterBarComponent,
    SortHeaderComponent,
    RowLinkDirective,
  ],
  templateUrl: './users.page.html',
})
export class UsersPage {
  private readonly users = inject(UsersService);
  private readonly auth = inject(AuthService);

  readonly rows = signal<ManagedUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly working = signal(false);

  readonly search = signal('');
  readonly selected = signal<Record<string, string[]>>({ role: [], status: [] });
  readonly sort = createSort<SortKey>({ key: 'name', direction: 'asc' });

  readonly confirmOpen = signal(false);
  readonly target = signal<ManagedUser | null>(null);
  readonly action = signal<PendingAction>('promote');

  readonly facets = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'customer', label: 'Customer' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'enabled', label: 'Enabled' },
        { value: 'disabled', label: 'Disabled' },
      ],
    },
  ];

  /** Rows after search, facets and sorting — all applied together. */
  readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const roles = this.selected()['role'] ?? [];
    const statuses = this.selected()['status'] ?? [];

    const filtered = this.rows().filter((u) => {
      if (term) {
        const haystack = `${u.username} ${u.email} ${u.firstName} ${u.lastName}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (roles.length > 0) {
        const role = u.isAdmin ? 'admin' : 'customer';
        if (!roles.includes(role)) return false;
      }
      if (statuses.length > 0) {
        const status = u.enabled ? 'enabled' : 'disabled';
        if (!statuses.includes(status)) return false;
      }
      return true;
    });

    return sortRows(filtered, this.sort.state(), (u, key) => {
      switch (key) {
        case 'name':
          return `${u.firstName} ${u.lastName}`.trim() || u.username;
        case 'username':
          return u.username;
        case 'email':
          return u.email;
        case 'role':
          return u.isAdmin ? 'admin' : 'customer';
        case 'created':
          return u.createdTimestamp ?? 0;
      }
    });
  });

  readonly adminCount = computed(() => this.rows().filter((u) => u.isAdmin).length);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.list().subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.message(err, 'Could not load accounts from Keycloak.'));
        this.loading.set(false);
      },
    });
  }

  isSelf(user: ManagedUser): boolean {
    return this.auth.user()?.subject === user.id;
  }

  /**
   * Why an action is unavailable, or null when it is allowed.
   *
   * Returned as a sentence so the reason can be shown as a tooltip rather than
   * leaving a disabled button unexplained.
   */
  blockedReason(user: ManagedUser, action: PendingAction): string | null {
    if (this.isSelf(user)) {
      return action === 'delete'
        ? 'You cannot delete your own account.'
        : 'You cannot change your own role.';
    }
    if (action === 'demote' && user.isAdmin && this.adminCount() <= 1) {
      return 'This is the last administrator. Promote someone else first.';
    }
    return null;
  }

  start(user: ManagedUser, action: PendingAction): void {
    if (this.blockedReason(user, action)) {
      return;
    }
    this.target.set(user);
    this.action.set(action);
    this.confirmOpen.set(true);
  }

  confirmText(): string {
    const user = this.target();
    if (!user) return '';
    const who = user.username;
    switch (this.action()) {
      case 'promote':
        return `Give ${who} administrator access? They will be able to manage the store and other accounts.`;
      case 'demote':
        return `Remove administrator access from ${who}? They keep their customer account and order history.`;
      case 'delete':
        return `Delete ${who} permanently? This cannot be undone, and any orders keep referring to an account that no longer exists.`;
    }
  }

  confirm(): void {
    const user = this.target();
    if (!user) return;

    this.working.set(true);
    this.error.set(null);
    this.notice.set(null);

    const action = this.action();
    const request =
      action === 'promote'
        ? this.users.promote(user.id)
        : action === 'demote'
          ? this.users.demote(user.id)
          : this.users.remove(user.id);

    request.subscribe({
      next: () => {
        this.working.set(false);
        this.confirmOpen.set(false);
        this.notice.set(
          action === 'promote'
            ? `${user.username} is now an administrator.`
            : action === 'demote'
              ? `${user.username} is now a customer.`
              : `${user.username} was deleted.`,
        );
        this.load();
      },
      error: (err) => {
        this.working.set(false);
        this.confirmOpen.set(false);
        this.error.set(this.message(err, 'Keycloak refused the change.'));
      },
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.selected.set({ role: [], status: [] });
  }

  displayName(user: ManagedUser): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.username;
  }

  private message(err: unknown, fallback: string): string {
    const body = (err as { error?: { errorMessage?: string; error?: string } })?.error;
    return body?.errorMessage || body?.error || fallback;
  }
}
