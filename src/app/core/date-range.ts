import { DateRange } from './models/analytics.models';

/**
 * Reporting window helpers.
 *
 * Deliberately their own module rather than exports of the analytics page.
 * The dashboard needs `rangeEndingToday` too, and importing it from a page
 * component pulls that component — and through it Chart.js — into the
 * dashboard's dependency graph, so a screen with no charts would pay to
 * download a charting library.
 */

/**
 * Local calendar date as `YYYY-MM-DD`, which is what the API expects.
 *
 * Built from local parts rather than `toISOString()`: the latter converts to
 * UTC first, so just after midnight in any timezone ahead of UTC it reports
 * yesterday, and the operator sees a window shifted by a day.
 */
export function isoDate(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The inclusive window ending today, `days` long. */
export function rangeEndingToday(days: number, today = new Date()): DateRange {
  const start = new Date(today);
  // Inclusive of both ends, so a 7 day window spans today and the six before.
  start.setDate(start.getDate() - (days - 1));
  return { from: isoDate(start), to: isoDate(today) };
}
