import { computed, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinner, type ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import type { ResumeTheme } from '../../core/theme.service';
import type { ResumeSectionId } from '../../helper/type/resume-section-id.type.ts';
import { RESUME_SECTIONS } from '../../helper/injection-token/resume-sections.variable.ts';
/**
 * Renders responsive section links and résumé-level theme and download controls.
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

  /** Whether the remote PDF asset is known to be available (null = checking/unknown, true = available, false = unavailable). */
  readonly downloadAvailable = input<boolean | null>(null);

  /** Whether a PDF request is running and both responsive controls must remain disabled. */
  readonly downloadPending = input(false);

  /** Current download progress percentage (0..100) or null if indeterminate/idle. */
  readonly downloadProgress = input<number | null>(null);

  /** Requests that the parent switch to the opposite theme. */
  readonly themeToggled = output<void>();

  /** Requests on-demand PDF generation without coupling navigation to the browser runtime. */
  readonly downloadRequested = output<void>();

  /** Progress spinner mode based on whether determinate progress is known. */
  protected readonly downloadSpinnerMode = computed<ProgressSpinnerMode>(() =>
    typeof this.downloadProgress() === 'number' ? 'determinate' : 'indeterminate',
  );

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

  /** @returns The accessible label describing the current PDF download state. */
  protected downloadControlLabel(): string {
    if (!this.downloadPending()) {
      return this.downloadAvailable() === false
        ? 'Download résumé as PDF (file may be unavailable)'
        : 'Download résumé as PDF';
    }

    const progress = this.downloadProgress();
    return typeof progress === 'number'
      ? `Downloading résumé PDF (${progress}%)`
      : 'Downloading résumé PDF';
  }

  /** @returns The concise mobile-menu label for the current PDF download state. */
  protected downloadControlText(): string {
    if (!this.downloadPending()) {
      return this.downloadAvailable() === false ? 'Download PDF (unavailable)' : 'Download PDF';
    }

    const progress = this.downloadProgress();
    return typeof progress === 'number' ? `Downloading PDF (${progress}%)` : 'Downloading PDF…';
  }
}
