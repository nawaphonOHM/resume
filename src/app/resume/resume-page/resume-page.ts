import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';

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

/**
 * Composes the canonical résumé and coordinates document-level navigation, theme, and printing.
 *
 * @remarks After the first browser render, a valid initial fragment is restored without smooth
 * scrolling and observable sections begin driving the active navigation state. Direct link
 * selection updates that state immediately; native anchors remain responsible for URL and scroll
 * behavior. A missing document view or intersection observer suppresses only its corresponding
 * browser side effect.
 */
@Component({
  selector: 'app-resume-page',
  imports: [
    EducationSection,
    ExperienceTimeline,
    HeroSection,
    ProfileSidebar,
    ResumeNavigation,
    SummarySection,
  ],
  templateUrl: './resume-page.html',
  styleUrl: './resume-page.scss',
})
export class ResumePage {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);

  /** Canonical profile distributed to the presentational section components. */
  protected readonly resume = RESUME;

  /** Section currently represented as active in responsive navigation. */
  protected readonly activeSection = signal<ResumeSectionId>('about');

  /** Template-facing reference to the theme service's selected preference. */
  protected readonly theme = this.themeService.theme;

  /** Defers hash restoration and DOM observation until section elements have rendered. */
  constructor() {
    afterNextRender(() => {
      this.restoreInitialSection();
      this.observeSections();
    });
  }

  /**
   * Transfers active navigation presentation as soon as a native section link is selected.
   *
   * @param section - Fragment-backed section selected by the reader.
   */
  protected selectSection(section: ResumeSectionId): void {
    this.activeSection.set(section);
  }

  /** Delegates explicit theme switching and persistence to the theme service. */
  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  /** Opens the browser print dialog when a document view is available. */
  protected printResume(): void {
    this.document.defaultView?.print();
  }

  /**
   * Restores a recognized initial fragment and scrolls it into view without inheriting global
   * smooth scrolling, then restores the root element's previous inline scroll behavior.
   */
  private restoreInitialSection(): void {
    const view = this.document.defaultView;
    const initialSection = view?.location.hash.slice(1);

    if (this.isSectionId(initialSection)) {
      this.activeSection.set(initialSection);
      const root = this.document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      this.document.getElementById(initialSection)?.scrollIntoView?.({
        block: 'start',
        behavior: 'auto',
      });
      root.style.scrollBehavior = previousScrollBehavior;
    }
  }

  /**
   * Tracks registered sections in a narrow viewport band and selects the intersecting entry
   * nearest the viewport top. The observer is omitted when unsupported and disconnected with the
   * component lifecycle.
   */
  private observeSections(): void {
    const view = this.document.defaultView;

    const Observer = view?.IntersectionObserver;

    if (!Observer) {
      return;
    }

    const sectionObserver = new Observer(
      (entries) => {
        const closestVisibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top),
          )[0];
        const sectionId = closestVisibleSection?.target.id;

        if (this.isSectionId(sectionId)) {
          this.activeSection.set(sectionId);
        }
      },
      {
        rootMargin: '-18% 0px -68% 0px',
        threshold: [0, 0.25, 0.5, 0.75],
      },
    );
    this.destroyRef.onDestroy(() => sectionObserver.disconnect());

    for (const section of RESUME_SECTIONS) {
      const element = this.document.getElementById(section.id);

      if (element) {
        sectionObserver.observe(element);
      }
    }
  }

  /** @returns Whether a fragment value belongs to the shared section registry. */
  private isSectionId(value: string | undefined): value is ResumeSectionId {
    return RESUME_SECTIONS.some((section) => section.id === value);
  }
}
