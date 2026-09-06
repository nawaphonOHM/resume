/** Vector shape used for the document's page-edge accent. */
export interface ResumePdfCanvas {
  readonly type: 'rect';
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly color: string;
}
