import { createSort, sortRows } from './sort';

describe('createSort', () => {
  it('starts on the column it was given', () => {
    const sort = createSort<'name' | 'age'>({ key: 'name', direction: 'asc' });
    expect(sort.state()).toEqual({ key: 'name', direction: 'asc' });
  });

  it('flips direction when the active column is clicked again', () => {
    const sort = createSort<'name'>({ key: 'name', direction: 'asc' });
    sort.toggle('name');
    expect(sort.state().direction).toBe('desc');
    sort.toggle('name');
    expect(sort.state().direction).toBe('asc');
  });

  it('moves to a new column ascending', () => {
    // Carrying the previous descending direction over to a different column
    // surprises people; a fresh column starts at the top.
    const sort = createSort<'name' | 'age'>({ key: 'name', direction: 'desc' });
    sort.toggle('age');
    expect(sort.state()).toEqual({ key: 'age', direction: 'asc' });
  });
});

describe('sortRows', () => {
  const rows = [
    { sku: 'B', qty: 10 },
    { sku: 'a', qty: 2 },
    { sku: 'C', qty: null as number | null },
  ];
  const accessor = (row: (typeof rows)[number], key: string) => (key === 'sku' ? row.sku : row.qty);

  it('sorts strings case-insensitively', () => {
    const out = sortRows(rows, { key: 'sku', direction: 'asc' }, accessor);
    expect(out.map((r) => r.sku)).toEqual(['a', 'B', 'C']);
  });

  it('sorts numbers numerically, not lexically', () => {
    const numbers = [{ n: 9 }, { n: 100 }, { n: 20 }];
    const out = sortRows(numbers, { key: 'n', direction: 'asc' }, (r) => r.n);
    expect(out.map((r) => r.n)).toEqual([9, 20, 100]);
  });

  it('reverses on descending', () => {
    const out = sortRows(rows, { key: 'sku', direction: 'desc' }, accessor);
    expect(out.map((r) => r.sku)).toEqual(['C', 'B', 'a']);
  });

  it('keeps missing values last in both directions', () => {
    // A blank is absent, not "smallest" - burying real data under it on one
    // direction is exactly what people do not want.
    const asc = sortRows(rows, { key: 'qty', direction: 'asc' }, accessor);
    const desc = sortRows(rows, { key: 'qty', direction: 'desc' }, accessor);
    expect(asc.at(-1)!.sku).toBe('C');
    expect(desc.at(-1)!.sku).toBe('C');
  });

  it('does not mutate the source array', () => {
    const original = [...rows];
    sortRows(rows, { key: 'sku', direction: 'desc' }, accessor);
    expect(rows).toEqual(original);
  });
});
