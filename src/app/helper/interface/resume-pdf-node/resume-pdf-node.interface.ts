import type { ResumePdfCanvas } from '../resume-pdf-canvas/resume-pdf-canvas.interface.ts';
import type { ResumePdfTable } from '../resume-pdf-table/resume-pdf-table.interface.ts';
import type { ResumePdfTableLayout } from '../resume-pdf-table-layout/resume-pdf-table-layout.interface.ts';
import type { ResumePdfMargin } from '../../type/resume-pdf-margin.type.ts';
import type { ResumePdfColumnWidth } from '../../type/resume-pdf-column-width.type.ts';
import type { ResumePdfAlignment } from '../../type/resume-pdf-alignment.type.ts';

/** A pdfmake content node used by the browser-neutral résumé definition. */
export interface ResumePdfNode {
  readonly text?: string | readonly ResumePdfNode[];
  readonly style?: string;
  readonly headlineLevel?: number;
  readonly margin?: ResumePdfMargin;
  readonly columns?: readonly ResumePdfNode[];
  readonly columnGap?: number;
  readonly stack?: readonly ResumePdfNode[];
  readonly ul?: readonly ResumePdfNode[];
  readonly width?: ResumePdfColumnWidth;
  readonly bold?: boolean;
  readonly color?: string;
  readonly font?: string;
  readonly fontSize?: number;
  readonly lineHeight?: number;
  readonly link?: string;
  readonly decoration?: 'underline';
  readonly alignment?: ResumePdfAlignment;
  readonly fillColor?: string;
  readonly table?: ResumePdfTable;
  readonly layout?: 'noBorders' | ResumePdfTableLayout;
  readonly canvas?: readonly ResumePdfCanvas[];
}
