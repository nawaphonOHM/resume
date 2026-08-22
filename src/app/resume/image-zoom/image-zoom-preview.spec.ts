/**
 * Verifies that overlay preview data produces non-interactive, accessibility-hidden artwork with
 * intrinsic sizing and the requested contrast surface.
 */
import { TestBed } from '@angular/core/testing';

import type { BrandLogo } from '../../helper/resume-profile/resume-profile.interface.ts';
import {
  IMAGE_ZOOM_PREVIEW_DATA,
  ImageZoomPreview,
  type ImageZoomPreviewData,
} from './image-zoom-preview';

describe('ImageZoomPreview', () => {
  afterEach(() => TestBed.resetTestingModule());

  it.each([
    ['light', 'rgb(255, 255, 255)'],
    ['dark', 'rgb(7, 26, 46)'],
  ] as const)('renders complete %s-surface image metadata', async (surface, expectedSurface) => {
    const logo: BrandLogo = {
      src: `/images/${surface}-mark.svg`,
      width: 640,
      height: 320,
      surface,
    };
    const data: ImageZoomPreviewData = { logo, label: `${surface} brand` };

    await TestBed.configureTestingModule({
      imports: [ImageZoomPreview],
      providers: [{ provide: IMAGE_ZOOM_PREVIEW_DATA, useValue: data }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ImageZoomPreview);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const panel = host.querySelector<HTMLElement>('.image-zoom-preview');
    const image = host.querySelector<HTMLImageElement>('img');
    const imageStyle = getComputedStyle(image!);

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('tabindex')).toBeNull();
    expect(panel?.classList.contains(`image-zoom-preview--${surface}`)).toBe(true);
    expect(panel?.getAttribute('data-image-zoom-surface')).toBe(surface);
    expect(panel?.style.getPropertyValue('--image-zoom-intrinsic-width')).toBe('640px');
    expect(panel?.style.getPropertyValue('--image-zoom-intrinsic-height')).toBe('320px');
    expect(getComputedStyle(panel!).backgroundColor).toBe(expectedSurface);
    expect(imageStyle.contain).toBe('size');
    expect(imageStyle.getPropertyValue('contain-intrinsic-size')).toBe(
      'var(--image-zoom-intrinsic-width) var(--image-zoom-intrinsic-height)',
    );
    expect(imageStyle.width).toBe('auto');
    expect(imageStyle.height).toBe('auto');
    expect(imageStyle.maxWidth).toBe(
      'var(--image-zoom-image-max-width, min(20vw, 100vw - 3.5rem))',
    );
    expect(imageStyle.maxHeight).toBe(
      'var(--image-zoom-image-max-height, min(20vh, 100vh - 3.5rem))',
    );
    expect(imageStyle.objectFit).toBe('contain');
    expect(image?.getAttribute('src')).toBe(logo.src);
    expect(image?.getAttribute('width')).toBe('640');
    expect(image?.getAttribute('height')).toBe('320');
    expect(image?.getAttribute('alt')).toBe(data.label);
    expect(image?.getAttribute('draggable')).toBe('false');
    expect(host.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0);
  });

  it('uses an exact background override without changing the logo surface hooks', async () => {
    const data: ImageZoomPreviewData = {
      logo: {
        src: '/images/enhanced-mark.png',
        width: 128,
        height: 128,
        surface: 'dark',
      },
      label: 'Enhanced brand',
      background: '#0d1b2d',
    };

    await TestBed.configureTestingModule({
      imports: [ImageZoomPreview],
      providers: [{ provide: IMAGE_ZOOM_PREVIEW_DATA, useValue: data }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ImageZoomPreview);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const panel = host.querySelector<HTMLElement>('.image-zoom-preview');

    expect(panel?.classList.contains('image-zoom-preview--dark')).toBe(true);
    expect(panel?.getAttribute('data-image-zoom-surface')).toBe('dark');
    expect(panel?.style.backgroundColor).toBe('rgb(13, 27, 45)');
  });
});
