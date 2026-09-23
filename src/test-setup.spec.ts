/** Verifies CI environment detection and MockIntersectionObserver functionality. */
import { isCiEnvironment, MockIntersectionObserver } from './test-setup';

declare const process: { env: Record<string, string | undefined> };

describe('test-setup', () => {
  describe('isCiEnvironment', () => {
    it('returns true when CI environment variable is "true"', () => {
      expect(isCiEnvironment({ CI: 'true' })).toBe(true);
    });

    it('returns true when CI environment variable is "1"', () => {
      expect(isCiEnvironment({ CI: '1' })).toBe(true);
    });

    it('returns true when CI environment variable is any truthy string value', () => {
      expect(isCiEnvironment({ CI: 'github-actions' })).toBe(true);
    });

    it('returns false when CI environment variable is undefined', () => {
      expect(isCiEnvironment({})).toBe(false);
    });

    it('returns false when CI environment variable is empty string', () => {
      expect(isCiEnvironment({ CI: '' })).toBe(false);
    });

    it('returns false when CI environment variable is "0"', () => {
      expect(isCiEnvironment({ CI: '0' })).toBe(false);
    });

    it('returns false when CI environment variable is "false"', () => {
      expect(isCiEnvironment({ CI: 'false' })).toBe(false);
    });

    it('defaults to evaluating process.env', () => {
      const originalCi = process.env['CI'];
      try {
        process.env['CI'] = 'true';
        expect(isCiEnvironment()).toBe(true);

        delete process.env['CI'];
        expect(isCiEnvironment()).toBe(false);
      } finally {
        if (originalCi !== undefined) {
          process.env['CI'] = originalCi;
        } else {
          delete process.env['CI'];
        }
      }
    });
  });

  describe('MockIntersectionObserver', () => {
    it('initializes with default properties when no options are provided', () => {
      const observer = new MockIntersectionObserver();

      expect(observer.root).toBeNull();
      expect(observer.rootMargin).toBe('0px');
      expect(observer.scrollMargin).toBe('0px');
      expect(observer.thresholds).toEqual([0]);
    });

    it('initializes with custom root, rootMargin, and single threshold', () => {
      const rootElement = document.createElement('div');
      const observer = new MockIntersectionObserver(undefined, {
        root: rootElement,
        rootMargin: '10px 20px',
        threshold: 0.5,
      });

      expect(observer.root).toBe(rootElement);
      expect(observer.rootMargin).toBe('10px 20px');
      expect(observer.thresholds).toEqual([0.5]);
    });

    it('initializes with array of thresholds', () => {
      const observer = new MockIntersectionObserver(undefined, {
        threshold: [0, 0.25, 0.5, 0.75, 1],
      });

      expect(observer.thresholds).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });

    it('executes observe, unobserve, and disconnect without throwing', () => {
      const observer = new MockIntersectionObserver();
      const targetElement = document.createElement('section');

      expect(() => {
        observer.observe(targetElement);
        observer.unobserve(targetElement);
        observer.disconnect();
      }).not.toThrow();
    });

    it('returns an empty array when calling takeRecords()', () => {
      const observer = new MockIntersectionObserver();
      expect(observer.takeRecords()).toEqual([]);
    });

    it('stores the callback passed to constructor', () => {
      const callback: IntersectionObserverCallback = vi.fn();
      const observer = new MockIntersectionObserver(callback);

      expect(observer.callback).toBe(callback);
    });
  });

  describe('global registration', () => {
    it('registers IntersectionObserver on globalThis and window', () => {
      expect(globalThis.IntersectionObserver).toBeDefined();
      expect(window.IntersectionObserver).toBeDefined();

      const instance = new window.IntersectionObserver(vi.fn());
      expect(instance).toBeInstanceOf(MockIntersectionObserver);
    });
  });
});
