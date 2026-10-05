import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RESUME_API_RETRY_COUNT } from '../injection-token/resume-api-retry-count.variable.ts';
import { RESUME_API_RETRY_DELAY_MS } from '../injection-token/resume-api-retry-delay-ms.variable.ts';
import { RESUME_API_RETRY_DELAY_MULTIPLIER } from '../injection-token/resume-api-retry-delay-multiplier.variable.ts';
import { RESUME_API_RETRY_JITTER_MS } from '../injection-token/resume-api-retry-jitter-ms.variable.ts';
import { RESUME_DATA_API_BASE_URL } from '../injection-token/resume-data-api-base-url.variable.ts';
import { resumeApiRetryInterceptor } from './resume-api-retry.interceptor.ts';

describe('resumeApiRetryInterceptor & Configuration Tokens', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function setupTestBed(providers: unknown[] = []): {
    http: HttpClient;
    httpMock: HttpTestingController;
  } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([resumeApiRetryInterceptor])),
        provideHttpClientTesting(),
        ...providers,
      ],
    });

    return {
      http: TestBed.inject(HttpClient),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  describe('default injection tokens', () => {
    it('provides expected default values for all configuration tokens', () => {
      setupTestBed();

      expect(TestBed.inject(RESUME_DATA_API_BASE_URL)).toBe('');
      expect(TestBed.inject(RESUME_API_RETRY_COUNT)).toBe(3);
      expect(TestBed.inject(RESUME_API_RETRY_DELAY_MS)).toBe(1000);
      expect(TestBed.inject(RESUME_API_RETRY_DELAY_MULTIPLIER)).toBe(2);
      expect(TestBed.inject(RESUME_API_RETRY_JITTER_MS)).toBe(0);
    });
  });

  describe('non-target requests passthrough', () => {
    it('passes through non-resume-data requests without retrying on 500 error', () => {
      const { http, httpMock } = setupTestBed();
      let capturedError: HttpErrorResponse | undefined;

      http.get('/api/v1/other').subscribe({
        error: (err: HttpErrorResponse) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/v1/other');
      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

      expect(capturedError?.status).toBe(500);
      // No retries scheduled
      vi.advanceTimersByTime(10000);
      httpMock.expectNone('/api/v1/other');
      httpMock.expectNone('/api/v1/other?retry=1');
      httpMock.verify();
    });

    it('passes through requests with different X-Api-Type header values without retrying', () => {
      const { http, httpMock } = setupTestBed();
      let capturedError: HttpErrorResponse | undefined;

      http
        .get('/api/v1/data', {
          headers: { 'X-Api-Type': 'analytics' },
        })
        .subscribe({
          error: (err: HttpErrorResponse) => {
            capturedError = err;
          },
        });

      const req = httpMock.expectOne('/api/v1/data');
      req.flush('Error', { status: 503, statusText: 'Service Unavailable' });

      expect(capturedError?.status).toBe(503);
      vi.advanceTimersByTime(10000);
      httpMock.expectNone('/api/v1/data?retry=1');
      httpMock.verify();
    });
  });

  describe('successful resume-data requests', () => {
    it('emits response directly when request succeeds on initial attempt', () => {
      const { http, httpMock } = setupTestBed();
      let responseBody: unknown;

      http
        .get('/api/v1/names', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe((res) => {
          responseBody = res;
        });

      const req = httpMock.expectOne('/api/v1/names');
      expect(req.request.headers.get('X-Api-Type')).toBe('resume-data');
      req.flush({ name: 'Nawaphon' });

      expect(responseBody).toEqual({ name: 'Nawaphon' });
      httpMock.verify();
    });
  });

  describe('retry with exponential backoff on 5xx failures', () => {
    it('retries with ?retry=1 and recovers when second attempt succeeds', () => {
      const { http, httpMock } = setupTestBed([
        { provide: RESUME_API_RETRY_DELAY_MS, useValue: 500 },
        { provide: RESUME_API_RETRY_DELAY_MULTIPLIER, useValue: 2 },
      ]);
      let responseBody: unknown;

      http
        .get('/api/v1/names', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe((res) => {
          responseBody = res;
        });

      // Attempt 0 (initial request without retry query parameter)
      const req0 = httpMock.expectOne('/api/v1/names');
      req0.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      // Before delay passes, no retry request yet
      vi.advanceTimersByTime(499);
      httpMock.expectNone('/api/v1/names?retry=1');

      // At 500ms delay: attempt 1 dispatched
      vi.advanceTimersByTime(1);
      const req1 = httpMock.expectOne('/api/v1/names?retry=1');
      expect(req1.request.headers.get('X-Api-Type')).toBe('resume-data');
      req1.flush({ name: 'Nawaphon' });

      expect(responseBody).toEqual({ name: 'Nawaphon' });
      httpMock.verify();
    });

    it('calculates exponential backoff delay correctly across multiple failed attempts', () => {
      const { http, httpMock } = setupTestBed([
        { provide: RESUME_API_RETRY_DELAY_MS, useValue: 100 },
        { provide: RESUME_API_RETRY_DELAY_MULTIPLIER, useValue: 3 },
        { provide: RESUME_API_RETRY_JITTER_MS, useValue: 10 },
      ]);
      let responseBody: unknown;

      http
        .get('/api/v1/titles', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe((res) => {
          responseBody = res;
        });

      // Attempt 0
      const req0 = httpMock.expectOne('/api/v1/titles');
      req0.flush('502 Bad Gateway', { status: 502, statusText: 'Bad Gateway' });

      // Delay 1: 100 * 3^0 + 10 = 110ms
      vi.advanceTimersByTime(109);
      httpMock.expectNone('/api/v1/titles?retry=1');
      vi.advanceTimersByTime(1);

      // Attempt 1 fails
      const req1 = httpMock.expectOne('/api/v1/titles?retry=1');
      req1.flush('503 Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

      // Delay 2: 100 * 3^1 + 10 = 310ms
      vi.advanceTimersByTime(309);
      httpMock.expectNone('/api/v1/titles?retry=2');
      vi.advanceTimersByTime(1);

      // Attempt 2 succeeds
      const req2 = httpMock.expectOne('/api/v1/titles?retry=2');
      req2.flush({ title: 'Software Engineer' });

      expect(responseBody).toEqual({ title: 'Software Engineer' });
      httpMock.verify();
    });
  });

  describe('retry on network error (status 0)', () => {
    it('retries when request fails with network error (status 0)', () => {
      const { http, httpMock } = setupTestBed([
        { provide: RESUME_API_RETRY_DELAY_MS, useValue: 200 },
        { provide: RESUME_API_RETRY_DELAY_MULTIPLIER, useValue: 2 },
      ]);
      let responseBody: unknown;

      http
        .get('/api/v1/summaries', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe((res) => {
          responseBody = res;
        });

      const req0 = httpMock.expectOne('/api/v1/summaries');
      req0.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      vi.advanceTimersByTime(200);
      const req1 = httpMock.expectOne('/api/v1/summaries?retry=1');
      req1.flush(['Summary item']);

      expect(responseBody).toEqual(['Summary item']);
      httpMock.verify();
    });
  });

  describe('exhaustion of retry attempts', () => {
    it('propagates error after exhausting configured RETRY_COUNT (default 3 retries, total 4 attempts)', () => {
      const { http, httpMock } = setupTestBed([
        { provide: RESUME_API_RETRY_DELAY_MS, useValue: 10 },
        { provide: RESUME_API_RETRY_DELAY_MULTIPLIER, useValue: 2 },
      ]);
      let capturedError: HttpErrorResponse | undefined;

      http
        .get('/api/v1/skills', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe({
          error: (err: HttpErrorResponse) => {
            capturedError = err;
          },
        });

      // Initial attempt (0)
      httpMock
        .expectOne('/api/v1/skills')
        .flush('500', { status: 500, statusText: 'Internal Server Error' });

      // Retry 1 (delay 10ms)
      vi.advanceTimersByTime(10);
      httpMock
        .expectOne('/api/v1/skills?retry=1')
        .flush('500', { status: 500, statusText: 'Internal Server Error' });

      // Retry 2 (delay 20ms)
      vi.advanceTimersByTime(20);
      httpMock
        .expectOne('/api/v1/skills?retry=2')
        .flush('500', { status: 500, statusText: 'Internal Server Error' });

      // Retry 3 (delay 40ms)
      vi.advanceTimersByTime(40);
      httpMock
        .expectOne('/api/v1/skills?retry=3')
        .flush('500', { status: 500, statusText: 'Internal Server Error' });

      // Error should now be delivered
      expect(capturedError?.status).toBe(500);

      // Verify no further retries
      vi.advanceTimersByTime(1000);
      httpMock.expectNone('/api/v1/skills?retry=4');
      httpMock.verify();
    });

    it('does not retry when RESUME_API_RETRY_COUNT is configured to 0', () => {
      const { http, httpMock } = setupTestBed([{ provide: RESUME_API_RETRY_COUNT, useValue: 0 }]);
      let capturedError: HttpErrorResponse | undefined;

      http
        .get('/api/v1/details', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe({
          error: (err: HttpErrorResponse) => {
            capturedError = err;
          },
        });

      const req0 = httpMock.expectOne('/api/v1/details');
      req0.flush('Server Error', { status: 500, statusText: 'Server Error' });

      expect(capturedError?.status).toBe(500);
      vi.advanceTimersByTime(10000);
      httpMock.expectNone('/api/v1/details?retry=1');
      httpMock.verify();
    });
  });

  describe('non-transient client errors (4xx)', () => {
    it('immediately fails without retry when receiving a 404 Not Found error', () => {
      const { http, httpMock } = setupTestBed();
      let capturedError: HttpErrorResponse | undefined;

      http
        .get('/api/v1/links', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe({
          error: (err: HttpErrorResponse) => {
            capturedError = err;
          },
        });

      const req0 = httpMock.expectOne('/api/v1/links');
      req0.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(capturedError?.status).toBe(404);
      vi.advanceTimersByTime(10000);
      httpMock.expectNone('/api/v1/links?retry=1');
      httpMock.verify();
    });

    it('immediately fails without retry when receiving a 400 Bad Request error', () => {
      const { http, httpMock } = setupTestBed();
      let capturedError: HttpErrorResponse | undefined;

      http
        .get('/api/v1/experiences', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe({
          error: (err: HttpErrorResponse) => {
            capturedError = err;
          },
        });

      const req0 = httpMock.expectOne('/api/v1/experiences');
      req0.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      expect(capturedError?.status).toBe(400);
      vi.advanceTimersByTime(10000);
      httpMock.expectNone('/api/v1/experiences?retry=1');
      httpMock.verify();
    });
  });

  describe('query parameters retention', () => {
    it('retains existing HttpParams when adding the retry query parameter', () => {
      const { http, httpMock } = setupTestBed([
        { provide: RESUME_API_RETRY_DELAY_MS, useValue: 50 },
      ]);

      http
        .get('/api/v1/educations', {
          params: { view: 'compact' },
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe();

      const req0 = httpMock.expectOne('/api/v1/educations?view=compact');
      req0.flush('Error', { status: 500, statusText: 'Internal Error' });

      vi.advanceTimersByTime(50);

      const req1 = httpMock.expectOne('/api/v1/educations?view=compact&retry=1');
      expect(req1.request.params.get('view')).toBe('compact');
      expect(req1.request.params.get('retry')).toBe('1');
      req1.flush({ school: 'University' });
      httpMock.verify();
    });

    it('correctly appends retry parameter when URL contains embedded query string', () => {
      const { http, httpMock } = setupTestBed([
        { provide: RESUME_API_RETRY_DELAY_MS, useValue: 50 },
      ]);

      http
        .get('/api/v1/educations?view=compact', {
          headers: { 'X-Api-Type': 'resume-data' },
        })
        .subscribe();

      const req0 = httpMock.expectOne('/api/v1/educations?view=compact');
      req0.flush('Error', { status: 500, statusText: 'Internal Error' });

      vi.advanceTimersByTime(50);

      const req1 = httpMock.expectOne('/api/v1/educations?view=compact&retry=1');
      expect(req1.request.urlWithParams).toBe('/api/v1/educations?view=compact&retry=1');
      expect(req1.request.params.get('retry')).toBe('1');
      req1.flush({ school: 'University' });
      httpMock.verify();
    });
  });
});
