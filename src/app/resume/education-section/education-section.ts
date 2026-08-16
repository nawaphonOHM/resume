import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { ResumeEducation } from '../../model/resume/resume.model';
import { ImageZoomDirective } from '../image-zoom/image-zoom.directive';

@Component({
  selector: 'app-education-section',
  imports: [
    ImageZoomDirective,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    NgOptimizedImage,
  ],
  templateUrl: './education-section.html',
  styleUrl: './education-section.scss',
})
export class EducationSection {
  readonly education = input.required<ResumeEducation>();
}
