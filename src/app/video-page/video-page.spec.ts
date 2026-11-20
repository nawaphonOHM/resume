import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { RESUME_THEME_STORAGE_KEY } from '../helper/injection-token/resume-theme-storage-key.variable.ts';
import { ThemeService } from '../helper/core/theme.service.ts';
import VideoPage from './video-page';

describe('VideoPage', () => {
  let harness!: RouterTestingHarness;
  let prefersDark: boolean;
  let systemThemeListener: ((event: MediaQueryListEvent) => void) | undefined;
  let originalMatchMedia: PropertyDescriptor | undefined;

  beforeEach(async () => {
    prefersDark = false;
    systemThemeListener = undefined;
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

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
    document.documentElement.classList.remove(
      'resume-theme-light',
      'resume-theme-dark',
      'resume-theme-transitioning',
    );

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            providers: [ThemeService],
            children: [{ path: '**', component: VideoPage }],
          },
        ]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    harness?.fixture.destroy();
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.classList.remove(
      'resume-theme-light',
      'resume-theme-dark',
      'resume-theme-transitioning',
    );

    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
    vi.restoreAllMocks();
  });

  async function bootstrapVideoPage(): Promise<void> {
    harness = await RouterTestingHarness.create('/unknown/path');
    await harness.fixture.whenStable();
  }

  function getThemeService(): ThemeService {
    const injector = harness.routeDebugElement?.injector;
    if (!injector) {
      throw new Error('Video page route injector not found');
    }
    return injector.get(ThemeService);
  }

  it('renders the autoplay-enabled, controllable YouTube player with a descriptive title', async () => {
    await bootstrapVideoPage();
    const iframe = harness.routeNativeElement?.querySelector('iframe');

    expect(iframe?.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=1',
    );
    expect(iframe?.getAttribute('allow')).toContain('autoplay');
    expect(iframe?.getAttribute('title')).toBe(
      'Never Gonna Give You Up by Rick Astley — YouTube video',
    );
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
  });

  it('provides direct YouTube and résumé navigation links', async () => {
    await bootstrapVideoPage();
    const page = harness.routeNativeElement as HTMLElement;
    const links = Array.from(page.querySelectorAll('a'));

    expect(links[0]?.getAttribute('href')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(links[1]?.getAttribute('href')).toBe('/');
  });

  it('moves focus to its main landmark after rendering', async () => {
    await bootstrapVideoPage();
    const main = harness.routeNativeElement?.querySelector('main');

    expect(main?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(main);
  });

  it('restores main landmark focus if the player takes focus while initially loading', async () => {
    await bootstrapVideoPage();
    const page = harness.routeNativeElement as HTMLElement;
    const main = page.querySelector('main');
    const iframe = page.querySelector('iframe');

    iframe?.focus();
    iframe?.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(main);
  });

  it('does not restore initial focus after keyboard navigation begins', async () => {
    await bootstrapVideoPage();
    const iframe = harness.routeNativeElement?.querySelector('iframe');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    iframe?.focus();
    iframe?.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(iframe);
  });

  it('does not restore focus after pointer interaction begins', async () => {
    await bootstrapVideoPage();
    const iframe = harness.routeNativeElement?.querySelector('iframe');

    document.dispatchEvent(new PointerEvent('pointerdown'));
    iframe?.focus();
    iframe?.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(iframe);
  });

  it('does not steal focus on repeated player loads', async () => {
    await bootstrapVideoPage();
    const page = harness.routeNativeElement as HTMLElement;
    const main = page.querySelector('main');
    const iframe = page.querySelector('iframe');

    iframe?.focus();
    iframe?.dispatchEvent(new Event('load'));
    expect(document.activeElement).toBe(main);

    iframe?.focus();
    iframe?.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(iframe);
  });

  it.each(['light', 'dark'] as const)('inherits the stored %s theme', async (theme) => {
    localStorage.setItem(TestBed.inject(RESUME_THEME_STORAGE_KEY), theme);
    await bootstrapVideoPage();
    const themeService = getThemeService();

    expect(themeService.theme()).toBe(theme);
    expect(document.documentElement.classList.contains(`resume-theme-${theme}`)).toBe(true);
  });

  it('follows system theme changes while the page is active', async () => {
    prefersDark = true;
    await bootstrapVideoPage();
    const themeService = getThemeService();
    expect(themeService.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);

    prefersDark = false;
    systemThemeListener?.({ matches: false } as MediaQueryListEvent);

    expect(themeService.theme()).toBe('light');
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);
  });
});
