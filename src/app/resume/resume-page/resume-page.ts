import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ErrorHandler,
  HostListener,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { merge } from 'rxjs';

import { ThemeService } from '../../core/theme.service';
import { EducationSection } from '../education-section/education-section';
import { ExperienceTimeline } from '../experience-timeline/experience-timeline';
import { HeroSection } from '../hero-section/hero-section';
import { ProfileSidebar } from '../profile-sidebar/profile-sidebar';
import { ResumeNavigation } from '../resume-navigation/resume-navigation';
import type { ResumeSectionId } from '../../helper/type/resume-section-id.type.ts';
import { RESUME_SECTIONS } from '../../helper/injection-token/resume-sections.variable.ts';
import { SummarySection } from '../summary-section/summary-section';
import { resumeData } from '../../helper/injection-token/resume.data.ts';
import { ResumePdfService } from './service/resume-pdf/resume-pdf.service.ts';
import { VIEWPORT_EVENT_THROTTLE_MS } from '../../helper/injection-token/viewport-event-throttle-ms.variable.ts';
import { SECTION_ACTIVATION_RATIO } from '../../helper/injection-token/section-activation-ratio.variable.ts';

/**
 * Composes the canonical résumé and coordinates navigation, theme, and PDF generation.
 *
 * @remarks Recognized routed fragments and observable viewport sections share responsibility for
 * active navigation state, while the Router owns URL, history, scrolling, and target focus.
 */
@Component({
  selector: 'app-resume-page',
  imports: [
    EducationSection,
    ExperienceTimeline,
    HeroSection,
    MatProgressSpinner,
    ProfileSidebar,
    ResumeNavigation,
    RouterLink,
    SummarySection,
  ],
  templateUrl: './resume-page.html',
  styleUrl: './resume-page.scss',
})
export default class ResumePage {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly resumePdfService = inject(ResumePdfService);
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly themeService = inject(ThemeService);
  private readonly viewportRuler = inject(ViewportRuler);
  private readonly sections = inject(RESUME_SECTIONS);
  private readonly viewportEventThrottleMs = inject(VIEWPORT_EVENT_THROTTLE_MS);
  private readonly sectionActivationRatio = inject(SECTION_ACTIVATION_RATIO);

  /** Canonical profile distributed to the presentational section components. */
  protected readonly resume = inject(resumeData);

  /** Section currently represented as active in responsive navigation. */
  protected readonly activeSection = signal<ResumeSectionId>('about');

  /** Whether one user-triggered PDF generation request is currently running. */
  protected readonly downloadPending = signal(false);

  /** Forces every post-hero boundary to render when a later app-controlled action requires it. */
  protected readonly renderAllSections = signal(false);

  /** Template-facing reference to the theme service's selected preference. */
  protected readonly theme = this.themeService.theme;

  /** Synchronizes routed fragments immediately and defers viewport tracking until initial render. */
  constructor() {
    this.activatedRoute.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (this.isSectionId(fragment)) {
        this.activeSection.set(fragment);
      }
    });

    afterNextRender(() => {
      merge(
        this.scrollDispatcher.scrolled(this.viewportEventThrottleMs),
        this.viewportRuler.change(this.viewportEventThrottleMs),
      )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.updateActiveSection();
        });
    });
  }

  /** Delegates explicit theme switching and persistence to the theme service. */
  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  /** Starts loading all deferred content as a best effort before a native print dialog opens. */
  @HostListener('window:beforeprint')
  protected prepareForNativePrint(): void {
    this.renderAllSections.set(true);
  }

  /** Generates the PDF once per request while preserving retry behavior after any outcome. */
  protected async downloadResume(): Promise<void> {
    if (this.downloadPending()) {
      return;
    }

    this.downloadPending.set(true);
    try {
      await this.resumePdfService.download();
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
    } finally {
      this.downloadPending.set(false);
    }
  }

  /**
   * Re-queries registered sections so deferred replacements participate immediately, then selects
   * the visible section containing the activation line or whose top is nearest to it.
   */
  private updateActiveSection(): void {
    const viewport = this.viewportRuler.getViewportRect();
    const activationLine = viewport.top + viewport.height * this.sectionActivationRatio;
    const visibleSections: Array<{
      readonly id: ResumeSectionId;
      readonly top: number;
      readonly bottom: number;
    }> = [];

    for (const section of this.sections) {
      const element = this.document.getElementById(section.id);

      if (!element) {
        continue;
      }

      const bounds = element.getBoundingClientRect();
      const top = viewport.top + bounds.top;
      const bottom = viewport.top + bounds.bottom;

      if (bottom > viewport.top && top < viewport.bottom) {
        visibleSections.push({ id: section.id, top, bottom });
      }
    }

    const activeSection =
      visibleSections.find(
        ({ top, bottom }) => top <= activationLine && bottom >= activationLine,
      ) ??
      visibleSections.sort(
        (first, second) =>
          Math.abs(first.top - activationLine) - Math.abs(second.top - activationLine),
      )[0];

    if (activeSection) {
      this.activeSection.set(activeSection.id);
    }
  }

  /** @returns Whether a fragment value belongs to the shared section registry. */
  private isSectionId(value: string | null | undefined): value is ResumeSectionId {
    return this.sections.some((section) => section.id === value);
  }
}
