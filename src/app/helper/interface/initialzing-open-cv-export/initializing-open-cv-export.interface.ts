export interface InitializingOpenCvExport {
  Mat?: unknown;
  onAbort?: (reason: unknown) => void;
  onRuntimeInitialized?: () => void;
}
