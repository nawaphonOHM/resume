/** Deferred OpenCV module loader, replaceable at the browser boundary in tests. */
export type TechnologyIconOpenCvLoader = (sourceUrl: string) => Promise<unknown>;
