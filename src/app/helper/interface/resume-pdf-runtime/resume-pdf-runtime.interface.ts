import type { ResumePdfDocumentDefinition } from '../../../resume/resume-pdf/resume-pdf-document.ts';
import type { ResumePdfGenerator } from '../resume-pdf-generator/resume-pdf-generator.interface.ts';

/** Minimal pdfmake API used to generate the résumé in the browser. */
export interface ResumePdfRuntime {
  createPdf(definition: ResumePdfDocumentDefinition): ResumePdfGenerator;
}
