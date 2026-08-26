import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';

interface ErrorReport {
  app: 'admin';
  name: string;
  message: string;
  stack?: string;
  path?: string;
  occurred_at: string;
}

/** Reports of the same error beyond this are dropped for the rest of the session. */
const MAX_PER_SIGNATURE = 3;

/** Hard ceiling per session, whatever the signatures. */
const MAX_PER_SESSION = 50;

/** Batched to this size before an eager flush. */
const BATCH_SIZE = 5;

/** Idle time before a partial batch is sent anyway, in milliseconds. */
const FLUSH_DELAY = 2000;

/** The API truncates too; this stops the browser sending needless kilobytes. */
const MAX_STACK_CHARS = 4000;

/**
 * Ships uncaught errors to the API.
 *
 * **It must never make things worse.** The failure mode being reported on is a
 * component throwing inside a render loop, which will call this as fast as the
 * browser can loop. So identical errors are reported at most three times per
 * session, there is a hard per-session ceiling, and a failing endpoint is
 * swallowed. A reporter that turns a render loop into a request loop has taken
 * a broken page and made it a broken page plus a hammered API.
 *
 * **Off by default.** Cloning this repository must not start sending anything
 * anywhere.
 *
 * Kept as a copy of the storefront's reporter rather than a shared package: two
 * Angular applications in separate repositories would need a published library
 * to share ~150 lines, and the versioning cost of that outweighs the
 * duplication. Any change here belongs in both.
 */
@Injectable({ providedIn: 'root' })
export class ErrorReportingService {
  private readonly router = inject(Router);
  private readonly config = environment.errorReporting;
  // Absolute: the admin UI is served by the Angular dev server and the API
  // lives on another origin, so a relative path would post to the wrong place.
  private readonly endpoint = `${environment.apiBaseUrl}${environment.errorReporting.endpoint}`;

  private readonly seen = new Map<string, number>();
  private queue: ErrorReport[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sessionTotal = 0;

  get enabled(): boolean {
    return this.config.enabled;
  }

  report(error: unknown): void {
    if (!this.enabled || this.sessionTotal >= MAX_PER_SESSION) {
      return;
    }

    const { name, message, stack } = this.describe(error);
    const signature = `${name}::${message}`;

    const count = (this.seen.get(signature) ?? 0) + 1;
    this.seen.set(signature, count);
    if (count > MAX_PER_SIGNATURE) {
      return;
    }

    this.sessionTotal++;
    this.queue.push({
      app: 'admin',
      name,
      message,
      stack: stack?.slice(0, MAX_STACK_CHARS),
      // Route only. The API strips query strings as well, but a token in a URL
      // should not travel to a request log on the way there.
      path: this.router.url.split(/[?#]/)[0],
      occurred_at: new Date().toISOString(),
    });

    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
      return;
    }
    this.timer ??= setTimeout(() => this.flush(), FLUSH_DELAY);
  }

  /** Anything can be thrown in JavaScript, so nothing here may assume a shape. */
  private describe(error: unknown): { name: string; message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        name: error.name || 'Error',
        message: (error.message || String(error)).slice(0, 500),
        stack: error.stack,
      };
    }
    if (typeof error === 'object' && error !== null) {
      const shaped = error as { name?: unknown; message?: unknown; stack?: unknown };
      return {
        name: typeof shaped.name === 'string' ? shaped.name.slice(0, 120) : 'UnknownError',
        message:
          typeof shaped.message === 'string'
            ? shaped.message.slice(0, 500)
            : safeStringify(error).slice(0, 500),
        stack: typeof shaped.stack === 'string' ? shaped.stack : undefined,
      };
    }
    return { name: 'UnknownError', message: String(error).slice(0, 500) };
  }

  private flush(beacon = false): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.queue.length === 0) {
      return;
    }

    const body = JSON.stringify({ errors: this.queue });
    this.queue = [];

    try {
      if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(this.endpoint, new Blob([body], { type: 'application/json' }));
        return;
      }
      void fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Silent by design. If reporting an error throws, saying so would mean
      // reporting that too.
    }
  }

  /** Send whatever is queued before the page goes away. */
  flushNow(): void {
    this.flush(true);
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Angular's global error handler.
 *
 * Still logs to the console. Swallowing that would take away the thing a
 * developer looks at first, in exchange for a report they cannot see locally.
 */
@Injectable()
export class TelemetryErrorHandler implements ErrorHandler {
  private readonly reporter = inject(ErrorReportingService);

  handleError(error: unknown): void {
    try {
      this.reporter.report(error);
    } catch {
      // Never let reporting mask the original error.
    }
    console.error(error);
  }
}
