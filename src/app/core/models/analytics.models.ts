/**
 * Analytics API types, mirroring `/v1/admin/analytics`.
 *
 * Two conventions carried over from the API and worth not undoing here:
 *
 * **Money is integer minor units.** Render with `MoneyPipe`; never divide by
 * 100 by hand.
 *
 * **Money is grouped by currency.** The API returns a list keyed by currency
 * because `orders.currency` permits several and a cross-currency total means
 * nothing. Adding these together in the UI would reintroduce exactly the bug
 * the API shape exists to prevent.
 */

export interface PeriodInfo {
  start: string;
  end: string;
  timezone: string;
  days: number;
}

/**
 * Movement against the previous period.
 *
 * Every field is nullable: change from a baseline of zero is undefined, not
 * infinite and not 100%. Render null as "no prior data", never as a number.
 */
export interface AnalyticsChange {
  net_revenue_pct: number | null;
  gross_revenue_pct: number | null;
  orders_pct: number | null;
  units_pct: number | null;
  average_order_value_pct: number | null;
}

export interface CurrencyTotalsPrevious {
  gross_revenue: number;
  refunded_revenue: number;
  net_revenue: number;
  orders: number;
  units: number;
  average_order_value: number;
}

export interface CurrencyTotals {
  currency: string;
  gross_revenue: number;
  refunded_revenue: number;
  net_revenue: number;
  orders: number;
  units: number;
  average_order_value: number;
  previous: CurrencyTotalsPrevious | null;
  change: AnalyticsChange | null;
}

export interface AnalyticsSummary {
  period: PeriodInfo;
  previous_period: PeriodInfo;
  currencies: CurrencyTotals[];
}

export interface SeriesPoint {
  bucket: string;
  gross_revenue: number;
  refunded_revenue: number;
  net_revenue: number;
  orders: number;
  units: number;
}

export interface CurrencySeries {
  currency: string;
  points: SeriesPoint[];
}

export interface AnalyticsTimeseries {
  period: PeriodInfo;
  interval: string;
  series: CurrencySeries[];
}

export interface ProductPerformance {
  sku: string;
  name: string | null;
  currency: string;
  units_sold: number;
  gross_revenue: number;
  orders: number;
  /**
   * Orders containing this SKU where a return was raised. Returns are recorded
   * per order, so this attributes one return to every SKU on that order — an
   * upper bound per SKU, not a per-item rate.
   */
  orders_with_return: number;
  return_rate: number | null;
}

export interface NeverSoldItem {
  sku: string;
  name: string;
  status: string;
  on_hand: number | null;
}

export interface AnalyticsProducts {
  period: PeriodInfo;
  sort: string;
  products: ProductPerformance[];
  never_sold: NeverSoldItem[];
}

export interface FunnelStep {
  step: string;
  label: string;
  orders: number;
  conversion_from_start: number | null;
  drop_off_from_previous: number | null;
}

/**
 * Where orders stop.
 *
 * An **order** funnel, not a visitor funnel: it begins at order creation and
 * cannot see shoppers who browsed without ordering. Label it accordingly —
 * calling this "conversion" would promise something it does not measure.
 */
export interface AnalyticsFunnel {
  period: PeriodInfo;
  steps: FunnelStep[];
  never_checked_out: number;
  payment_failed: number;
  payment_unresolved: number;
  cancelled: number;
}

export type SeriesInterval = 'day' | 'week' | 'month';
export type ProductSort = 'revenue' | 'units' | 'orders' | 'return_rate';

/** A selectable reporting window, as inclusive calendar dates. */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * The shopper journey, from arriving at the shop to a paid order.
 *
 * **The pre-order steps are a floor, not a count.** Blocked scripts, a tab
 * closed before the batch flushed and disabled JavaScript all lose events. The
 * `paid` step is read from the orders table and is exact. Present them
 * differently — a funnel whose first step undercounts and whose last does not
 * will overstate conversion, and a reader deserves to know which end is soft.
 */
export interface StorefrontStep {
  step: string;
  label: string;
  sessions: number;
  conversion_from_start: number | null;
  drop_off_from_previous: number | null;
}

export interface PathViews {
  path: string;
  views: number;
  sessions: number;
}

export interface ProductInterest {
  sku: string;
  name: string | null;
  sessions_viewed: number;
  sessions_added: number;
  /** Sessions that added divided by sessions that viewed. Null when unviewed. */
  add_to_cart_rate: number | null;
}

export interface AnalyticsStorefront {
  period: PeriodInfo;
  /** False when the deployment is not collecting. Distinct from "no visitors". */
  enabled: boolean;
  page_views: number;
  steps: StorefrontStep[];
  top_paths: PathViews[];
  product_interest: ProductInterest[];
}
