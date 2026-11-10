/**
 * Verifies that overlay preview data produces non-interactive, accessibility-hidden artwork with
 * intrinsic sizing and the requested contrast surface.
 */
import { TestBed } from '@angular/core/testing';

import { ImageZoomPreview } from './image-zoom-preview.ts';
import { IMAGE_ZOOM_PREVIEW_DATA } from '../../helper/injection-token/image-zoom-preview-data.variable.ts';
import type { ImageZoomPreviewData } from '../../helper/interface/image-zoom-preview-data/image-zoom-preview-data.interface.ts';
import type { BrandLogo } from '../../helper/interface/brand-logo/brand-logo.interface.ts';

const findImageSizingRule = (): CSSStyleRule | undefined =>
  Array.from(document.querySelectorAll('style'))
    .flatMap((style) => Array.from(style.sheet?.cssRules ?? []))
    .find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText.includes('.image-zoom-preview__image'),
    );

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

    expect(panel).not.toBeNull();
    expect(image).not.toBeNull();
    if (!panel || !image) {
      throw new Error('Required preview elements were not found');
    }

    const imageStyle = getComputedStyle(image);

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('tabindex')).toBeNull();
    expect(panel.classList.contains(`image-zoom-preview--${surface}`)).toBe(true);
    expect(panel.getAttribute('data-image-zoom-surface')).toBe(surface);
    expect(panel.style.getPropertyValue('--image-zoom-intrinsic-width')).toBe('640px');
    expect(panel.style.getPropertyValue('--image-zoom-intrinsic-height')).toBe('320px');
    expect(getComputedStyle(panel).backgroundColor).toBe(expectedSurface);
    expect(imageStyle.contain).toBe('size');
    expect(imageStyle.getPropertyValue('contain-intrinsic-size')).toBe(
      `${String(logo.width)}px ${String(logo.height)}px`,
    );
    expect(imageStyle.width).toBe('auto');
    expect(imageStyle.height).toBe('auto');
    expect(imageStyle.objectFit).toBe('contain');

    const imageSizingRule = findImageSizingRule();
    expect(imageSizingRule).toBeDefined();
    expect(imageSizingRule?.style.getPropertyValue('max-width')).toMatch(
      /^var\(--image-zoom-image-max-width,\s*min\(20vw,\s*(?:calc\()?100vw - 3\.5rem\)?\)\)$/,
    );
    expect(imageSizingRule?.style.getPropertyValue('max-height')).toMatch(
      /^var\(--image-zoom-image-max-height,\s*min\(20vh,\s*(?:calc\()?100vh - 3\.5rem\)?\)\)$/,
    );

    panel.style.setProperty('--image-zoom-image-max-width', '125px');
    panel.style.setProperty('--image-zoom-image-max-height', '80px');
    const overriddenImageStyle = getComputedStyle(image);
    expect(overriddenImageStyle.maxWidth).toBe('125px');
    expect(overriddenImageStyle.maxHeight).toBe('80px');

    expect(image.getAttribute('src')).toBe(logo.src);
    expect(image.getAttribute('width')).toBe('640');
    expect(image.getAttribute('height')).toBe('320');
    expect(image.getAttribute('alt')).toBe(data.label);
    expect(image.getAttribute('draggable')).toBe('false');
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

  it('renders URL-backed PNG artwork with its intrinsic and accessibility metadata', async () => {
    const generatedSource = '/images/enhanced-mark.png';
    const data: ImageZoomPreviewData = {
      logo: {
        src: generatedSource,
        width: 96,
        height: 48,
        surface: 'light',
      },
      label: 'URL-backed brand',
      background: '#ffffff',
    };

    await TestBed.configureTestingModule({
      imports: [ImageZoomPreview],
      providers: [{ provide: IMAGE_ZOOM_PREVIEW_DATA, useValue: data }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ImageZoomPreview);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const panel = host.querySelector<HTMLElement>('.image-zoom-preview');
    const image = host.querySelector<HTMLImageElement>('img');

    expect(image).not.toBeNull();
    if (!image) {
      throw new Error('Required preview image was not found');
    }

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(panel?.classList.contains('image-zoom-preview--light')).toBe(true);
    expect(panel?.getAttribute('data-image-zoom-surface')).toBe('light');
    expect(image.getAttribute('src')).toBe(generatedSource);
    expect(image.getAttribute('width')).toBe('96');
    expect(image.getAttribute('height')).toBe('48');
    expect(image.getAttribute('alt')).toBe(data.label);
    expect(image.getAttribute('draggable')).toBe('false');
    expect(getComputedStyle(image).getPropertyValue('contain-intrinsic-size')).toBe('96px 48px');
  });
});
