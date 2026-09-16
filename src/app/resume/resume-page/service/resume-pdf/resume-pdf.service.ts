import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { PLATFORM_ID, inject, Service, signal, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RESUME_PDF_DOWNLOAD_URL } from '../../../../helper/injection-token/resume-pdf-download-url.variable.ts';
import { RESUME_PDF_FILENAME } from '../../../../helper/injection-token/resume-pdf-filename.variable.ts';
import type { DownloadProgressCallback } from '../../../../helper/type/download-progress-callback.type.ts';

/**
 * Streams and downloads the canonical hosted résumé PDF asset with live progress tracking.
 *
 * @remarks
 * ### Download Pipeline Architecture
 * Coordinates remote PDF asset delivery through a 3-stage lifecycle:
 * 1. **Availability Verification**: Asynchronously executes an HTTP `HEAD` request to verify that the
 *    hosted PDF asset is reachable and returns an HTTP 2xx status.
 * 2. **Event-Driven Progress Streaming**: Downloads the asset via `HttpClient.get` with `reportDownloadProgress: true`
 *    and `observe: 'events'`, calculating percentage completion from transfer bytes.
 * 3. **Blob Lifecycle & Trigger**: Converts the received `Blob` into a temporary Object URL, triggers a native
 *    browser download via a synthetic `<a download>` click, and immediately revokes the URL in a `finally` block
 *    to prevent memory leaks.
 */
@Service()
export class ResumePdfService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly downloadUrl = inject(RESUME_PDF_DOWNLOAD_URL);
  private readonly filename = inject(RESUME_PDF_FILENAME);
  private readonly view = isPlatformBrowser(this.platformId) ? this.document.defaultView : null;

  private readonly _isAvailable = signal<boolean | null>(null);

  /** Reactive state indicating remote PDF availability: null = checking, true = 2xx OK, false = unavailable. */
  readonly isAvailable: Signal<boolean | null> = this._isAvailable.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.checkAvailability();
    }
  }

  /**
   * Executes HEAD request to check whether the download asset returns a 2xx response.
   *
   * @returns A promise resolving to `true` if the remote asset returns HTTP 2xx, or `false` otherwise.
   *
   * @remarks
   * Issues a lightweight `HEAD` request to avoid downloading binary content during pre-flight checks.
   * Sets `_isAvailable` signal to `true` (available), `false` (missing or network error), or `false` on SSR.
   */
  async checkAvailability(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      this._isAvailable.set(false);
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.http.request('HEAD', this.downloadUrl, { observe: 'response' }),
      );
      const isAvailable = response.status >= 200 && response.status < 300;
      this._isAvailable.set(isAvailable);
      return isAvailable;
    } catch {
      this._isAvailable.set(false);
      return false;
    }
  }

  /**
   * Streams the hosted PDF and triggers a browser download while reporting download progress.
   *
   * @param onProgress - Optional callback receiving progress percentage (0..100) or `null` for indeterminate.
   * @returns A promise that resolves when the download completes and the file blob is dispatched.
   *
   * @remarks
   * ### Progress Calculation Formula
   * During `HttpEventType.DownloadProgress` events, the transfer progress is calculated as:
   * ```
   * percentage = clamp(round((loaded / total) * 100), 0, 100)
   * ```
   * If `event.total` is missing or zero (e.g., HTTP chunked transfer encoding without `Content-Length`),
   * `onProgress(null)` is emitted to signal indeterminate progress.
   */
  async download(onProgress?: DownloadProgressCallback): Promise<void> {
    const view = this.view;
    if (!view) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      let isRejected = false;
      this.http
        .get(this.downloadUrl, {
          reportDownloadProgress: true,
          observe: 'events',
          responseType: 'blob',
        })
        .subscribe({
          next: (event) => {
            try {
              if (event.type === HttpEventType.Response && event.body) {
                this.downloadBlob(view, event.body);
                return;
              }

              if (event.type === HttpEventType.DownloadProgress) {
                if (!(typeof event.total === 'number' && event.total > 0)) {
                  onProgress?.(null);
                  return;
                }

                const percentage = Math.min(
                  100,
                  Math.max(0, Math.round((event.loaded / event.total) * 100)),
                );

                onProgress?.(percentage);
              }
            } catch (error: unknown) {
              isRejected = true;
              reject(error);
            }
          },
          error: (error: unknown) => {
            isRejected = true;
            reject(error);
          },
          complete: () => {
            if (!isRejected) {
              resolve();
            }
          },
        });
    });
  }

  /**
   * Activates one temporary anchor and releases every browser resource afterward.
   *
   * @param view - Active browser window object.
   * @param blob - Binary PDF payload received from the HTTP response.
   *
   * @remarks
   * ### Blob URL Lifecycle & Memory Hygiene
   * 1. `URL.createObjectURL(blob)`: Allocates an internal browser reference to the binary memory.
   * 2. `anchor.click()`: Synthetically triggers the native browser download prompt with the configured filename.
   * 3. `URL.revokeObjectURL(objectUrl)`: Executed inside a `finally` block to guarantee immediate deallocation
   *    of the blob URL reference, preventing browser memory leaks.
   */
  private downloadBlob(view: Window & typeof globalThis, blob: Blob): void {
    const objectUrl = view.URL.createObjectURL(blob);
    let anchor: HTMLAnchorElement | undefined;

    try {
      anchor = this.document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = this.filename;
      anchor.hidden = true;
      this.document.body.append(anchor);
      anchor.click();
    } finally {
      anchor?.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
  }
}
