/**
 * Verifies immediate technology artwork, asynchronous enhancement, exact frame surfaces, and
 * propagation of resolved presentation metadata to image zoom.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { ImageZoomDirective } from '../image-zoom/image-zoom.directive';
import {
  TechnologyIconContrastService,
  type TechnologyIconPresentation,
} from './technology-icon-contrast.service';
import { TechnologyIconComponent } from './technology-icon';
import type { TechnologyIconMetadata } from './technology-icons';

const ICON: TechnologyIconMetadata = {
  src: '/images/technology-icons/oracle.svg',
  width: 64,
  height: 64,
  surface: 'light',
};

const OPTIMIZED_PRESENTATION: TechnologyIconPresentation = {
  logo: {
    src: 'data:image/png;base64,optimized',
    width: 64,
    height: 64,
    surface: 'dark',
  },
  backgroundColor: '#0d1b2d',
};

describe('TechnologyIconComponent', () => {
  let fixture: ComponentFixture<TechnologyIconComponent> | undefined;
  let resolveOptimization: (presentation: TechnologyIconPresentation) => void;
  let rejectOptimization: (reason: unknown) => void;
  let optimize: ReturnType<typeof vi.fn<TechnologyIconContrastService['optimize']>>;

  beforeEach(async () => {
    optimize = vi.fn<TechnologyIconContrastService['optimize']>(
      () =>
        new Promise<TechnologyIconPresentation>((resolve, reject) => {
          resolveOptimization = resolve;
          rejectOptimization = reject;
        }),
    );

    await TestBed.configureTestingModule({
      imports: [TechnologyIconComponent],
      providers: [{ provide: TechnologyIconContrastService, useValue: { optimize } }],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it('renders the original immediately and atomically applies the optimized frame and zoom data', async () => {
    fixture = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const image = host.querySelector<HTMLImageElement>('img')!;
    const zoom = fixture.debugElement
      .query(By.directive(ImageZoomDirective))
      .injector.get(ImageZoomDirective);

    expect(optimize).toHaveBeenCalledOnce();
    expect(optimize).toHaveBeenCalledWith(ICON);
    expect(host.classList.contains('technology-icon-container')).toBe(true);
    expect(host.classList.contains('technology-icon-frame')).toBe(true);
    expect(host.classList.contains('technology-icon-frame--light')).toBe(true);
    expect(host.classList.contains('technology-icon-frame--dark')).toBe(false);
    expect(host.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(image.getAttribute('src')).toBe(ICON.src);
    expect(image.getAttribute('width')).toBe('64');
    expect(image.getAttribute('height')).toBe('64');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('alt')).toBe('');
    expect(image.getAttribute('aria-hidden')).toBe('true');
    expect(zoom.appImageZoom()).toBe(ICON);
    expect(zoom.imageZoomLabel()).toBe('Oracle');
    expect(zoom.imageZoomBackground()).toBe('#ffffff');

    resolveOptimization(OPTIMIZED_PRESENTATION);
    await Promise.resolve();
    await fixture.whenStable();

    expect(host.classList.contains('technology-icon-frame--light')).toBe(false);
    expect(host.classList.contains('technology-icon-frame--dark')).toBe(true);
    expect(host.style.backgroundColor).toBe('rgb(13, 27, 45)');
    expect(image.getAttribute('src')).toBe(OPTIMIZED_PRESENTATION.logo.src);
    expect(image.getAttribute('width')).toBe('64');
    expect(image.getAttribute('height')).toBe('64');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('alt')).toBe('');
    expect(zoom.appImageZoom()).toBe(OPTIMIZED_PRESENTATION.logo);
    expect(zoom.imageZoomLabel()).toBe('Oracle');
    expect(zoom.imageZoomBackground()).toBe('#0d1b2d');
  });

  it('retains the usable original presentation when optimization unexpectedly rejects', async () => {
    fixture = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const image = host.querySelector<HTMLImageElement>('img')!;

    rejectOptimization(new Error('optimization failed'));
    await Promise.resolve();
    await fixture.whenStable();

    expect(image.getAttribute('src')).toBe(ICON.src);
    expect(host.classList.contains('technology-icon-frame--light')).toBe(true);
    expect(host.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  async function createComponent(): Promise<ComponentFixture<TechnologyIconComponent>> {
    const componentFixture = TestBed.createComponent(TechnologyIconComponent);
    componentFixture.componentRef.setInput('icon', ICON);
    componentFixture.componentRef.setInput('label', 'Oracle');
    await componentFixture.whenStable();
    return componentFixture;
  }
});
