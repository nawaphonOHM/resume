import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { describe, expect, it } from 'vitest';

import { TechnologyIconContrastService } from '../../experience-timeline/technology-icon/service/technology-icon-contrast/technology-icon-contrast.service.ts';
import type { BrandLogo } from '../../../helper/interface/brand-logo/brand-logo.interface.ts';
import type { ResumeLink } from '../../../helper/interface/ressume-link/resume-link.interface.ts';
import type { TechnologyIconPresentation } from '../../../helper/interface/technology-icon-presentation/technology-icon-presentation.interface.ts';
import { resumeProfileFixture } from '../../../../../test/fixtures/resume-profile.ts';
import { OnlineLinkIcon } from './online-link-icon';

const ORIGINAL_LOGO: BrandLogo = {
  src: '/assets/original-logo.svg',
  width: 64,
  height: 64,
  surface: 'dark',
};

const ENHANCED_LOGO: BrandLogo = {
  src: 'data:image/png;base64,enhanced',
  width: 64,
  height: 64,
  surface: 'light',
};

const LINK_WITH_LOGO: ResumeLink = {
  ...resumeProfileFixture.links[0],
  logo: ORIGINAL_LOGO,
};

interface PendingOptimization {
  readonly logo: BrandLogo;
  readonly resolve: (presentation: TechnologyIconPresentation) => void;
  readonly reject: (reason: unknown) => void;
}

