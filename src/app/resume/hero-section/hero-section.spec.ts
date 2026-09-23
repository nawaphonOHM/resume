/** Verifies fixed UTC+7 clock, transition animations, availability rendering, updates, and timer lifecycle. */
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { resumeData } from '../../helper/injection-token/resume.data.ts';
import { HERO_CLOCK_TRANSITIONS } from '../../helper/injection-token/hero-clock-transitions.variable.ts';
import { heroClockTransitionPicker } from '../../helper/injection-token/hero-clock-transition-picker.variable.ts';
import { STATUS_LUMINANCE_PHI } from '../../helper/injection-token/status-luminance-parameters.phi.variable.ts';
import type { HeroClockTransition } from '../../helper/type/hero-clock-transistion.type.ts';
import { HeroSection } from './hero-section';
import { STATUS_LUMINANCE_A } from '../../helper/injection-token/status-luminance-parameters.amplitude.variable.ts';
import { STATUS_LUMINANCE_F } from '../../helper/injection-token/status-luminance-parameters.frequency.variable.ts';
import { STATUS_LUMINANCE_OMEGA } from '../../helper/injection-token/status-luminance-parameters.omega.variable.ts';
import { HERO_CODE_F } from '../../helper/injection-token/hero-code-parameters.frequency.variable.ts';
import { HERO_CODE_OMEGA } from '../../helper/injection-token/hero-code-parameters.omega.variable.ts';
import { HERO_CODE_R_LEFT } from '../../helper/injection-token/hero-code-parameters.radius-left.variable.ts';
import { HERO_CODE_R_RIGHT } from '../../helper/injection-token/hero-code-parameters.radius-right.variable.ts';
import { calculateHeroCodePosition } from '../../helper/injection-token/hero-code-position.function.ts';
import { HERO_CODE_PHI_LEFT } from '../../helper/injection-token/hero-code-parameters.phi-left.variable.ts';
import { HERO_CODE_PHI_RIGHT } from '../../helper/injection-token/hero-code-parameters.phi-right.variable.ts';

const ALL_CLOCK_TRANSITIONS: readonly HeroClockTransition[] = [
  'slide-fade',
  'opacity-pulse',
  'soft-glow',
];

const AVAILABLE_COLOR = '#92C353';
const LIMITED_COLOR = '#F7A600';
const UNAVAILABLE_COLOR = '#D1D1D1';

const AVAILABLE_FAVICON = 'https://resume-images.ohm-mho.space/favicons/available/favicon.svg';
const LIMITED_FAVICON = 'https://resume-images.ohm-mho.space/favicons/limited/favicon.svg';
const UNAVAILABLE_FAVICON = 'https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg';

const COLOR_TO_FAVICON: Record<string, string> = {
  [AVAILABLE_COLOR]: AVAILABLE_FAVICON,
  [LIMITED_COLOR]: LIMITED_FAVICON,
  [UNAVAILABLE_COLOR]: UNAVAILABLE_FAVICON,
};

interface AvailabilityBoundaryCase {
  readonly label: string;
  readonly instantBeforeBoundary: string;
  readonly colorBeforeBoundary: string;
  readonly colorAtBoundary: string;
}

