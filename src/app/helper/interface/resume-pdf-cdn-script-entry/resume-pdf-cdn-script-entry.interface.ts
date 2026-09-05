export interface ResumePdfCdnScriptEntry {
  readonly element: HTMLScriptElement;
  readonly promise: Promise<void>;
  discard(error?: Error): void;
}
