import axe from 'axe-core';
import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { YouTubePlayer } from '@angular/youtube-player';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { RESUME_THEME_STORAGE_KEY } from '../helper/injection-token/resume-theme-storage-key.variable.ts';
import { ThemeService } from '../helper/core/theme.service.ts';
import VideoPage from './video-page';
import {
  installYouTubeIframeApiTestDouble,
  YouTubeIframeApiPlayerTestDouble,
} from './testing/youtube-iframe-api.test-double.ts';

describe('VideoPage', () => {
  let harness: RouterTestingHarness | undefined;
  let prefersDark: boolean;
  let systemThemeListener: ((event: MediaQueryListEvent) => void) | undefined;
  let originalMatchMedia: PropertyDescriptor | undefined;
  let resizeObserverCallback: ResizeObserverCallback | undefined;
  let resizeObserverObserve: ReturnType<typeof vi.fn<ResizeObserver['observe']>>;
  let resizeObserverDisconnect: ReturnType<typeof vi.fn<ResizeObserver['disconnect']>>;
  let notifyPlayerFrameMutations: (() => void) | undefined;
  let mutationObserverObserve: ReturnType<typeof vi.fn<MutationObserver['observe']>>;
  let mutationObserverDisconnect: ReturnType<typeof vi.fn<MutationObserver['disconnect']>>;

  beforeEach(async () => {
    harness = undefined;
    installYouTubeIframeApiTestDouble();
    prefersDark = false;
    systemThemeListener = undefined;
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    resizeObserverCallback = undefined;
    notifyPlayerFrameMutations = undefined;
    resizeObserverObserve = vi.fn<ResizeObserver['observe']>();
    resizeObserverDisconnect = vi.fn<ResizeObserver['disconnect']>();
    mutationObserverObserve = vi.fn<MutationObserver['observe']>();
    mutationObserverDisconnect = vi.fn<MutationObserver['disconnect']>();

    class ResizeObserverMock implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
      }

      readonly observe = resizeObserverObserve;
      readonly unobserve = vi.fn<ResizeObserver['unobserve']>();
      readonly disconnect = resizeObserverDisconnect;

      takeRecords(): ResizeObserverEntry[] {
        return [];
      }
    }

    class MutationObserverMock implements MutationObserver {
      constructor(callback: MutationCallback) {
        notifyPlayerFrameMutations = () => {
          callback([], this);
        };
      }

      readonly observe = mutationObserverObserve;
      readonly disconnect = mutationObserverDisconnect;

      takeRecords(): MutationRecord[] {
        return [];
      }
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.stubGlobal('MutationObserver', MutationObserverMock);

    const mediaQuery = {
      get matches() {
        return prefersDark;
      },
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        systemThemeListener = listener;
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => mediaQuery),
    });
    localStorage.clear();
    document.documentElement.classList.remove(
      'resume-theme-light',
      'resume-theme-dark',
      'resume-theme-transitioning',
    );

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            providers: [ThemeService],
            children: [{ path: '**', component: VideoPage }],
          },
        ]),
      ],
    });
    await TestBed.compileComponents();
  });

  afterEach(() => {
    harness?.fixture.destroy();
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.classList.remove(
      'resume-theme-light',
      'resume-theme-dark',
      'resume-theme-transitioning',
    );

    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function createVideoPageHarness(): Promise<RouterTestingHarness> {
    const createdHarness = await RouterTestingHarness.create('/unknown/path');
    harness = createdHarness;
    await createdHarness.fixture.whenStable();
    return createdHarness;
  }

  async function bootstrapVideoPage(width = 640): Promise<RouterTestingHarness> {
    const createdHarness = await createVideoPageHarness();
    triggerFrameResize(createdHarness, width);
    return createdHarness;
  }

  function getVideoPageElement(harness: RouterTestingHarness): HTMLElement {
    const page = harness.routeNativeElement;
    if (!page) {
      throw new Error('Video page route element not found');
    }
    return page;
  }

  function getYouTubePlayer(harness: RouterTestingHarness): YouTubePlayer {
    const player = harness.routeDebugElement?.query(By.directive(YouTubePlayer));
    if (!player) {
      throw new Error('YouTube player component not found');
    }
    return player.injector.get(YouTubePlayer);
  }

  function getIframeApiPlayer(): YouTubeIframeApiPlayerTestDouble {
    const player = YouTubeIframeApiPlayerTestDouble.instances.at(-1);
    if (!player) {
      throw new Error('YouTube iframe API player test double not found');
    }
    return player;
  }

  function getFrameContainer(harness: RouterTestingHarness): HTMLElement {
    const frame = harness.routeNativeElement?.querySelector<HTMLElement>('.video-page__frame');
    if (!frame) {
      throw new Error('YouTube player frame container not found');
    }
    return frame;
  }

  function triggerFrameResize(harness: RouterTestingHarness, width: number): void {
    if (!resizeObserverCallback) {
      throw new Error('ResizeObserver callback not initialized');
    }

    const container = getFrameContainer(harness);
    resizeObserverCallback(
      [
        {
          target: container,
          contentRect: { width } as DOMRectReadOnly,
        } as unknown as ResizeObserverEntry,
      ],
      {} as ResizeObserver,
    );
    harness.fixture.detectChanges();
  }

  function createPlayerFrame(harness: RouterTestingHarness): HTMLIFrameElement {
    const frame = getIframeApiPlayer().iframe;
    if (!getFrameContainer(harness).contains(frame)) {
      throw new Error('YouTube iframe is outside the frame container');
    }
    notifyPlayerFrameMutations?.();
    return frame;
  }

  function getThemeService(harness: RouterTestingHarness): ThemeService {
    const injector = harness.routeDebugElement?.injector;
    if (!injector) {
      throw new Error('Video page route injector not found');
    }
    return injector.get(ThemeService);
  }

  it('renders the immediately loaded YouTube player with default controls and a descriptive title', async () => {
    const harness = await bootstrapVideoPage();
    const page = getVideoPageElement(harness);
    const player = getYouTubePlayer(harness);

    expect(player.videoId).toBe('dQw4w9WgXcQ');
    expect(player.playerVars).toBeUndefined();
    expect(player.disablePlaceholder).toBe(true);
    expect(getIframeApiPlayer().options.videoId).toBe('dQw4w9WgXcQ');
    const iframe = createPlayerFrame(harness);
    expect(iframe.getAttribute('title')).toBe(
      'Never Gonna Give You Up by Rick Astley — YouTube video',
    );
    expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    expect(page.querySelector('youtube-player')).not.toBeNull();
  });

  it('requests playback after the player has cued the video on ready', async () => {
    await bootstrapVideoPage();
    const player = getIframeApiPlayer();

    player.emitReady();
    expect(player.operations).toEqual(['setSize', 'cueVideoById']);

    await Promise.resolve();

    expect(player.operations).toEqual(['setSize', 'cueVideoById', 'playVideo']);
  });

  it('does not request playback from a player after it has been replaced', async () => {
    const harness = await bootstrapVideoPage();
    const apiPlayer = getIframeApiPlayer();
    const player = getYouTubePlayer(harness);

    apiPlayer.emitReady();
    player.videoId = 'another-video';
    player.ngOnChanges({
      videoId: new SimpleChange('dQw4w9WgXcQ', 'another-video', false),
    });
    harness.fixture.detectChanges();
    const replacementPlayer = getIframeApiPlayer();
    expect(replacementPlayer).not.toBe(apiPlayer);
    replacementPlayer.emitReady();
    await Promise.resolve();

    expect(apiPlayer.destroyed).toBe(true);
    expect(apiPlayer.playbackCalls).not.toContain('playVideo');
    expect(replacementPlayer.operations).toEqual(['setSize', 'cueVideoById', 'playVideo']);
  });

  it('does not request playback after the page is destroyed', async () => {
    const harness = await bootstrapVideoPage();
    const player = getIframeApiPlayer();

    player.emitReady();
    harness.fixture.destroy();
    await Promise.resolve();

    expect(player.playbackCalls).not.toContain('playVideo');
  });

  it('restores the descriptive title if YouTube changes it after creating the iframe', async () => {
    const harness = await bootstrapVideoPage();
    const iframe = createPlayerFrame(harness);

    expect(mutationObserverObserve).toHaveBeenCalledWith(getFrameContainer(harness), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title', 'referrerpolicy'],
    });
    iframe.title = 'YouTube video player';
    notifyPlayerFrameMutations?.();

    expect(iframe.title).toBe('Never Gonna Give You Up by Rick Astley — YouTube video');
  });

  it('provides direct YouTube and résumé navigation links', async () => {
    const harness = await bootstrapVideoPage();
    const page = getVideoPageElement(harness);
    const links = Array.from(page.querySelectorAll('a'));

    expect(links[0]?.getAttribute('href')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(links[1]?.getAttribute('href')).toBe('/');
  });

  it('moves focus to its main landmark after rendering', async () => {
    const harness = await bootstrapVideoPage();
    const main = harness.routeNativeElement?.querySelector('main');

    expect(main?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(main);
  });

  it('restores main landmark focus if the player takes focus while initially loading', async () => {
    const harness = await bootstrapVideoPage();
    const page = getVideoPageElement(harness);
    const main = page.querySelector('main');
    const iframe = createPlayerFrame(harness);

    iframe.focus();
    iframe.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(main);
  });

  it('does not restore initial focus after keyboard navigation begins', async () => {
    const harness = await bootstrapVideoPage();
    const iframe = createPlayerFrame(harness);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    iframe.focus();
    iframe.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(iframe);
  });

  it('does not restore focus after pointer interaction begins', async () => {
    const harness = await bootstrapVideoPage();
    const iframe = createPlayerFrame(harness);

    document.dispatchEvent(new PointerEvent('pointerdown'));
    iframe.focus();
    iframe.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(iframe);
  });

  it('does not steal focus on repeated player loads', async () => {
    const harness = await bootstrapVideoPage();
    const page = getVideoPageElement(harness);
    const main = page.querySelector('main');
    const iframe = createPlayerFrame(harness);

    iframe.focus();
    iframe.dispatchEvent(new Event('load'));
    expect(document.activeElement).toBe(main);

    iframe.focus();
    iframe.dispatchEvent(new Event('load'));

    expect(document.activeElement).toBe(iframe);
  });

  it('uses the player ready event as a first-load focus fallback', async () => {
    const harness = await bootstrapVideoPage();
    const page = getVideoPageElement(harness);
    const iframe = createPlayerFrame(harness);

    iframe.focus();
    getIframeApiPlayer().emitReady();

    expect(document.activeElement).toBe(page.querySelector('main'));
  });

  it('uses 16:9 dimensions when possible and keeps narrow players at least 200px tall', async () => {
    const harness = await bootstrapVideoPage(640);
    const player = getYouTubePlayer(harness);

    expect(player.width).toBe(640);
    expect(player.height).toBe(360);

    triggerFrameResize(harness, 320);

    expect(player.width).toBe(320);
    expect(player.height).toBe(200);
  });

  it('shows the direct-link fallback below YouTube’s 200px minimum width', async () => {
    const harness = await bootstrapVideoPage(199);
    const page = getVideoPageElement(harness);

    expect(page.querySelector('youtube-player')).toBeNull();
    expect(page.querySelector('a[href^="https://www.youtube.com/watch"]')).not.toBeNull();

    triggerFrameResize(harness, 200);

    const player = getYouTubePlayer(harness);
    expect(player.width).toBe(200);
    expect(player.height).toBe(200);
  });

  it('keeps the direct-link fallback when the player API never creates a frame', async () => {
    YouTubeIframeApiPlayerTestDouble.createIframe = false;
    const harness = await bootstrapVideoPage();
    const page = getVideoPageElement(harness);

    expect(page.querySelector('youtube-player iframe')).toBeNull();
    expect(page.querySelector('a[href^="https://www.youtube.com/watch"]')).not.toBeNull();
  });

  it('disconnects observers and removes the iframe load listener on destroy', async () => {
    const harness = await bootstrapVideoPage();
    const iframe = createPlayerFrame(harness);
    const removeEventListener = vi.spyOn(iframe, 'removeEventListener');

    harness.fixture.destroy();
    expect(resizeObserverDisconnect).toHaveBeenCalledOnce();
    expect(mutationObserverDisconnect).toHaveBeenCalledOnce();
    expect(removeEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('measures and responds to window resize when ResizeObserver is unavailable', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    let containerWidth = 320;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('video-page__frame')) {
        return { width: containerWidth } as DOMRect;
      }
      return { width: 0 } as DOMRect;
    });

    const harness = await createVideoPageHarness();
    const player = getYouTubePlayer(harness);
    expect(player.width).toBe(320);
    expect(player.height).toBe(200);

    containerWidth = 480;
    window.dispatchEvent(new Event('resize'));
    harness.fixture.detectChanges();

    expect(player.width).toBe(480);
    expect(player.height).toBe(270);
  });

  it.each(['light', 'dark'] as const)('inherits the stored %s theme', async (theme) => {
    localStorage.setItem(TestBed.inject(RESUME_THEME_STORAGE_KEY), theme);
    const harness = await bootstrapVideoPage();
    const themeService = getThemeService(harness);

    expect(themeService.theme()).toBe(theme);
    expect(document.documentElement.classList.contains(`resume-theme-${theme}`)).toBe(true);
  });

  it.each(['light', 'dark'] as const)(
    'passes axe checks with keyboard focus in the %s theme',
    async (theme) => {
      const harness = await bootstrapVideoPage();
      const page = getVideoPageElement(harness);
      const main = page.querySelector<HTMLElement>('main');
      const resumeLink = page.querySelector<HTMLAnchorElement>('.video-page__resume-link');

      if (!main || !resumeLink) {
        throw new Error('Expected the video page landmark and résumé link');
      }

      createPlayerFrame(harness);
      getThemeService(harness).setTheme(theme);
      resumeLink.focus();

      expect(document.activeElement).toBe(resumeLink);
      const results = await axe.run(main, { iframes: false });

      expect(results.violations).toEqual([]);
    },
  );

  it('follows system theme changes while the page is active', async () => {
    prefersDark = true;
    const harness = await bootstrapVideoPage();
    const themeService = getThemeService(harness);
    expect(themeService.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('resume-theme-dark')).toBe(true);

    prefersDark = false;
    systemThemeListener?.({ matches: false } as MediaQueryListEvent);

    expect(themeService.theme()).toBe('light');
    expect(document.documentElement.classList.contains('resume-theme-light')).toBe(true);
  });
});
