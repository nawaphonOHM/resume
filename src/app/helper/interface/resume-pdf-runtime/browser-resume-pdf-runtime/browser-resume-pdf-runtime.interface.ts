import type { ResumePdfRuntime } from '../resume-pdf-runtime.interface.ts';

interface BrowserResumePdfRuntime extends ResumePdfRuntime {
  readonly virtualfs?: {
    readonly storage?: Readonly<Record<string, unknown>>;
  };
  addVirtualFileSystem(virtualFileSystem: Readonly<Record<string, unknown>>): void;
}
