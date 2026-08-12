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
  styleUrl: './resume-page.css',
})
export class ResumePage {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);

  protected readonly resume = RESUME;
  protected readonly activeSection = signal<ResumeSectionId>('about');
  protected readonly theme = this.themeService.theme;

  constructor() {
    afterNextRender(() => {
      this.restoreInitialSection();
      this.observeSections();
    });
  }

  protected selectSection(section: ResumeSectionId): void {
    this.activeSection.set(section);
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected printResume(): void {
    this.document.defaultView?.print();
  }

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

  private isSectionId(value: string | undefined): value is ResumeSectionId {
    return RESUME_SECTIONS.some((section) => section.id === value);
  }
}
