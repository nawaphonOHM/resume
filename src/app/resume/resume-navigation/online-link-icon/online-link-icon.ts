import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, resource } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TechnologyIconContrastService } from '../../experience-timeline/technology-icon/service/technology-icon-contrast/technology-icon-contrast.service.ts';
import type { ResumeLink } from '../../../helper/interface/ressume-link/resume-link.interface.ts';
import type { TechnologyIconPresentation } from '../../../helper/interface/technology-icon-presentation/technology-icon-presentation.interface.ts';
import type { OnlineLinkArtwork } from '../../../helper/interface/online-link-artwork/online-link-artwork.interface.ts';
import { SURFACE_BACKGROUND } from '../../../helper/injection-token/surface-background.ts';

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

  private readonly surfaceBackground = inject(SURFACE_BACKGROUND);

  private readonly contrastService = inject(TechnologyIconContrastService);
  private readonly optimizedPresentation = resource({
    params: () => this.link().logo ?? undefined,
    loader: ({ params: logo }) => this.contrastService.optimize(logo),
  });
  /** Tracks source-image failures independently; a failed enhancement must not hide valid original art. */
  private readonly originalArtworkFailed = linkedSignal({
    source: () => this.link().logo,
    computation: () => false,
  });
  /** Resets with the source logo so a new enhancement attempt does not inherit an old image failure. */
  private readonly enhancedArtworkFailed = linkedSignal({
    source: () => this.link().logo,
    computation: () => false,
  });

  /**
   * Chooses the visible artwork in fallback-first order.
   *
   * @remarks
   * Missing or failed original artwork yields no image; otherwise the original is used until a
   * distinct enhanced image is ready, and an enhanced-image failure falls back to the original.
   */
  readonly artwork = computed<OnlineLinkArtwork | undefined>(() => {
    const original = this.link().logo;
    if (!original || this.originalArtworkFailed()) {
      return undefined;
    }

    const originalSurface = this.surfaceBackground[original.surface];
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
