import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CatalogueService } from '../../core/api/catalogue.service';
import { FilterBarComponent } from '../../shared/filters/filter-bar';
import { RowLinkDirective, SortHeaderComponent, createSort, sortRows } from '../../shared/table';
import { Item, ItemStatus } from '../../core/models/api.models';
import {
  AlertComponent,
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  ModalComponent,
  MoneyPipe,
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
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    SpinnerComponent,
    ModalComponent,
    AlertComponent,
    MoneyPipe,
    FilterBarComponent,
    SortHeaderComponent,
    RowLinkDirective,
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

  /** File chosen in the form, uploaded after the item itself is saved. */
  readonly pendingImage = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);

  readonly search = signal('');
  readonly selected = signal<Record<string, string[]>>({ status: [] });
  readonly sort = createSort<'name' | 'sku' | 'status' | 'price'>({
    key: 'name',
    direction: 'asc',
  });

  readonly facets = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
      ],
    },
  ];

  /** Search, facets and sorting applied together. */
  readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.selected()['status'] ?? [];

    const filtered = this.items().filter((item) => {
      if (term) {
        const haystack = `${item.name} ${item.sku} ${item.brand ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (statuses.length > 0 && !statuses.includes(item.status)) return false;
      return true;
    });

    return sortRows(filtered, this.sort.state(), (item, key) => {
      switch (key) {
        case 'name':
          return item.name;
        case 'sku':
          return item.sku;
        case 'status':
          return item.status;
        case 'price':
          return item.price?.amount ?? 0;
      }
    });
  });

  clearFilters(): void {
    this.search.set('');
    this.selected.set({ status: [] });
  }

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

  imageUrl(item: Item): string | null {
    return this.catalogue.imageUrl(item);
  }

  pickImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.pendingImage.set(file);

    // Show the chosen file straight away rather than after a round trip, so
    // the operator can see they picked the right picture.
    const previous = this.imagePreview();
    if (previous?.startsWith('blob:')) {
      URL.revokeObjectURL(previous);
    }
    this.imagePreview.set(file ? URL.createObjectURL(file) : null);
  }

  private clearPendingImage(): void {
    const preview = this.imagePreview();
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    this.pendingImage.set(null);
    this.imagePreview.set(null);
  }

  openCreate(): void {
    this.editing.set(null);
    this.clearPendingImage();
    this.form.reset({ status: 'active', currency: 'EUR', amount: 0 });
    this.formOpen.set(true);
  }

  openEdit(item: Item): void {
    this.editing.set(item);
    this.clearPendingImage();
    this.imagePreview.set(this.catalogue.imageUrl(item));
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
      next: (saved) => {
        const image = this.pendingImage();
        if (!image) {
          this.finishSave();
          return;
        }
        // The image can only be attached once the item exists, so it follows
        // the save rather than riding along with it.
        this.catalogue.uploadImage(saved.uuid, image).subscribe({
          next: () => this.finishSave(),
          error: (err) => {
            this.saving.set(false);
            this.formOpen.set(false);
            this.load();
            // The product itself saved; say so, rather than implying it did not.
            this.error.set(
              this.message(err, 'The product was saved, but the image could not be uploaded.'),
            );
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.message(err, 'Saving the product failed.'));
      },
    });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.formOpen.set(false);
    this.clearPendingImage();
    this.load();
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
