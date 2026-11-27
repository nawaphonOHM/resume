import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, timer } from 'rxjs';

import { RESUME_API_RETRY_COUNT } from '../injection-token/resume-api-retry-count.variable.ts';
import { RESUME_API_RETRY_DELAY_MS } from '../injection-token/resume-api-retry-delay-ms.variable.ts';
import { RESUME_API_RETRY_DELAY_MULTIPLIER } from '../injection-token/resume-api-retry-delay-multiplier.variable.ts';
import { RESUME_API_RETRY_JITTER_MS } from '../injection-token/resume-api-retry-jitter-ms.variable.ts';

/**
 * Checks whether an error is transient and eligible for retry.
 *
 * @remarks
 * HTTP network failures and 5xx responses are transient; non-HTTP errors are also retried because
 * they do not carry a reliable HTTP status that can rule out a temporary failure.
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }
  return true;
}

/**
 * HTTP interceptor that targets `X-Api-Type: resume-data` requests and retries transient failures
 * with exponential backoff and `?retry={attempt}` cache-busting query parameters.
 */
export const resumeApiRetryInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (req.headers.get('x-api-type')?.toLowerCase() !== 'resume-data') {
    return next(req);
  }

  const retryCount = inject(RESUME_API_RETRY_COUNT);
  const retryDelayMs = inject(RESUME_API_RETRY_DELAY_MS);
  const retryDelayMultiplier = inject(RESUME_API_RETRY_DELAY_MULTIPLIER);
  const retryJitterMs = inject(RESUME_API_RETRY_JITTER_MS);

  const maxRetries = Math.max(0, retryCount);

  const executeAttempt = (attempt: number): Observable<HttpEvent<unknown>> => {
    const currentReq =
      attempt === 0
        ? req
        : req.clone({
            // Distinguish each retry so intermediary caches do not replay a failed response.
            params: req.params.set('retry', String(attempt)),
          });

    return next(currentReq).pipe(
      catchError((error: unknown) => {
        if (!isTransientError(error) || attempt >= maxRetries) {
          return throwError(() => error);
        }

        const nextAttempt = attempt + 1;
        // delay = base × multiplier^(nextAttempt - 1) + jitter; retry attempts are one-based here.
        const delay = retryDelayMs * retryDelayMultiplier ** (nextAttempt - 1) + retryJitterMs;

        // Re-enter with the incremented attempt after the backoff timer expires.
        return timer(Math.max(0, delay)).pipe(switchMap(() => executeAttempt(nextAttempt)));
      }),
    );
  };

  return executeAttempt(0);
};
