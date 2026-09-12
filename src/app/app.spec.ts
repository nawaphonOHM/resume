/** Verifies the routed root shell's bootstrap contract, loading states, and accessibility. */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { By } from '@angular/platform-browser';
import {
  type Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  provideRouter,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { Subject } from 'rxjs';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let router: Router;
  let routerEvents$: Subject<RouterEvent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    routerEvents$ = router.events as Subject<RouterEvent>;
    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('creates the root component', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the primary router outlet', async () => {
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const outlet = fixture.debugElement.query(By.directive(RouterOutlet));

    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(outlet).not.toBeNull();
    expect(outlet.injector.get(RouterOutlet).name).toBe('primary');
  });

  describe('loading overlay & accessibility', () => {
    it('initializes in loading state and renders the progress spinner container', async () => {
      expect(component.isRouteLoading()).toBe(true);
      await fixture.whenStable();

      const container = fixture.nativeElement.querySelector('.route-loading-container');
      expect(container).not.toBeNull();
      expect(container?.getAttribute('role')).toBe('status');
      expect(container?.getAttribute('aria-live')).toBe('polite');
      expect(container?.getAttribute('aria-label')).toBe('Loading résumé');
    });

    it('renders the indeterminate Material progress spinner with required dimensions', async () => {
      await fixture.whenStable();

      const spinnerDebug = fixture.debugElement.query(By.directive(MatProgressSpinner));
      expect(spinnerDebug).not.toBeNull();

      const spinner = spinnerDebug.componentInstance as MatProgressSpinner;
      expect(spinner.mode).toBe('indeterminate');
      expect(spinner.diameter).toBe(56);
      expect(spinner.strokeWidth).toBe(4);
    });
  });

  describe('router event transitions', () => {
    it('dismisses the loading overlay when NavigationEnd fires', async () => {
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.route-loading-container')).not.toBeNull();

      routerEvents$.next(new NavigationEnd(1, '/', '/'));
      await fixture.whenStable();

      expect(component.isRouteLoading()).toBe(false);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).toBeNull();
      expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    });

    it('dismisses the loading overlay when NavigationCancel fires', async () => {
      await fixture.whenStable();

      routerEvents$.next(new NavigationCancel(1, '/', 'Redirect'));
      await fixture.whenStable();

      expect(component.isRouteLoading()).toBe(false);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).toBeNull();
    });

    it('dismisses the loading overlay when NavigationError fires', async () => {
      await fixture.whenStable();

      routerEvents$.next(new NavigationError(1, '/', new Error('Network error')));
      await fixture.whenStable();

      expect(component.isRouteLoading()).toBe(false);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).toBeNull();
    });

    it('restores the loading overlay when a new NavigationStart fires', async () => {
      routerEvents$.next(new NavigationEnd(1, '/', '/'));
      await fixture.whenStable();
      expect(component.isRouteLoading()).toBe(false);

      routerEvents$.next(new NavigationStart(2, '/#experience'));
      await fixture.whenStable();

      expect(component.isRouteLoading()).toBe(true);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).not.toBeNull();
    });

    it('activates loading state when RouteConfigLoadStart fires', async () => {
      routerEvents$.next(new NavigationEnd(1, '/', '/'));
      await fixture.whenStable();
      expect(component.isRouteLoading()).toBe(false);

      routerEvents$.next(new RouteConfigLoadStart({ path: 'lazy' }));
      await fixture.whenStable();

      expect(component.isRouteLoading()).toBe(true);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).not.toBeNull();
    });

    it('does not dismiss loading overlay on RouteConfigLoadEnd until terminal navigation completes', async () => {
      routerEvents$.next(new NavigationStart(1, '/'));
      routerEvents$.next(new RouteConfigLoadStart({ path: '' }));
      await fixture.whenStable();
      expect(component.isRouteLoading()).toBe(true);

      routerEvents$.next(new RouteConfigLoadEnd({ path: '' }));
      await fixture.whenStable();

      // Route chunk finished, but overall navigation is still pending
      expect(component.isRouteLoading()).toBe(true);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).not.toBeNull();

      routerEvents$.next(new NavigationEnd(1, '/', '/'));
      await fixture.whenStable();

      expect(component.isRouteLoading()).toBe(false);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).toBeNull();
    });

    it('automatically transitions from loading to idle when navigation completes via router.navigateByUrl', async () => {
      expect(component.isRouteLoading()).toBe(true);

      await router.navigateByUrl('/');
      await fixture.whenStable();

      expect(component.isRouteLoading()).toBe(false);
      expect(fixture.nativeElement.querySelector('.route-loading-container')).toBeNull();
    });
  });

  describe('subscription cleanup', () => {
    it('unsubscribes from router events on component destroy', async () => {
      await fixture.whenStable();
      fixture.destroy();

      expect(() => {
        routerEvents$.next(new NavigationStart(99, '/'));
        routerEvents$.next(new NavigationEnd(99, '/', '/'));
      }).not.toThrow();
    });
  });
});
