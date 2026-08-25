/** Verifies root activation and the application's Router-managed scrolling contract. */
import { PlatformLocation, ViewportScroller } from '@angular/common';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef } from '@angular/core';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { appConfig } from './app.config';
import { routes } from './app.routes';
import { TechnologyIconContrastService } from './resume/experience-timeline/technology-icon/service/technology-icon-contrast/technology-icon-contrast.service.ts';
import { ResumePage } from './resume/resume-page/resume-page';

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
      ],
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-top');
    history.replaceState(null, '', location.pathname);
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

  it('defines only the eager root résumé route', () => {
    expect(routes).toEqual([{ path: '', component: ResumePage, pathMatch: 'full' }]);
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
    const element = harness.routeNativeElement!;
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
});