describe('OnlineLinkIcon', () => {
  let pendingOptimizations: PendingOptimization[];
  let optimizedLogos: BrandLogo[];

  beforeEach(async () => {
    pendingOptimizations = [];
    optimizedLogos = [];

    await TestBed.configureTestingModule({
      imports: [OnlineLinkIcon],
      providers: [
        {
          provide: TechnologyIconContrastService,
          useValue: {
            optimize: (logo: BrandLogo) => {
              optimizedLogos.push(logo);
              return new Promise<TechnologyIconPresentation>((resolve, reject) => {
                pendingOptimizations.push({ logo, resolve, reject });
              });
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('renders an accessible, secure link and reveals a generated enhanced image', async () => {
    const fixture = createFixture(LINK_WITH_LOGO);
    const anchor = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a');
    const original = anchor?.querySelector<HTMLImageElement>('.online-link-artwork--original');
    const tooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);

    expect(anchor?.getAttribute('href')).toBe(LINK_WITH_LOGO.url);
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(anchor?.getAttribute('aria-label')).toBe(LINK_WITH_LOGO.label);
    expect(tooltip.message).toBe(`Open ${LINK_WITH_LOGO.label} in a new tab`);
    expect(original?.getAttribute('alt')).toBe('');
    expect(original?.getAttribute('src')).toBe(ORIGINAL_LOGO.src);
    expect(original?.getAttribute('width')).toBe(String(ORIGINAL_LOGO.width));
    expect(original?.getAttribute('height')).toBe(String(ORIGINAL_LOGO.height));
    expect(anchor?.querySelector('.online-link-artwork--enhanced')).toBeNull();
    expect(optimizedLogos).toEqual([ORIGINAL_LOGO]);

    pendingOptimizations[0].resolve({
      logo: ENHANCED_LOGO,
      backgroundColor: '#0d1b2d',
    });
    await fixture.whenStable();

    const enhanced = anchor?.querySelector<HTMLImageElement>('.online-link-artwork--enhanced');
    expect(enhanced?.getAttribute('src')).toBe(ENHANCED_LOGO.src);
    expect(enhanced?.getAttribute('ngSrc')).toBeNull();
    expect(enhanced?.getAttribute('alt')).toBe('');
    expect(anchor?.querySelector('.online-link-artwork-frame')?.getAttribute('style')).toContain(
      '--online-link-enhanced-surface: #0d1b2d',
    );
  });

  it('keeps the original image and declared surface available while enhancement is pending', () => {
    const fixture = createFixture(LINK_WITH_LOGO);
    const element = fixture.nativeElement as HTMLElement;
    const frame = element.querySelector<HTMLElement>('.online-link-artwork-frame');

    const anchor = element.querySelector<HTMLAnchorElement>('a');

    expect(anchor?.querySelector('.online-link-artwork--original')).not.toBeNull();
    expect(anchor?.querySelector('.online-link-artwork--enhanced')).toBeNull();
    expect(frame?.style.getPropertyValue('--online-link-original-surface')).toBe('#0d1b2d');

    pendingOptimizations[0].resolve({
      logo: ORIGINAL_LOGO,
      backgroundColor: '#ffffff',
    });
  });

  it('falls back to the original logo and its declared surface when enhancement fails', async () => {
    const fixture = createFixture(LINK_WITH_LOGO);
    pendingOptimizations[0].reject(new Error('Enhancement failed'));
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const frame = element.querySelector<HTMLElement>('.online-link-artwork-frame');

    expect(element.querySelector('.online-link-artwork--original')).not.toBeNull();
    expect(element.querySelector('.online-link-artwork--enhanced')).toBeNull();
    expect(frame?.style.getPropertyValue('--online-link-original-surface')).toBe('#0d1b2d');
  });

  it('uses the generic link icon when a logo is missing', () => {
    const link = resumeProfileFixture.links[1];
    const fixture = createFixture(link);
    const element = fixture.nativeElement as HTMLElement;
    const anchor = element.querySelector<HTMLAnchorElement>('a');

    expect(anchor?.getAttribute('aria-label')).toBe(link.label);
    expect(anchor?.getAttribute('href')).toBe(link.url);
    expect(anchor?.querySelector('mat-icon')?.textContent.trim()).toBe('link');
    expect(anchor?.querySelector('img')).toBeNull();
    expect(optimizedLogos).toEqual([]);
  });

  it('uses the generic icon when the original logo fails to load without losing the link', () => {
    const fixture = createFixture(LINK_WITH_LOGO);
    const element = fixture.nativeElement as HTMLElement;
    const original = element.querySelector<HTMLImageElement>('.online-link-artwork--original');

    original?.dispatchEvent(new Event('error'));
    TestBed.tick();

    expect(element.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe(LINK_WITH_LOGO.url);
    expect(element.querySelector('mat-icon')?.textContent.trim()).toBe('link');
    expect(element.querySelector('img')).toBeNull();

    pendingOptimizations[0].resolve({ logo: ORIGINAL_LOGO, backgroundColor: '#ffffff' });
  });

  it('returns to the original image when the enhanced image fails to load', async () => {
    const fixture = createFixture(LINK_WITH_LOGO);
    pendingOptimizations[0].resolve({ logo: ENHANCED_LOGO, backgroundColor: '#0d1b2d' });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    element
      .querySelector<HTMLImageElement>('.online-link-artwork--enhanced')
      ?.dispatchEvent(new Event('error'));
    TestBed.tick();

    expect(element.querySelector('.online-link-artwork--original')).not.toBeNull();
    expect(element.querySelector('.online-link-artwork--enhanced')).toBeNull();
  });

  it('ignores a stale enhancement when the link input changes', async () => {
    const fixture = createFixture(LINK_WITH_LOGO);
    const replacementLogo: BrandLogo = {
      ...ORIGINAL_LOGO,
      src: '/assets/replacement-logo.svg',
      surface: 'light',
    };
    const replacementLink: ResumeLink = { ...LINK_WITH_LOGO, logo: replacementLogo };

    fixture.componentRef.setInput('link', replacementLink);
    TestBed.tick();
    expect(optimizedLogos).toEqual([ORIGINAL_LOGO, replacementLogo]);

    pendingOptimizations[0].resolve({
      logo: { ...ENHANCED_LOGO, src: 'data:image/png;base64,stale' },
      backgroundColor: '#0d1b2d',
    });
    TestBed.tick();
    expect((fixture.nativeElement as HTMLElement).querySelector('.online-link-artwork--enhanced')).toBeNull();

    const replacementEnhancedLogo: BrandLogo = {
      ...ENHANCED_LOGO,
      src: 'data:image/png;base64,replacement',
    };
    pendingOptimizations[1].resolve({ logo: replacementEnhancedLogo, backgroundColor: '#ffffff' });
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLImageElement>('.online-link-artwork--enhanced')
        ?.getAttribute('src'),
    ).toBe(replacementEnhancedLogo.src);
  });
});

function createFixture(link: ResumeLink) {
  const fixture = TestBed.createComponent(OnlineLinkIcon);
  fixture.componentRef.setInput('link', link);
  TestBed.tick();
  return fixture;
}
