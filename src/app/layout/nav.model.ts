/** One entry in the side navigation. */
export interface NavItem {
  label: string;
  path: string;
  /** Inline SVG path data, so no icon font or network request is needed. */
  icon: string;
  description: string;
}

/**
 * The side navigation, in the order an administrator works through the day:
 * what the shop offers, whether it can be sold, what has been bought, and what
 * is coming back.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    description: 'Overview',
    icon: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z',
  },
  {
    label: 'Products',
    path: '/products',
    description: 'What customers can see and buy',
    icon: 'M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    label: 'Inventory',
    path: '/inventory',
    description: 'Stock levels per SKU',
    icon: 'M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0-2.5 6.5a1 1 0 0 1-.94.5H7.44a1 1 0 0 1-.94-.5L4 13m16 0H4',
  },
  {
    label: 'Orders',
    path: '/orders',
    description: 'Fulfilment and status',
    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4',
  },
  {
    label: 'Returns',
    path: '/returns',
    description: 'RMA requests',
    icon: 'M9 15 4 10l5-5m-5 5h10a6 6 0 0 1 0 12h-3',
  },
  {
    label: 'Users',
    path: '/users',
    description: 'Accounts and admin access',
    icon: 'M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H2v-2a4 4 0 0 1 3-3.87m0 0a4 4 0 1 1 8 0m-8 0h8m4-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  },
] as const;
