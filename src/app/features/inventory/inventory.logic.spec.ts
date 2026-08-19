import { InventoryItem } from '../../core/models/api.models';

/**
 * Available stock is what a customer can actually buy, and the whole inventory
 * screen is read through it. Kept as pure functions so the rules can be tested
 * without standing up a component.
 */
export function available(row: Pick<InventoryItem, 'on_hand' | 'reserved'>): number {
  return Math.max(0, row.on_hand - row.reserved);
}

export function stockTone(
  row: Pick<InventoryItem, 'on_hand' | 'reserved'>,
): 'ok' | 'warn' | 'danger' {
  const value = available(row);
  if (value === 0) return 'danger';
  if (value <= 5) return 'warn';
  return 'ok';
}

describe('inventory stock rules', () => {
  it('subtracts reserved units from on hand', () => {
    expect(available({ on_hand: 20, reserved: 10 })).toBe(10);
  });

  it('never reports negative availability', () => {
    // Over-reservation is a data problem, not a reason to render "-3".
    expect(available({ on_hand: 2, reserved: 5 })).toBe(0);
  });

  it('flags nothing available as danger', () => {
    expect(stockTone({ on_hand: 10, reserved: 10 })).toBe('danger');
  });

  it('flags a low remainder as a warning', () => {
    expect(stockTone({ on_hand: 5, reserved: 0 })).toBe('warn');
  });

  it('treats healthy stock as ok', () => {
    expect(stockTone({ on_hand: 40, reserved: 4 })).toBe('ok');
  });

  it('counts fully reserved stock as unavailable even when on hand is high', () => {
    // on_hand alone looks healthy here; only availability tells the truth.
    expect(stockTone({ on_hand: 100, reserved: 100 })).toBe('danger');
  });
});
