import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import pdfMakeModule from 'pdfmake/build/pdfmake.js';
import virtualFileSystemModule from 'pdfmake/build/vfs_fonts.js';
import { vi } from 'vitest';

import { resumeData } from '../../helper/injection-token/resume.data.ts';
import type { ResumeProfile } from '../../helper/interface/resume-profile/resume-profile.interface.ts';
import type { ResumePdfDocumentDefinition } from './resume-pdf-document';
import {
  RESUME_PDF_CDN_SCRIPT_LOADER,
  RESUME_PDF_FILENAME,
  RESUME_PDF_RUNTIME_LOADER,
  type ResumePdfCdnAsset,
  type ResumePdfCdnScriptLoader,
  type ResumePdfRuntime,
  type ResumePdfRuntimeLoader, ResumePdfService,
} from './resume-pdf.service';

const PDFMAKE_CORE_ASSET: ResumePdfCdnAsset = {
  url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/pdfmake.min.js',
  integrity:
    'sha512-EkS5jkn3vXRWIdphIy51xskMZggNip3Or8kpe/FlM5XaQeiK2GZJ9OwrIEbXl6txKWsHNtm4OXtxzkkz41Mspw==',
};

const PDFMAKE_FONT_ASSET: ResumePdfCdnAsset = {
  url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/vfs_fonts.min.js',
  integrity:
    'sha512-rpvsrDF7BNgiFOXqkKyyoJ46jZ8nwQ3NJJAmpYnYKuZHfzwR2wpz5cAaPX09RCj9un5E+ErATIqy4CZBcuNogA==',
};

const REQUIRED_ROBOTO_FONTS = [
  'Roboto-Regular.ttf',
  'Roboto-Medium.ttf',
  'Roboto-Italic.ttf',
  'Roboto-MediumItalic.ttf',
] as const;

interface TestBrowserPdfRuntime extends ResumePdfRuntime {
  readonly virtualfs: { readonly storage: Record<string, unknown> };

  addVirtualFileSystem(virtualFileSystem: Readonly<Record<string, unknown>>): void;
}

type PdfMakeWindow = Window & typeof globalThis & { pdfMake?: unknown };

function validPdfBytes(profile: ResumeProfile, additionalText = ''): Uint8Array {
  return new TextEncoder().encode(
    [
      '%PDF-1.7',
      '/ToUnicode',
      `mailto:${profile.details.email}`,
      profile.education.seniorProject.url,
      ...profile.links.map(({ url }) => url),
      additionalText,
    ]
      .join('\n')
      .padEnd(10_001, 'x'),
  );
}

function createFakeRuntime(initialBytes?: unknown) {
  const getBuffer = vi.fn(async (): Promise<unknown> => {
    if (initialBytes !== undefined) {
      return initialBytes;
    }
    return validPdfBytes(TestBed.inject(resumeData));
  });
  const createPdf = vi.fn((_definition: ResumePdfDocumentDefinition) => ({ getBuffer }));
  const runtime: ResumePdfRuntime = { createPdf };

  return { runtime, createPdf, getBuffer };
}

function createFakeBrowserRuntime(initialBytes?: unknown) {
  const fake = createFakeRuntime(initialBytes);
  const storage: Record<string, unknown> = {};
  const addVirtualFileSystem = vi.fn((virtualFileSystem: Readonly<Record<string, unknown>>) => {
    Object.assign(storage, virtualFileSystem);
  });
  const runtime: TestBrowserPdfRuntime = Object.assign(fake.runtime, {
    addVirtualFileSystem,
    virtualfs: { storage },
  });

  return { ...fake, addVirtualFileSystem, runtime, storage };
}

function registerRobotoFonts(runtime: TestBrowserPdfRuntime): void {
  for (const font of REQUIRED_ROBOTO_FONTS) {
    runtime.virtualfs.storage[font] = { data: font };
  }
}

function unwrapDefaultExport(value: unknown): unknown {
  if (value && typeof value === 'object' && 'default' in value) {
    return value.default;
  }
  return value;
}

function createLocalPdfMakeRuntime(): ResumePdfRuntime {
  const runtime = unwrapDefaultExport(pdfMakeModule) as TestBrowserPdfRuntime;
  const virtualFileSystem = unwrapDefaultExport(virtualFileSystemModule) as Readonly<
    Record<string, unknown>
  >;
  runtime.addVirtualFileSystem(virtualFileSystem);
  return runtime;
}

