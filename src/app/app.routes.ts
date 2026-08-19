import { Routes } from '@angular/router';

import { adminGuard } from './core/auth/admin.guard';
import { ShellComponent } from './layout/shell';

/**
 * Feature screens are lazy-loaded so the initial bundle carries only the shell
 * and whatever the operator actually opens.
 */
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · OpenTaberna Admin',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'products',
        title: 'Products · OpenTaberna Admin',
        loadComponent: () =>
          import('./features/products/products.page').then((m) => m.ProductsPage),
      },
      {
        path: 'inventory',
        title: 'Inventory · OpenTaberna Admin',
        loadComponent: () =>
          import('./features/inventory/inventory.page').then((m) => m.InventoryPage),
      },
      {
        path: 'orders',
        title: 'Orders · OpenTaberna Admin',
        loadComponent: () => import('./features/orders/orders.page').then((m) => m.OrdersPage),
      },
      {
        path: 'returns',
        title: 'Returns · OpenTaberna Admin',
        loadComponent: () => import('./features/returns/returns.page').then((m) => m.ReturnsPage),
      },
    ],
  },
  {
    // Outside the shell: a non-admin should not see navigation to screens they
    // cannot use.
    path: 'forbidden',
    title: 'No access · OpenTaberna Admin',
    loadComponent: () => import('./features/forbidden.page').then((m) => m.ForbiddenPage),
  },
  { path: '**', redirectTo: '' },
];
