import type { ResumePdfNode } from '../resume-pdf-node/resume-pdf-node.interface.ts';
import type { ResumePdfColumnWidth } from '../../type/resume-pdf-column-width.type.ts';

/** Table data accepted by the résumé's pdfmake layout. */
export interface ResumePdfTable {
  readonly widths: readonly ResumePdfColumnWidth[];
  readonly dontBreakRows?: boolean;
  readonly body: readonly (readonly ResumePdfNode[])[];
}
