declare const process: { env?: Record<string, string | undefined> } | undefined;

function getProcessEnv(): Record<string, string | undefined> {
  return process?.env ?? {};
}

/** Evaluates whether the current execution runtime is governed by a CI runner. */
export function isCiEnvironment(
  env: Record<string, string | undefined> = getProcessEnv(),
): boolean {
  const value = env['CI'];
  return value !== undefined && value !== '' && value !== '0' && value !== 'false';
}

/** Standalone IntersectionObserver mock ensuring compatibility in headless Node.js environments. */
export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly scrollMargin: string = '0px';
  readonly thresholds: readonly number[] = [0];

  constructor(
    public readonly callback?: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    if (options) {
      if (options.root !== undefined) {
        this.root = options.root;
      }
      if (options.rootMargin !== undefined) {
        this.rootMargin = options.rootMargin;
      }
      if (options.threshold !== undefined) {
        this.thresholds = Array.isArray(options.threshold)
          ? options.threshold
          : [options.threshold];
      }
    }
  }

  private readonly observedElements = new Set<Element>();

  observe(target: Element): void {
    this.observedElements.add(target);
  }

  unobserve(target: Element): void {
    this.observedElements.delete(target);
  }

  disconnect(): void {
    this.observedElements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (isCiEnvironment() || typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = MockIntersectionObserver;
  if (typeof window !== 'undefined') {
    window.IntersectionObserver = MockIntersectionObserver;
  }
}
