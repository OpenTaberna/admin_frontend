import { NAV_ITEMS } from './nav.model';

describe('side navigation', () => {
  it('exposes the five administration areas', () => {
    expect(NAV_ITEMS.map((i) => i.path)).toEqual([
      '/dashboard',
      '/products',
      '/inventory',
      '/orders',
      '/returns',
    ]);
  });

  it('gives every entry a label, icon and description', () => {
    // The description is the second line in the sidenav; a missing one leaves
    // a visibly ragged item rather than failing loudly.
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('uses absolute paths so links work from any route', () => {
    for (const item of NAV_ITEMS) {
      expect(item.path.startsWith('/')).toBe(true);
    }
  });
});
