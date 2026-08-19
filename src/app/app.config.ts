import { DOCUMENT, ViewportScroller } from '@angular/common';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';

/** Applies the CSS-owned sticky-header clearance before the Router's initial navigation. */
function configureViewportOffset(): void {
  const document = inject(DOCUMENT);
  const viewportScroller = inject(ViewportScroller);
  const scrollPaddingTop = document.defaultView?.getComputedStyle(
    document.documentElement,
  ).scrollPaddingTop;
  const offset = Number.parseFloat(scrollPaddingTop ?? '');

  if (Number.isFinite(offset)) {
    viewportScroller.setOffset([0, offset]);
  }
}

/**
 * Application-wide providers used during standalone bootstrap.
 *
 * Browser global error listeners route uncaught application errors through
 * Angular's error handling infrastructure. Router features own fragment and history scrolling,
 * including repeat navigation to the current URL.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideAppInitializer(configureViewportOffset),
  ],
};
