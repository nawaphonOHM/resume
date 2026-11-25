/** Verifies root activation and the application's Router-managed scrolling contract. */
import { PlatformLocation, ViewportScroller } from '@angular/common';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, Injector, signal } from '@angular/core';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { appConfig } from './app.config';
import { routes } from './app.routes';
import { ResumeDataService } from './helper/core/resume-data.service.ts';
import { ThemeService } from './helper/core/theme.service.ts';
import { resumeProfileFixture } from '../../test/fixtures/resume-profile.ts';
import { TechnologyIconContrastService } from './resume/experience-timeline/technology-icon/service/technology-icon-contrast/technology-icon-contrast.service.ts';
import ResumePage from './resume/resume-page/resume-page.ts';
import VideoPage from './video-page/video-page';
import { installYouTubeIframeApiTestDouble } from './video-page/testing/youtube-iframe-api.test-double.ts';

describe('application routes', () => {
  let router: Router;
  let viewportScroller: ViewportScroller;
  let setOffset: ReturnType<typeof vi.fn<ViewportScroller['setOffset']>>;
  let getScrollPosition: ReturnType<typeof vi.fn<ViewportScroller['getScrollPosition']>>;
  let scrollToPosition: ReturnType<typeof vi.fn<ViewportScroller['scrollToPosition']>>;
  let scrollToAnchor: ReturnType<typeof vi.fn<ViewportScroller['scrollToAnchor']>>;
  let setHistoryScrollRestoration: ReturnType<
    typeof vi.fn<ViewportScroller['setHistoryScrollRestoration']>
  >;

  beforeEach(() => {
    installYouTubeIframeApiTestDouble();
    document.documentElement.style.scrollPaddingTop = '88px';
    setOffset = vi.fn<ViewportScroller['setOffset']>();
    getScrollPosition = vi.fn<ViewportScroller['getScrollPosition']>(() => [0, 0]);
    scrollToPosition = vi.fn<ViewportScroller['scrollToPosition']>();
    scrollToAnchor = vi.fn<ViewportScroller['scrollToAnchor']>();
    setHistoryScrollRestoration = vi.fn<ViewportScroller['setHistoryScrollRestoration']>();
    viewportScroller = {
      setOffset,
      getScrollPosition,
      scrollToPosition,
      scrollToAnchor,
      setHistoryScrollRestoration,
    };
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        appConfig.providers,
        { provide: ViewportScroller, useValue: viewportScroller },
        {
          provide: TechnologyIconContrastService,
          useValue: {
            optimize: vi.fn<TechnologyIconContrastService['optimize']>((icon) =>
              Promise.resolve({ logo: icon, backgroundColor: '#ffffff' }),
            ),
          },
        },
        {
          provide: ResumeDataService,
          useValue: {
            profile: signal(resumeProfileFixture),
            isLoading: signal(false),
            hasError: signal(false),
            reloadAll: vi.fn(),
          },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-top');
    history.replaceState(null, '', '/');
    vi.restoreAllMocks();
  });

  async function settleRouterScroll(harness: RouterTestingHarness): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }

  async function bootstrapHarnessAt(initialUrl: string): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create();
    TestBed.inject(PlatformLocation).replaceState(null, '', initialUrl);
    const navigationCompleted = new Promise<void>((resolve) => {
      const subscription = router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });
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

    await navigationCompleted;
    harness.detectChanges();
    await settleRouterScroll(harness);
    return harness;
  }

  it('defines lazy résumé and fallback routes under one theme provider', async () => {
    expect(routes).toEqual([
      {
        path: '',
        providers: [ThemeService],
        children: [
          {
            path: '',
            loadComponent: expect.any(Function) as unknown,
            pathMatch: 'full',
          },
          {
            path: '**',
            loadComponent: expect.any(Function) as unknown,
          },
        ],
      },
    ]);

    const loadResumePage = routes[0].children?.[0]?.loadComponent;
    expect(loadResumePage).toBeDefined();
    const loadedResumePage = await (loadResumePage as () => Promise<unknown>)();
    expect(loadedResumePage).toMatchObject({ default: ResumePage });

    const loadVideoPage = routes[0].children?.[1]?.loadComponent;
    expect(loadVideoPage).toBeDefined();
    const loadedVideoPage = await (loadVideoPage as () => Promise<unknown>)();
    expect(loadedVideoPage).toMatchObject({ default: VideoPage });
  });

  it('resolves ThemeService from the active route, not the root injector', async () => {
    const harness = await bootstrapHarnessAt('/');
    const themeService = harness.routeDebugElement?.injector.get(ThemeService);

    expect(themeService).toBeInstanceOf(ThemeService);
    expect(TestBed.inject(Injector).get(ThemeService, null)).toBeNull();

    await harness.navigateByUrl('/portfolio/unknown/path', VideoPage);

    expect(harness.routeDebugElement?.injector.get(ThemeService)).toBe(themeService);
  });

  it('activates ResumePage at the root URL and enables history position restoration', async () => {
    const harness = await bootstrapHarnessAt('/');

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(ResumePage);
    expect(harness.routeNativeElement?.querySelector('main#main-content')).not.toBeNull();
    expect(router.url).toBe('/');
    expect(setHistoryScrollRestoration).toHaveBeenCalledWith('manual');
  });

  it('scrolls an initial fragment after applying the computed sticky-header offset', async () => {
    const harness = await bootstrapHarnessAt('/#experience');
    expect(harness.routeNativeElement).not.toBeNull();
    if (!harness.routeNativeElement) {
      throw new Error('Root native element not found');
    }
    const element = harness.routeNativeElement;
    const fragmentTarget = element.querySelector<HTMLElement>('#experience');
    const placeholderTargets = ['about', 'experience', 'education', 'skills', 'profile'].map((id) =>
      element.querySelector<HTMLElement>(`#${id}`),
    );

    expect(router.url).toBe('/#experience');
    expect(fragmentTarget).not.toBeNull();
    expect(fragmentTarget?.hasAttribute('data-resume-defer-placeholder')).toBe(true);
    expect(fragmentTarget?.getAttribute('role')).toBe('status');
    expect(placeholderTargets.every((target) => target !== null)).toBe(true);
    expect(
      placeholderTargets.every((target) => target?.closest('[data-resume-defer-placeholder]')),
    ).toBe(true);
    expect(element.querySelectorAll('[data-resume-defer-placeholder]')).toHaveLength(3);
    expect(element.querySelector('app-experience-timeline')).toBeNull();
    expect(setOffset).toHaveBeenCalledWith([0, 88]);
    expect(scrollToAnchor).toHaveBeenCalledWith('experience');
    expect(setOffset.mock.invocationCallOrder[0]).toBeLessThan(
      scrollToAnchor.mock.invocationCallOrder[0],
    );
  });

  it('reloads and scrolls when navigating to the current fragment again', async () => {
    const harness = await bootstrapHarnessAt('/#experience');
    scrollToAnchor.mockClear();
    const navigationEnds: NavigationEnd[] = [];
    const subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        navigationEnds.push(event);
      }
    });

    await harness.navigateByUrl('/#experience', ResumePage);
    await settleRouterScroll(harness);

    expect(navigationEnds).toHaveLength(1);
    expect(scrollToAnchor).toHaveBeenCalledWith('experience');
    subscription.unsubscribe();
  });

  it('restores a saved position during browser history navigation', async () => {
    const harness = await bootstrapHarnessAt('/#about');
    getScrollPosition.mockReturnValue([0, 420]);
    await harness.navigateByUrl('/#experience', ResumePage);
    await settleRouterScroll(harness);
    scrollToPosition.mockClear();
    const navigationCompleted = new Promise<void>((resolve) => {
      const subscription = router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });

    TestBed.inject(PlatformLocation).back();
    await navigationCompleted;
    harness.detectChanges();
    await settleRouterScroll(harness);

    expect(router.url).toBe('/#about');
    expect(scrollToPosition).toHaveBeenCalledWith([0, 420], { behavior: 'instant' });
  });

  it('activates the video fallback on a nested direct URL and preserves query and fragment', async () => {
    const requestedUrl = '/portfolio/unknown/path?source=resume#player';
    const harness = await bootstrapHarnessAt(requestedUrl);

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(VideoPage);
    const main = harness.routeNativeElement?.querySelector('main#video-page-main');

    expect(main).not.toBeNull();
    expect(document.activeElement).toBe(main);
    expect(router.url).toBe(requestedUrl);
  });

  it('returns to the résumé through the fallback page link', async () => {
    const harness = await bootstrapHarnessAt('/portfolio/unknown/path');
    const returnLink = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(
      '.video-page__resume-link',
    );

    expect(returnLink).not.toBeNull();
    returnLink?.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(ResumePage);
  });

  it('applies theme changes after navigating to the video fallback', async () => {
    const harness = await bootstrapHarnessAt('/');
    const themeService = harness.routeDebugElement?.injector.get(ThemeService);

    if (!themeService) {
      throw new Error('Route-scoped ThemeService not found');
    }

    await harness.navigateByUrl('/portfolio/unknown/path', VideoPage);
    themeService.setTheme('dark');

    expect(themeService.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(false);
  });
});
