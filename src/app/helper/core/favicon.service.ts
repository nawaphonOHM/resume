import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject, Service } from '@angular/core';

/**
 * Manages the document favicon link element safely across browser and non-browser platforms.
 *
 * @remarks
 * In browser environments, setting the favicon locates or creates a
 * `<link rel="icon">` element in `document.head` and updates its `href` attribute.
 * In non-browser environments (such as server-side rendering), operations are
 * safely skipped without throwing errors.
 */
@Service()
export class FaviconService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Updates or creates the document's `<link rel="icon">` element with the provided URL.
   *
   * @param href - The URL of the favicon SVG or icon asset.
   */
  setFavicon(href: string): void {
    if (!this.isBrowser) {
      return;
    }

    let link = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="icon"], link[rel~="icon"]',
    );

    if (link) {
      link.setAttribute('href', href);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'icon');
      link.setAttribute('type', 'image/svg+xml');
      link.setAttribute('href', href);
      this.document.head.appendChild(link);
    }
  }

  /**
   * Reads the current favicon URL from the document head.
   *
   * @returns The active favicon `href`, or `null` if not found or outside a browser platform.
   */
  getFavicon(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const link = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="icon"], link[rel~="icon"]',
    );

    return link?.getAttribute('href') ?? null;
  }
}
