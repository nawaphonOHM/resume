import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { ImageZoomDirective } from '../../directive/image-zome/image-zoom.directive.ts';
import { TechnologyIconComponent } from './technology-icon/technology-icon.ts';
import { resolveTechnologyIcon } from './technology-icon/technology-icons.ts';
import type { Experience } from '../../helper/experience/experience.interface.ts';

/** Renders ordered employment records with client relationships and technology metadata. */
@Component({
  selector: 'app-experience-timeline',
  imports: [
    ImageZoomDirective,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    NgOptimizedImage,
    TechnologyIconComponent,
  ],
  templateUrl: './experience-timeline.html',
  styleUrl: './experience-timeline.scss',
})
export class ExperienceTimeline {
  /** Employment history to display in its supplied, typically newest-first order. */
  readonly experience = input.required<readonly Experience[]>();

  /** Exact-label icon lookup exposed to the template; absence selects its generic fallback. */
  protected readonly resolveTechnologyIcon = resolveTechnologyIcon;
}
