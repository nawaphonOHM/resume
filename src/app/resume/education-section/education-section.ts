import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import type { ResumeEducation } from '../../helper/resume/resume.model';
import { ImageZoomDirective } from '../../directive/image-zome/image-zoom.directive.ts';

/** Presents the academic record, institution branding, and capstone link. */
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
  /** Academic record required to render the complete education section. */
  readonly education = input.required<ResumeEducation>();
}
