/**
 * Types mirroring the FastAPI response schemas.
 *
 * Hand-written rather than generated so the admin only carries the fields it
 * actually renders. If the API changes shape, this file is the one place to
 * follow it.
 */

export interface Money {
  amount: number;
  currency: string;
  includes_tax?: boolean;
  original_amount?: number | null;
  tax_class?: string | null;
}

/** Mirrors the API's ItemStatus. Only `active` is visible to customers. */
export type ItemStatus = 'draft' | 'active' | 'archived';

export interface Item {
  uuid: string;
  sku: string;
  status: ItemStatus;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  brand?: string | null;
  categories: string[];
  price: Money;
  media?: { main_image?: string | null; gallery?: string[] };
  inventory?: {
    stock_quantity: number;
    stock_status: string;
    allow_backorder: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface PageInfo {
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface Paginated<T> {
  success: boolean;
  items: T[];
  page_info: PageInfo;
  message?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  on_hand: number;
  reserved: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  'draft' | 'pending_payment' | 'paid' | 'ready_to_ship' | 'shipped' | 'cancelled' | 'refunded';

export interface OrderSummary {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderList {
  orders: OrderSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface OrderItemLine {
  id: string;
  sku: string;
  quantity: number;
  unit_price: number;
}

export interface AdminOrderDetail {
  order: OrderSummary;
  items: OrderItemLine[];
  customer?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
  } | null;
  shipping_address?: {
    street: string;
    city: string;
    zip_code: string;
    country: string;
  } | null;
  payment?: { status: string; provider: string; amount: number } | null;
  shipment?: {
    carrier: string;
    tracking_number?: string | null;
    status: string;
  } | null;
}

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'completed';

export interface ReturnRequest {
  id: string;
  order_id: string;
  customer_id: string;
  status: ReturnStatus;
  reason: string;
  admin_note?: string | null;
  created_at: string;
  updated_at: string;
}
