import { Pipe, PipeTransform } from '@angular/core';

/**
 * Render an integer minor-unit amount as currency.
 *
 * The API stores money in minor units (cents) to avoid float rounding, so
 * every screen would otherwise divide by 100 by hand and eventually one would
 * forget.
 */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(minorUnits: number | null | undefined, currency = 'EUR'): string {
    if (minorUnits === null || minorUnits === undefined) {
      return '—';
    }
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(minorUnits / 100);
  }
}
