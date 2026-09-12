import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import pdfMakeModule from 'pdfmake/build/pdfmake.js';
import virtualFileSystemModule from 'pdfmake/build/vfs_fonts.js';
import { vi } from 'vitest';

import { clearPdfMake } from '../../../../helper/injection-token/clear-pdf-make.function.ts';
import { clearRequiredRobotoFonts } from '../../../../helper/injection-token/clear-required-roboto-fonts.function.ts';
import { createCdnScriptLoader } from '../../../../helper/injection-token/create-cdn-script-loader.function.ts';
import { hasRequiredRobotoFonts } from '../../../../helper/injection-token/has-required-roboto-fonts.function.ts';
import { loadBrowserPdfRuntime } from '../../../../helper/injection-token/load-browser-pdf-runtime.function.ts';
import { normalizePdfMake } from '../../../../helper/injection-token/normalize-pdf-make.function.ts';
import { PDFMAKE_CORE_ASSET } from '../../../../helper/injection-token/pdfmake-core-asset.variable.ts';
import { PDFMAKE_FONT_ASSET } from '../../../../helper/injection-token/pdfmake-font-asset.variable.ts';
import { REQUIRED_ROBOTO_FONTS } from '../../../../helper/injection-token/required-roboto-fonts.type.ts';
import { RESUME_PDF_CDN_SCRIPT_LOADER } from '../../../../helper/injection-token/resume-pdf-con-script-loader.function.ts';
import { RESUME_PDF_FILENAME } from '../../../../helper/injection-token/resume-pdf-filename.variable.ts';
import { RESUME_PDF_RUNTIME_LOADER } from '../../../../helper/injection-token/resume-pdf-runtime-loader.function.ts';
import { resumeData } from '../../../../helper/injection-token/resume.data.ts';
import { unwrapDefaultExport } from '../../../../helper/injection-token/unwrap-default-export.function.ts';
import type { ResumePdfCdnAsset } from '../../../../helper/interface/resume-pdf-cdn-asset/resume-pdf-cdn-asset.interface.ts';
import type { ResumePdfCdnScriptLoader } from '../../../../helper/interface/resume-pdf-cdn-script-loader/resume-pdf-cdn-script-loader.interface.ts';
import type { BrowserResumePdfRuntime } from '../../../../helper/interface/resume-pdf-runtime/browser-resume-pdf-runtime/browser-resume-pdf-runtime.interface.ts';
import type { ResumePdfRuntime } from '../../../../helper/interface/resume-pdf-runtime/resume-pdf-runtime.interface.ts';
import type { ResumeProfile } from '../../../../helper/interface/resume-profile/resume-profile.interface.ts';
import type { PdfMakeWindow } from '../../../../helper/type/pdf-make-window.type.ts';
import type { ResumePdfRuntimeLoader } from '../../../../helper/type/resume-pdf-runtime-loader.type.ts';
import type { ResumePdfDocumentDefinition } from '../../../../helper/interface/resume-pdf-document-definition/resume-pdf-document-definition.interface.ts';
import { ResumePdfService } from './resume-pdf.service';

interface TestBrowserPdfRuntime extends ResumePdfRuntime {
  readonly virtualfs: { readonly storage: Record<string, unknown> };

  addVirtualFileSystem(virtualFileSystem: Readonly<Record<string, unknown>>): void;
}

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
  for (const font of TestBed.inject(REQUIRED_ROBOTO_FONTS)) {
    runtime.virtualfs.storage[font] = { data: font };
  }
}

