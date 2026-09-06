/** Table callbacks accepted by the résumé's pdfmake layout. */
export interface ResumePdfTableLayout {
  readonly hLineColor?: (index: number) => string;
  readonly vLineColor?: (index: number) => string;
  readonly hLineWidth?: (index: number) => number;
  readonly vLineWidth?: (index: number) => number;
  readonly paddingLeft?: (index: number) => number;
  readonly paddingRight?: (index: number) => number;
  readonly paddingTop?: (index: number) => number;
  readonly paddingBottom?: (index: number) => number;
}
