import { ChartConfiguration } from 'chart.js';

/**
 * Shared chart styling.
 *
 * Kept beside the wrapper rather than repeated per page so every chart in the
 * back office reads the same way, and so the money formatter is defined once —
 * amounts arrive in minor units and dividing by 100 in each chart is exactly
 * how one of them ends up a hundred times too large.
 */

const INK = '#334155';
const INK_SUBTLE = '#94a3b8';
const LINE = '#e2e8f0';

export const BRAND = '#2563eb';
export const BRAND_SOFT = 'rgba(37, 99, 235, 0.12)';
export const DANGER = '#dc2626';
export const MUTED = '#94a3b8';

/** Format an integer minor-unit amount for an axis or tooltip. */
export function formatMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minorUnits / 100);
}

/** Axis and tooltip defaults shared by every chart on the analytics page. */
export function baseOptions(currency: string): ChartConfiguration['options'] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: INK, boxWidth: 12, boxHeight: 12, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            const isMoney = /revenue/i.test(context.dataset.label ?? '');
            return `${context.dataset.label}: ${isMoney ? formatMoney(value, currency) : value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: INK_SUBTLE, maxRotation: 0, autoSkipPadding: 16 },
      },
      y: {
        beginAtZero: true,
        grid: { color: LINE },
        ticks: {
          color: INK_SUBTLE,
          callback: (value) => formatMoney(Number(value), currency),
        },
      },
    },
  };
}
