/** Verifies availability status color to asset favicon URL mapping. */
import { TestBed } from '@angular/core/testing';

import { statusFaviconForStatusColor } from './status-favicon-for-status-color.function.ts';
import { IMAGE_ASSET_ORIGIN } from './image-asset-origin.variable.ts';
import { statusColor } from './status-colors.variable.ts';

describe('statusFaviconForStatusColor', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('maps standard status colors to their encoded favicon query URLs', () => {
    TestBed.configureTestingModule({});
    const resolveFavicon = TestBed.inject(statusFaviconForStatusColor);

    expect(resolveFavicon('#92C353')).toBe(
      'https://ohm-mho.space/assets/favicon.svg?%7B%22status%22%3A%22available%22%7D',
    );
    expect(resolveFavicon('#F7A600')).toBe(
      'https://ohm-mho.space/assets/favicon.svg?%7B%22status%22%3A%22limited%22%7D',
    );
    expect(resolveFavicon('#D1D1D1')).toBe(
      'https://ohm-mho.space/assets/favicon.svg?%7B%22status%22%3A%22unavailable%22%7D',
    );
  });

  it('falls back to the unavailable favicon URL for unrecognized status colors', () => {
    TestBed.configureTestingModule({});
    const resolveFavicon = TestBed.inject(statusFaviconForStatusColor);

    expect(resolveFavicon('#000000')).toBe(
      'https://ohm-mho.space/assets/favicon.svg?%7B%22status%22%3A%22unavailable%22%7D',
    );
    expect(resolveFavicon('')).toBe(
      'https://ohm-mho.space/assets/favicon.svg?%7B%22status%22%3A%22unavailable%22%7D',
    );
  });

  it('honors overridden IMAGE_ASSET_ORIGIN and statusColor tokens', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: IMAGE_ASSET_ORIGIN, useValue: 'https://custom-cdn.example.com/' },
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
      'https://custom-cdn.example.com/assets/favicon.svg?%7B%22status%22%3A%22available%22%7D',
    );
    expect(resolveFavicon('#222222')).toBe(
      'https://custom-cdn.example.com/assets/favicon.svg?%7B%22status%22%3A%22limited%22%7D',
    );
    expect(resolveFavicon('#333333')).toBe(
      'https://custom-cdn.example.com/assets/favicon.svg?%7B%22status%22%3A%22unavailable%22%7D',
    );
  });
});
