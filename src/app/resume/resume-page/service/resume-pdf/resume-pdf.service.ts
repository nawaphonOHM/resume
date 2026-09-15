import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { PLATFORM_ID, inject, Service, signal, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RESUME_PDF_DOWNLOAD_URL } from '../../../../helper/injection-token/resume-pdf-download-url.variable.ts';
import { RESUME_PDF_FILENAME } from '../../../../helper/injection-token/resume-pdf-filename.variable.ts';
import type { DownloadProgressCallback } from '../../../../helper/type/download-progress-callback.type.ts';

/** Streams and downloads the canonical hosted résumé PDF asset with live progress tracking. */
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

  /** Executes HEAD request to check whether the download asset returns a 2xx response. */
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

  /** Streams the hosted PDF and triggers a browser download while reporting download progress. */
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

  /** Activates one temporary anchor and releases every browser resource afterward. */
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
