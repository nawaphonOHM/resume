import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RESUME_THEME_STORAGE_KEY } from '../core/theme.service';
import { ResumePage } from './resume-page';

describe('ResumePage', () => {
  let observerCallback: IntersectionObserverCallback;
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    observe = vi.fn();
    disconnect = vi.fn();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: function (callback: IntersectionObserverCallback) {
        observerCallback = callback;
        return {
          root: null,
          rootMargin: '0px',
          thresholds: [],
          observe,
          unobserve: vi.fn(),
          disconnect,
          takeRecords: vi.fn(() => []),
        };
      },
    });

    localStorage.clear();
    document.documentElement.classList.remove('resume-theme-light', 'resume-theme-dark');

    await TestBed.configureTestingModule({
      imports: [ResumePage],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    localStorage.clear();
    history.replaceState(null, '', location.pathname);
    document.documentElement.classList.remove('resume-theme-light', 'resume-theme-dark');
  });

  it('renders every résumé section and keeps public links safe', () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const sectionIds = Array.from(
      element.querySelectorAll<HTMLElement>('[data-resume-section]'),
    ).map((section) => section.id);
    const externalLinks = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'),
    );

    expect(sectionIds).toEqual(['about', 'experience', 'skills', 'profile']);
    expect(element.querySelector('h1')?.textContent).toContain('Nawaphon Isarathanachaikul');
    expect(element.querySelectorAll('.experience-card')).toHaveLength(5);
    expect(element.querySelectorAll('.skills-panel mat-chip')).toHaveLength(6);
    expect(element.textContent).toContain('Available on request');
    expect(element.querySelector('a[href^="tel:"]')).toBeNull();
    expect(element.querySelector('a[href="mailto:nawaphon2539@gmail.com"]')).not.toBeNull();
    expect(externalLinks).toHaveLength(2);
    expect(externalLinks.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(
      true,
    );
  });

  it('provides keyboard-named controls for theme, print, and PDF download', () => {
    const print = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, value: print });
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('[aria-label="Switch to dark theme"]')?.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[aria-label="Print résumé"]')?.click();

    const download = element.querySelector<HTMLAnchorElement>(
      'a[aria-label="Download résumé as PDF"]',
    );
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe('dark');
    expect(print).toHaveBeenCalledOnce();
    expect(download?.hasAttribute('download')).toBe(true);
  });

  it('updates active navigation from observed sections and disconnects cleanly', () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const experienceSection = element.querySelector<HTMLElement>('#experience');

    expect(observe).toHaveBeenCalledTimes(4);
    observerCallback(
      [
        {
          isIntersecting: true,
          target: experienceSection,
          boundingClientRect: { top: 24 },
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    fixture.detectChanges();

    expect(element.querySelector('nav a[href="#experience"]')?.getAttribute('aria-current')).toBe(
      'location',
    );

    fixture.destroy();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('restores active navigation from a valid initial section hash', () => {
    history.replaceState(null, '', '#skills');
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav a[href="#skills"]')?.getAttribute('aria-current')).toBe(
      'location',
    );
  });
});