const AVAILABILITY_BOUNDARIES: readonly AvailabilityBoundaryCase[] = [
  {
    label: 'workday 06:00',
    instantBeforeBoundary: '2026-01-05T05:59:59+07:00',
    colorBeforeBoundary: UNAVAILABLE_COLOR,
    colorAtBoundary: LIMITED_COLOR,
  },
  {
    label: 'workday 09:00',
    instantBeforeBoundary: '2026-01-05T08:59:59+07:00',
    colorBeforeBoundary: LIMITED_COLOR,
    colorAtBoundary: AVAILABLE_COLOR,
  },
  {
    label: 'workday 12:00',
    instantBeforeBoundary: '2026-01-05T11:59:59+07:00',
    colorBeforeBoundary: AVAILABLE_COLOR,
    colorAtBoundary: LIMITED_COLOR,
  },
  {
    label: 'workday 13:00',
    instantBeforeBoundary: '2026-01-05T12:59:59+07:00',
    colorBeforeBoundary: LIMITED_COLOR,
    colorAtBoundary: AVAILABLE_COLOR,
  },
  {
    label: 'workday 18:00',
    instantBeforeBoundary: '2026-01-05T17:59:59+07:00',
    colorBeforeBoundary: AVAILABLE_COLOR,
    colorAtBoundary: LIMITED_COLOR,
  },
  {
    label: 'workday 22:00',
    instantBeforeBoundary: '2026-01-05T21:59:59+07:00',
    colorBeforeBoundary: LIMITED_COLOR,
    colorAtBoundary: UNAVAILABLE_COLOR,
  },
  {
    label: 'Saturday 06:00',
    instantBeforeBoundary: '2026-01-10T05:59:59+07:00',
    colorBeforeBoundary: UNAVAILABLE_COLOR,
    colorAtBoundary: LIMITED_COLOR,
  },
  {
    label: 'Sunday 22:00',
    instantBeforeBoundary: '2026-01-11T21:59:59+07:00',
    colorBeforeBoundary: LIMITED_COLOR,
    colorAtBoundary: UNAVAILABLE_COLOR,
  },
];

function normalizedText(element: Element | null): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function renderedStatusColor(element: HTMLElement): string {
  return (
    element
      .querySelector<HTMLElement>('.status-dot')
      ?.style.getPropertyValue('--status-dot-color') ?? ''
  );
}

function renderedStatusLuminance(element: HTMLElement): string {
  return (
    element
      .querySelector<HTMLElement>('.status-dot')
      ?.style.getPropertyValue('--status-dot-luminance') ?? ''
  );
}

function renderedStatusLuminanceNumber(element: HTMLElement): number {
  return Number.parseFloat(renderedStatusLuminance(element));
}

function renderedHeroCodeLeftX(element: HTMLElement): number {
  return Number.parseFloat(
    element
      .querySelector<HTMLElement>('.hero-code-left')
      ?.style.getPropertyValue('--hero-code-left-x') ?? '',
  );
}

function renderedHeroCodeLeftY(element: HTMLElement): number {
  return Number.parseFloat(
    element
      .querySelector<HTMLElement>('.hero-code-left')
      ?.style.getPropertyValue('--hero-code-left-y') ?? '',
  );
}

function renderedHeroCodeRightX(element: HTMLElement): number {
  return Number.parseFloat(
    element
      .querySelector<HTMLElement>('.hero-code-right')
      ?.style.getPropertyValue('--hero-code-right-x') ?? '',
  );
}

function renderedHeroCodeRightY(element: HTMLElement): number {
  return Number.parseFloat(
    element
      .querySelector<HTMLElement>('.hero-code-right')
      ?.style.getPropertyValue('--hero-code-right-y') ?? '',
  );
}

function renderedFaviconHref(): string {
  const link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel~="icon"]');
  return link?.getAttribute('href') ?? '';
}

function cleanupHeadIconLinks(): void {
  const existingLinks = document.head.querySelectorAll<HTMLLinkElement>(
    'link[rel="icon"], link[rel~="icon"]',
  );
  existingLinks.forEach((link) => {
    link.remove();
  });
}

