import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { fallbackRoutes } from './fallback.routes';
import { PAGE_RELOAD, WebsiteUnavailable } from './website-unavailable/website-unavailable';

describe('fallback routes', () => {
  let reloadPage: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    reloadPage = vi.fn<() => void>();
    TestBed.configureTestingModule({
      providers: [provideRouter(fallbackRoutes), { provide: PAGE_RELOAD, useValue: reloadPage }],
    });
  });

  afterEach(() => {
    history.replaceState(null, '', '/');
  });

  it('renders the unavailable message and reload action at the root URL', async () => {
    const harness = await RouterTestingHarness.create('/');
    const element = harness.routeNativeElement!;
    const heading = element.querySelector('h1');
    const status = element.querySelector('[role="status"]');
    const retry = element.querySelector<HTMLButtonElement>('button');

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(WebsiteUnavailable);
    expect(heading?.textContent?.trim()).toBe('Website is unavailable');
    expect(status?.textContent?.trim()).toBe(
      'The website could not load its required resources. Check your connection, then retry.',
    );
    expect(retry?.type).toBe('button');
    expect(retry?.textContent?.trim()).toBe('Retry');

    retry?.click();

    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it('renders the same unavailable route for a deep link', async () => {
    const harness = await RouterTestingHarness.create('/resume/experience');

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(WebsiteUnavailable);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe(
      'Website is unavailable',
    );
  });
});
