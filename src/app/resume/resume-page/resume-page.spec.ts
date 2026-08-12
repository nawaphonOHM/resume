import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RESUME_THEME_STORAGE_KEY } from '../../core/theme.service';
import { RESUME } from '../../data/resume/resume.data';
import { ResumePage } from './resume-page';

describe('ResumePage', () => {
  let observerCallback: IntersectionObserverCallback;
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    observe = vi.fn();
    disconnect = vi.fn();
    scrollIntoView = vi.fn();

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

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
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
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

    const educationSection = element.querySelector<HTMLElement>('#education');
    const projectLink = educationSection?.querySelector<HTMLAnchorElement>(
      `a[href="${RESUME.education.seniorProject.url}"]`,
    );
    const educationText = educationSection?.textContent?.replace(/\s+/g, ' ').trim();
    const gpaxValue = Array.from(educationSection?.querySelectorAll('dt') ?? [])
      .find((term) => term.textContent?.trim() === 'GPAX')
      ?.nextElementSibling?.textContent?.trim();

    expect(sectionIds).toEqual(['about', 'experience', 'education', 'skills', 'profile']);
    expect(element.querySelector('h1')?.textContent).toContain('Nawaphon Isarathanachaikul');
    expect(element.querySelectorAll('.experience-card')).toHaveLength(5);
    expect(educationSection?.getAttribute('aria-labelledby')).toBe('education-title');
    expect(educationSection?.querySelector('#education-title')?.textContent?.trim()).toBe(
      'Education',
    );
    expect(educationText).toContain(RESUME.education.degree);
    expect(educationText).toContain(RESUME.education.institution);
    expect(educationText).toContain(RESUME.education.period);
    expect(gpaxValue).toBe(RESUME.education.gpax);
    expect(educationText).toContain(`Senior project: ${RESUME.education.seniorProject.name}`);
    expect(projectLink?.textContent).toContain('View source code');
    expect(projectLink?.getAttribute('aria-label')).toBe(
      `View source code for ${RESUME.education.seniorProject.name} (opens in a new tab)`,
    );
    expect(projectLink?.getAttribute('target')).toBe('_blank');
    expect(projectLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(element.querySelectorAll('.skills-panel mat-chip')).toHaveLength(6);
    expect(element.textContent).toContain('Available on request');
    expect(element.querySelector('a[href^="tel:"]')).toBeNull();
    expect(element.querySelector('a[href="mailto:nawaphon2539@gmail.com"]')).not.toBeNull();
    expect(externalLinks).toHaveLength(3);
    expect(externalLinks.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(
      true,
    );
  });

  it('renders the official university logo beside the accessible institution identity', () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const identity = element.querySelector<HTMLElement>('#education .institution-identity');
    const logoFrame = identity?.querySelector<HTMLElement>('.institution-logo-frame');
    const logo = logoFrame?.querySelector<HTMLImageElement>('.institution-logo');
    const printIcon = identity?.querySelector<HTMLElement>('.education-icon--print');

    expect(identity?.querySelector('.institution')?.textContent?.trim()).toBe(
      RESUME.education.institution,
    );
    expect(logo?.getAttribute('src')).toBe(RESUME.education.institutionLogo.src);
    expect(logo?.getAttribute('width')).toBe(String(RESUME.education.institutionLogo.width));
    expect(logo?.getAttribute('height')).toBe(String(RESUME.education.institutionLogo.height));
    expect(logo?.getAttribute('alt')).toBe('');
    expect(logo?.getAttribute('loading')).toBe('lazy');
    expect(
      logoFrame?.classList.contains(
        `institution-logo-frame--${RESUME.education.institutionLogo.surface}`,
      ),
    ).toBe(true);
    expect(identity?.querySelectorAll('a')).toHaveLength(0);
    expect(printIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(printIcon!).display).toBe('none');
  });

  it('renders one accessible employment type marker for every experience', () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll<HTMLElement>('.experience-card'));
    const expectedLabels = [
      'Contract',
      'Contract',
      'Contract',
      'Permanent',
      'Internship → Permanent',
    ];
    const markersByCard = cards.map((card) =>
      Array.from(card.querySelectorAll<HTMLElement>('.employment-type')),
    );

    expect(cards).toHaveLength(5);
    expect(markersByCard.every((markers) => markers.length === 1)).toBe(true);
    expect(markersByCard.map(([marker]) => marker.textContent?.trim())).toEqual(expectedLabels);
    expect(markersByCard.map(([marker]) => marker.getAttribute('aria-label'))).toEqual(
      expectedLabels.map((label) => `Employment type: ${label}`),
    );
  });

  it('renders outsourced employer-to-client relationships and direct company identities', () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll<HTMLElement>('.experience-card'));

    expect(cards).toHaveLength(RESUME.experience.length);

    cards.forEach((card, index) => {
      const job = RESUME.experience[index];
      const client = 'client' in job ? job.client : undefined;
      const identities = Array.from(card.querySelectorAll<HTMLElement>('.company-identity'));
      const expectedIdentities = [
        {
          label: client ? 'Employer' : 'Company',
          name: job.company,
          logo: job.companyLogo,
        },
        ...(client
          ? [
              {
                label: 'Client',
                name: client.name,
                logo: client.logo,
              },
            ]
          : []),
      ];
      const printCompany = card.querySelector<HTMLElement>('.company');

      expect(identities).toHaveLength(expectedIdentities.length);

      identities.forEach((identity, identityIndex) => {
        const expected = expectedIdentities[identityIndex];
        const logo = identity.querySelector<HTMLImageElement>('.company-logo');
        const logoFrame = identity.querySelector<HTMLElement>('.company-logo-frame');

        expect(identity.querySelector('.company-label')?.textContent?.trim()).toBe(expected.label);
        expect(identity.querySelector('.company-name')?.textContent?.trim()).toBe(expected.name);
        expect(logo?.getAttribute('src')).toBe(expected.logo.src);
        expect(logo?.getAttribute('width')).toBe(String(expected.logo.width));
        expect(logo?.getAttribute('height')).toBe(String(expected.logo.height));
        expect(logo?.getAttribute('alt')).toBe('');
        expect(logo?.getAttribute('loading')).toBe('lazy');
        expect(logoFrame?.classList.contains(`company-logo-frame--${expected.logo.surface}`)).toBe(
          true,
        );
      });

      const arrows = card.querySelectorAll<HTMLElement>('.company-relationship-arrow');
      expect(arrows).toHaveLength(client ? 1 : 0);
      if (client) {
        expect(arrows.item(0).textContent?.trim()).toBe('→');
        expect(arrows.item(0).getAttribute('aria-hidden')).toBe('true');
      }

      expect(printCompany?.textContent?.trim()).toBe(job.company);
      expect(getComputedStyle(printCompany!).display).toBe('none');
    });

    const logos = Array.from(element.querySelectorAll<HTMLImageElement>('.company-logo'));
    const clientIdentities = Array.from(
      element.querySelectorAll<HTMLElement>('.company-identity--client'),
    );

    expect(logos).toHaveLength(8);
    expect(logos.every((logo) => logo.getAttribute('alt') === '')).toBe(true);
    expect(
      logos.every((logo) => logo.getAttribute('src')?.startsWith('/images/company-logos/')),
    ).toBe(true);
    expect(
      clientIdentities.map((identity) =>
        identity.querySelector('.company-name')?.textContent?.trim(),
      ),
    ).toEqual(['InnovestX', 'Ayudhya Capital Services (AYCAP)', 'TISCO Bank']);
    expect(
      clientIdentities.map((identity) =>
        identity.querySelector<HTMLImageElement>('.company-logo')?.getAttribute('src'),
      ),
    ).toEqual([
      '/images/company-logos/innovestx.png',
      '/images/company-logos/krungsri.png',
      '/images/company-logos/tisco.svg',
    ]);
    expect(element.querySelectorAll('.company-identity--client .company-label')).toHaveLength(3);
    expect(element.querySelectorAll('.company-relationship-arrow')).toHaveLength(3);
    expect(element.querySelectorAll('.company-identities a')).toHaveLength(0);
  });

  it('renders the backend-first profile and four summary cards', () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const text = (selector: string) =>
      element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
    const summaries = Array.from(
      element.querySelectorAll('.summary-card mat-card-content > p'),
    ).map((item) => item.textContent?.trim());

    expect(text('.hero-kicker')).toBe(`${RESUME.title} · ${RESUME.details.location}`);
    expect(text('.hero-role')).toBe(RESUME.title);
    expect(text('.hero-introduction')).toBe(
      'Building reliable APIs, data integrations, event-driven workflows, and responsive interfaces for financial and business systems.',
    );
    expect(summaries).toEqual(RESUME.summary);
    expect(summaries).toHaveLength(4);
    expect(text('footer p')).toBe(`${RESUME.name} · ${RESUME.title}`);
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

  it('updates active navigation from observed sections and disconnects cleanly', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const experienceSection = element.querySelector<HTMLElement>('#experience');
    const educationSection = element.querySelector<HTMLElement>('#education');

    expect(observe).toHaveBeenCalledTimes(5);
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
    await fixture.whenStable();

    expect(element.querySelector('nav a[href="#experience"]')?.getAttribute('aria-current')).toBe(
      'location',
    );

    observerCallback(
      [
        {
          isIntersecting: true,
          target: educationSection,
          boundingClientRect: { top: 12 },
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    await fixture.whenStable();

    expect(element.querySelector('nav a[href="#education"]')?.getAttribute('aria-current')).toBe(
      'location',
    );

    expect(disconnect).not.toHaveBeenCalled();
    fixture.destroy();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('skips section observation when IntersectionObserver is unavailable', async () => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: undefined,
    });
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(observe).not.toHaveBeenCalled();
    fixture.destroy();
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('restores active navigation from a valid initial section hash', async () => {
    history.replaceState(null, '', '#education');
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav a[href="#education"]')?.getAttribute('aria-current')).toBe(
      'location',
    );
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
  });
});
