import { DOCUMENT, ViewportScroller } from '@angular/common';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import type { ResumeTheme } from '../../core/theme.service';
import type { ResumeNavigationSection } from '../../helper/interface/resume-navigation-section/resume-navigation-section.interface.ts';
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
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewportScroller = inject(ViewportScroller);

  private navigationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private scrollEndCleanup: (() => void) | null = null;

  /** Section whose desktop and mobile links receive the active presentation. */
  readonly activeSection = input.required<ResumeSectionId>();

  /** Current theme used to derive the opposite-theme control label and icon. */
  readonly theme = input.required<ResumeTheme>();

  /** Whether a PDF request is running and both responsive controls must remain disabled. */
  readonly downloadPending = input(false);

  /** Active section navigation currently processing smooth scrolling. */
  readonly loadingSection = signal<ResumeSectionId | null>(null);

  /** Requests that the parent switch to the opposite theme. */
  readonly themeToggled = output<void>();

  /** Requests browser printing without coupling the navigation to the document object. */
  readonly printRequested = output<void>();

  /** Requests on-demand PDF generation without coupling navigation to the browser runtime. */
  readonly downloadRequested = output<void>();

  /** Shared section registry exposed to both desktop and mobile templates. */
  protected readonly sections = inject(RESUME_SECTIONS);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearActiveNavigation();
      this.loadingSection.set(null);
    });
  }

  /**
   * Smoothly scrolls to the targeted section and tracks the loading state until settled or timed out.
   */
  onSectionNavigate(sectionId: ResumeSectionId, _event?: MouseEvent): void {
    this.clearActiveNavigation();
    this.loadingSection.set(sectionId);

    this.viewportScroller.scrollToAnchor(sectionId);

    const settle = () => {
      this.clearActiveNavigation();
      if (this.loadingSection() === sectionId) {
        this.loadingSection.set(null);
      }
    };

    const targetWindow = this.document.defaultView;
    if (targetWindow && typeof targetWindow.addEventListener === 'function') {
      targetWindow.addEventListener('scrollend', settle, { once: true });
      this.scrollEndCleanup = () => {
        targetWindow.removeEventListener('scrollend', settle);
      };
    } else if (this.document && typeof this.document.addEventListener === 'function') {
      this.document.addEventListener('scrollend', settle, { once: true });
      this.scrollEndCleanup = () => {
        this.document.removeEventListener('scrollend', settle);
      };
    }

    this.navigationTimeoutId = setTimeout(settle, 500);
  }

  /** @returns The accessible action label for a section link reflecting in-flight navigation. */
  protected sectionAriaLabel(section: ResumeNavigationSection): string {
    return this.loadingSection() === section.id ? `Navigating to ${section.label}` : section.label;
  }

  private clearActiveNavigation(): void {
    if (this.navigationTimeoutId !== null) {
      clearTimeout(this.navigationTimeoutId);
      this.navigationTimeoutId = null;
    }
    if (this.scrollEndCleanup) {
      this.scrollEndCleanup();
      this.scrollEndCleanup = null;
    }
  }

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
