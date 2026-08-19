import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CatalogueService } from '../../core/api/catalogue.service';
import { Item, ItemStatus } from '../../core/models/api.models';
import {
  AlertComponent,
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  ModalComponent,
  MoneyPipe,
  PageHeaderComponent,
  SpinnerComponent,
} from '../../shared/ui';

/**
 * The catalogue: what customers can see and buy.
 *
 * Status is the lever that matters here — an inactive product disappears from
 * the storefront without being deleted, which is what an operator normally
 * wants when something is temporarily unavailable.
 */
@Component({
  selector: 'ot-products-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    SpinnerComponent,
    ModalComponent,
    AlertComponent,
    MoneyPipe,
  ],
  templateUrl: './products.page.html',
})
export class ProductsPage {
  private readonly catalogue = inject(CatalogueService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<Item | null>(null);

  readonly form = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.maxLength(200)]],
    brand: ['', [Validators.required]],
    status: ['active' as ItemStatus, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    currency: ['EUR', [Validators.required]],
    short_description: [''],
    description: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalogue.list(0, 100).subscribe({
      next: (page) => {
        this.items.set(page.items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.message(err, 'Could not load the catalogue.'));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ status: 'active', currency: 'EUR', amount: 0 });
    this.formOpen.set(true);
  }

  openEdit(item: Item): void {
    this.editing.set(item);
    this.form.reset({
      sku: item.sku,
      name: item.name,
      slug: item.slug,
      brand: item.brand ?? '',
      status: item.status,
      amount: item.price?.amount ?? 0,
      currency: item.price?.currency ?? 'EUR',
      short_description: item.short_description ?? '',
      description: item.description ?? '',
    });
    this.formOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const existing = this.editing();

    // SKU is the catalogue's stable identifier and is not editable after
    // creation — orders hold a price snapshot keyed by it.
    const payload: Record<string, unknown> = {
      name: v.name,
      slug: v.slug,
      brand: v.brand,
      status: v.status,
      short_description: v.short_description || null,
      description: v.description || null,
      price: { amount: v.amount, currency: v.currency, includes_tax: true },
    };

    const request = existing
      ? this.catalogue.update(existing.uuid, payload as Partial<Item>)
      : this.catalogue.create({
          ...payload,
          sku: v.sku,
          categories: [],
        } as Partial<Item>);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.message(err, 'Saving the product failed.'));
      },
    });
  }

  remove(item: Item): void {
    if (!confirm(`Delete “${item.name}”? Customers will no longer see it.`)) {
      return;
    }
    this.catalogue.remove(item.uuid).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(this.message(err, 'Deleting failed.')),
    });
  }

  /**
   * Only `active` products reach the storefront; draft and archived are both
   * hidden, so they read as "not live" rather than as errors.
   */
  toneFor(status: ItemStatus): 'ok' | 'neutral' | 'warn' {
    if (status === 'active') return 'ok';
    if (status === 'draft') return 'warn';
    return 'neutral';
  }

  private message(err: unknown, fallback: string): string {
    const detail = (err as { error?: { message?: string } })?.error?.message;
    return detail || fallback;
  }
}
