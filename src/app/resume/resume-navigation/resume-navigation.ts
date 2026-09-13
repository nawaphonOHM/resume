import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import type { ResumeTheme } from '../../core/theme.service';
import type { ResumeSectionId } from '../../helper/type/resume-section-id.type.ts';
import { RESUME_SECTIONS } from '../../helper/injection-token/resume-sections.variable.ts';
/**
 * Renders responsive section links and résumé-level theme, print, and download controls.
 *
 * @remarks Section anchors delegate fragment URL, history, and scroll behavior to the Router. The
 * parent supplies active styling from routed fragments and observed viewport sections.
 */
@Component({
  selector: 'app-resume-navigation',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinner,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './resume-navigation.html',
  styleUrl: './resume-navigation.scss',
})
export class ResumeNavigation {
  /** Section whose desktop and mobile links receive the active presentation. */
  readonly activeSection = input.required<ResumeSectionId>();

  /** Current theme used to derive the opposite-theme control label and icon. */
  readonly theme = input.required<ResumeTheme>();

  /** Whether a print request is preparing printable boundaries and controls must remain disabled. */
  readonly printPending = input(false);

  /** Whether a PDF request is running and both responsive controls must remain disabled. */
  readonly downloadPending = input(false);

  /** Requests that the parent switch to the opposite theme. */
  readonly themeToggled = output<void>();

  /** Requests browser printing without coupling the navigation to the document object. */
  readonly printRequested = output<void>();

  /** Requests on-demand PDF generation without coupling navigation to the browser runtime. */
  readonly downloadRequested = output<void>();

  /** Shared section registry exposed to both desktop and mobile templates. */
  protected readonly sections = inject(RESUME_SECTIONS);

  /** @returns An accessible action label naming the theme that will be selected. */
  protected themeControlLabel(): string {
    return this.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  /** @returns The Material icon representing the theme that will be selected. */
  protected themeIcon(): string {
    return this.theme() === 'dark' ? 'light_mode' : 'dark_mode';
  }

  /** @returns The accessible action label describing the current print state. */
  protected printControlLabel(): string {
    return this.printPending() ? 'Preparing résumé for printing' : 'Print résumé';
  }

  /** @returns The concise mobile-menu label for the current print state. */
  protected printControlText(): string {
    return this.printPending() ? 'Preparing to print…' : 'Print résumé';
  }

  /** @returns The accessible label describing the current PDF download state. */
  protected downloadControlLabel(): string {
    return this.downloadPending() ? 'Generating résumé PDF' : 'Download résumé as PDF';
  }

  /** @returns The concise mobile-menu label for the current PDF download state. */
  protected downloadControlText(): string {
    return this.downloadPending() ? 'Generating PDF…' : 'Download PDF';
  }
}
