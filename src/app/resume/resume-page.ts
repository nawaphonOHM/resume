import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';

import { ThemeService } from '../core/theme.service';
import { ExperienceTimeline } from './experience-timeline';
import { HeroSection } from './hero-section';
import { ProfileSidebar } from './profile-sidebar';
import { RESUME } from './resume.data';
import { RESUME_SECTIONS, ResumeNavigation, type ResumeSectionId } from './resume-navigation';
import { SummarySection } from './summary-section';

@Component({
  selector: 'app-resume-page',
  imports: [ExperienceTimeline, HeroSection, ProfileSidebar, ResumeNavigation, SummarySection],
  templateUrl: './resume-page.html',
  styleUrl: './resume-page.scss',
})
export class ResumePage implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private sectionObserver: IntersectionObserver | undefined;

  protected readonly resume = RESUME;
  protected readonly activeSection = signal<ResumeSectionId>('about');
  protected readonly theme = this.themeService.theme;

  ngAfterViewInit(): void {
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

    const Observer = view?.IntersectionObserver;

    if (!Observer) {
      return;
    }

    this.sectionObserver = new Observer(
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

    for (const section of RESUME_SECTIONS) {
      const element = this.document.getElementById(section.id);

      if (element) {
        this.sectionObserver.observe(element);
      }
    }
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
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

  private isSectionId(value: string | undefined): value is ResumeSectionId {
    return RESUME_SECTIONS.some((section) => section.id === value);
  }
}
