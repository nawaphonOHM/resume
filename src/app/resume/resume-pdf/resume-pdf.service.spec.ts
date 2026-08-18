import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RESUME } from '../../data/resume/resume.data';
import type { ResumePdfDocumentDefinition } from './resume-pdf-document';
import {
  RESUME_PDF_FILENAME,
  RESUME_PDF_RUNTIME_LOADER,
  ResumePdfService,
  type ResumePdfRuntime,
  type ResumePdfRuntimeLoader,
} from './resume-pdf.service';

function validPdfBytes(additionalText = ''): Uint8Array {
  return new TextEncoder().encode(
    [
      '%PDF-1.7',
      '/ToUnicode',
      `mailto:${RESUME.details.email}`,
      RESUME.education.seniorProject.url,
      ...RESUME.links.map(({ url }) => url),
      additionalText,
    ]
      .join('\n')
      .padEnd(10_001, 'x'),
  );
}

function createFakeRuntime(initialBytes: unknown = validPdfBytes()) {
  const getBuffer = vi.fn(async (): Promise<unknown> => initialBytes);
  const createPdf = vi.fn((_definition: ResumePdfDocumentDefinition) => ({ getBuffer }));
  const runtime: ResumePdfRuntime = { createPdf };

  return { runtime, createPdf, getBuffer };
}

function createService(
  loader: ResumePdfRuntimeLoader,
  platformId: 'browser' | 'server' = 'browser',
): ResumePdfService {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: RESUME_PDF_RUNTIME_LOADER, useValue: loader },
    ],
  });
  return TestBed.inject(ResumePdfService);
}

function trackAnchorClicks(): HTMLAnchorElement[] {
  const anchors: HTMLAnchorElement[] = [];
  vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    anchors.push(this);
  });
  return anchors;
}

