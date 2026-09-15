/**
 * Verifies remote PDF availability check, streaming download, live progress calculation,
 * DOM anchor dispatch, URL resource cleanup, and platform isolation for ResumePdfService.
 */
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RESUME_PDF_DOWNLOAD_URL } from '../../../../helper/injection-token/resume-pdf-download-url.variable.ts';
import { RESUME_PDF_FILENAME } from '../../../../helper/injection-token/resume-pdf-filename.variable.ts';
import { ResumePdfService } from './resume-pdf.service.ts';

function trackAnchorClicks(): HTMLAnchorElement[] {
  const anchors: HTMLAnchorElement[] = [];
  vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    anchors.push(this);
  });
  return anchors;
}

function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
  } else {
    Reflect.deleteProperty(target, property);
  }
}

describe('ResumePdfService', () => {
  let originalCreateObjectUrl: PropertyDescriptor | undefined;
  let originalRevokeObjectUrl: PropertyDescriptor | undefined;
  let createObjectUrl: ReturnType<typeof vi.fn<(blob: Blob) => string>>;
  let revokeObjectUrl: ReturnType<typeof vi.fn<(url: string) => void>>;

  beforeEach(() => {
    originalCreateObjectUrl = Object.getOwnPropertyDescriptor(window.URL, 'createObjectURL');
    originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(window.URL, 'revokeObjectURL');
    createObjectUrl = vi.fn((_blob: Blob) => 'blob:https://test.local/resume-pdf-mock');
    revokeObjectUrl = vi.fn((_url: string) => undefined);
    Object.defineProperties(window.URL, {
      createObjectURL: { configurable: true, value: createObjectUrl },
      revokeObjectURL: { configurable: true, value: revokeObjectUrl },
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    restoreProperty(window.URL, 'createObjectURL', originalCreateObjectUrl);
    restoreProperty(window.URL, 'revokeObjectURL', originalRevokeObjectUrl);
  });

  function setupService(
    providers: unknown[] = [],
    options: { autoFlushHead?: boolean; headStatus?: number } = {},
  ): {
    service: ResumePdfService;
    httpMock: HttpTestingController;
  } {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ResumePdfService, ...providers],
    });

    const isBrowser = isPlatformBrowser(TestBed.inject(PLATFORM_ID));
    const service = TestBed.inject(ResumePdfService);
    const httpMock = TestBed.inject(HttpTestingController);

    if (isBrowser && options.autoFlushHead !== false) {
      const downloadUrl = TestBed.inject(RESUME_PDF_DOWNLOAD_URL);
      const headReq = httpMock.expectOne({ method: 'HEAD', url: downloadUrl });
      const status = options.headStatus ?? 200;
      headReq.flush(null, {
        status,
        statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
      });
    }

    return {
      service,
      httpMock,
    };
  }

  it('provides the expected default injection tokens for PDF URL and filename', () => {
    const { service, httpMock } = setupService();
    expect(service).toBeDefined();

    const downloadUrl = TestBed.inject(RESUME_PDF_DOWNLOAD_URL);
    const filename = TestBed.inject(RESUME_PDF_FILENAME);

    expect(downloadUrl).toBe(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );
    expect(filename).toBe('nawaphon-isarathanachaikul-resume-profile.pdf');
    httpMock.verify();
  });

  it('initiates an HTTP HEAD check on browser startup and marks availability as true on 2xx status', async () => {
    const { service, httpMock } = setupService([], { autoFlushHead: false });
    expect(service.isAvailable()).toBeNull();

    const headReq = httpMock.expectOne({
      method: 'HEAD',
      url: 'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    });
    headReq.flush(null, { status: 200, statusText: 'OK' });

    // Allow promise resolution inside service
    await Promise.resolve();

    expect(service.isAvailable()).toBe(true);
    httpMock.verify();
  });

  it('marks availability as true when checkAvailability is invoked directly and returns 200 OK', async () => {
    const { service, httpMock } = setupService([], { autoFlushHead: true });
    const checkPromise = service.checkAvailability();

    const headReq = httpMock.expectOne({
      method: 'HEAD',
      url: 'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    });
    headReq.flush(null, { status: 200, statusText: 'OK' });

    const result = await checkPromise;
    expect(result).toBe(true);
    expect(service.isAvailable()).toBe(true);
    httpMock.verify();
  });

  it('marks availability as true for non-200 2xx status (e.g. 204 No Content)', async () => {
    const { service, httpMock } = setupService([], { autoFlushHead: true });
    const checkPromise = service.checkAvailability();

    const headReq = httpMock.expectOne({
      method: 'HEAD',
      url: 'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    });
    headReq.flush(null, { status: 204, statusText: 'No Content' });

    const result = await checkPromise;
    expect(result).toBe(true);
    expect(service.isAvailable()).toBe(true);
    httpMock.verify();
  });

  it('marks availability as false when HEAD request returns a 4xx error (e.g. 404 Not Found)', async () => {
    const { service, httpMock } = setupService([], { autoFlushHead: false });
    const headReq = httpMock.expectOne({
      method: 'HEAD',
      url: 'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    });
    headReq.flush(null, { status: 404, statusText: 'Not Found' });

    await Promise.resolve();

    expect(service.isAvailable()).toBe(false);
    httpMock.verify();
  });

  it('marks availability as false and does not throw when checkAvailability receives 500 error', async () => {
    const { service, httpMock } = setupService([], { autoFlushHead: true });
    const checkPromise = service.checkAvailability();

    const headReq = httpMock.expectOne({
      method: 'HEAD',
      url: 'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    });
    headReq.flush(null, { status: 500, statusText: 'Internal Server Error' });

    const result = await checkPromise;
    expect(result).toBe(false);
    expect(service.isAvailable()).toBe(false);
    httpMock.verify();
  });

  it('marks availability as false when HEAD request encounters a network error', async () => {
    const { service, httpMock } = setupService([], { autoFlushHead: true });
    const checkPromise = service.checkAvailability();

    const headReq = httpMock.expectOne({
      method: 'HEAD',
      url: 'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    });
    headReq.error(new ProgressEvent('error'));

    const result = await checkPromise;
    expect(result).toBe(false);
    expect(service.isAvailable()).toBe(false);
    httpMock.verify();
  });

  it('does not dispatch HEAD request on server platform and returns false from checkAvailability', async () => {
    const { service, httpMock } = setupService([{ provide: PLATFORM_ID, useValue: 'server' }]);
    expect(service.isAvailable()).toBeNull();

    httpMock.expectNone(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );

    const result = await service.checkAvailability();
    expect(result).toBe(false);
    expect(service.isAvailable()).toBe(false);

    httpMock.expectNone(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );
    httpMock.verify();
  });

  it('dispatches HEAD request to overridden custom download URL token', async () => {
    const customUrl = 'https://custom-domain.com/custom-resume.pdf';
    const { service, httpMock } = setupService(
      [{ provide: RESUME_PDF_DOWNLOAD_URL, useValue: customUrl }],
      { autoFlushHead: false },
    );

    const headReq = httpMock.expectOne({ method: 'HEAD', url: customUrl });
    headReq.flush(null, { status: 200, statusText: 'OK' });

    await Promise.resolve();

    expect(service.isAvailable()).toBe(true);
    httpMock.verify();
  });

  it('fetches the PDF asset with reportProgress and observe events', async () => {
    const { service, httpMock } = setupService();
    const downloadPromise = service.download();

    const req = httpMock.expectOne(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.reportDownloadProgress).toBe(true);
    expect(req.request.responseType).toBe('blob');

    const mockBlob = new Blob(['%PDF-1.7 mock'], { type: 'application/pdf' });
    req.flush(mockBlob);

    await downloadPromise;
    httpMock.verify();
  });

  it('emits percentage progress when total size is available and clamps edge values', async () => {
    const { service, httpMock } = setupService();
    const progressHistory: Array<number | null> = [];
    const onProgress = vi.fn((progress: number | null) => {
      progressHistory.push(progress);
    });

    const downloadPromise = service.download(onProgress);

    const req = httpMock.expectOne(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );

    // Simulate Sent event (should be ignored by progress calculation)
    req.event({
      type: HttpEventType.Sent,
    });

    // Simulate normal progress events
    req.event({
      type: HttpEventType.DownloadProgress,
      loaded: 10_000,
      total: 40_000,
    });
    expect(onProgress).toHaveBeenLastCalledWith(25);

    req.event({
      type: HttpEventType.DownloadProgress,
      loaded: 30_000,
      total: 40_000,
    });
    expect(onProgress).toHaveBeenLastCalledWith(75);

    // Clamped upper bound if loaded exceeds total
    req.event({
      type: HttpEventType.DownloadProgress,
      loaded: 45_000,
      total: 40_000,
    });
    expect(onProgress).toHaveBeenLastCalledWith(100);

    const mockBlob = new Blob(['%PDF-1.7 complete'], { type: 'application/pdf' });
    req.flush(mockBlob);

    await downloadPromise;

    expect(progressHistory).toEqual([25, 75, 100]);
    httpMock.verify();
  });

  it('emits null progress when total size is unknown or zero', async () => {
    const { service, httpMock } = setupService();
    const progressHistory: Array<number | null> = [];
    const onProgress = vi.fn((progress: number | null) => {
      progressHistory.push(progress);
    });

    const downloadPromise = service.download(onProgress);

    const req = httpMock.expectOne(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );

    // Missing total
    req.event({
      type: HttpEventType.DownloadProgress,
      loaded: 5_000,
      total: undefined,
    });
    expect(onProgress).toHaveBeenLastCalledWith(null);

    // Zero total
    req.event({
      type: HttpEventType.DownloadProgress,
      loaded: 5_000,
      total: 0,
    });
    expect(onProgress).toHaveBeenLastCalledWith(null);

    const mockBlob = new Blob(['%PDF-1.7 stream'], { type: 'application/pdf' });
    req.flush(mockBlob);

    await downloadPromise;

    expect(progressHistory).toEqual([null, null]);
    httpMock.verify();
  });

  it('triggers browser file download with correct filename and revokes object URL', async () => {
    const { service, httpMock } = setupService();
    const clickedAnchors = trackAnchorClicks();

    const downloadPromise = service.download();

    const req = httpMock.expectOne(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );

    const mockBlob = new Blob(['%PDF-1.7 content'], { type: 'application/pdf' });
    req.flush(mockBlob);

    await downloadPromise;

    expect(createObjectUrl).toHaveBeenCalledWith(mockBlob);
    expect(clickedAnchors).toHaveLength(1);

    const anchor = clickedAnchors[0]!;
    expect(anchor.href).toBe('blob:https://test.local/resume-pdf-mock');
    expect(anchor.download).toBe('nawaphon-isarathanachaikul-resume-profile.pdf');
    expect(anchor.hidden).toBe(true);
    expect(anchor.isConnected).toBe(false); // Verified removed from DOM
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:https://test.local/resume-pdf-mock');

    httpMock.verify();
  });

  it('guarantees object URL revocation and DOM cleanup if clicking anchor fails', async () => {
    const { service, httpMock } = setupService();

    vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('Synthetic anchor click failure');
    });

    const downloadPromise = service.download();

    const req = httpMock.expectOne(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );

    const mockBlob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    req.flush(mockBlob);

    await expect(downloadPromise).rejects.toThrow('Synthetic anchor click failure');

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:https://test.local/resume-pdf-mock');
    expect(document.body.querySelector('a[hidden]')).toBeNull();

    httpMock.verify();
  });

  it('propagates HTTP error and rejects download promise', async () => {
    const { service, httpMock } = setupService();
    const downloadPromise = service.download();

    const req = httpMock.expectOne(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );

    const errorBlob = new Blob(['Not Found'], { type: 'text/plain' });
    req.flush(errorBlob, { status: 404, statusText: 'Not Found' });

    await expect(downloadPromise).rejects.toSatisfy((error: unknown) => {
      return error instanceof HttpErrorResponse && error.status === 404;
    });

    expect(createObjectUrl).not.toHaveBeenCalled();
    httpMock.verify();
  });

  it('no-ops on non-browser / server platform', async () => {
    const { service, httpMock } = setupService([{ provide: PLATFORM_ID, useValue: 'server' }]);

    const onProgress = vi.fn();
    const downloadPromise = service.download(onProgress);

    await downloadPromise;

    httpMock.expectNone(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );
    expect(onProgress).not.toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();
    httpMock.verify();
  });

  it('respects overridden download URL and filename tokens', async () => {
    const customUrl = 'https://custom-domain.com/custom-resume.pdf';
    const customFilename = 'custom-nawaphon-resume.pdf';

    const { service, httpMock } = setupService([
      { provide: RESUME_PDF_DOWNLOAD_URL, useValue: customUrl },
      { provide: RESUME_PDF_FILENAME, useValue: customFilename },
    ]);

    const clickedAnchors = trackAnchorClicks();
    const downloadPromise = service.download();

    const req = httpMock.expectOne(customUrl);
    const mockBlob = new Blob(['%PDF-1.7 custom'], { type: 'application/pdf' });
    req.flush(mockBlob);

    await downloadPromise;

    expect(clickedAnchors).toHaveLength(1);
    expect(clickedAnchors[0]!.download).toBe(customFilename);

    httpMock.verify();
  });

  it('handles downloads when onProgress callback is omitted', async () => {
    const { service, httpMock } = setupService();
    const downloadPromise = service.download();

    const req = httpMock.expectOne(
      'https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
    );

    req.event({
      type: HttpEventType.DownloadProgress,
      loaded: 5_000,
      total: 10_000,
    });

    const mockBlob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    req.flush(mockBlob);

    await expect(downloadPromise).resolves.toBeUndefined();
    httpMock.verify();
  });
});
