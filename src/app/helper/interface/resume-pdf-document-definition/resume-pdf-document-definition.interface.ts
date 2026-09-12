import type { ResumePdfInfo } from '../resume-pdf-info/resume-pdf-info.interface.ts';
import type { ResumePdfStyle } from '../resume-pdf-style/resume-pdf-style.interface.ts';
import type { ResumePdfNode } from '../resume-pdf-node/resume-pdf-node.interface.ts';
import type { ResumePdfMargin } from '../../type/resume-pdf-margin.type.ts';

/** Typed document definition consumed by the lazily loaded browser pdfmake runtime. */
export interface ResumePdfDocumentDefinition {
  readonly pageSize: 'A4';
  readonly pageMargins: ResumePdfMargin;
  readonly info: ResumePdfInfo;
  readonly language: 'en';
  readonly defaultStyle: ResumePdfStyle;
  readonly styles: Readonly<Record<string, ResumePdfStyle>>;
  readonly background: (
    currentPage: number,
    pageSize: Readonly<{ width: number; height: number }>,
  ) => ResumePdfNode;
  readonly footer: (currentPage: number, pageCount: number) => ResumePdfNode;
  readonly content: readonly ResumePdfNode[];
}
