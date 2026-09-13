/** Verifies fixed UTC+7 clock, transition animations, availability rendering, updates, and timer lifecycle. */
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { resumeData } from '../../helper/injection-token/resume.data.ts';
import { HERO_CLOCK_TRANSITIONS } from '../../helper/injection-token/hero-clock-transitions.variable.ts';
import { heroClockTransitionPicker } from '../../helper/injection-token/hero-clock-transition-picker.variable.ts';
import type { HeroClockTransition } from '../../helper/type/hero-clock-transistion.type.ts';
import { HeroSection } from './hero-section';

const ALL_CLOCK_TRANSITIONS: readonly HeroClockTransition[] = [
  'slide-fade',
  'opacity-pulse',
  'soft-glow',
];

const AVAILABLE_COLOR = '#92C353';
const LIMITED_COLOR = '#F7A600';
const UNAVAILABLE_COLOR = '#D1D1D1';

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
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function renderedStatusColor(element: HTMLElement): string {
  return (
    element
      .querySelector<HTMLElement>('.status-dot')
      ?.style.getPropertyValue('--status-dot-color') ?? ''
  );
}

describe('HeroSection', () => {
  let fixture: ComponentFixture<HeroSection> | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSection],
      providers: [provideRouter([])],
    }).compileComponents();
    vi.useFakeTimers();
    fixture = null;
  });

  afterEach(() => {
    fixture?.destroy();
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

  it('clears its one-second interval when destroyed', () => {
    vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));
    const initialTimerCount = vi.getTimerCount();
    const setInterval = vi.spyOn(window, 'setInterval');
    const clearInterval = vi.spyOn(window, 'clearInterval');
    const heroFixture = renderHero();
    const clockTimerIndex = setInterval.mock.calls.findIndex(([, delay]) => delay === 1_000);
    const clockTimerId = setInterval.mock.results[clockTimerIndex]?.value;

    expect(clockTimerIndex).toBeGreaterThanOrEqual(0);
    expect(clockTimerId).toBeDefined();
    expect(vi.getTimerCount()).toBe(initialTimerCount + 1);

    heroFixture.destroy();
    fixture = null;

    expect(clearInterval).toHaveBeenCalledWith(clockTimerId);
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
