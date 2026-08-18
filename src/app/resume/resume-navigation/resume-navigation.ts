import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { ResumeTheme } from '../../core/theme.service';

/** Stable fragment identifiers for sections that participate in résumé navigation. */
export type ResumeSectionId = 'about' | 'experience' | 'education' | 'skills' | 'profile';

/** Navigation metadata for one observable résumé section. */
export interface ResumeNavigationSection {
  /** Fragment identifier shared by its anchor and section element. */
  readonly id: ResumeSectionId;

  /** Reader-facing anchor label. */
  readonly label: string;
}

/** Ordered registry used by both navigation links and page-level section observation. */
export const RESUME_SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'profile', label: 'Profile' },
] as const satisfies readonly ResumeNavigationSection[];

/**
 * Renders responsive section links and résumé-level theme, print, and download controls.
 *
 * @remarks Section anchors always retain their native fragments. Selection events let the
 * parent transfer active styling immediately while the browser remains responsible for fragment
 * navigation and history updates.
 */
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
  styleUrl: './resume-navigation.scss',
})
export class ResumeNavigation {
  /** Section whose desktop and mobile links receive the active presentation. */
  readonly activeSection = input.required<ResumeSectionId>();

  /** Current theme used to derive the opposite-theme control label and icon. */
  readonly theme = input.required<ResumeTheme>();

  /** Whether a PDF request is running and both responsive controls must remain disabled. */
  readonly downloadPending = input(false);

  /** Emits the fragment target selected through any navigation presentation. */
  readonly sectionSelected = output<ResumeSectionId>();

  /** Requests that the parent switch to the opposite theme. */
  readonly themeToggled = output<void>();

  /** Requests browser printing without coupling the navigation to the document object. */
  readonly printRequested = output<void>();

  /** Requests on-demand PDF generation without coupling navigation to the browser runtime. */
  readonly downloadRequested = output<void>();

  /** Shared section registry exposed to both desktop and mobile templates. */
  protected readonly sections = RESUME_SECTIONS;

  /** @returns An accessible action label naming the theme that will be selected. */
  protected themeControlLabel(): string {
    return this.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  /** @returns The Material icon representing the theme that will be selected. */
  protected themeIcon(): string {
    return this.theme() === 'dark' ? 'light_mode' : 'dark_mode';
  }

  /** @returns The accessible label describing the current PDF download state. */
  protected downloadControlLabel(): string {
    return this.downloadPending() ? 'Generating résumé PDF' : 'Download résumé as PDF';
  }

  /** @returns The icon representing either generation progress or download readiness. */
  protected downloadIcon(): string {
    return this.downloadPending() ? 'progress_activity' : 'download';
  }

  /** @returns The concise mobile-menu label for the current PDF download state. */
  protected downloadControlText(): string {
    return this.downloadPending() ? 'Generating PDF…' : 'Download PDF';
  }
}