describe('HeroSection', () => {
  let fixture: ComponentFixture<HeroSection> | null;

  beforeEach(async () => {
    cleanupHeadIconLinks();
    await TestBed.configureTestingModule({
      imports: [HeroSection],
      providers: [provideRouter([])],
    }).compileComponents();
    vi.useFakeTimers();
    fixture = null;
  });

  afterEach(() => {
    fixture?.destroy();
    cleanupHeadIconLinks();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function renderHero(): ComponentFixture<HeroSection> {
    const profile = TestBed.inject(resumeData);
    fixture = TestBed.createComponent(HeroSection);
    fixture.componentRef.setInput('profile', profile);
    fixture.detectChanges();
    return fixture;
  }

  it('renders separate profile and UTC+7 kicker lines with an immediate timestamp and initial tick class', () => {
    vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));

    const element = renderHero().nativeElement as HTMLElement;
    const kickerCopies = element.querySelectorAll('.hero-kicker-copy');
    const clockElement = element.querySelector<HTMLElement>('.hero-clock');

    expect(kickerCopies).toHaveLength(2);
    expect(normalizedText(kickerCopies.item(0))).toBe(
      'Backend Software Engineer · Bangkok, Thailand',
    );
    expect(normalizedText(kickerCopies.item(1))).toBe('UTC+7 · 2026-01-02 08:04:05');
    expect(normalizedText(clockElement)).toBe('2026-01-02 08:04:05');
    expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(true);
    expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(false);
  });

  it('selects a valid transition from HERO_CLOCK_TRANSITIONS by default and applies its modifier class', () => {
    vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
    const element = renderHero().nativeElement as HTMLElement;
    const clockElement = element.querySelector<HTMLElement>('.hero-clock');
    const configuredTransitions = TestBed.inject(HERO_CLOCK_TRANSITIONS);

    const activeTransitionClasses = configuredTransitions
      .map((t) => `hero-clock--${t}`)
      .filter((cls) => clockElement?.classList.contains(cls));

    expect(activeTransitionClasses).toHaveLength(1);
    const activeTransition = activeTransitionClasses[0].replace(
      'hero-clock--',
      '',
    ) as HeroClockTransition;
    expect(configuredTransitions).toContain(activeTransition);
  });

  describe.each(ALL_CLOCK_TRANSITIONS)('with transition mode "%s"', (transitionMode) => {
    beforeEach(() => {
      TestBed.overrideProvider(heroClockTransitionPicker, {
        useValue: () => transitionMode,
      });
    });

    it(`binds hero-clock--${transitionMode} modifier class and excludes other transition classes`, () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      const element = renderHero().nativeElement as HTMLElement;
      const clockElement = element.querySelector<HTMLElement>('.hero-clock');

      expect(clockElement?.classList.contains(`hero-clock--${transitionMode}`)).toBe(true);

      for (const otherMode of ALL_CLOCK_TRANSITIONS.filter((m) => m !== transitionMode)) {
        expect(clockElement?.classList.contains(`hero-clock--${otherMode}`)).toBe(false);
      }
    });

    it('alternates tick animation classes and updates timestamp across one-second ticks', () => {
      vi.setSystemTime(new Date('2026-01-02T10:59:58.000Z'));
      const heroFixture = renderHero();
      const clockElement = (heroFixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
        '.hero-clock',
      );

      expect(clockElement?.classList.contains(`hero-clock--${transitionMode}`)).toBe(true);
      expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(true);
      expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(false);
      expect(normalizedText(clockElement)).toBe('2026-01-02 17:59:58');

      vi.advanceTimersByTime(1_000);
      heroFixture.detectChanges();

      expect(clockElement?.classList.contains(`hero-clock--${transitionMode}`)).toBe(true);
      expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(true);
      expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(false);
      expect(normalizedText(clockElement)).toBe('2026-01-02 17:59:59');

      vi.advanceTimersByTime(1_000);
      heroFixture.detectChanges();

      expect(clockElement?.classList.contains(`hero-clock--${transitionMode}`)).toBe(true);
      expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(true);
      expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(false);
      expect(normalizedText(clockElement)).toBe('2026-01-02 18:00:00');
    });
  });

  it('alternates tick animation classes and updates timestamp across repeated one-second ticks', () => {
    vi.setSystemTime(new Date('2026-01-02T10:59:58.000Z'));
    const heroFixture = renderHero();
    const clockElement = (heroFixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.hero-clock',
    );

    expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(true);
    expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(false);
    expect(normalizedText(clockElement)).toBe('2026-01-02 17:59:58');

    // First tick: toggles to tick-a and advances by one second
    vi.advanceTimersByTime(1_000);
    heroFixture.detectChanges();

    expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(true);
    expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(false);
    expect(normalizedText(clockElement)).toBe('2026-01-02 17:59:59');

    // Second tick: toggles back to tick-b and advances by another second
    vi.advanceTimersByTime(1_000);
    heroFixture.detectChanges();

    expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(true);
    expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(false);
    expect(normalizedText(clockElement)).toBe('2026-01-02 18:00:00');

    // Third tick: toggles to tick-a again and advances by another second
    vi.advanceTimersByTime(1_000);
    heroFixture.detectChanges();

    expect(clockElement?.classList.contains('hero-clock-tick-a')).toBe(true);
    expect(clockElement?.classList.contains('hero-clock-tick-b')).toBe(false);
    expect(normalizedText(clockElement)).toBe('2026-01-02 18:00:01');
  });

  it('uses the UTC+7 calendar date when it differs from UTC', () => {
    vi.setSystemTime(new Date('2026-12-31T18:02:03.000Z'));

    const element = renderHero().nativeElement as HTMLElement;

    expect(normalizedText(element.querySelector('.hero-clock'))).toBe('2027-01-01 01:02:03');
  });

  it('refreshes from the current system time on each one-second tick', () => {
    vi.setSystemTime(new Date('2026-01-02T10:59:58.000Z'));
    const heroFixture = renderHero();
    const element = heroFixture.nativeElement as HTMLElement;
    expect(normalizedText(element.querySelector('.hero-clock'))).toBe('2026-01-02 17:59:58');
    expect(renderedStatusColor(element)).toBe(AVAILABLE_COLOR);

    vi.setSystemTime(new Date('2026-01-02T11:04:30.000Z'));
    vi.advanceTimersByTime(1_000);
    heroFixture.detectChanges();

    expect(normalizedText(element.querySelector('.hero-clock'))).toBe('2026-01-02 18:04:31');
    expect(renderedStatusColor(element)).toBe(LIMITED_COLOR);
  });

  it.each(AVAILABILITY_BOUNDARIES)(
    'changes the rendered status color at $label UTC+7',
    ({ instantBeforeBoundary, colorBeforeBoundary, colorAtBoundary }) => {
      vi.setSystemTime(new Date(instantBeforeBoundary));
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      expect(renderedStatusColor(element)).toBe(colorBeforeBoundary);

      vi.advanceTimersByTime(1_000);
      heroFixture.detectChanges();

      expect(renderedStatusColor(element)).toBe(colorAtBoundary);
    },
  );

  describe('dynamic favicon synchronization', () => {
    it('sets the available favicon on initial render during workday working hours', () => {
      vi.setSystemTime(new Date('2026-01-05T10:00:00+07:00'));
      renderHero();

      expect(renderedFaviconHref()).toBe(AVAILABLE_FAVICON);
    });

    it('sets the limited favicon on initial render during off-hours or weekends', () => {
      vi.setSystemTime(new Date('2026-01-05T07:00:00+07:00'));
      renderHero();

      expect(renderedFaviconHref()).toBe(LIMITED_FAVICON);

      vi.setSystemTime(new Date('2026-01-10T14:00:00+07:00'));
      fixture?.destroy();
      renderHero();

      expect(renderedFaviconHref()).toBe(LIMITED_FAVICON);
    });

    it('sets the unavailable favicon on initial render during night hours', () => {
      vi.setSystemTime(new Date('2026-01-05T23:00:00+07:00'));
      renderHero();

      expect(renderedFaviconHref()).toBe(UNAVAILABLE_FAVICON);
    });

    it.each(AVAILABILITY_BOUNDARIES)(
      'synchronizes the document favicon at $label UTC+7',
      ({ instantBeforeBoundary, colorBeforeBoundary, colorAtBoundary }) => {
        vi.setSystemTime(new Date(instantBeforeBoundary));
        const heroFixture = renderHero();

        expect(renderedFaviconHref()).toBe(COLOR_TO_FAVICON[colorBeforeBoundary]);

        vi.advanceTimersByTime(1_000);
        heroFixture.detectChanges();

        expect(renderedFaviconHref()).toBe(COLOR_TO_FAVICON[colorAtBoundary]);
      },
    );

    it('updates existing link[rel="icon"] element in place without creating duplicates', () => {
      const initialLink = document.createElement('link');
      initialLink.setAttribute('rel', 'icon');
      initialLink.setAttribute('type', 'image/svg+xml');
      initialLink.setAttribute('href', 'https://resume-images.ohm-mho.space/favicon.svg');
      document.head.appendChild(initialLink);

      vi.setSystemTime(new Date('2026-01-05T10:00:00+07:00'));
      renderHero();

      const iconLinks = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
      expect(iconLinks.length).toBe(1);
      expect(iconLinks[0].getAttribute('href')).toBe(AVAILABLE_FAVICON);
      expect(renderedFaviconHref()).toBe(AVAILABLE_FAVICON);
    });

    it('refreshes the favicon when system time updates across clock ticks', () => {
      vi.setSystemTime(new Date('2026-01-02T10:59:58.000Z'));
      const heroFixture = renderHero();

      expect(renderedFaviconHref()).toBe(AVAILABLE_FAVICON);

      vi.setSystemTime(new Date('2026-01-02T11:04:30.000Z'));
      vi.advanceTimersByTime(1_000);
      heroFixture.detectChanges();

      expect(renderedFaviconHref()).toBe(LIMITED_FAVICON);
    });
  });

  describe('status dot luminance oscillation and custom property binding', () => {
    it('binds both --status-dot-color and --status-dot-luminance custom properties to .status-dot', () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      const element = renderHero().nativeElement as HTMLElement;
      const statusDot = element.querySelector<HTMLElement>('.status-dot');

      expect(statusDot).not.toBeNull();
      expect(renderedStatusColor(element)).toBeTruthy();
      expect(renderedStatusLuminance(element)).toBe('1');
    });

    it('oscillates luminance across time advances adhering to 0.5 Hz sinusoidal cycle', () => {
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      // Initial at t = 0 ms: peak L(0) = 1.0
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(1.0, 5);

      // Advance 5 frames (80 ms): beginning descent L(0.08) ≈ 0.98
      vi.advanceTimersByTime(80);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.98, 2);

      // Advance 5 more frames (total 160 ms): continuing gradual descent L(0.16) ≈ 0.94
      vi.advanceTimersByTime(80);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.9, 1);

      // Advance 11 more frames (total 336 ms / 21 frames): descending toward midpoint L(0.336) ≈ 0.75
      vi.advanceTimersByTime(176);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.7, 1);
    });

    it('alters oscillation amplitude when STATUS_LUMINANCE_A is overridden', () => {
      TestBed.overrideProvider(STATUS_LUMINANCE_A, { useValue: 0.2 });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      // Initial peak at t = 0: 0.5 + 0.2 = 0.7
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.7, 5);

      // Advance 160 ms (10 frames): 0.5 + 0.2 * cos(0.16pi) ≈ 0.68
      vi.advanceTimersByTime(160);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.7, 1);
    });

    it('alters starting phase when STATUS_LUMINANCE_PHI is overridden', () => {
      TestBed.overrideProvider(STATUS_LUMINANCE_PHI, { useValue: Math.PI });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      // Initial at t = 0 with PHI = PI: 0.5 + 0.5 * cos(PI) = 0.0 (starts at trough)
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.0, 5);

      // Advance 160 ms (10 frames): 0.5 + 0.5 * cos(0.16pi + pi) ≈ 0.06
      vi.advanceTimersByTime(160);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.1, 1);
    });

    it('alters oscillation period when STATUS_LUMINANCE_F is overridden', () => {
      TestBed.overrideProvider(STATUS_LUMINANCE_F, { useValue: 1 });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      // Initial peak at t = 0: 1.0
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(1.0, 5);

      // At f = 1 Hz, half-period trough is at ~500 ms (32 frames / 512 ms): L ≈ 0.0
      vi.advanceTimersByTime(512);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.0, 1);

      // Full period peak at ~1000 ms (63 frames / 1008 ms): L ≈ 1.0
      vi.advanceTimersByTime(496);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(1.0, 1);
    });

    it('alters oscillation period when STATUS_LUMINANCE_OMEGA is overridden directly', () => {
      TestBed.overrideProvider(STATUS_LUMINANCE_OMEGA, { useValue: 4 * Math.PI });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      // OMEGA = 4*PI implies f = 2 Hz, half-period is 250 ms (16 frames / 256 ms, trough L ≈ 0.0)
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(1.0, 5);

      vi.advanceTimersByTime(256);
      heroFixture.detectChanges();
      expect(renderedStatusLuminanceNumber(element)).toBeCloseTo(0.0, 1);
    });

    it('declares reduced-motion style rule overriding luminance to a static midpoint', () => {
      renderHero();
      const styleElements = Array.from(document.querySelectorAll('style'));
      const combinedCss = styleElements.map((el) => el.textContent).join('\n');

      expect(combinedCss).toContain('prefers-reduced-motion');
      expect(combinedCss).toContain('--status-dot-luminance');
      expect(combinedCss).toContain('0.5');
    });
  });

  describe('hero code badges circular orbital motion and custom property bindings', () => {
    it('binds initial circular orbital coordinates to .hero-code-left and .hero-code-right at current Unix time', () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      const element = renderHero().nativeElement as HTMLElement;
      const leftBadge = element.querySelector<HTMLElement>('.hero-code-left');
      const rightBadge = element.querySelector<HTMLElement>('.hero-code-right');

      expect(leftBadge).not.toBeNull();
      expect(rightBadge).not.toBeNull();

      const calcHeroPos = TestBed.inject(calculateHeroCodePosition);
      const expectedPos = calcHeroPos(Date.now() / 1000);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(expectedPos.left.x, 2);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(expectedPos.left.y, 2);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(expectedPos.right.x, 2);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(expectedPos.right.y, 2);
    });

    it('evolves orbital coordinates smoothly over time adhering to angular frequency', () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      TestBed.overrideProvider(HERO_CODE_F, { useValue: 1 });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      // Initial coordinates anchored to current Unix time Date.now() / 1000
      const initialSeconds = Date.now() / 1000;
      const calcHeroPos = TestBed.inject(calculateHeroCodePosition);
      const initialPos = calcHeroPos(initialSeconds);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(initialPos.left.x, 2);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(initialPos.left.y, 2);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(initialPos.right.x, 2);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(initialPos.right.y, 2);

      // Advance 16 frames (256 ms, approx quarter cycle)
      vi.advanceTimersByTime(256);
      heroFixture.detectChanges();
      const pos256 = calcHeroPos(initialSeconds + 0.256);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(pos256.left.x, -1);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(pos256.left.y, -1);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(pos256.right.x, -1);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(pos256.right.y, -1);

      // Advance 16 more frames (total 512 ms / 32 frames, approx half cycle)
      vi.advanceTimersByTime(256);
      heroFixture.detectChanges();
      const pos512 = calcHeroPos(initialSeconds + 0.512);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(pos512.left.x, -1);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(pos512.left.y, -1);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(pos512.right.x, -1);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(pos512.right.y, -1);

      // Advance 31 more frames (total 1008 ms / 63 frames, approx full cycle for right badge)
      vi.advanceTimersByTime(496);
      heroFixture.detectChanges();
      const pos1008 = calcHeroPos(initialSeconds + 1.008);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(pos1008.left.x, -1);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(pos1008.left.y, -1);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(pos1008.right.x, -1);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(pos1008.right.y, -1);
    });

    it.each([
      { date: '2026-01-01T00:00:00+07:00', expectedDay: 1 },
      { date: '2026-01-15T12:00:00+07:00', expectedDay: 15 },
      { date: '2026-01-31T23:59:59+07:00', expectedDay: 31 },
      { date: '2026-12-31T18:00:00.000Z', expectedDay: 1 }, // 2027-01-01 01:00:00 UTC+7
    ])(
      'derives orbital frequency from current UTC+7 day of month ($date -> day $expectedDay)',
      ({ date, expectedDay }) => {
        vi.setSystemTime(new Date(date));
        const expectedFrequency = expectedDay / 3600;
        const expectedOmega = (2 * Math.PI * expectedDay) / 3600;

        expect(TestBed.inject(HERO_CODE_F)).toBeCloseTo(expectedFrequency, 8);
        expect(TestBed.inject(HERO_CODE_OMEGA)).toBeCloseTo(expectedOmega, 8);
      },
    );

    it('alters orbital radius when HERO_CODE_R_LEFT is overridden', () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      TestBed.overrideProvider(HERO_CODE_R_LEFT, { useValue: 80 });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      const calcHeroPos = TestBed.inject(calculateHeroCodePosition);
      const expectedPos = calcHeroPos(Date.now() / 1000);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(expectedPos.left.x, 2);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(expectedPos.left.y, 2);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(expectedPos.right.x, 2);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(expectedPos.right.y, 2);
    });

    it('alters orbital radius when HERO_CODE_R_RIGHT is overridden', () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      TestBed.overrideProvider(HERO_CODE_R_RIGHT, { useValue: 100 });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      const calcHeroPos = TestBed.inject(calculateHeroCodePosition);
      const expectedPos = calcHeroPos(Date.now() / 1000);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(expectedPos.left.x, 2);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(expectedPos.left.y, 2);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(expectedPos.right.x, 2);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(expectedPos.right.y, 2);
    });

    it('alters starting phase when HERO_CODE_PHI_LEFT and HERO_CODE_PHI_RIGHT are overridden', () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      TestBed.overrideProvider(HERO_CODE_PHI_LEFT, { useValue: 0 });
      TestBed.overrideProvider(HERO_CODE_PHI_RIGHT, { useValue: Math.PI });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      const calcHeroPos = TestBed.inject(calculateHeroCodePosition);
      const expectedPos = calcHeroPos(Date.now() / 1000);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(expectedPos.left.x, 2);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(expectedPos.left.y, 2);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(expectedPos.right.x, 2);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(expectedPos.right.y, 2);
    });

    it('alters orbital period when HERO_CODE_OMEGA is overridden directly', () => {
      vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
      TestBed.overrideProvider(HERO_CODE_OMEGA, { useValue: Math.PI });
      const heroFixture = renderHero();
      const element = heroFixture.nativeElement as HTMLElement;

      const initialSeconds = Date.now() / 1000;
      const calcHeroPos = TestBed.inject(calculateHeroCodePosition);
      const initialPos = calcHeroPos(initialSeconds);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(initialPos.left.x, 2);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(initialPos.left.y, 2);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(initialPos.right.x, 2);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(initialPos.right.y, 2);

      // Advance 63 frames (1008 ms, phase advanced by 1.008 * PI = 181.44°): positions invert across origin
      vi.advanceTimersByTime(1008);
      heroFixture.detectChanges();
      const advancedPos = calcHeroPos(initialSeconds + 1.008);
      expect(renderedHeroCodeLeftX(element)).toBeCloseTo(advancedPos.left.x, -1);
      expect(renderedHeroCodeLeftY(element)).toBeCloseTo(advancedPos.left.y, -1);
      expect(renderedHeroCodeRightX(element)).toBeCloseTo(advancedPos.right.x, -1);
      expect(renderedHeroCodeRightY(element)).toBeCloseTo(advancedPos.right.y, -1);
    });

    it('declares reduced-motion style rule overriding hero code coordinates to static default values', () => {
      renderHero();
      const styleElements = Array.from(document.querySelectorAll('style'));
      const combinedCss = styleElements.map((el) => el.textContent).join('\n');

      expect(combinedCss).toContain('prefers-reduced-motion');
      expect(combinedCss).toContain('--hero-code-left-x');
      expect(combinedCss).toContain('-32.04%');
      expect(combinedCss).toContain('--hero-code-left-y');
      expect(combinedCss).toContain('-18.5%');
      expect(combinedCss).toContain('--hero-code-right-x');
      expect(combinedCss).toContain('43.3%');
      expect(combinedCss).toContain('25%');
    });

    it('renders left and right hero code badges intact on a single line with exact text content', () => {
      const element = renderHero().nativeElement as HTMLElement;
      const leftBadge = element.querySelector<HTMLElement>('.hero-code-left');
      const rightBadge = element.querySelector<HTMLElement>('.hero-code-right');

      expect(leftBadge).not.toBeNull();
      expect(rightBadge).not.toBeNull();

      if (leftBadge && rightBadge) {
        expect(leftBadge.textContent).toBe('</>');
        expect(leftBadge.textContent.length).toBe(3);
        expect(leftBadge.textContent).not.toContain('\n');

        expect(rightBadge.textContent).toBe('{ }');
        expect(rightBadge.textContent.length).toBe(3);
        expect(rightBadge.textContent).not.toContain('\n');
      }
    });

    it('declares non-wrapping and 3ch minimum width style rules for hero code badges', () => {
      renderHero();
      const styleElements = Array.from(document.querySelectorAll('style'));
      const combinedCss = styleElements.map((el) => el.textContent).join('\n');

      expect(combinedCss).toContain('white-space: nowrap');
      expect(combinedCss).toContain('min-width: 3ch');
    });
  });

  it('clears its one-second interval and animation frame when destroyed', () => {
    vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
    const initialTimerCount = vi.getTimerCount();
    const setInterval = vi.spyOn(window, 'setInterval');
    const clearInterval = vi.spyOn(window, 'clearInterval');
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame');
    const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame');
    const heroFixture = renderHero();
    const clockTimerIndex = setInterval.mock.calls.findIndex(([, delay]) => delay === 1_000);
    const clockTimerId: unknown = setInterval.mock.results[clockTimerIndex]?.value;
    const animationFrameId: unknown = requestAnimationFrame.mock.results[0]?.value;

    expect(clockTimerIndex).toBeGreaterThanOrEqual(0);
    expect(clockTimerId).toBeDefined();
    expect(animationFrameId).toBeDefined();
    expect(vi.getTimerCount()).toBe(initialTimerCount + 2);

    heroFixture.destroy();
    fixture = null;

    expect(clearInterval).toHaveBeenCalledWith(clockTimerId);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(animationFrameId);
    expect(vi.getTimerCount()).toBe(initialTimerCount);
  });
});

