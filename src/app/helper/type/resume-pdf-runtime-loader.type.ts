import type { ResumePdfRuntime } from '../interface/resume-pdf-runtime/resume-pdf-runtime.interface.ts';

/** Deferred browser-runtime loader, replaceable at the lazy boundary in tests. */
export type ResumePdfRuntimeLoader = () => Promise<ResumePdfRuntime>;
