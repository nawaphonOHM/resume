/** Verifies fixed UTC+7 clock and availability rendering, updates, and timer lifecycle. */
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { RESUME } from '../../data/resume/resume.data';
import { HeroSection } from './hero-section';

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
    fixture = TestBed.createComponent(HeroSection);
    fixture.componentRef.setInput('profile', RESUME);
    fixture.detectChanges();
    return fixture;
  }

  it('renders separate profile and UTC+7 kicker lines with an immediate timestamp', () => {
    vi.setSystemTime(new Date('2026-01-02T01:04:05.000Z'));

    const element = renderHero().nativeElement as HTMLElement;
    const kickerCopies = element.querySelectorAll('.hero-kicker-copy');

    expect(kickerCopies).toHaveLength(2);
    expect(normalizedText(kickerCopies.item(0))).toBe(
      'Backend Software Engineer · Bangkok, Thailand',
    );
    expect(normalizedText(kickerCopies.item(1))).toBe('UTC+7 · 2026-01-02 08:04:05');
    expect(normalizedText(element.querySelector('.hero-clock'))).toBe('2026-01-02 08:04:05');
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
