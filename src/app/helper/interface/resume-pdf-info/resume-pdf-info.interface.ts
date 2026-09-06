/** Deterministic publication metadata embedded into the generated PDF. */
export interface ResumePdfInfo {
  readonly title: string;
  readonly author: string;
  readonly subject: string;
  readonly keywords: string;
  readonly creator: string;
  readonly producer: string;
  readonly creationDate: Date;
  readonly modDate: Date;
}
