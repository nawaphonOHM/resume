import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { Experience } from '../../model/resume/resume.model';
import { ImageZoomDirective } from '../image-zoom/image-zoom.directive';
import { resolveTechnologyIcon } from './technology-icons';

@Component({
  selector: 'app-experience-timeline',
  imports: [
    ImageZoomDirective,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    NgOptimizedImage,
  ],
  templateUrl: './experience-timeline.html',
  styleUrl: './experience-timeline.scss',
})
export class ExperienceTimeline {
  readonly experience = input.required<readonly Experience[]>();
  protected readonly resolveTechnologyIcon = resolveTechnologyIcon;
}
