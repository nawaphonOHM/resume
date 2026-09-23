/** Verifies availability status color to CDN favicon URL mapping. */
import { TestBed } from '@angular/core/testing';

import { statusFaviconForStatusColor } from './status-favicon-for-status-color.function.ts';
import { IMAGE_ASSET_ORIGIN } from './image-asset-origin.variable.ts';
import { statusColor } from './status-colors.variable.ts';

describe('statusFaviconForStatusColor', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('maps standard status colors to their respective CDN favicon SVG URLs', () => {
    TestBed.configureTestingModule({});
    const resolveFavicon = TestBed.inject(statusFaviconForStatusColor);

    expect(resolveFavicon('#92C353')).toBe(
      'https://resume-images.ohm-mho.space/favicons/available/favicon.svg',
    );
    expect(resolveFavicon('#F7A600')).toBe(
      'https://resume-images.ohm-mho.space/favicons/limited/favicon.svg',
    );
    expect(resolveFavicon('#D1D1D1')).toBe(
      'https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg',
    );
  });

  it('falls back to the unavailable favicon URL for unrecognized status colors', () => {
    TestBed.configureTestingModule({});
    const resolveFavicon = TestBed.inject(statusFaviconForStatusColor);

    expect(resolveFavicon('#000000')).toBe(
      'https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg',
    );
    expect(resolveFavicon('')).toBe(
      'https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg',
    );
  });

  it('honors overridden IMAGE_ASSET_ORIGIN and statusColor tokens', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: IMAGE_ASSET_ORIGIN, useValue: 'https://custom-cdn.example.com' },
        {
          provide: statusColor,
          useValue: {
            available: '#111111',
            limited: '#222222',
            unavailable: '#333333',
          },
        },
      ],
    });

    const resolveFavicon = TestBed.inject(statusFaviconForStatusColor);

    expect(resolveFavicon('#111111')).toBe(
      'https://custom-cdn.example.com/favicons/available/favicon.svg',
    );
    expect(resolveFavicon('#222222')).toBe(
      'https://custom-cdn.example.com/favicons/limited/favicon.svg',
    );
    expect(resolveFavicon('#333333')).toBe(
      'https://custom-cdn.example.com/favicons/unavailable/favicon.svg',
    );
  });
});