function readBlob(blob: Blob): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error('Unable to read the generated PDF Blob.'));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
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
    createObjectUrl = vi.fn((_blob: Blob) => 'blob:resume-pdf');
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

  it('defers all work until requested and downloads the same validated bytes once', async () => {
    const bytes = validPdfBytes();
    const fake = createFakeRuntime(bytes);
    const loader = vi.fn(async () => fake.runtime);
    const anchors = trackAnchorClicks();
    const service = createService(loader);

    expect(loader).not.toHaveBeenCalled();
    expect(fake.createPdf).not.toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();

    await service.download();

    expect(loader).toHaveBeenCalledOnce();
    expect(fake.createPdf).toHaveBeenCalledOnce();
    expect(fake.getBuffer).toHaveBeenCalledOnce();
    expect(fake.createPdf.mock.calls[0]?.[0]).toMatchObject({
      info: { title: `${RESUME.name} — ${RESUME.title}` },
      defaultStyle: { font: 'Roboto' },
    });
    expect(createObjectUrl).toHaveBeenCalledOnce();

    const blob = createObjectUrl.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(window.Blob);
    expect(blob?.type).toBe('application/pdf');
    expect(blob?.size).toBe(bytes.byteLength);
    expect(Array.from(await readBlob(blob!))).toEqual(Array.from(bytes));

    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.download).toBe(RESUME_PDF_FILENAME);
    expect(anchors[0]?.href).toBe('blob:resume-pdf');
    expect(anchors[0]?.isConnected).toBe(false);
    expect(revokeObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:resume-pdf');
  });

  it('shares an in-flight runtime load and reuses it for later generation', async () => {
    const fake = createFakeRuntime();
    let resolveRuntime!: (runtime: ResumePdfRuntime) => void;
    const pendingRuntime = new Promise<ResumePdfRuntime>((resolve) => {
      resolveRuntime = resolve;
    });
    const loader = vi.fn(() => pendingRuntime);
    const anchors = trackAnchorClicks();
    const service = createService(loader);

    const firstDownload = service.download();
    const secondDownload = service.download();

    expect(loader).toHaveBeenCalledOnce();
    expect(fake.createPdf).not.toHaveBeenCalled();

    resolveRuntime(fake.runtime);
    await Promise.all([firstDownload, secondDownload]);
    await service.download();

    expect(loader).toHaveBeenCalledOnce();
    expect(fake.createPdf).toHaveBeenCalledTimes(3);
    expect(fake.getBuffer).toHaveBeenCalledTimes(3);
    expect(createObjectUrl).toHaveBeenCalledTimes(3);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(3);
    expect(anchors).toHaveLength(3);
  });

  it('rejects invalid generated output before creating a download', async () => {
    const fake = createFakeRuntime(new TextEncoder().encode('%PDF-1.7'));
    const loader = vi.fn(async () => fake.runtime);
    const anchorClick = vi.spyOn(window.HTMLAnchorElement.prototype, 'click');
    const service = createService(loader);

    await expect(service.download()).rejects.toThrow(/unexpectedly small/i);

    expect(fake.getBuffer).toHaveBeenCalledOnce();
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(revokeObjectUrl).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();
  });

  it('removes the anchor and revokes its object URL when activation fails', async () => {
    const failure = new Error('Synthetic click failure');
    const fake = createFakeRuntime();
    const loader = vi.fn(async () => fake.runtime);
    vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw failure;
    });
    const service = createService(loader);

    await expect(service.download()).rejects.toBe(failure);

    expect(document.querySelector(`a[download="${RESUME_PDF_FILENAME}"]`)).toBeNull();
    expect(revokeObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:resume-pdf');
  });

  it('does no loading, generation, or download work outside the browser', async () => {
    const fake = createFakeRuntime();
    const loader = vi.fn(async () => fake.runtime);
    const anchorClick = vi.spyOn(window.HTMLAnchorElement.prototype, 'click');
    const service = createService(loader, 'server');

    await expect(service.download()).resolves.toBeUndefined();

    expect(loader).not.toHaveBeenCalled();
    expect(fake.createPdf).not.toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(revokeObjectUrl).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();
  });

  it('rejects a loader failure and retries the lazy load on the next request', async () => {
    const failure = new Error('Synthetic loader failure');
    const fake = createFakeRuntime();
    let attempt = 0;
    const loader = vi.fn(async () => {
      if (attempt++ === 0) {
        throw failure;
      }
      return fake.runtime;
    });
    const anchors = trackAnchorClicks();
    const service = createService(loader);

    await expect(service.download()).rejects.toBe(failure);
    await expect(service.download()).resolves.toBeUndefined();

    expect(loader).toHaveBeenCalledTimes(2);
    expect(fake.createPdf).toHaveBeenCalledOnce();
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledOnce();
    expect(anchors).toHaveLength(1);
  });

  it('keeps the loaded runtime reusable after a generation failure', async () => {
    const failure = new Error('Synthetic generation failure');
    const fake = createFakeRuntime();
    fake.getBuffer.mockRejectedValueOnce(failure);
    const loader = vi.fn(async () => fake.runtime);
    const anchors = trackAnchorClicks();
    const service = createService(loader);

    await expect(service.download()).rejects.toBe(failure);
    await expect(service.download()).resolves.toBeUndefined();

    expect(loader).toHaveBeenCalledOnce();
    expect(fake.createPdf).toHaveBeenCalledTimes(2);
    expect(fake.getBuffer).toHaveBeenCalledTimes(2);
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledOnce();
    expect(anchors).toHaveLength(1);
  });

  it('generates deterministic Unicode PDF bytes with canonical safe links using the default loader', async () => {
    createObjectUrl
      .mockReturnValueOnce('blob:first-resume')
      .mockReturnValueOnce('blob:second-resume');
    const anchors = trackAnchorClicks();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] });
    const service = TestBed.inject(ResumePdfService);

    await service.download();
    await service.download();

    const firstBlob = createObjectUrl.mock.calls[0]?.[0];
    const secondBlob = createObjectUrl.mock.calls[1]?.[0];
    const firstPdf = await readBlob(firstBlob!);
    const secondPdf = await readBlob(secondBlob!);
    const pdfSource = new TextDecoder('latin1').decode(firstPdf);

    expect(Array.from(firstPdf.subarray(0, 5))).toEqual(
      Array.from(new TextEncoder().encode('%PDF-')),
    );
    expect(firstPdf.byteLength).toBeGreaterThan(10_000);
    expect(Array.from(firstPdf)).toEqual(Array.from(secondPdf));
    expect(pdfSource).toMatch(/\/ToUnicode\b/);
    expect(pdfSource).toContain(`mailto:${RESUME.details.email}`);
    expect(pdfSource).toContain(RESUME.education.seniorProject.url);
    for (const { url } of RESUME.links) {
      expect(pdfSource).toContain(url);
    }
    expect(pdfSource).not.toMatch(/tel:/i);
    expect(anchors).toHaveLength(2);
    expect(revokeObjectUrl).toHaveBeenNthCalledWith(1, 'blob:first-resume');
    expect(revokeObjectUrl).toHaveBeenNthCalledWith(2, 'blob:second-resume');
  });
});
