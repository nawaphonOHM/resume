import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { RouterLink } from '@angular/router';

import { MainContentDirective } from './directive/main-content.directive.ts';
import { PlayerHostDirective } from './directive/player-host.directive.ts';
import { MINIMUM_PLAYER_WIDTH } from '../helper/injection-token/minimum-player-width.variable.ts';
import { PLAYER_FRAME_TITLE } from '../helper/injection-token/player-frame-title.variable.ts';

/**
 * Provides an accessible YouTube fallback for every unmatched application route.
 *
 * @remarks
 * The player is measured and observed after rendering because YouTube owns iframe creation,
 * while focus hand-back is suppressed as soon as the user interacts with the page. Observers and
 * frame listeners are disconnected when the component is destroyed.
 */
@Component({
  selector: 'app-video-page',
  imports: [RouterLink, MainContentDirective, YouTubePlayer, PlayerHostDirective],
  host: {
    '(document:keydown)': 'cancelPendingFocusRestoration()',
    '(document:pointerdown)': 'cancelPendingFocusRestoration()',
  },
  templateUrl: './video-page.html',
  styleUrl: './video-page.scss',
})
export default class VideoPage {
  private readonly MINIMUM_PLAYER_WIDTH_ = inject(MINIMUM_PLAYER_WIDTH);
  private readonly PLAYER_FRAME_TITLE_ = inject(PLAYER_FRAME_TITLE);

  private readonly mainContent = viewChild.required(MainContentDirective);
  private readonly playerHost = viewChild.required(PlayerHostDirective);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly frameWidth = signal(0);
  private resizeObserver: ResizeObserver | null = null;
  private playerFrameObserver: MutationObserver | null = null;
  private observedPlayerFrame: HTMLIFrameElement | null = null;
  private playerFrameLoadListener: (() => void) | null = null;
  private shouldRestoreFocus = true;
  private isDestroyed = false;
  readonly videoId = 'dQw4w9WgXcQ';
  readonly playerWidth = computed(() => Math.floor(this.frameWidth()));
  /** Keeps the player near 16:9 while enforcing a minimum height for narrow hosts. */
  readonly playerHeight = computed(() =>
    Math.max(this.MINIMUM_PLAYER_WIDTH_, Math.round((this.playerWidth() * 9) / 16)),
  );
  readonly canRenderPlayer = computed(() => this.playerWidth() >= this.MINIMUM_PLAYER_WIDTH_);
  private readonly handleWindowResize = (): void => {
    this.measureFrameWidth();
  };

  constructor() {
    afterNextRender(() => {
      this.mainContent().mainContent.nativeElement.focus({ preventScroll: true });
      this.initializeObservers();
    });

    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
      this.resizeObserver?.disconnect();
      this.playerFrameObserver?.disconnect();
      this.removePlayerFrameLoadListener();
      this.document.defaultView?.removeEventListener('resize', this.handleWindowResize);
    });
  }

  /** Cancels automatic focus hand-back once the user starts interacting. */
  cancelPendingFocusRestoration(): void {
    this.shouldRestoreFocus = false;
  }

  /** Returns focus to the main landmark only when the iframe took it before user interaction. */
  restorePageFocusAfterPlayerLoad(): void {
    if (!this.shouldRestoreFocus) {
      return;
    }

    this.shouldRestoreFocus = false;
    if (this.document.activeElement === this.observedPlayerFrame) {
      this.mainContent().mainContent.nativeElement.focus({ preventScroll: true });
    }
  }

  handlePlayerReady(event: YT.PlayerEvent): void {
    this.observePlayerFrame();
    this.restorePageFocusAfterPlayerLoad();

    const player = event.target;
    const playerFrame = player.getIframe();
    // Let YouTube finish its ready callback, then avoid autoplaying a replaced or destroyed frame.
    queueMicrotask(() => {
      if (
        this.isDestroyed ||
        playerFrame !== this.observedPlayerFrame ||
        playerFrame !== this.playerHost().playerHost.nativeElement.querySelector('iframe')
      ) {
        return;
      }

      player.playVideo();
    });
  }

  private initializeObservers(): void {
    const playerHost = this.playerHost().playerHost.nativeElement;
    this.measureFrameWidth();

    // Observe element-size changes when supported; older browsers can still react to window resizes.
    const ResizeObserverConstructor = globalThis.ResizeObserver;
    if (typeof ResizeObserverConstructor === 'function') {
      this.resizeObserver = new ResizeObserverConstructor((entries) => {
        const entry = entries.find((candidate) => candidate.target === playerHost);
        this.setFrameWidth(entry?.contentRect.width ?? playerHost.getBoundingClientRect().width);
      });
      this.resizeObserver.observe(playerHost);
    } else {
      this.document.defaultView?.addEventListener('resize', this.handleWindowResize);
    }

    // YouTube may recreate the iframe or rewrite its accessibility/security attributes after insertion.
    const MutationObserverConstructor = globalThis.MutationObserver;
    if (typeof MutationObserverConstructor === 'function') {
      this.playerFrameObserver = new MutationObserverConstructor(() => {
        this.observePlayerFrame();
      });
      this.playerFrameObserver.observe(playerHost, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title', 'referrerpolicy'],
      });
    }

    this.observePlayerFrame();
  }

  private measureFrameWidth(): void {
    this.setFrameWidth(this.playerHost().playerHost.nativeElement.getBoundingClientRect().width);
  }

  private setFrameWidth(width: number): void {
    this.frameWidth.set(Number.isFinite(width) ? Math.max(0, width) : 0);
  }

  /** Reasserts iframe metadata and attaches a one-shot load hook to each new frame. */
  private observePlayerFrame(): void {
    const playerFrame =
      this.playerHost().playerHost.nativeElement.querySelector<HTMLIFrameElement>('iframe');
    if (!playerFrame) {
      return;
    }

    if (playerFrame.getAttribute('title') !== this.PLAYER_FRAME_TITLE_) {
      playerFrame.setAttribute('title', this.PLAYER_FRAME_TITLE_);
    }
    if (playerFrame.getAttribute('referrerpolicy') !== 'strict-origin-when-cross-origin') {
      playerFrame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    }

    if (playerFrame === this.observedPlayerFrame) {
      return;
    }

    this.removePlayerFrameLoadListener();
    this.observedPlayerFrame = playerFrame;
    this.playerFrameLoadListener = () => {
      this.restorePageFocusAfterPlayerLoad();
    };
    playerFrame.addEventListener('load', this.playerFrameLoadListener, { once: true });
  }

  private removePlayerFrameLoadListener(): void {
    if (this.observedPlayerFrame && this.playerFrameLoadListener) {
      this.observedPlayerFrame.removeEventListener('load', this.playerFrameLoadListener);
    }

    this.playerFrameLoadListener = null;
    this.observedPlayerFrame = null;
  }
}
