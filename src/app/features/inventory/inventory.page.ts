import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InventoryService } from '../../core/api/inventory.service';
import { FilterBarComponent } from '../../shared/filters/filter-bar';
import { SortHeaderComponent, createSort, sortRows } from '../../shared/table';
import { InventoryItem } from '../../core/models/api.models';
import {
  AlertComponent,
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  SpinnerComponent,
} from '../../shared/ui';

/**
 * Stock levels.
 *
 * `available` (on_hand − reserved) is what a customer can actually buy, so it
 * is shown as its own column rather than leaving the operator to subtract.
 * `reserved` is owned by the checkout flow and is never editable here.
 */
@Component({
  selector: 'ot-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    SpinnerComponent,
    AlertComponent,
    FilterBarComponent,
    SortHeaderComponent,
  ],
  templateUrl: './inventory.page.html',
})
export class InventoryPage {
  private readonly inventory = inject(InventoryService);

  readonly rows = signal<InventoryItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);
  readonly drafts = signal<Record<string, number>>({});

  newSku = '';
  newOnHand = 0;

  readonly search = signal('');
  readonly selected = signal<Record<string, string[]>>({ level: [] });
  readonly sort = createSort<'sku' | 'level' | 'on_hand' | 'reserved' | 'available'>({
    key: 'sku',
    direction: 'asc',
  });

  readonly facets = [
    {
      key: 'level',
      label: 'Stock level',
      options: [
        { value: 'danger', label: 'Out of stock' },
        { value: 'warn', label: 'Low' },
        { value: 'ok', label: 'In stock' },
      ],
    },
  ];

  readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const levels = this.selected()['level'] ?? [];

    const filtered = this.rows().filter((row) => {
      if (term && !row.sku.toLowerCase().includes(term)) return false;
      if (levels.length > 0 && !levels.includes(this.tone(row))) return false;
      return true;
    });

    return sortRows(filtered, this.sort.state(), (row, key) => {
      switch (key) {
        case 'sku':
          return row.sku;
        case 'level':
          return this.available(row);
        case 'on_hand':
          return row.on_hand;
        case 'reserved':
          return row.reserved;
        case 'available':
          return this.available(row);
      }
    });
  });

  clearFilters(): void {
    this.search.set('');
    this.selected.set({ level: [] });
  }

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.inventory.list(0, 100).subscribe({
      next: (page) => {
        this.rows.set(page.items ?? []);
        this.drafts.set(Object.fromEntries((page.items ?? []).map((r) => [r.id, r.on_hand])));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.message(err, 'Could not load stock levels.'));
        this.loading.set(false);
      },
    });
  }

  available(row: InventoryItem): number {
    return Math.max(0, row.on_hand - row.reserved);
  }

  tone(row: InventoryItem): 'ok' | 'warn' | 'danger' {
    const available = this.available(row);
    if (available === 0) return 'danger';
    if (available <= 5) return 'warn';
    return 'ok';
  }

  label(row: InventoryItem): string {
    const available = this.available(row);
    if (available === 0) return 'out of stock';
    if (available <= 5) return 'low';
    return 'in stock';
  }

  setDraft(id: string, value: string): void {
    this.drafts.update((d) => ({ ...d, [id]: Number(value) }));
  }

  isDirty(row: InventoryItem): boolean {
    return this.drafts()[row.id] !== row.on_hand;
  }

  save(row: InventoryItem): void {
    const next = this.drafts()[row.id];
    this.savingId.set(row.id);
    this.error.set(null);
    this.notice.set(null);
    this.inventory.updateStock(row.id, next).subscribe({
      next: () => {
        this.savingId.set(null);
        this.notice.set(`Stock for ${row.sku} set to ${next}.`);
        this.load();
      },
      error: (err) => {
        this.savingId.set(null);
        // The API refuses on_hand below what is currently reserved; surfacing
        // its message explains that far better than a generic failure would.
        this.error.set(this.message(err, 'Updating stock failed.'));
      },
    });
  }

  create(): void {
    if (!this.newSku.trim()) {
      return;
    }
    this.error.set(null);
    this.inventory.create(this.newSku.trim(), this.newOnHand).subscribe({
      next: () => {
        this.notice.set(`Tracking stock for ${this.newSku}.`);
        this.newSku = '';
        this.newOnHand = 0;
        this.load();
      },
      error: (err) => this.error.set(this.message(err, 'Could not add the SKU.')),
    });
  }

  private message(err: unknown, fallback: string): string {
    const detail = (err as { error?: { message?: string } })?.error?.message;
    return detail || fallback;
  }
}
