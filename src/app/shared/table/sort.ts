import { signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string = string> {
  key: K;
  direction: SortDirection;
}

/**
 * Sorting state shared by every table in the application.
 *
 * Clicking the active column flips direction; clicking a different one moves
 * to it and starts ascending. That is what people expect, and doing it in one
 * place means no table invents its own rule.
 */
export function createSort<K extends string>(initial: SortState<K>) {
  const state = signal<SortState<K>>(initial);

  function toggle(key: K): void {
    state.update((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }

  return { state: state.asReadonly(), toggle };
}

/**
 * Sort rows by a caller-supplied accessor.
 *
 * Returns a new array rather than sorting in place, so a signal holding the
 * source list is not mutated behind Angular's back.
 *
 * Nullish values always sort last regardless of direction — a missing value is
 * not "smallest", it is absent, and burying it under real data on one of the
 * two directions is what people actually want.
 */
export function sortRows<T, K extends string>(
  rows: readonly T[],
  sort: SortState<K>,
  accessor: (row: T, key: K) => string | number | null | undefined,
): T[] {
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = accessor(a, sort.key);
    const right = accessor(b, sort.key);

    const leftMissing = left === null || left === undefined || left === '';
    const rightMissing = right === null || right === undefined || right === '';
    if (leftMissing && rightMissing) return 0;
    if (leftMissing) return 1;
    if (rightMissing) return -1;

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * factor;
    }
    return (
      String(left).localeCompare(String(right), undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * factor
    );
  });
}
