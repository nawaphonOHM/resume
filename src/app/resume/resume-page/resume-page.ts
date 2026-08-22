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
  injectAsync,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { merge } from 'rxjs';

import { ThemeService } from '../../core/theme.service';
import { EducationSection } from '../education-section/education-section';
import { ExperienceTimeline } from '../experience-timeline/experience-timeline';
import { HeroSection } from '../hero-section/hero-section';
import { ProfileSidebar } from '../profile-sidebar/profile-sidebar';
import { RESUME } from '../../data/resume/resume.data';
import {
  RESUME_SECTIONS,
  ResumeNavigation,
  type ResumeSectionId,
} from '../resume-navigation/resume-navigation';
import { SummarySection } from '../summary-section/summary-section';

/** Stable identifiers shared by deferred content and its printable fallback states. */
export const RESUME_DEFER_BOUNDARIES = {
  summary: 'summary',
  experience: 'experience',
  educationProfile: 'education-profile',
} as const;

const VIEWPORT_EVENT_THROTTLE_MS = 100;
const SECTION_ACTIVATION_RATIO = 0.18;
const DEFER_SETTLEMENT_ATTRIBUTE = 'data-resume-profile-defer-settled';
const DEFER_BOUNDARY_IDS = Object.values(RESUME_DEFER_BOUNDARIES);

/**
 * Composes the canonical résumé and coordinates navigation, theme, printing, and PDF generation.
 *
 * @remarks Recognized routed fragments and observable viewport sections share responsibility for
 * active navigation state, while the Router owns URL, history, scrolling, and target focus.
 */
@Component({
  selector: 'app-resume-profile-page',
  imports: [
    EducationSection,
    ExperienceTimeline,
    HeroSection,
    ProfileSidebar,
    RouterLink,
    SummarySection,
    ResumeNavigation,
  ],
  templateUrl: './resume-page.html',
  styleUrl: './resume-page.scss',
})
export class ResumePage {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly resumePdfService = injectAsync(() => import('../resume-pdf/resume-pdf.service'));
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly themeService = inject(ThemeService);
  private readonly viewportRuler = inject(ViewportRuler);

  private boundaryReadiness?: Promise<void>;
  private boundaryReadinessObserver?: MutationObserver;
  private resolveBoundaryReadiness?: () => void;
  private destroyed = false;

  /** Canonical profile distributed to the presentational section components. */
  protected readonly resume = RESUME;

  /** Section currently represented as active in responsive navigation. */
  protected readonly activeSection = signal<ResumeSectionId>('about');

  /** Whether one user-triggered PDF generation request is currently running. */
  protected readonly downloadPending = signal(false);

  /** Deferred boundary identifiers exposed to successful and error settlement markers. */
  protected readonly deferBoundaries = RESUME_DEFER_BOUNDARIES;

  /** Forces every post-hero boundary to render when a later app-controlled action requires it. */
  protected readonly renderAllSections = signal(false);

  /** Template-facing reference to the theme service's selected preference. */
  protected readonly theme = this.themeService.theme;

  /** Synchronizes routed fragments immediately and defers viewport tracking until initial render. */
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.settleBoundaryReadiness();
    });

    this.activatedRoute.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (this.isSectionId(fragment)) {
        this.activeSection.set(fragment);
      }
    });

    afterNextRender(() => {
      merge(
        this.scrollDispatcher.scrolled(VIEWPORT_EVENT_THROTTLE_MS),
        this.viewportRuler.change(VIEWPORT_EVENT_THROTTLE_MS),
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

  /** Renders and settles every printable boundary before opening the browser print dialog. */
  protected async printResume(): Promise<void> {
    this.renderAllSections.set(true);
    const view = this.document.defaultView;

    if (!view || this.destroyed) {
      return;
    }

    await this.waitForBoundarySettlement();

    if (!this.destroyed) {
      view.print();
    }
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
      const resumePdf = await this.resumePdfService();
      await resumePdf.download();
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
    const activationLine = viewport.top + viewport.height * SECTION_ACTIVATION_RATIO;
    const visibleSections: Array<{
      readonly id: ResumeSectionId;
      readonly top: number;
      readonly bottom: number;
    }> = [];

    for (const section of RESUME_SECTIONS) {
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

  /** Returns one cached promise that resolves when all printable boundaries have settled. */
  private waitForBoundarySettlement(): Promise<void> {
    if (this.boundaryReadiness) {
      return this.boundaryReadiness;
    }

    const main = this.document.querySelector<HTMLElement>('main#main-content');

    if (!main || this.haveAllBoundariesSettled(main)) {
      this.boundaryReadiness = Promise.resolve();
      return this.boundaryReadiness;
    }

    const MutationObserverConstructor = this.document.defaultView?.MutationObserver;

    if (!MutationObserverConstructor) {
      this.boundaryReadiness = Promise.resolve();
      return this.boundaryReadiness;
    }

    this.boundaryReadiness = new Promise<void>((resolve) => {
      this.resolveBoundaryReadiness = resolve;
      this.boundaryReadinessObserver = new MutationObserverConstructor(() => {
        if (this.haveAllBoundariesSettled(main)) {
          this.settleBoundaryReadiness();
        }
      });
      this.boundaryReadinessObserver.observe(main, {
        attributes: true,
        attributeFilter: [DEFER_SETTLEMENT_ATTRIBUTE],
        childList: true,
        subtree: true,
      });

      if (this.haveAllBoundariesSettled(main)) {
        this.settleBoundaryReadiness();
      }
    });
    return this.boundaryReadiness;
  }

  /** @returns Whether each deferred boundary has one success or error marker below the page main. */
  private haveAllBoundariesSettled(main: ParentNode): boolean {
    const settledBoundaries = new Set(
      Array.from(main.querySelectorAll<HTMLElement>(`[${DEFER_SETTLEMENT_ATTRIBUTE}]`)).map(
        (element) => element.getAttribute(DEFER_SETTLEMENT_ATTRIBUTE),
      ),
    );
    return DEFER_BOUNDARY_IDS.every((boundary) => settledBoundaries.has(boundary));
  }

  /** Disconnects and resolves an active readiness wait on settlement or component destruction. */
  private settleBoundaryReadiness(): void {
    this.boundaryReadinessObserver?.disconnect();
    this.boundaryReadinessObserver = undefined;
    this.resolveBoundaryReadiness?.();
    this.resolveBoundaryReadiness = undefined;
  }

  /** @returns Whether a fragment value belongs to the shared section registry. */
  private isSectionId(value: string | null | undefined): value is ResumeSectionId {
    return RESUME_SECTIONS.some((section) => section.id === value);
  }
}
