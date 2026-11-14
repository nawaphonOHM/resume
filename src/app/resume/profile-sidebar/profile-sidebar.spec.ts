/**
 * Verifies ProfileSidebar rendering of skills chips, contact details dl list,
 * external link buttons, mailto href, and accessibility landmarks.
 */
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ProfileSidebar } from './profile-sidebar';
import { resumeProfileFixture } from '../../../../test/fixtures/resume-profile.ts';

describe('ProfileSidebar', () => {
  it('renders skill chips matching the profile skills array', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', fullData);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const chips = Array.from(element.querySelectorAll('mat-chip'));

    expect(chips.length).toBe(fullData.skills.length);
    expect(chips.map((chip) => chip.textContent.trim())).toEqual(fullData.skills);
  });

  it('renders public profile details in definition list', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', fullData);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const dl = element.querySelector('dl');

    expect(dl).not.toBeNull();
    const text = dl?.textContent ?? '';

    expect(text).toContain(fullData.details.location);
    expect(text).toContain(fullData.details.phoneLabel);
    expect(text).toContain(fullData.details.email);
    expect(text).toContain(fullData.details.nationality);
    expect(text).toContain(fullData.details.birthDate);
    expect(text).not.toContain('[object Object]');

    const emailLink = element.querySelector<HTMLAnchorElement>(
      `a[href="mailto:${fullData.details.email}"]`,
    );
    expect(emailLink).not.toBeNull();
    expect(emailLink?.textContent.trim()).toBe(fullData.details.email);
  });

  it('renders external links with target="_blank" and noopener rel', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', fullData);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const linkButtons = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('.links-list a[mat-stroked-button]'),
    );

    expect(linkButtons.length).toBe(fullData.links.length);
    for (let i = 0; i < fullData.links.length; i++) {
      const link = fullData.links[i];
      const btn = linkButtons[i];

      expect(btn.getAttribute('href')).toBe(link.url);
      expect(btn.getAttribute('target')).toBe('_blank');
      expect(btn.getAttribute('rel')).toBe('noopener noreferrer');
      expect(btn.textContent).toContain(link.label);
    }
  });

  it('preserves section landmark and ARIA label associations', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', fullData);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const aside = element.querySelector('aside');
    expect(aside?.getAttribute('aria-label')).toBe('Skills and public profile');

    const skillsSection = element.querySelector('section#skills');
    expect(skillsSection?.getAttribute('data-resume-section')).toBe('');
    expect(skillsSection?.getAttribute('aria-labelledby')).toBe('skills-title');

    const profileSection = element.querySelector('section#profile');
    expect(profileSection?.getAttribute('data-resume-section')).toBe('');
    expect(profileSection?.getAttribute('aria-labelledby')).toBe('profile-title');
  });
});
