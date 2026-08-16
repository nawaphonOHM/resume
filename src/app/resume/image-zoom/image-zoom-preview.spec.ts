import { TestBed } from '@angular/core/testing';

import type { BrandLogo } from '../../model/resume/resume.model';
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
    expect(image?.getAttribute('src')).toBe(logo.src);
    expect(image?.getAttribute('width')).toBe('640');
    expect(image?.getAttribute('height')).toBe('320');
    expect(image?.getAttribute('alt')).toBe(data.label);
    expect(image?.getAttribute('draggable')).toBe('false');
    expect(host.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0);
  });
});
