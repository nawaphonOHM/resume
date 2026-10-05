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
 * Checks whether an HTTP error is transient and eligible for retry (network error or 5xx server error).
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }
  return true;
}

/**
 * HTTP interceptor that targets requests with `X-Api-Type: resume-data` and executes
 * retries with exponential backoff and `?retry={attempt}` query parameters upon network or 5xx failures.
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
            params: req.params.set('retry', String(attempt)),
          });

    return next(currentReq).pipe(
      catchError((error: unknown) => {
        if (!isTransientError(error) || attempt >= maxRetries) {
          return throwError(() => error);
        }

        const nextAttempt = attempt + 1;
        const delay = retryDelayMs * retryDelayMultiplier ** (nextAttempt - 1) + retryJitterMs;

        return timer(Math.max(0, delay)).pipe(switchMap(() => executeAttempt(nextAttempt)));
      }),
    );
  };

  return executeAttempt(0);
};