function setPdfMake(value: unknown): void {
  Object.defineProperty(window, 'pdfMake', {
    configurable: true,
    value,
    writable: true,
  });
}

function cdnScripts(): HTMLScriptElement[] {
  return Array.from(
    document.head.querySelectorAll<HTMLScriptElement>(
      'script[src^="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/"]',
    ),
  );
}

async function waitForCdnScripts(count: number): Promise<HTMLScriptElement[]> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const scripts = cdnScripts();
    if (scripts.length === count) {
      return scripts;
    }
    await Promise.resolve();
  }
  throw new Error(`Expected ${count} pdfmake CDN script elements.`);
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

function createServiceWithCdnLoader(loader?: ResumePdfCdnScriptLoader): ResumePdfService {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      ...(loader ? [{ provide: RESUME_PDF_CDN_SCRIPT_LOADER, useValue: loader }] : []),
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
  let originalPdfMake: PropertyDescriptor | undefined;
  let originalRevokeObjectUrl: PropertyDescriptor | undefined;
  let createObjectUrl: ReturnType<typeof vi.fn<(blob: Blob) => string>>;
  let revokeObjectUrl: ReturnType<typeof vi.fn<(url: string) => void>>;

  beforeEach(() => {
    originalCreateObjectUrl = Object.getOwnPropertyDescriptor(window.URL, 'createObjectURL');
    originalPdfMake = Object.getOwnPropertyDescriptor(window, 'pdfMake');
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
    for (const script of cdnScripts()) {
      script.remove();
    }
    restoreProperty(window.URL, 'createObjectURL', originalCreateObjectUrl);
    restoreProperty(window, 'pdfMake', originalPdfMake);
    restoreProperty(window.URL, 'revokeObjectURL', originalRevokeObjectUrl);
  });

  it('injects the exact secured CDN assets in order only after a download request', async () => {
    const fake = createFakeBrowserRuntime();
    const anchors = trackAnchorClicks();
    const service = createServiceWithCdnLoader();

    expect(cdnScripts()).toEqual([]);
    expect(fake.createPdf).not.toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();

    const firstDownload = service.download();
    const secondDownload = service.download();
    const [coreScript] = await waitForCdnScripts(1);

    expect(coreScript?.src).toBe(PDFMAKE_CORE_ASSET.url);
    expect(coreScript?.integrity).toBe(PDFMAKE_CORE_ASSET.integrity);
    expect(coreScript?.crossOrigin).toBe('anonymous');
    expect(coreScript?.referrerPolicy).toBe('no-referrer');
    expect(fake.createPdf).not.toHaveBeenCalled();

    setPdfMake(fake.runtime);
    coreScript?.dispatchEvent(new Event('load'));
    const scripts = await waitForCdnScripts(2);
    const fontScript = scripts[1];

    expect(fontScript?.src).toBe(PDFMAKE_FONT_ASSET.url);
    expect(fontScript?.integrity).toBe(PDFMAKE_FONT_ASSET.integrity);
    expect(fontScript?.crossOrigin).toBe('anonymous');
    expect(fontScript?.referrerPolicy).toBe('no-referrer');
    expect(coreScript?.compareDocumentPosition(fontScript!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    registerRobotoFonts(fake.runtime);
    fontScript?.dispatchEvent(new Event('load'));
    await Promise.all([firstDownload, secondDownload]);
    await service.download();

    expect(cdnScripts()).toEqual([coreScript, fontScript]);
    expect(fake.createPdf).toHaveBeenCalledTimes(3);
    expect(createObjectUrl).toHaveBeenCalledTimes(3);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(3);
    expect(anchors).toHaveLength(3);
  });

  it('deduplicates script loads and removes failed elements and listeners before retrying', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] });
    const loader = TestBed.inject(RESUME_PDF_CDN_SCRIPT_LOADER);

    const firstLoad = loader.load(PDFMAKE_CORE_ASSET);
    const secondLoad = loader.load(PDFMAKE_CORE_ASSET);
    const [failedScript] = await waitForCdnScripts(1);
    const removeEventListener = vi.spyOn(failedScript!, 'removeEventListener');
    const firstFailure = firstLoad.catch((error: unknown) => error);
    const secondFailure = secondLoad.catch((error: unknown) => error);

    expect(secondLoad).toBe(firstLoad);
    failedScript?.dispatchEvent(new Event('error'));

    await expect(firstFailure).resolves.toEqual(expect.any(Error));
    await expect(secondFailure).resolves.toEqual(expect.any(Error));
    expect(removeEventListener).toHaveBeenCalledWith('load', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    expect(failedScript?.isConnected).toBe(false);
    expect(cdnScripts()).toEqual([]);

    const retry = loader.load(PDFMAKE_CORE_ASSET);
    const [retryScript] = await waitForCdnScripts(1);
    expect(retryScript).not.toBe(failedScript);
    retryScript?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();
    expect(loader.load(PDFMAKE_CORE_ASSET)).toBe(retry);

    loader.invalidate(PDFMAKE_CORE_ASSET);
    expect(retryScript?.isConnected).toBe(false);
  });

  it('uses the injectable CDN boundary with the exact sequential descriptors', async () => {
    const fake = createFakeBrowserRuntime();
    const load = vi.fn(async (asset: ResumePdfCdnAsset) => {
      if (asset.url === PDFMAKE_CORE_ASSET.url) {
        setPdfMake(fake.runtime);
      } else {
        registerRobotoFonts(fake.runtime);
      }
    });
    const loader: ResumePdfCdnScriptLoader = { load, invalidate: vi.fn() };
    const service = createServiceWithCdnLoader(loader);

    expect(load).not.toHaveBeenCalled();
    await service.download();

    expect(load.mock.calls.map(([asset]) => asset)).toEqual([
      PDFMAKE_CORE_ASSET,
      PDFMAKE_FONT_ASSET,
    ]);
  });

  it('rejects a core script load error without a download and permits a clean retry', async () => {
    const fake = createFakeBrowserRuntime();
    const anchorClick = vi.spyOn(window.HTMLAnchorElement.prototype, 'click');
    const service = createServiceWithCdnLoader();

    const failedDownload = service.download();
    const [failedCoreScript] = await waitForCdnScripts(1);
    const rejectedDownload = expect(failedDownload).rejects.toThrow(/pdfmake\.min\.js/);
    failedCoreScript?.dispatchEvent(new Event('error'));
    await rejectedDownload;

    expect(cdnScripts()).toEqual([]);
    expect(failedCoreScript?.isConnected).toBe(false);
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();

    const retry = service.download();
    const [retryCoreScript] = await waitForCdnScripts(1);
    expect(retryCoreScript).not.toBe(failedCoreScript);
    setPdfMake(fake.runtime);
    retryCoreScript?.dispatchEvent(new Event('load'));
    const retryScripts = await waitForCdnScripts(2);
    registerRobotoFonts(fake.runtime);
    retryScripts[1]?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
  });

  it('retains a validated core script when the font script fails and retries only the font asset', async () => {
    const fake = createFakeBrowserRuntime();
    const anchorClick = vi.spyOn(window.HTMLAnchorElement.prototype, 'click');
    const service = createServiceWithCdnLoader();

    const failedDownload = service.download();
    const [coreScript] = await waitForCdnScripts(1);
    setPdfMake(fake.runtime);
    coreScript?.dispatchEvent(new Event('load'));
    const firstScripts = await waitForCdnScripts(2);
    const failedFontScript = firstScripts[1];
    const rejectedDownload = expect(failedDownload).rejects.toThrow(/vfs_fonts\.min\.js/);

    failedFontScript?.dispatchEvent(new Event('error'));
    await rejectedDownload;

    expect(cdnScripts()).toEqual([coreScript]);
    expect(coreScript?.isConnected).toBe(true);
    expect(failedFontScript?.isConnected).toBe(false);
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();

    const retry = service.download();
    const retryScripts = await waitForCdnScripts(2);
    const retryFontScript = retryScripts[1];
    expect(retryScripts[0]).toBe(coreScript);
    expect(retryFontScript).not.toBe(failedFontScript);

    registerRobotoFonts(fake.runtime);
    retryFontScript?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
  });

  it.each([
    ['window.pdfMake is missing', () => undefined],
    [
      'createPdf is missing',
      () => ({
        addVirtualFileSystem: vi.fn(),
        virtualfs: { storage: {} },
      }),
    ],
    [
      'addVirtualFileSystem is missing',
      () => ({
        createPdf: createFakeRuntime().runtime.createPdf,
        virtualfs: { storage: {} },
      }),
    ],
  ])('invalidates a loaded core when %s and permits a clean retry', async (_label, malformed) => {
    const valid = createFakeBrowserRuntime();
    const anchorClick = vi.spyOn(window.HTMLAnchorElement.prototype, 'click');
    const service = createServiceWithCdnLoader();

    const failedDownload = service.download();
    const [failedCoreScript] = await waitForCdnScripts(1);
    setPdfMake(malformed());
    const rejectedDownload = expect(failedDownload).rejects.toThrow(/runtime is unavailable/i);
    failedCoreScript?.dispatchEvent(new Event('load'));
    await rejectedDownload;

    expect(cdnScripts()).toEqual([]);
    expect(failedCoreScript?.isConnected).toBe(false);
    expect((window as PdfMakeWindow).pdfMake).toBeUndefined();
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();

    const retry = service.download();
    const [retryCoreScript] = await waitForCdnScripts(1);
    expect(retryCoreScript).not.toBe(failedCoreScript);
    setPdfMake(valid.runtime);
    retryCoreScript?.dispatchEvent(new Event('load'));
    const retryScripts = await waitForCdnScripts(2);
    registerRobotoFonts(valid.runtime);
    retryScripts[1]?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
  });

  it('invalidates incomplete Roboto font registration while retaining the validated core', async () => {
    const fake = createFakeBrowserRuntime();
    const anchorClick = vi.spyOn(window.HTMLAnchorElement.prototype, 'click');
    const service = createServiceWithCdnLoader();

    const failedDownload = service.download();
    const [coreScript] = await waitForCdnScripts(1);
    setPdfMake(fake.runtime);
    coreScript?.dispatchEvent(new Event('load'));
    const firstScripts = await waitForCdnScripts(2);
    const failedFontScript = firstScripts[1];
    for (const font of REQUIRED_ROBOTO_FONTS.slice(0, -1)) {
      fake.storage[font] = { data: font };
    }
    const rejectedDownload = expect(failedDownload).rejects.toThrow(/font bundle is unavailable/i);
    failedFontScript?.dispatchEvent(new Event('load'));
    await rejectedDownload;

    expect(cdnScripts()).toEqual([coreScript]);
    expect(coreScript?.isConnected).toBe(true);
    expect(failedFontScript?.isConnected).toBe(false);
    expect((window as PdfMakeWindow).pdfMake).toBe(fake.runtime);
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(anchorClick).not.toHaveBeenCalled();

    const retry = service.download();
    const retryScripts = await waitForCdnScripts(2);
    expect(retryScripts[0]).toBe(coreScript);
    registerRobotoFonts(fake.runtime);
    retryScripts[1]?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
  });

  it('defers all work until requested and downloads the same validated bytes once', async () => {
    const fake = createFakeRuntime();
    const loader = vi.fn(async () => fake.runtime);
    const anchors = trackAnchorClicks();
    const service = createService(loader);
    const resume = TestBed.inject(resumeData);
    const bytes = validPdfBytes(resume);

    expect(loader).not.toHaveBeenCalled();
    expect(fake.createPdf).not.toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();

    await service.download();

    expect(loader).toHaveBeenCalledOnce();
    expect(fake.createPdf).toHaveBeenCalledOnce();
    expect(fake.getBuffer).toHaveBeenCalledOnce();
    expect(fake.createPdf.mock.calls[0]?.[0]).toMatchObject({
      info: { title: `${resume.name} — ${resume.title}` },
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

  it('generates deterministic Unicode PDF bytes with canonical safe links using the local fixture', async () => {
    createObjectUrl
      .mockReturnValueOnce('blob:first-resume-profile')
      .mockReturnValueOnce('blob:second-resume-profile');
    const anchors = trackAnchorClicks();
    const loader = vi.fn(async () => createLocalPdfMakeRuntime());
    const service = createService(loader);
    const resume = TestBed.inject(resumeData);

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
    expect(pdfSource).toContain(`mailto:${resume.details.email}`);
    expect(pdfSource).toContain(resume.education.seniorProject.url);
    for (const { url } of resume.links) {
      expect(pdfSource).toContain(url);
    }
    expect(pdfSource).not.toMatch(/tel:/i);
    expect(loader).toHaveBeenCalledOnce();
    expect(anchors).toHaveLength(2);
    expect(revokeObjectUrl).toHaveBeenNthCalledWith(1, 'blob:first-resume-profile');
    expect(revokeObjectUrl).toHaveBeenNthCalledWith(2, 'blob:second-resume-profile');
  });
});
