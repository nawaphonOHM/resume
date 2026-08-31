import { Component, computed, inject, input, resource } from '@angular/core';

import { ImageZoomDirective } from '../../../directive/image-zome/image-zoom.directive.ts';
import { TechnologyIconContrastService } from './service/technology-icon-contrast/technology-icon-contrast.service.ts';
import type { TechnologyIconPresentation } from '../../../helper/interface/technology-icon-presentation/technology-icon-presentation.interface.ts';
import { NgOptimizedImage } from '@angular/common';
import type { TechnologyIconMetadata } from '../../../helper/interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';

/** Presents one decorative technology mark and upgrades it after deferred contrast processing. */
@Component({
  selector: 'app-technology-icon',
  imports: [ImageZoomDirective, NgOptimizedImage],
  templateUrl: './technology-icon.html',
  host: {
    class:
      'technology-icon-container technology-icon-frame inline-grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-[0.3rem] border border-solid border-[color:var(--resume-border)] p-px',
    '[class.technology-icon-frame--light]': "presentation()?.backgroundColor === '#ffffff'",
    '[class.technology-icon-frame--dark]': "presentation()?.backgroundColor === '#0d1b2d'",
    '[style.background-color]': 'presentation()?.backgroundColor',
    'aria-hidden': 'true',
  },
})
export class TechnologyIconComponent {
  /** Original local SVG metadata displayed before and whenever optimization is unavailable. */
  readonly icon = input.required<TechnologyIconMetadata>();

  /** Technology name retained for the enlarged visual preview. */
  readonly label = input.required<string>();

  private readonly fallbackPresentation = computed<TechnologyIconPresentation>(() => ({
    logo: this.icon(),
    backgroundColor: '#ffffff',
  }));
  private readonly contrastService = inject(TechnologyIconContrastService);
  private readonly optimizedPresentation = resource({
    params: () => this.icon(),
    loader: ({ params: icon }) => this.contrastService.optimize(icon),
  });

  /** Atomic artwork-and-surface state consumed by both the chip frame and zoom directive. */
  protected readonly presentation = computed<TechnologyIconPresentation>(() =>
    this.optimizedPresentation.hasValue()
      ? this.optimizedPresentation.value()
      : this.fallbackPresentation(),
  );
}
