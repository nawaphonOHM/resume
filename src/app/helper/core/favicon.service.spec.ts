/**
 * Verifies favicon link element lookup, creation, URL updating, and SSR safety.
 */
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FaviconService } from './favicon.service.ts';

describe('FaviconService', () => {
  const cleanupHeadIconLinks = (): void => {
    const existingLinks = document.head.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel~="icon"]',
    );
    existingLinks.forEach((link) => link.remove());
  };

  beforeEach(() => {
    cleanupHeadIconLinks();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    cleanupHeadIconLinks();
    TestBed.resetTestingModule();
  });

  it('updates the href of an existing link[rel="icon"] element', () => {
    const initialLink = document.createElement('link');
    initialLink.setAttribute('rel', 'icon');
    initialLink.setAttribute('type', 'image/svg+xml');
    initialLink.setAttribute('href', 'https://resume-images.ohm-mho.space/favicon.svg');
    document.head.appendChild(initialLink);

    const service = TestBed.inject(FaviconService);
    const targetUrl = 'https://resume-images.ohm-mho.space/favicons/available/favicon.svg';

    service.setFavicon(targetUrl);

    expect(initialLink.getAttribute('href')).toBe(targetUrl);
    expect(service.getFavicon()).toBe(targetUrl);
    expect(document.head.querySelectorAll('link[rel="icon"]').length).toBe(1);
  });

  it('creates and appends a new link[rel="icon"] if none exists in document.head', () => {
    const service = TestBed.inject(FaviconService);
    const targetUrl = 'https://resume-images.ohm-mho.space/favicons/limited/favicon.svg';

    service.setFavicon(targetUrl);

    const createdLink = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(createdLink).not.toBeNull();
    expect(createdLink?.getAttribute('rel')).toBe('icon');
    expect(createdLink?.getAttribute('type')).toBe('image/svg+xml');
    expect(createdLink?.getAttribute('href')).toBe(targetUrl);
    expect(service.getFavicon()).toBe(targetUrl);
  });

  it('updates the favicon across consecutive calls without creating duplicate elements', () => {
    const service = TestBed.inject(FaviconService);

    service.setFavicon('https://resume-images.ohm-mho.space/favicons/available/favicon.svg');
    service.setFavicon('https://resume-images.ohm-mho.space/favicons/limited/favicon.svg');
    service.setFavicon('https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg');

    const iconLinks = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
    expect(iconLinks.length).toBe(1);
    expect(iconLinks[0].getAttribute('href')).toBe(
      'https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg',
    );
    expect(service.getFavicon()).toBe(
      'https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg',
    );
  });

  it('returns null for getFavicon when no favicon link exists', () => {
    const service = TestBed.inject(FaviconService);

    expect(service.getFavicon()).toBeNull();
  });

  it('safely handles non-browser platform (SSR) without throwing or modifying the DOM', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const service = TestBed.inject(FaviconService);

    expect(() => {
      service.setFavicon('https://resume-images.ohm-mho.space/favicons/available/favicon.svg');
    }).not.toThrow();

    expect(service.getFavicon()).toBeNull();
    expect(document.head.querySelectorAll('link[rel="icon"]').length).toBe(0);
  });
});
