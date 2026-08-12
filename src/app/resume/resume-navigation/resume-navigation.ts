import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { ResumeTheme } from '../../core/theme.service';

export type ResumeSectionId = 'about' | 'experience' | 'education' | 'skills' | 'profile';

export interface ResumeNavigationSection {
  readonly id: ResumeSectionId;
  readonly label: string;
}

export const RESUME_SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'profile', label: 'Profile' },
] as const satisfies readonly ResumeNavigationSection[];

@Component({
  selector: 'app-resume-navigation',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  templateUrl: './resume-navigation.html',
  styleUrl: './resume-navigation.css',
})
export class ResumeNavigation {
  readonly activeSection = input.required<ResumeSectionId>();
  readonly theme = input.required<ResumeTheme>();
  readonly sectionSelected = output<ResumeSectionId>();
  readonly themeToggled = output<void>();
  readonly printRequested = output<void>();

  protected readonly sections = RESUME_SECTIONS;
  protected readonly downloadUrl = 'downloads/nawaphon-isarathanachaikul-resume.pdf';

  protected themeControlLabel(): string {
    return this.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  protected themeIcon(): string {
    return this.theme() === 'dark' ? 'light_mode' : 'dark_mode';
  }
}
