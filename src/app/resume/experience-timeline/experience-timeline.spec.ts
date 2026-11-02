/**
 * Verifies ExperienceTimeline rendering of job history items, role titles, company names,
 * client relationships, highlights bullets, technology chips, and accessibility semantics.
 */
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ExperienceTimeline } from './experience-timeline';
import { resumeData } from '../../helper/injection-token/resume.data.ts';

describe('ExperienceTimeline', () => {
  it('renders all experience records with correct roles, companies, periods, and locations', () => {
    const fullData = TestBed.inject(resumeData);
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('experience', fullData.experience);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll('.experience-card'));

    expect(cards).toHaveLength(fullData.experience.length);

    for (let i = 0; i < fullData.experience.length; i++) {
      const exp = fullData.experience[i];
      const card = cards[i];
      const cardText = card.textContent;

      expect(cardText).toContain(exp.role);
      expect(cardText).toContain(exp.company);
      expect(cardText).toContain(exp.period);
      expect(cardText).toContain(exp.location);
      expect(cardText).not.toContain('[object Object]');
    }
  });

  it('renders employment types and client company information when present', () => {
    const fullData = TestBed.inject(resumeData);
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('experience', fullData.experience);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll('.experience-card'));

    for (let i = 0; i < fullData.experience.length; i++) {
      const exp = fullData.experience[i];
      const card = cards[i];

      const expectedEmploymentLabel = exp.employmentTypes.join(' → ');
      const empTypeEl = card.querySelector('.employment-type');
      expect(empTypeEl?.textContent.trim()).toBe(expectedEmploymentLabel);

      if (exp.client) {
        const clientEl = card.querySelector('.company-identity--client');
        expect(clientEl).not.toBeNull();
        expect(clientEl?.textContent).toContain(exp.client.name);
      }
    }
  });

  it('renders highlights and technology chips for each role', () => {
    const fullData = TestBed.inject(resumeData);
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('experience', fullData.experience);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll('.experience-card'));

    for (let i = 0; i < fullData.experience.length; i++) {
      const exp = fullData.experience[i];
      const card = cards[i];

      const highlightItems = Array.from(card.querySelectorAll('ul.highlights li'));
      expect(highlightItems).toHaveLength(exp.highlights.length);

      const techChips = Array.from(card.querySelectorAll('mat-chip .technology-label'));
      expect(techChips.map((c) => c.textContent.trim())).toEqual(exp.technologies);
    }
  });

  it('preserves section landmark and ARIA heading associations', () => {
    const fullData = TestBed.inject(resumeData);
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('experience', fullData.experience);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector('section#experience');

    expect(section).not.toBeNull();
    expect(section?.getAttribute('data-resume-section')).toBe('');
    expect(section?.getAttribute('aria-labelledby')).toBe('experience-title');

    const heading = element.querySelector('#experience-title');
    expect(heading?.textContent.trim()).toBe('Experience timeline');
  });
});
