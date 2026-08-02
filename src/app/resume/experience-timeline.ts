import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { Experience } from './resume.model';

@Component({
  selector: 'app-experience-timeline',
  imports: [MatCardModule, MatChipsModule, MatDividerModule, MatIconModule],
  templateUrl: './experience-timeline.html',
  styleUrl: './experience-timeline.css',
})
export class ExperienceTimeline {
  readonly experience = input.required<readonly Experience[]>();
}