function createLocalPdfMakeRuntime(): ResumePdfRuntime {
  const unwrap = TestBed.inject(unwrapDefaultExport);
  const runtime = unwrap(pdfMakeModule) as TestBrowserPdfRuntime;
  const virtualFileSystem = unwrap(virtualFileSystemModule) as Readonly<Record<string, unknown>>;
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

  it('provides the expected injection token values for PDF assets and Roboto fonts', () => {
    const coreAsset = TestBed.inject(PDFMAKE_CORE_ASSET);
    const fontAsset = TestBed.inject(PDFMAKE_FONT_ASSET);
    const robotoFonts = TestBed.inject(REQUIRED_ROBOTO_FONTS);

    expect(coreAsset).toEqual({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/pdfmake.min.js',
      integrity:
        'sha512-EkS5jkn3vXRWIdphIy51xskMZggNip3Or8kpe/FlM5XaQeiK2GZJ9OwrIEbXl6txKWsHNtm4OXtxzkkz41Mspw==',
    });
    expect(fontAsset).toEqual({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/vfs_fonts.min.js',
      integrity:
        'sha512-rpvsrDF7BNgiFOXqkKyyoJ46jZ8nwQ3NJJAmpYnYKuZHfzwR2wpz5cAaPX09RCj9un5E+ErATIqy4CZBcuNogA==',
    });
    expect(robotoFonts).toEqual([
      'Roboto-Regular.ttf',
      'Roboto-Medium.ttf',
      'Roboto-Italic.ttf',
      'Roboto-MediumItalic.ttf',
    ]);
  });

  it('injects the exact secured CDN assets in order only after a download request', async () => {
    const fake = createFakeBrowserRuntime();
    const anchors = trackAnchorClicks();
    const service = createServiceWithCdnLoader();
    const coreAsset = TestBed.inject(PDFMAKE_CORE_ASSET);
    const fontAsset = TestBed.inject(PDFMAKE_FONT_ASSET);

    expect(cdnScripts()).toEqual([]);
    expect(fake.createPdf).not.toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();

    const firstDownload = service.download();
    const secondDownload = service.download();
    const [coreScript] = await waitForCdnScripts(1);

    expect(coreScript?.src).toBe(coreAsset.url);
    expect(coreScript?.integrity).toBe(coreAsset.integrity);
    expect(coreScript?.crossOrigin).toBe('anonymous');
    expect(coreScript?.referrerPolicy).toBe('no-referrer');
    expect(fake.createPdf).not.toHaveBeenCalled();

    setPdfMake(fake.runtime);
    coreScript?.dispatchEvent(new Event('load'));
    const scripts = await waitForCdnScripts(2);
    const fontScript = scripts[1];

    expect(fontScript?.src).toBe(fontAsset.url);
    expect(fontScript?.integrity).toBe(fontAsset.integrity);
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
    const coreAsset = TestBed.inject(PDFMAKE_CORE_ASSET);

    const firstLoad = loader.load(coreAsset);
    const secondLoad = loader.load(coreAsset);
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

    const retry = loader.load(coreAsset);
    const [retryScript] = await waitForCdnScripts(1);
    expect(retryScript).not.toBe(failedScript);
    retryScript?.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();
    expect(loader.load(coreAsset)).toBe(retry);

    loader.invalidate(coreAsset);
    expect(retryScript?.isConnected).toBe(false);
  });

  it('uses the injectable CDN boundary with the exact sequential descriptors', async () => {
    const fake = createFakeBrowserRuntime();
    const load = vi.fn(async (asset: ResumePdfCdnAsset) => {
      const core = TestBed.inject(PDFMAKE_CORE_ASSET);
      if (asset.url === core.url) {
        setPdfMake(fake.runtime);
      } else {
        registerRobotoFonts(fake.runtime);
      }
    });
    const loader: ResumePdfCdnScriptLoader = { load, invalidate: vi.fn() };
    const service = createServiceWithCdnLoader(loader);
    const coreAsset = TestBed.inject(PDFMAKE_CORE_ASSET);
    const fontAsset = TestBed.inject(PDFMAKE_FONT_ASSET);

    expect(load).not.toHaveBeenCalled();
    await service.download();

    expect(load.mock.calls.map(([asset]) => asset)).toEqual([coreAsset, fontAsset]);
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
    for (const font of TestBed.inject(REQUIRED_ROBOTO_FONTS).slice(0, -1)) {
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
    expect(anchors[0]?.download).toBe(TestBed.inject(RESUME_PDF_FILENAME));
    expect(anchors[0]?.href).toBe('blob:resume-pdf');
    expect(anchors[0]?.isConnected).toBe(false);
    expect(revokeObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:resume-pdf');
  });

  it('uses custom injected filename when provided via RESUME_PDF_FILENAME token', async () => {
    const customFilename = 'custom-resume-file.pdf';
    const fake = createFakeRuntime();
    const loader = vi.fn(async () => fake.runtime);
    const anchors = trackAnchorClicks();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: RESUME_PDF_RUNTIME_LOADER, useValue: loader },
        { provide: RESUME_PDF_FILENAME, useValue: customFilename },
      ],
    });
    const service = TestBed.inject(ResumePdfService);

    await service.download();

    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.download).toBe(customFilename);
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

    expect(
      document.querySelector(`a[download="${TestBed.inject(RESUME_PDF_FILENAME)}"]`),
    ).toBeNull();
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

  it('throws and invalidates assets if window.pdfMake is swapped during font loading', async () => {
    const firstFake = createFakeBrowserRuntime();
    const secondFake = createFakeBrowserRuntime();
    const service = createServiceWithCdnLoader();

    const failedDownload = service.download();
    const [coreScript] = await waitForCdnScripts(1);
    setPdfMake(firstFake.runtime);
    coreScript?.dispatchEvent(new Event('load'));
    const scripts = await waitForCdnScripts(2);
    setPdfMake(secondFake.runtime);
    registerRobotoFonts(secondFake.runtime);
    const rejectedDownload = expect(failedDownload).rejects.toThrow(/runtime is unavailable/i);
    scripts[1]?.dispatchEvent(new Event('load'));
    await rejectedDownload;
  });

  describe('helper functions and injection tokens', () => {
    it('clearPdfMake removes pdfMake from the target window or assigns undefined if non-configurable', () => {
      const clear = TestBed.inject(clearPdfMake);
      const fakeWindow = { pdfMake: { createPdf: vi.fn() } } as unknown as PdfMakeWindow;
      clear(fakeWindow);
      expect(fakeWindow.pdfMake).toBeUndefined();

      const nonConfigurableWindow = {} as unknown as PdfMakeWindow;
      Object.defineProperty(nonConfigurableWindow, 'pdfMake', {
        configurable: false,
        writable: true,
        value: { createPdf: vi.fn() },
      });
      clear(nonConfigurableWindow);
      expect(nonConfigurableWindow.pdfMake).toBeUndefined();
    });

    it('clearRequiredRobotoFonts removes required fonts from virtualfs storage', () => {
      const clearFonts = TestBed.inject(clearRequiredRobotoFonts);
      const storage: Record<string, unknown> = {
        'Roboto-Regular.ttf': 'data',
        'Roboto-Medium.ttf': 'data',
        'CustomFont.ttf': 'data',
      };
      const runtime = {
        createPdf: vi.fn(),
        addVirtualFileSystem: vi.fn(),
        virtualfs: { storage },
      } as unknown as BrowserResumePdfRuntime;

      clearFonts(runtime);
      expect(storage['Roboto-Regular.ttf']).toBeUndefined();
      expect(storage['Roboto-Medium.ttf']).toBeUndefined();
      expect(storage['CustomFont.ttf']).toBe('data');

      expect(() => clearFonts({} as BrowserResumePdfRuntime)).not.toThrow();
      expect(() =>
        clearFonts({
          virtualfs: { storage: [] as unknown as Record<string, unknown> },
        } as unknown as BrowserResumePdfRuntime),
      ).not.toThrow();
    });

    it('hasRequiredRobotoFonts validates presence of required fonts', () => {
      const checkFonts = TestBed.inject(hasRequiredRobotoFonts);
      const completeStorage: Record<string, unknown> = {};
      for (const font of TestBed.inject(REQUIRED_ROBOTO_FONTS)) {
        completeStorage[font] = { data: font };
      }
      const validRuntime = {
        createPdf: vi.fn(),
        addVirtualFileSystem: vi.fn(),
        virtualfs: { storage: completeStorage },
      } as unknown as BrowserResumePdfRuntime;

      expect(checkFonts(validRuntime)).toBe(true);

      const incompleteStorage: Record<string, unknown> = { ...completeStorage };
      delete incompleteStorage['Roboto-Regular.ttf'];
      const incompleteRuntime = {
        ...validRuntime,
        virtualfs: { storage: incompleteStorage },
      } as unknown as BrowserResumePdfRuntime;
      expect(checkFonts(incompleteRuntime)).toBe(false);

      expect(checkFonts({} as BrowserResumePdfRuntime)).toBe(false);
      expect(
        checkFonts({
          virtualfs: { storage: [] as unknown as Record<string, unknown> },
        } as unknown as BrowserResumePdfRuntime),
      ).toBe(false);
    });

    it('normalizePdfMake validates runtime structure and throws for invalid candidates', () => {
      const normalize = TestBed.inject(normalizePdfMake);
      const validRuntime = {
        createPdf: vi.fn(),
        addVirtualFileSystem: vi.fn(),
      } as unknown as BrowserResumePdfRuntime;

      expect(normalize(validRuntime)).toBe(validRuntime);
      expect(() => normalize(null)).toThrow(/runtime is unavailable/);
      expect(() => normalize(undefined)).toThrow(/runtime is unavailable/);
      expect(() => normalize('invalid')).toThrow(/runtime is unavailable/);
      expect(() => normalize({ createPdf: vi.fn() })).toThrow(/runtime is unavailable/);
      expect(() => normalize({ addVirtualFileSystem: vi.fn() })).toThrow(/runtime is unavailable/);
    });

    it('unwrapDefaultExport handles ES module default export wrappers', () => {
      const unwrap = TestBed.inject(unwrapDefaultExport);
      expect(unwrap(null)).toBeNull();
      expect(unwrap('plain string')).toBe('plain string');
      expect(unwrap({ directProperty: 123 })).toEqual({ directProperty: 123 });
      expect(unwrap({ default: 'unwrapped value' })).toBe('unwrapped value');

      const selfReferential: { default?: unknown } = {};
      selfReferential.default = selfReferential;
      expect(unwrap(selfReferential)).toBe(selfReferential);

      expect(unwrap({ default: undefined })).toEqual({ default: undefined });
    });

    it('createCdnScriptLoader handles non-browser environment and script append errors', async () => {
      const factory = TestBed.inject(createCdnScriptLoader);
      const serverLoader = factory(document, 'server' as unknown as object);
      await expect(serverLoader.load(TestBed.inject(PDFMAKE_CORE_ASSET))).rejects.toThrow(
        /CDN scripts require a browser/,
      );

      const appendSpy = vi.spyOn(document.head, 'append').mockImplementation(() => {
        throw new Error('Synthetic append failure');
      });
      const browserLoader = factory(document, 'browser' as unknown as object);
      await expect(browserLoader.load(TestBed.inject(PDFMAKE_CORE_ASSET))).rejects.toThrow(
        /Synthetic append failure/,
      );
      appendSpy.mockRestore();
    });

    it('loadBrowserPdfRuntime handles missing view and script errors', async () => {
      const loaderFactory = TestBed.inject(loadBrowserPdfRuntime);
      const scriptLoader: ResumePdfCdnScriptLoader = {
        load: vi.fn().mockRejectedValue(new Error('Load failed')),
        invalidate: vi.fn(),
      };
      const fakeWindow = { pdfMake: undefined } as unknown as PdfMakeWindow;

      await expect(loaderFactory(fakeWindow, scriptLoader)).rejects.toThrow('Load failed');
      expect(scriptLoader.invalidate).toHaveBeenCalledWith(TestBed.inject(PDFMAKE_CORE_ASSET));
    });
  });
});