describe('heroClockTransitionPicker', () => {
  it('selects each transition style across Math.random distribution ranges', () => {
    const mathRandomSpy = vi.spyOn(Math, 'random');
    const picker = TestBed.inject(heroClockTransitionPicker);

    mathRandomSpy.mockReturnValue(0.0);
    expect(TestBed.runInInjectionContext(() => picker())).toBe('slide-fade');

    mathRandomSpy.mockReturnValue(0.4);
    expect(TestBed.runInInjectionContext(() => picker())).toBe('opacity-pulse');

    mathRandomSpy.mockReturnValue(0.8);
    expect(TestBed.runInInjectionContext(() => picker())).toBe('soft-glow');
  });
});

describe('calculateHeroCodePosition', () => {
  it('computes exact orbital coordinates given elapsed seconds and injected parameters', () => {
    const calcFn = TestBed.inject(calculateHeroCodePosition);

    const pos0 = calcFn(0);
    expect(pos0.left.x).toBeCloseTo(37.0, 4);
    expect(pos0.left.y).toBeCloseTo(0.0, 4);
    expect(pos0.right.x).toBeCloseTo(50.0, 4);
    expect(pos0.right.y).toBeCloseTo(0.0, 4);

    const pos1 = calcFn(10);
    expect(typeof pos1.left.x).toBe('number');
    expect(typeof pos1.left.y).toBe('number');
    expect(typeof pos1.right.x).toBe('number');
    expect(typeof pos1.right.y).toBe('number');
  });

  it('computes orbital coordinates when radius tokens are overridden', () => {
    TestBed.overrideProvider(HERO_CODE_R_LEFT, { useValue: 80 });
    TestBed.overrideProvider(HERO_CODE_R_RIGHT, { useValue: 100 });
    const calcFn = TestBed.inject(calculateHeroCodePosition);

    const pos0 = calcFn(0);
    expect(pos0.left.x).toBeCloseTo(80.0, 3);
    expect(pos0.left.y).toBeCloseTo(0.0, 3);
    expect(pos0.right.x).toBeCloseTo(100.0, 4);
    expect(pos0.right.y).toBeCloseTo(0.0, 4);
  });
});
