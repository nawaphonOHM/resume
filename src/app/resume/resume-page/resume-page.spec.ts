/**
 * Exercises the composed résumé, section accessibility, navigation orchestration, theme, print,
 * download controls, image-zoom bindings, and viewport-tracking lifecycle.
 */
import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, ErrorHandler } from '@angular/core';
import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import {
  provideRouter,
  Router,
  RouterLink,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { routes } from '../../app.routes';
import { RESUME_THEME_STORAGE_KEY } from '../../core/theme.service';
import { IMAGE_ASSET_ORIGIN } from '../../data/image-assets';
import { RESUME } from '../../data/resume/resume.data';
import {
  TechnologyIconContrastService,
} from '../experience-timeline/technology-icon/service/technology-icon-contrast/technology-icon-contrast.service.ts';
import { TechnologyIconComponent } from '../experience-timeline/technology-icon/technology-icon.ts';
import {
  TECHNOLOGY_ICON_FALLBACK_LABELS,
  resolveTechnologyIcon,
  type TechnologyIconMetadata,
} from '../experience-timeline/technology-icon/technology-icons.ts';
import { ImageZoomDirective } from '../../directive/image-zome/image-zoom.directive.ts';
import { ResumeNavigation, type ResumeSectionId } from '../resume-navigation/resume-navigation';
import { RESUME_DEFER_BOUNDARIES, ResumePage } from './resume-page';
import {
  TechnologyIconPresentation
} from '../../helper/interface/technology-icon-presentation/technology-icon-presentation.interface.ts';
import ResumePdfService from '../resume-pdf/resume-pdf.service.ts';
import {BrandLogo} from '../../helper/interface/brand-logo/brand-logo.interface.ts';

const OPTIMIZED_ICON_SOURCE = 'data:image/png;base64,b3B0aW1pemVk';
const OPTIMIZED_ICON_BACKGROUND = '#0d1b2d';

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

/** Deterministic presentation fixture that keeps composed page tests independent of OpenCV. */
function optimizedPresentation(icon: TechnologyIconMetadata): TechnologyIconPresentation {
  return {
    logo: {
      ...icon,
      src: OPTIMIZED_ICON_SOURCE,
      surface: 'dark',
    },
    backgroundColor: OPTIMIZED_ICON_BACKGROUND,
  };
}

/** Starts the real Router scroller for a harness fixture that is not bootstrapped by Angular. */
function initializeRouterScrolling(harness: RouterTestingHarness): void {
  const applicationRef = TestBed.inject(ApplicationRef);
  applicationRef.components.unshift(harness.fixture.componentRef);
  applicationRef.componentTypes.unshift(harness.fixture.componentRef.componentType);

  try {
    for (const listener of TestBed.inject(APP_BOOTSTRAP_LISTENER)) {
      listener(harness.fixture.componentRef);
    }
  } finally {
    applicationRef.components.shift();
    applicationRef.componentTypes.shift();
  }
}

/** Renders all manually controlled boundaries before assertions that exercise complete content. */
async function renderDeferredSections(fixture: ComponentFixture<ResumePage>): Promise<void> {
  fixture.detectChanges();
  const deferBlocks = await fixture.getDeferBlocks();

  expect(deferBlocks).toHaveLength(3);
  for (const deferBlock of deferBlocks) {
    await deferBlock.render(DeferBlockState.Complete);
  }
  fixture.detectChanges();
}

/** Invokes the page-level print workflow while retaining its asynchronous completion handle. */
function requestPrint(fixture: ComponentFixture<ResumePage>): Promise<void> {
  return (
    fixture.componentInstance as unknown as {
      printResume(): Promise<void>;
    }
  ).printResume();
}

/** Supplies viewport-relative section bounds while retaining the element for replacement checks. */
function setSectionRect(
  root: ParentNode,
  sectionId: ResumeSectionId,
  top: number,
  bottom: number,
): HTMLElement {
  const element = root.querySelector<HTMLElement>(`#${sectionId}`);
  expect(element).not.toBeNull();
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: vi.fn(() => ({ top, bottom }) as DOMRect),
  });
  return element!;
}

/** Opens the responsive menu so page-level active state can be asserted in its rendered links. */
async function openMobileMenu(fixture: ComponentFixture<ResumePage>): Promise<HTMLElement> {
  const trigger = fixture.debugElement
    .query(By.directive(MatMenuTrigger))
    .injector.get(MatMenuTrigger);
  trigger.openMenu();
  fixture.detectChanges();
  await fixture.whenStable();

  const menu = document.querySelector<HTMLElement>('[role="menu"]');
  expect(menu).not.toBeNull();
  return menu!;
}

