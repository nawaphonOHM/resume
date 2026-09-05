import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject, Service } from '@angular/core';

import {
  buildResumeDocumentDefinition,
  validateResumePdfBytes,
} from '../../../resume-pdf/resume-pdf-document.ts';
import { resumeData } from '../../../../helper/injection-token/resume.data.ts';
import { RESUME_PDF_FILENAME } from '../../../../helper/injection-token/resume-pdf-filename.variable.ts';
import type { ResumePdfRuntime } from '../../../../helper/interface/resume-pdf-runtime/resume-pdf-runtime.interface.ts';
import { RESUME_PDF_RUNTIME_LOADER } from '../../../../helper/injection-token/resume-pdf-runtime-loader.function.ts';

/** Lazily generates, validates, and downloads the canonical résumé PDF. */
@Service()
export class ResumePdfService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly runtimeLoader = inject(RESUME_PDF_RUNTIME_LOADER);
  private readonly view = isPlatformBrowser(this.platformId) ? this.document.defaultView : null;
  private runtime: Promise<ResumePdfRuntime> | undefined;

  private readonly resumeDataToken = inject(resumeData);

  private readonly resumePdfFilenameToken = inject(RESUME_PDF_FILENAME);

  /** Generates one PDF only after a browser caller explicitly requests it. */
  async download(): Promise<void> {
    const view = this.view;
    if (!view) {
      return;
    }

    const definition = buildResumeDocumentDefinition(this.resumeDataToken);
    const runtime = await this.loadRuntime();
    const pdf = await runtime.createPdf(definition).getBuffer();
    validateResumePdfBytes(pdf, this.resumeDataToken);

    const blob = new view.Blob([pdf as BlobPart], { type: 'application/pdf' });
    this.downloadBlob(view, blob);
  }

  /** Shares successful and in-flight loading while allowing failed loads to retry. */
  private loadRuntime(): Promise<ResumePdfRuntime> {
    this.runtime ??= this.runtimeLoader().catch((error: unknown) => {
      this.runtime = undefined;
      throw error;
    });
    return this.runtime;
  }

  /** Activates one temporary anchor and releases every browser resource afterward. */
  private downloadBlob(view: Window & typeof globalThis, blob: Blob): void {
    const objectUrl = view.URL.createObjectURL(blob);
    let anchor: HTMLAnchorElement | undefined;

    try {
      anchor = this.document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = this.resumePdfFilenameToken;
      anchor.hidden = true;
      this.document.body.append(anchor);
      anchor.click();
    } finally {
      anchor?.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
  }
}
