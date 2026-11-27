import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, resource } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TechnologyIconContrastService } from '../../experience-timeline/technology-icon/service/technology-icon-contrast/technology-icon-contrast.service.ts';
import type { BrandLogo } from '../../../helper/interface/brand-logo/brand-logo.interface.ts';
import type { ResumeLink } from '../../../helper/interface/ressume-link/resume-link.interface.ts';
import type { TechnologyIconPresentation } from '../../../helper/interface/technology-icon-presentation/technology-icon-presentation.interface.ts';
import type { TechnologyIconBackgroundColor } from '../../../helper/type/technology-icon-background-color.type.ts';
import type {OnlineLinkArtwork} from '../../../helper/interface/online-link-artwork/online-link-artwork.interface.ts';

const SURFACE_BACKGROUND: Readonly<Record<BrandLogo['surface'], TechnologyIconBackgroundColor>> = {
  light: '#ffffff',
  dark: '#0d1b2d',
};

/** Renders one accessible external destination with its logo or a generic link mark. */
@Component({
  selector: 'app-online-link-icon',
  imports: [NgOptimizedImage, MatIconModule, MatTooltipModule],
  templateUrl: './online-link-icon.html',
  styleUrl: './online-link-icon.scss',
})
export class OnlineLinkIcon {
  /** Destination and optional decorative logo displayed by this icon link. */
  readonly link = input.required<ResumeLink>();

  private readonly contrastService = inject(TechnologyIconContrastService);
  private readonly optimizedPresentation = resource({
    params: () => this.link().logo ?? undefined,
    loader: ({ params: logo }) => this.contrastService.optimize(logo),
  });
  private readonly originalArtworkFailed = linkedSignal({
    source: () => this.link().logo,
    computation: () => false,
  });
  private readonly enhancedArtworkFailed = linkedSignal({
    source: () => this.link().logo,
    computation: () => false,
  });

  /** Keeps the original available until an enhancement succeeds and whenever artwork fails. */
  readonly artwork = computed<OnlineLinkArtwork | undefined>(() => {
    const original = this.link().logo;
    if (!original || this.originalArtworkFailed()) {
      return undefined;
    }

    const originalSurface = SURFACE_BACKGROUND[original.surface];
    const fallback: OnlineLinkArtwork = {
      original,
      originalSurface,
      enhancedSurface: originalSurface,
    };
    const optimized: TechnologyIconPresentation | undefined = this.optimizedPresentation.hasValue()
      ? this.optimizedPresentation.value()
      : undefined;

    if (!optimized || optimized.logo.src === original.src || this.enhancedArtworkFailed()) {
      return fallback;
    }

    return {
      ...fallback,
      enhanced: optimized.logo,
      enhancedSurface: optimized.backgroundColor,
    };
  });

  private onOriginalArtworkError(): void {
    this.originalArtworkFailed.set(true);
  }

  private onEnhancedArtworkError(): void {
    this.enhancedArtworkFailed.set(true);
  }
}
