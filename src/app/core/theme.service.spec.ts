/**
 * Verifies theme precedence, browser side effects, print handling, and cleanup
 * across both browser and non-browser platforms.
 */
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RESUME_THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const transitionClass = 'resume-theme-transitioning';

  /** Mutable backing state for the deterministic `matchMedia` test double. */
  let prefersDark: boolean;

  /** Captured callback used to emit synthetic system preference changes. */
  let systemThemeListener: ((event: MediaQueryListEvent) => void) | undefined;

  beforeEach(() => {
    prefersDark = false;
    systemThemeListener = undefined;

    /** `matchMedia` fixture whose `matches` value follows `prefersDark`. */
    const mediaQuery = {
      get matches() {
        return prefersDark;
      },
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        systemThemeListener = listener;
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => mediaQuery),
    });

    vi.useFakeTimers();
    localStorage.clear();
    document.documentElement.classList.remove(
      'resume-theme-light',
      'resume-theme-dark',
      transitionClass,
    );
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove(
      'resume-theme-light',
      'resume-theme-dark',
      transitionClass,
    );
  });

  it('uses the system preference and follows changes until a choice is made', () => {
    prefersDark = true;
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);

    prefersDark = false;
    systemThemeListener?.({ matches: false } as MediaQueryListEvent);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
  });

  it('restores and persists an explicit theme choice', () => {
    prefersDark = true;
    localStorage.setItem(RESUME_THEME_STORAGE_KEY, 'light');
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);

    service.toggle();
    systemThemeListener?.({ matches: false } as MediaQueryListEvent);

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe('dark');
  });

  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const)(
    'marks an explicit %s-to-%s change while updating the theme immediately',
    (initialTheme, nextTheme) => {
      localStorage.setItem(RESUME_THEME_STORAGE_KEY, initialTheme);
      const service = TestBed.inject(ThemeService);

      service.setTheme(nextTheme);

      expect(service.theme()).toBe(nextTheme);
      expect(document.documentElement.classList.contains(`resume-theme-${nextTheme}`)).toBe(true);
      expect(document.documentElement.classList.contains(transitionClass)).toBe(true);
      expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe(nextTheme);

      vi.advanceTimersByTime(249);
      expect(document.documentElement.classList.contains(transitionClass)).toBe(true);

      vi.advanceTimersByTime(1);
      expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
    },
  );

  it('does not mark an explicit assignment when the theme is unchanged', () => {
    const service = TestBed.inject(ThemeService);
    const timerCount = vi.getTimerCount();

    service.setTheme('light');
    vi.advanceTimersByTime(0);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe('light');
    expect(vi.getTimerCount()).toBe(timerCount);
  });

  it('restarts marker cleanup for rapid theme changes and settles on the latest theme', () => {
    const service = TestBed.inject(ThemeService);
    const timerCount = vi.getTimerCount();

    service.setTheme('dark');
    vi.advanceTimersByTime(125);
    service.setTheme('light');

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(false);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(true);
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe('light');

    vi.advanceTimersByTime(249);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(true);

    vi.advanceTimersByTime(1);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
    expect(vi.getTimerCount()).toBe(timerCount);
  });

  it('applies a temporary light theme while printing', () => {
    localStorage.setItem(RESUME_THEME_STORAGE_KEY, 'dark');
    const service = TestBed.inject(ThemeService);

    window.dispatchEvent(new Event('beforeprint'));
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);

    window.dispatchEvent(new Event('afterprint'));
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
  });

  it('cancels an active transition before printing', () => {
    const service = TestBed.inject(ThemeService);
    const timerCount = vi.getTimerCount();
    service.setTheme('dark');
    vi.advanceTimersByTime(0);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(true);
    const clearTimeout = vi.spyOn(window, 'clearTimeout');

    window.dispatchEvent(new Event('beforeprint'));

    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);
    expect(vi.getTimerCount()).toBe(timerCount);
    expect(clearTimeout).toHaveBeenCalledOnce();

    window.dispatchEvent(new Event('afterprint'));
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
  });

  it('cancels an active transition when destroyed', () => {
    const service = TestBed.inject(ThemeService);
    service.setTheme('dark');
    vi.advanceTimersByTime(0);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(true);
    const clearTimeout = vi.spyOn(window, 'clearTimeout');

    TestBed.resetTestingModule();

    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
    expect(clearTimeout).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(250);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
  });

  it('does not start transitions outside the browser', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(ThemeService);

    service.setTheme('dark');

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains(transitionClass)).toBe(false);
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('continues working when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable');
    });

    let service: ThemeService | undefined;
    expect(() => {
      service = TestBed.inject(ThemeService);
    }).not.toThrow();
    expect(() => service?.setTheme('dark')).not.toThrow();
    expect(service?.theme()).toBe('dark');
  });
});
