import type {
  ResumePdfCanvas,
  ResumePdfTable,
  ResumePdfTableLayout,
} from '../../../resume/resume-pdf/resume-pdf-document.ts';

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