describe('ResumePage', () => {
  /** Synthetic document-scroll stream returned by the CDK dispatcher fixture. */
  let scrollEvents: Subject<void>;

  /** Synthetic viewport-resize stream returned by the CDK ruler fixture. */
  let viewportChangeEvents: Subject<Event>;

  /** Spies recording the requested CDK stream throttles. */
  let scrolled: ReturnType<typeof vi.fn<ScrollDispatcher['scrolled']>>;
  let viewportChanged: ReturnType<typeof vi.fn<ViewportRuler['change']>>;

  /** Deterministic page-coordinate viewport geometry consumed on every tracking event. */
  let getViewportRect: ReturnType<typeof vi.fn<ViewportRuler['getViewportRect']>>;

  /** Deterministic optimizer fixture used by every composed technology-icon presenter. */
  let optimize: ReturnType<typeof vi.fn<TechnologyIconContrastService['optimize']>>;

  /** PDF download fixture used to isolate page orchestration from the lazy runtime. */
  let download: ReturnType<typeof vi.fn<ResumePdfService['download']>>;

  /** Angular error-handler fixture that records rejected download attempts. */
  let handleError: ReturnType<typeof vi.fn<ErrorHandler['handleError']>>;

  beforeEach(async () => {
    scrollEvents = new Subject<void>();
    viewportChangeEvents = new Subject<Event>();

    /** Stable light-system preference fixture required by the page's theme service. */
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

    localStorage.clear();
    document.documentElement.classList.remove(
      'resume-profile-theme-light',
      'resume-profile-theme-dark',
      'resume-profile-theme-transitioning',
    );

    optimize = vi.fn<TechnologyIconContrastService['optimize']>((icon) =>
      Promise.resolve(optimizedPresentation(icon)),
    );
    download = vi.fn<ResumePdfService['download']>(() => Promise.resolve());
    handleError = vi.fn<ErrorHandler['handleError']>();

    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [ResumePage],
      providers: [
        provideRouter(
          routes,
          withInMemoryScrolling({
            anchorScrolling: 'enabled',
            scrollPositionRestoration: 'enabled',
          }),
          withRouterConfig({ onSameUrlNavigation: 'reload' }),
        ),
        { provide: TechnologyIconContrastService, useValue: { optimize } },
        { provide: ResumePdfService, useValue: { download } },
        { provide: ErrorHandler, useValue: { handleError } },
      ],
    }).compileComponents();

    scrolled = vi.spyOn(TestBed.inject(ScrollDispatcher), 'scrolled').mockReturnValue(scrollEvents);
    viewportChanged = vi
      .spyOn(TestBed.inject(ViewportRuler), 'change')
      .mockReturnValue(viewportChangeEvents);
    getViewportRect = vi.spyOn(TestBed.inject(ViewportRuler), 'getViewportRect').mockReturnValue({
      top: 1000,
      bottom: 2000,
      left: 0,
      right: 1200,
      width: 1200,
      height: 1000,
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    localStorage.clear();
    history.replaceState(null, '', location.pathname);
    document.documentElement.classList.remove(
      'resume-profile-theme-light',
      'resume-profile-theme-dark',
      'resume-profile-theme-transitioning',
    );
  });

  it('keeps the shell and hero eager while exposing three accessible placeholder roots', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();
    const element = fixture.nativeElement as HTMLElement;
    const placeholderRoots = Array.from(
      element.querySelectorAll<HTMLElement>('[data-resume-profile-defer-placeholder]'),
    );
    const anchors = Array.from(
      element.querySelectorAll<HTMLElement>('[data-resume-profile-section]'),
    );
    const groupedPlaceholder = element.querySelector<HTMLElement>(
      '.resume-profile-defer-placeholder--education-profile',
    );

    expect(deferBlocks).toHaveLength(3);
    expect(element.querySelector('app-resume-profile-navigation')).not.toBeNull();
    expect(element.querySelector('app-hero-section')).not.toBeNull();
    expect(element.querySelector('main#main-content')).not.toBeNull();
    expect(element.querySelector('footer')).not.toBeNull();
    expect(element.querySelector('app-summary-section')).toBeNull();
    expect(element.querySelector('app-experience-timeline')).toBeNull();
    expect(element.querySelector('app-education-section')).toBeNull();
    expect(element.querySelector('app-profile-sidebar')).toBeNull();
    expect(placeholderRoots).toHaveLength(3);
    expect(placeholderRoots.map((root) => root.getAttribute('role'))).toEqual([
      'status',
      'status',
      'status',
    ]);
    expect(placeholderRoots.every((root) => root.getAttribute('aria-busy') === 'true')).toBe(true);
    expect(anchors.map(({ id }) => id)).toEqual([
      'about',
      'experience',
      'education',
      'skills',
      'profile',
    ]);
    expect(anchors.every((anchor) => anchor.getAttribute('tabindex') === '-1')).toBe(true);
    expect(anchors.every((anchor) => anchor.hasAttribute('aria-labelledby'))).toBe(true);
    expect(groupedPlaceholder?.querySelectorAll(':scope > section')).toHaveLength(3);
    expect(element.querySelectorAll('[data-resume-profile-defer-settled]')).toHaveLength(0);
  });

  it('renders every deferred boundary once and marks complete content as settled', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
    const element = fixture.nativeElement as HTMLElement;
    const hosts = Array.from(
      element.querySelectorAll<HTMLElement>(
        'app-summary-section, app-experience-timeline, app-education-section, app-profile-sidebar',
      ),
    );
    const settledHosts = Array.from(
      element.querySelectorAll<HTMLElement>('[data-resume-profile-defer-settled]'),
    );

    expect(hosts.map(({ tagName }) => tagName.toLowerCase())).toEqual([
      'app-summary-section',
      'app-experience-timeline',
      'app-education-section',
      'app-profile-sidebar',
    ]);
    expect(
      settledHosts.map((host) => host.getAttribute('data-resume-profile-defer-settled')),
    ).toEqual(Object.values(RESUME_DEFER_BOUNDARIES));
    expect(settledHosts.map(({ tagName }) => tagName.toLowerCase())).toEqual([
      'app-summary-section',
      'app-experience-timeline',
      'app-profile-sidebar',
    ]);
    expect(element.querySelectorAll('[data-resume-profile-defer-placeholder]')).toHaveLength(0);
    expect(element.querySelectorAll('[data-resume-profile-section]')).toHaveLength(5);

    fixture.detectChanges();
    expect(Array.from(element.querySelectorAll('[data-resume-profile-defer-settled]'))).toEqual(
      settledHosts,
    );
  });

  it('preserves every fragment target and settlement marker in deferred error states', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();

    for (const deferBlock of deferBlocks) {
      await deferBlock.render(DeferBlockState.Error);
    }
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const errorRoots = Array.from(
      element.querySelectorAll<HTMLElement>('[data-resume-profile-defer-error]'),
    );
    const anchors = Array.from(
      element.querySelectorAll<HTMLElement>('[data-resume-profile-section]'),
    );

    expect(errorRoots).toHaveLength(3);
    expect(errorRoots.map((root) => root.getAttribute('role'))).toEqual([
      'alert',
      'alert',
      'alert',
    ]);
    expect(
      errorRoots.map((root) => root.getAttribute('data-resume-profile-defer-settled')),
    ).toEqual(Object.values(RESUME_DEFER_BOUNDARIES));
    expect(anchors.map(({ id }) => id)).toEqual([
      'about',
      'experience',
      'education',
      'skills',
      'profile',
    ]);
    expect(anchors.every((anchor) => anchor.getAttribute('tabindex') === '-1')).toBe(true);
    expect(anchors.every((anchor) => anchor.textContent?.includes('unavailable'))).toBe(true);
    expect(
      element
        .querySelector('.resume-profile-defer-error--education-profile')
        ?.querySelectorAll(':scope > section'),
    ).toHaveLength(3);
    expect(element.querySelector('app-summary-section')).toBeNull();
    expect(element.querySelector('app-experience-timeline')).toBeNull();
    expect(element.querySelector('app-education-section')).toBeNull();
    expect(element.querySelector('app-profile-sidebar')).toBeNull();
  });

  it('renders every résumé section and keeps public links safe', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
    const element = fixture.nativeElement as HTMLElement;

    const sectionIds = Array.from(
      element.querySelectorAll<HTMLElement>('[data-resume-profile-section]'),
    ).map((section) => section.id);
    const externalLinks = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'),
    );
    const heroExperienceAction =
      element.querySelector<HTMLAnchorElement>('a.hero-secondary-action');
    const routerManagedLinks = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('a[href^="/#"]'),
    );
    const experienceSection = element.querySelector<HTMLElement>('#experience');

    const educationSection = element.querySelector<HTMLElement>('#education');
    const projectLink = educationSection?.querySelector<HTMLAnchorElement>(
      `a[href="${RESUME.education.seniorProject.url}"]`,
    );
    const educationText = educationSection?.textContent?.replace(/\s+/g, ' ').trim();
    const gpaxValue = Array.from(educationSection?.querySelectorAll('dt') ?? [])
      .find((term) => term.textContent?.trim() === 'GPAX')
      ?.nextElementSibling?.textContent?.trim();

    expect(sectionIds).toEqual(['about', 'experience', 'education', 'skills', 'profile']);
    expect(heroExperienceAction).not.toBeNull();
    expect(heroExperienceAction?.getAttribute('href')).toBe('/#experience');
    expect(experienceSection).not.toBeNull();
    expect(routerManagedLinks).toHaveLength(8);
    expect(fixture.debugElement.queryAll(By.directive(RouterLink))).toHaveLength(8);
    for (const link of routerManagedLinks) {
      const targetId = link.getAttribute('href')?.slice(2);
      expect(targetId).toBeTruthy();
      expect(element.querySelector(`[id="${targetId}"]`)).not.toBeNull();
    }
    expect(element.querySelector('a.skip-link')?.getAttribute('href')).toBe('/#main-content');
    expect(element.querySelector('main#main-content')?.getAttribute('tabindex')).toBe('-1');
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

  it('renders the GitHub logo before its label and keeps the personal website text-only', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
    const element = fixture.nativeElement as HTMLElement;
    const [github, personalWebsite] = RESUME.links;
    const linksCard = element.querySelector<HTMLElement>('.links-card');
    const githubLink = linksCard?.querySelector<HTMLAnchorElement>(`a[href="${github.url}"]`);
    const personalWebsiteLink = linksCard?.querySelector<HTMLAnchorElement>(
      `a[href="${personalWebsite.url}"]`,
    );
    const githubIdentity = githubLink?.querySelector<HTMLElement>('.link-identity');
    const githubLogoFrame = githubIdentity?.querySelector<HTMLElement>('.link-logo-frame');
    const githubLogo = githubLogoFrame?.querySelector<HTMLImageElement>('.link-logo');
    const githubLabel = githubIdentity?.querySelector<HTMLElement>('.link-label');
    const githubExternalIcon = githubLink?.querySelector<HTMLElement>('mat-icon');

    expect(githubLabel?.textContent?.trim()).toBe(github.label);
    expect(githubLogo?.getAttribute('src')).toBe(github.logo.src);
    expect(githubLogo?.getAttribute('width')).toBe(String(github.logo.width));
    expect(githubLogo?.getAttribute('height')).toBe(String(github.logo.height));
    expect(githubLogo?.getAttribute('alt')).toBe('');
    expect(githubLogo?.getAttribute('loading')).toBe('lazy');
    expect(githubLogoFrame?.classList.contains(`link-logo-frame--${github.logo.surface}`)).toBe(
      true,
    );
    expect(getComputedStyle(githubLogoFrame!).backgroundColor).toBe('rgb(255, 255, 255)');
    document.documentElement.classList.add('resume-profile-theme-dark');
    expect(getComputedStyle(githubLogoFrame!).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(githubIdentity?.firstElementChild).toBe(githubLogoFrame);
    expect(githubLogoFrame?.nextElementSibling).toBe(githubLabel);
    expect(
      githubIdentity && githubExternalIcon
        ? githubIdentity.compareDocumentPosition(githubExternalIcon) &
            Node.DOCUMENT_POSITION_FOLLOWING
        : 0,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(personalWebsiteLink?.querySelector('.link-label')?.textContent?.trim()).toBe(
      personalWebsite.label,
    );
    expect(personalWebsiteLink?.querySelector('.link-logo-frame')).toBeNull();
    expect(personalWebsiteLink?.querySelector('img')).toBeNull();

    [
      { element: githubLink, url: github.url },
      { element: personalWebsiteLink, url: personalWebsite.url },
    ].forEach(({ element: link, url }) => {
      const externalIcon = link?.querySelector<HTMLElement>('mat-icon');

      expect(link?.getAttribute('href')).toBe(url);
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(externalIcon?.textContent?.trim()).toBe('open_in_new');
      expect(externalIcon?.hasAttribute('iconPositionEnd')).toBe(true);
      expect(externalIcon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('wires every rendered image for zoom with GitHub as the only touch exception', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
    await fixture.whenStable();
    const renderedImages = fixture.debugElement.queryAll(By.css('img'));
    const zoomImages = fixture.debugElement.queryAll(By.directive(ImageZoomDirective));
    const expectedBindings: Array<{
      readonly logo: BrandLogo;
      readonly label: string;
      readonly touch: boolean;
      readonly background?: string;
    }> = [];

    for (const job of RESUME.experience) {
      expectedBindings.push({ logo: job.companyLogo, label: job.company, touch: true });

      if ('client' in job) {
        expectedBindings.push({ logo: job.client.logo, label: job.client.name, touch: true });
      }

      for (const technology of job.technologies) {
        const logo = resolveTechnologyIcon(technology);

        if (logo) {
          const presentation = optimizedPresentation(logo);
          expectedBindings.push({
            logo: presentation.logo,
            label: technology,
            touch: true,
            background: presentation.backgroundColor,
          });
        }
      }
    }

    expectedBindings.push({
      logo: RESUME.education.institutionLogo,
      label: RESUME.education.institution,
      touch: true,
    });

    for (const link of RESUME.links) {
      if ('logo' in link) {
        expectedBindings.push({
          logo: link.logo,
          label: link.label,
          touch: link.label !== 'GitHub',
        });
      }
    }

    const actualBindings = zoomImages.map((image) => {
      const directive = image.injector.get(ImageZoomDirective);
      const background = directive.imageZoomBackground();

      return {
        logo: directive.appImageZoom(),
        label: directive.imageZoomLabel(),
        touch: directive.imageZoomTouch(),
        ...(background === undefined ? {} : { background }),
      };
    });

    expect(zoomImages.map(({ nativeElement }) => nativeElement)).toEqual(
      renderedImages.map(({ nativeElement }) => nativeElement),
    );
    expect(actualBindings).toEqual(expectedBindings);
    expect(actualBindings.filter(({ touch }) => !touch)).toEqual([
      { logo: RESUME.links[0].logo, label: 'GitHub', touch: false },
    ]);
  });

  it('renders the official university logo beside the accessible institution identity', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
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

  it('renders one accessible employment type marker for every experience', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
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

  it('renders every experience technology with one decorative leading icon', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll<HTMLElement>('.experience-card'));
    const zoomByImage = new Map(
      fixture.debugElement
        .queryAll(By.directive(ImageZoomDirective))
        .map((image) => [image.nativeElement, image.injector.get(ImageZoomDirective)] as const),
    );
    const expectedBrandedIcons: TechnologyIconMetadata[] = [];
    const renderedLabels: string[] = [];
    const renderedFallbackLabels: string[] = [];
    const printStyles = Array.from(document.head.querySelectorAll<HTMLStyleElement>('style'))
      .map((style) => style.textContent ?? '')
      .find(
        (styles) =>
          styles.includes('@media print') && styles.includes('.technology-icon-container'),
      );

    expect(cards).toHaveLength(RESUME.experience.length);

    cards.forEach((card, experienceIndex) => {
      const technologies = RESUME.experience[experienceIndex].technologies;
      const chips = Array.from(card.querySelectorAll<HTMLElement>('mat-chip'));

      expect(chips).toHaveLength(technologies.length);

      chips.forEach((chip, technologyIndex) => {
        const technology = technologies[technologyIndex];
        const expectedIcon = resolveTechnologyIcon(technology);
        const content = chip.querySelector<HTMLElement>('.technology-chip-content');
        const iconContainer = content?.querySelector<HTMLElement>('.technology-icon-container');
        const label = content?.querySelector<HTMLElement>('.technology-label');
        const brandIcons = content?.querySelectorAll<HTMLImageElement>('.technology-brand-icon');
        const fallbackIcons = content?.querySelectorAll<HTMLElement>('.technology-fallback-icon');

        expect(label?.textContent?.trim()).toBe(technology);
        expect(content?.firstElementChild).toBe(iconContainer);
        expect(iconContainer?.getAttribute('aria-hidden')).toBe('true');
        expect((brandIcons?.length ?? 0) + (fallbackIcons?.length ?? 0)).toBe(1);

        renderedLabels.push(label!.textContent!.trim());

        if (expectedIcon) {
          const expectedPresentation = optimizedPresentation(expectedIcon);
          const brandIcon = brandIcons?.item(0);
          const iconFrame = brandIcon?.closest('.technology-icon-frame');
          const zoom = brandIcon ? zoomByImage.get(brandIcon) : undefined;

          expectedBrandedIcons.push(expectedIcon);
          expect(brandIcons).toHaveLength(1);
          expect(fallbackIcons).toHaveLength(0);
          expect(iconContainer?.tagName.toLowerCase()).toBe('app-technology-icon');
          expect(iconFrame).toBe(iconContainer);
          const expectedIconUrl = new URL(expectedIcon.src);
          expect(expectedIconUrl.origin).toBe(IMAGE_ASSET_ORIGIN);
          expect(expectedIconUrl.pathname).toMatch(/^\/technology-icons\/[a-z0-9-]+\.svg$/);
          expect(brandIcon?.getAttribute('src')).toBe(expectedPresentation.logo.src);
          expect(brandIcon?.getAttribute('width')).toBe(String(expectedIcon.width));
          expect(brandIcon?.getAttribute('height')).toBe(String(expectedIcon.height));
          expect(brandIcon?.getAttribute('alt')).toBe('');
          expect(brandIcon?.getAttribute('aria-hidden')).toBe('true');
          expect(brandIcon?.getAttribute('loading')).toBe('lazy');
          expect(iconFrame?.classList.contains('technology-icon-frame--dark')).toBe(true);
          expect((iconFrame as HTMLElement | null)?.style.backgroundColor).toBe('rgb(13, 27, 45)');
          expect(zoom?.appImageZoom()).toEqual(expectedPresentation.logo);
          expect(zoom?.imageZoomLabel()).toBe(technology);
          expect(zoom?.imageZoomBackground()).toBe(expectedPresentation.backgroundColor);
        } else {
          const fallbackIcon = fallbackIcons?.item(0);

          expect(brandIcons).toHaveLength(0);
          expect(fallbackIcons).toHaveLength(1);
          expect(fallbackIcon?.textContent?.trim()).toBe('code');
          expect(fallbackIcon?.getAttribute('aria-hidden')).toBe('true');
          renderedFallbackLabels.push(technology);
        }
      });
    });

    expect(renderedLabels).toEqual(RESUME.experience.flatMap(({ technologies }) => technologies));
    expect([...new Set(renderedFallbackLabels)]).toEqual(TECHNOLOGY_ICON_FALLBACK_LABELS);
    expect(fixture.debugElement.queryAll(By.directive(TechnologyIconComponent))).toHaveLength(
      expectedBrandedIcons.length,
    );
    expect(optimize).toHaveBeenCalledTimes(expectedBrandedIcons.length);
    expect(optimize.mock.calls.map(([icon]) => icon)).toEqual(expectedBrandedIcons);
    expect(printStyles).toMatch(
      /\.technology-icon-container[^\{]*\{[^}]*display:\s*none\s*!important/,
    );
  });

  it('renders outsourced employer-to-client relationships and direct company identities', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
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
      logos.every((logo) =>
        logo.getAttribute('src')?.startsWith(`${IMAGE_ASSET_ORIGIN}/company-logos/`),
      ),
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
      'https://resume-images.ohm-mho.space/company-logos/innovestx.png',
      'https://resume-images.ohm-mho.space/company-logos/krungsri.png',
      'https://resume-images.ohm-mho.space/company-logos/tisco.svg',
    ]);
    expect(element.querySelectorAll('.company-identity--client .company-label')).toHaveLength(3);
    expect(element.querySelectorAll('.company-relationship-arrow')).toHaveLength(3);
    expect(element.querySelectorAll('.company-identities a')).toHaveLength(0);
  });

  it('renders the backend-first profile and four summary cards', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    await renderDeferredSections(fixture);
    const element = fixture.nativeElement as HTMLElement;
    const text = (selector: string) =>
      element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
    const summaries = Array.from(
      element.querySelectorAll('.summary-card mat-card-content > p'),
    ).map((item) => item.textContent?.trim());
    const heroClock = text('.hero-clock');

    expect(heroClock).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(text('.hero-kicker')).toBe(
      `${RESUME.title} · ${RESUME.details.location} · UTC+7 · ${heroClock}`,
    );
    expect(text('.hero-role')).toBe(RESUME.title);
    expect(text('.hero-introduction')).toBe(
      'Building reliable APIs, data integrations, event-driven workflows, and responsive interfaces for financial and business systems.',
    );
    expect(summaries).toEqual(RESUME.summary);
    expect(summaries).toHaveLength(4);
    expect(text('footer p')).toBe(`${RESUME.name} · ${RESUME.title}`);
  });

  it('waits to print until every deferred boundary has completed', async () => {
    const print = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, value: print });
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();
    const main = fixture.nativeElement.querySelector('main#main-content') as HTMLElement;
    const observe = vi.spyOn(window.MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(window.MutationObserver.prototype, 'disconnect');

    const printCompleted = requestPrint(fixture);

    expect(print).not.toHaveBeenCalled();
    expect(observe).toHaveBeenCalledOnce();
    expect(observe).toHaveBeenCalledWith(
      main,
      expect.objectContaining({ childList: true, subtree: true }),
    );

    await deferBlocks[0].render(DeferBlockState.Complete);
    fixture.detectChanges();
    await deferBlocks[1].render(DeferBlockState.Complete);
    fixture.detectChanges();
    expect(print).not.toHaveBeenCalled();

    await deferBlocks[2].render(DeferBlockState.Complete);
    fixture.detectChanges();
    await printCompleted;

    expect(print).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('treats deferred error fallbacks as settled before printing', async () => {
    const print = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, value: print });
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();

    const printCompleted = requestPrint(fixture);

    for (const [index, deferBlock] of deferBlocks.entries()) {
      await deferBlock.render(DeferBlockState.Error);
      fixture.detectChanges();

      if (index < deferBlocks.length - 1) {
        expect(print).not.toHaveBeenCalled();
      }
    }
    await printCompleted;

    expect(print).toHaveBeenCalledOnce();
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-resume-profile-defer-error][data-resume-profile-defer-settled]',
      ),
    ).toHaveLength(3);
  });

  it('reuses settled print readiness for later print requests', async () => {
    const print = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, value: print });
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();
    const observe = vi.spyOn(window.MutationObserver.prototype, 'observe');

    const firstPrint = requestPrint(fixture);
    for (const deferBlock of deferBlocks) {
      await deferBlock.render(DeferBlockState.Complete);
      fixture.detectChanges();
    }
    await firstPrint;

    const printButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Print résumé"]',
    );
    expect(printButton).not.toBeNull();
    printButton!.click();
    await Promise.resolve();

    expect(print).toHaveBeenCalledTimes(2);
    expect(observe).toHaveBeenCalledOnce();
  });

  it('requests all boundaries synchronously for native printing without opening a dialog', async () => {
    const print = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, value: print });
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const component = fixture.componentInstance as unknown as {
      readonly renderAllSections: () => boolean;
    };

    window.dispatchEvent(new Event('beforeprint'));

    expect(component.renderAllSections()).toBe(true);
    expect(print).not.toHaveBeenCalled();
    expect(element.querySelectorAll('[data-resume-profile-defer-placeholder]')).toHaveLength(3);
    expect(element.querySelectorAll('[data-resume-profile-defer-settled]')).toHaveLength(0);
  });

  it('disconnects a pending print wait when the page is destroyed', async () => {
    const print = vi.fn();
    Object.defineProperty(window, 'print', { configurable: true, value: print });
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const disconnect = vi.spyOn(window.MutationObserver.prototype, 'disconnect');

    const printCompleted = requestPrint(fixture);
    fixture.destroy();
    await printCompleted;

    expect(disconnect).toHaveBeenCalledOnce();
    expect(print).not.toHaveBeenCalled();
  });

  it('fades both theme directions and provides keyboard-named controls', () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const root = document.documentElement;
    const switchToDark = element.querySelector<HTMLButtonElement>(
      '[aria-label="Switch to dark theme"]',
    );

    expect(switchToDark?.textContent?.trim()).toBe('dark_mode');
    switchToDark?.click();
    fixture.detectChanges();

    expect(root.classList.contains('resume-profile-theme-dark')).toBe(true);
    expect(root.classList.contains('resume-profile-theme-transitioning')).toBe(true);
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe('dark');

    const switchToLight = element.querySelector<HTMLButtonElement>(
      '[aria-label="Switch to light theme"]',
    );
    expect(switchToLight?.textContent?.trim()).toBe('light_mode');
    switchToLight?.click();
    fixture.detectChanges();

    expect(root.classList.contains('resume-profile-theme-light')).toBe(true);
    expect(root.classList.contains('resume-profile-theme-dark')).toBe(false);
    expect(root.classList.contains('resume-profile-theme-transitioning')).toBe(true);
    expect(localStorage.getItem(RESUME_THEME_STORAGE_KEY)).toBe('light');
    expect(
      element.querySelector<HTMLButtonElement>('[aria-label="Switch to dark theme"]')?.textContent,
    ).toContain('dark_mode');

    const downloadButton = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Download résumé as PDF"]',
    );
    expect(element.querySelector<HTMLButtonElement>('[aria-label="Print résumé"]')?.type).toBe(
      'button',
    );
    expect(downloadButton?.type).toBe('button');
  });

  it('shares pending state with navigation and prevents duplicate download requests', async () => {
    const pendingDownload = deferred<void>();
    download.mockReturnValueOnce(pendingDownload.promise);
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const navigation = fixture.debugElement.query(By.directive(ResumeNavigation))
      .componentInstance as ResumeNavigation;
    const downloadButton = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Download résumé as PDF"]',
    );

    downloadButton?.click();
    fixture.detectChanges();

    expect(download).toHaveBeenCalledOnce();
    expect(navigation.downloadPending()).toBe(true);
    expect(downloadButton?.disabled).toBe(true);
    expect(downloadButton?.getAttribute('aria-label')).toBe('Generating résumé PDF');

    navigation.downloadRequested.emit();
    expect(download).toHaveBeenCalledOnce();

    pendingDownload.resolve(undefined);
    await Promise.resolve();
    fixture.detectChanges();

    expect(navigation.downloadPending()).toBe(false);
    expect(downloadButton?.disabled).toBe(false);
    expect(downloadButton?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(handleError).not.toHaveBeenCalled();
  });

  it('reports a rejected download, restores controls, and allows retry', async () => {
    const failure = new Error('Synthetic download failure');
    download.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const downloadButton = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Download résumé as PDF"]',
    );

    downloadButton?.click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(handleError).toHaveBeenCalledOnce();
    expect(handleError).toHaveBeenCalledWith(failure);
    expect(downloadButton?.disabled).toBe(false);
    expect(downloadButton?.getAttribute('aria-label')).toBe('Download résumé as PDF');

    downloadButton?.click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(download).toHaveBeenCalledTimes(2);
    expect(handleError).toHaveBeenCalledOnce();
    expect(downloadButton?.disabled).toBe(false);
  });

  it('synchronizes active navigation with recognized Router fragments only', async () => {
    const harness = await RouterTestingHarness.create('/#experience');
    harness.detectChanges();
    await harness.fixture.whenStable();
    const element = harness.routeNativeElement!;
    const aboutLink = element.querySelector<HTMLAnchorElement>('nav a[href="/#about"]');
    const experienceLink = element.querySelector<HTMLAnchorElement>('nav a[href="/#experience"]');

    expect(aboutLink?.classList.contains('navigation-link-active')).toBe(false);
    expect(aboutLink?.getAttribute('aria-current')).toBeNull();
    expect(experienceLink?.classList.contains('navigation-link-active')).toBe(true);
    expect(experienceLink?.getAttribute('aria-current')).toBe('location');

    setSectionRect(element, 'about', 40, 640);
    scrollEvents.next();
    await harness.fixture.whenStable();

    expect(aboutLink?.getAttribute('aria-current')).toBe('location');
    expect(TestBed.inject(Router).url).toBe('/#experience');

    await harness.navigateByUrl('/#education', ResumePage);
    harness.detectChanges();
    const educationLink = element.querySelector<HTMLAnchorElement>('nav a[href="/#education"]');

    expect(educationLink?.classList.contains('navigation-link-active')).toBe(true);
    expect(educationLink?.getAttribute('aria-current')).toBe('location');
    expect(experienceLink?.classList.contains('navigation-link-active')).toBe(false);

    await harness.navigateByUrl('/#main-content', ResumePage);
    harness.detectChanges();
    expect(educationLink?.getAttribute('aria-current')).toBe('location');

    await harness.navigateByUrl('/#unknown-section', ResumePage);
    harness.detectChanges();
    expect(educationLink?.getAttribute('aria-current')).toBe('location');
  });

  it('renders responsive active navigation from viewport signals without manual change detection', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(scrolled).toHaveBeenCalledWith(100);
    expect(viewportChanged).toHaveBeenCalledWith(100);

    setSectionRect(element, 'experience', 100, 600);
    // Keep viewport emissions followed only by scheduler stabilization so this remains a zoneless
    // signal-rendering regression test rather than relying on fixture.detectChanges().
    scrollEvents.next();
    await fixture.whenStable();

    expect(element.querySelector('nav a[href="/#experience"]')?.getAttribute('aria-current')).toBe(
      'location',
    );
    expect(
      element
        .querySelector('nav a[href="/#experience"]')
        ?.classList.contains('navigation-link-active'),
    ).toBe(true);

    getViewportRect.mockReturnValue({
      top: 2000,
      bottom: 2500,
      left: 0,
      right: 1200,
      width: 1200,
      height: 500,
    });
    setSectionRect(element, 'experience', -100, 50);
    setSectionRect(element, 'skills', 120, 400);
    viewportChangeEvents.next(new Event('resize'));
    await fixture.whenStable();

    expect(element.querySelector('nav a[href="/#skills"]')?.getAttribute('aria-current')).toBe(
      'location',
    );
    expect(
      element.querySelector('nav a[href="/#skills"]')?.classList.contains('navigation-link-active'),
    ).toBe(true);
    expect(
      element
        .querySelector('nav a[href="/#experience"]')
        ?.classList.contains('navigation-link-active'),
    ).toBe(false);
    expect(
      element.querySelector('nav a[href="/#experience"]')?.getAttribute('aria-current'),
    ).toBeNull();

    const menu = await openMobileMenu(fixture);
    expect(menu.querySelector('a[href="/#skills"]')?.getAttribute('aria-current')).toBe('location');
  });

  it('re-queries section elements after deferred content replaces a placeholder', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const placeholder = setSectionRect(element, 'experience', 100, 600);
    const placeholderRect = vi.mocked(placeholder.getBoundingClientRect);

    scrollEvents.next();
    await fixture.whenStable();
    expect(element.querySelector('nav a[href="/#experience"]')?.getAttribute('aria-current')).toBe(
      'location',
    );

    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[1].render(DeferBlockState.Complete);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderedExperience = element.querySelector<HTMLElement>('#experience');

    expect(renderedExperience).not.toBe(placeholder);
    setSectionRect(element, 'experience', -500, -100);
    setSectionRect(element, 'education', 100, 500);
    scrollEvents.next();
    await fixture.whenStable();

    expect(element.querySelector('nav a[href="/#education"]')?.getAttribute('aria-current')).toBe(
      'location',
    );
    expect(placeholderRect).toHaveBeenCalledOnce();
  });

  it('unsubscribes from both CDK viewport streams when destroyed', async () => {
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    setSectionRect(element, 'experience', 100, 600);

    expect(scrollEvents.observed).toBe(true);
    expect(viewportChangeEvents.observed).toBe(true);
    scrollEvents.next();
    await fixture.whenStable();
    const geometryReads = getViewportRect.mock.calls.length;

    fixture.destroy();
    expect(scrollEvents.observed).toBe(false);
    expect(viewportChangeEvents.observed).toBe(false);

    scrollEvents.next();
    viewportChangeEvents.next(new Event('resize'));
    expect(getViewportRect).toHaveBeenCalledTimes(geometryReads);
  });

  it('focuses the main content when the Router handles skip navigation', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const harness = await RouterTestingHarness.create('/');
    initializeRouterScrolling(harness);
    harness.detectChanges();
    const element = harness.routeNativeElement!;
    const skipLink = element.querySelector<HTMLAnchorElement>('a.skip-link');
    const main = element.querySelector<HTMLElement>('main#main-content');

    expect(skipLink?.getAttribute('href')).toBe('/#main-content');
    expect(main?.getAttribute('tabindex')).toBe('-1');

    skipLink?.click();
    await harness.fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));

    expect(TestBed.inject(Router).url).toBe('/#main-content');
    expect(document.activeElement).toBe(main);
    expect(scrollTo).toHaveBeenCalled();
  });
});
