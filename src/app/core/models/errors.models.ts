/**
 * Frontend error reports, from `/v1/admin/telemetry/errors`.
 *
 * Grouped by application, error class and message — one bug produces thousands
 * of identical rows, and grouping by stack would split a single fault reached
 * from two routes into two bugs.
 */

export interface ErrorGroup {
  app: string;
  name: string;
  message: string;
  occurrences: number;
  /** Distinct routes this error happened on. Spread, where a stack cannot show it. */
  affected_paths: number;
  /** Coarse family and major version. Never a raw user agent. */
  browsers: string[];
  first_seen: string;
  last_seen: string;
  sample_stack: string | null;
}

export interface FrontendErrors {
  /** False when the deployment is not collecting. Distinct from "no errors". */
  enabled: boolean;
  total_occurrences: number;
  groups: ErrorGroup[];
}
