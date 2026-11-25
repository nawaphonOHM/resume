import { vi } from 'vitest';

export class YouTubeIframeApiPlayerTestDouble {
  static readonly instances: YouTubeIframeApiPlayerTestDouble[] = [];
  static createIframe = true;

  readonly iframe: HTMLIFrameElement;
  readonly options: YT.PlayerOptions;
  readonly cueCalls: unknown[] = [];
  readonly playbackCalls: string[] = [];
  readonly operations: string[] = [];
  readonly sizeCalls: [number | string | undefined, number | string | undefined][] = [];
  destroyed = false;
  private readonly eventListeners = new Map<string, Set<(event: YT.PlayerEvent) => void>>();

  constructor(container: HTMLElement, options: YT.PlayerOptions = {}) {
    this.options = options;
    this.iframe = container.ownerDocument.createElement('iframe');
    if (YouTubeIframeApiPlayerTestDouble.createIframe) {
      container.append(this.iframe);
    }
    YouTubeIframeApiPlayerTestDouble.instances.push(this);
  }

  static reset(): void {
    this.instances.length = 0;
    this.createIframe = true;
  }

  addEventListener<EventName extends keyof YT.Events>(
    eventName: EventName,
    listener: NonNullable<YT.Events[EventName]>,
  ): void {
    const listeners = this.eventListeners.get(eventName) ?? new Set();
    listeners.add(listener as (event: YT.PlayerEvent) => void);
    this.eventListeners.set(eventName, listeners);
  }

  removeEventListener<EventName extends keyof YT.Events>(
    eventName: EventName,
    listener: NonNullable<YT.Events[EventName]>,
  ): void {
    this.eventListeners.get(eventName)?.delete(listener as (event: YT.PlayerEvent) => void);
  }

  emitReady(): void {
    for (const listener of this.eventListeners.get('onReady') ?? []) {
      listener({ target: this as unknown as YT.Player });
    }
  }

  getPlayerState(): undefined {
    return undefined;
  }

  getIframe(): HTMLIFrameElement {
    return this.iframe;
  }

  cueVideoById(options: unknown): void {
    this.cueCalls.push(options);
    this.operations.push('cueVideoById');
  }

  setSize(width?: number | string, height?: number | string): void {
    this.sizeCalls.push([width, height]);
    this.operations.push('setSize');
  }

  setPlaybackQuality(): void {
    this.playbackCalls.push('setPlaybackQuality');
  }

  playVideo(): void {
    this.playbackCalls.push('playVideo');
    this.operations.push('playVideo');
  }

  pauseVideo(): void {
    this.playbackCalls.push('pauseVideo');
  }

  stopVideo(): void {
    this.playbackCalls.push('stopVideo');
  }

  setPlaybackRate(): void {
    this.playbackCalls.push('setPlaybackRate');
  }

  setVolume(): void {
    this.playbackCalls.push('setVolume');
  }

  mute(): void {
    this.playbackCalls.push('mute');
  }

  unMute(): void {
    this.playbackCalls.push('unMute');
  }

  seekTo(): void {
    this.playbackCalls.push('seekTo');
  }

  destroy(): void {
    this.destroyed = true;
    this.iframe.remove();
  }
}

export function installYouTubeIframeApiTestDouble(): void {
  YouTubeIframeApiPlayerTestDouble.reset();
  vi.stubGlobal('YT', { Player: YouTubeIframeApiPlayerTestDouble });
}
