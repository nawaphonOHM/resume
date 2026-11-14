/**
 * Verifies EducationSection rendering of degree, institution, study period, GPAX,
 * senior project links, and accessibility semantics.
 */
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { EducationSection } from './education-section';
import { resumeProfileFixture } from '../../../../test/fixtures/resume-profile.ts';

describe('EducationSection', () => {
  it('renders degree, institution, period, and GPAX correctly', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(EducationSection);
    fixture.componentRef.setInput('education', fullData.education);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cardText = element.querySelector('.education-card')?.textContent ?? '';

    expect(cardText).toContain(fullData.education.degree);
    expect(cardText).toContain(fullData.education.institution);
    expect(cardText).toContain(fullData.education.period);
    expect(cardText).toContain(fullData.education.gpax);
    expect(cardText).not.toContain('[object Object]');
  });

  it('renders senior project name and external repository link', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(EducationSection);
    fixture.componentRef.setInput('education', fullData.education);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const projectTitle = element.querySelector('.project-title');
    expect(projectTitle?.textContent).toContain(fullData.education.seniorProject.name);

    const projectLink = element.querySelector<HTMLAnchorElement>('.project-link');
    expect(projectLink).not.toBeNull();
    expect(projectLink?.getAttribute('href')).toBe(fullData.education.seniorProject.url);
    expect(projectLink?.getAttribute('target')).toBe('_blank');
    expect(projectLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(projectLink?.getAttribute('aria-label')).toContain(
      fullData.education.seniorProject.name,
    );
  });

  it('preserves section landmark and ARIA heading associations', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(EducationSection);
    fixture.componentRef.setInput('education', fullData.education);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector('section#education');

    expect(section).not.toBeNull();
    expect(section?.getAttribute('data-resume-section')).toBe('');
    expect(section?.getAttribute('aria-labelledby')).toBe('education-title');

    const heading = element.querySelector('#education-title');
    expect(heading?.textContent.trim()).toBe('Education');
  });
});
