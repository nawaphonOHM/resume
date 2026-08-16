import { Component, DestroyRef, inject, input, signal, type OnInit } from '@angular/core';

import { ImageZoomDirective } from '../image-zoom/image-zoom.directive';
import {
  TechnologyIconContrastService,
  type TechnologyIconPresentation,
} from './technology-icon-contrast.service';
import type { TechnologyIconMetadata } from './technology-icons';

/** Presents one decorative technology mark and upgrades it after deferred contrast processing. */
@Component({
  selector: 'app-technology-icon',
  imports: [ImageZoomDirective],
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
export class TechnologyIconComponent implements OnInit {
  /** Original local SVG metadata displayed before and whenever optimization is unavailable. */
  readonly icon = input.required<TechnologyIconMetadata>();

  /** Technology name retained for the enlarged visual preview. */
  readonly label = input.required<string>();

  /** Atomic artwork-and-surface state consumed by both the chip frame and zoom directive. */
  protected readonly presentation = signal<TechnologyIconPresentation | undefined>(undefined);

  private readonly contrastService = inject(TechnologyIconContrastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Publishes the original synchronously, then applies the safely resolved optimized result. */
  ngOnInit(): void {
    const icon = this.icon();
    this.presentation.set({ logo: icon, backgroundColor: '#ffffff' });

    try {
      void this.contrastService.optimize(icon).then(
        (presentation) => {
          if (!this.destroyRef.destroyed) {
            this.presentation.set(presentation);
          }
        },
        () => undefined,
      );
    } catch {
      // The original SVG and light frame are already usable.
    }
  }
}
