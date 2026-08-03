import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { Experience } from '../../model/resume/resume.model';

@Component({
  selector: 'app-experience-timeline',
  imports: [MatCardModule, MatChipsModule, MatDividerModule, MatIconModule],
  templateUrl: './experience-timeline.html',
  styleUrl: './experience-timeline.scss',
})
export class ExperienceTimeline {
  readonly experience = input.required<readonly Experience[]>();
}
