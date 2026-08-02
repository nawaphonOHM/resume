import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RESUME_THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let prefersDark: boolean;
  let systemThemeListener: ((event: MediaQueryListEvent) => void) | undefined;

  beforeEach(() => {
    prefersDark = false;
    systemThemeListener = undefined;

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

    localStorage.clear();
    document.documentElement.classList.remove('resume-theme-light', 'resume-theme-dark');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('resume-theme-light', 'resume-theme-dark');
  });

  it('uses the system preference and follows changes until a choice is made', () => {
    prefersDark = true;
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);

    prefersDark = false;
    systemThemeListener?.({ matches: false } as MediaQueryListEvent);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);
  });

  it('restores and persists an explicit theme choice', () => {
    prefersDark = true;
    localStorage.setItem(RESUME_THEME_STORAGE_KEY, 'light');
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');

    service.toggle();
    systemThemeListener?.({ matches: false } as MediaQueryListEvent);

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe('dark');
  });

  it('applies a temporary light theme while printing', () => {
    localStorage.setItem(RESUME_THEME_STORAGE_KEY, 'dark');
    const service = TestBed.inject(ThemeService);

    window.dispatchEvent(new Event('beforeprint'));
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);

    window.dispatchEvent(new Event('afterprint'));
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);
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
