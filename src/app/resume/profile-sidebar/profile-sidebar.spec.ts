/**
 * Verifies ProfileSidebar rendering of skills chips, contact details, mailto href,
 * and accessibility landmarks without duplicating navigation-owned links.
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

  it('keeps external profile links out of the sidebar', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', fullData);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.links-list')).toBeNull();
    expect(element.querySelector('mat-card-title')?.textContent.trim()).toBe('Profile details');
    expect(element.querySelectorAll('a[target="_blank"]')).toHaveLength(0);
  });

  it('preserves section landmark and ARIA label associations', () => {
    const fullData = resumeProfileFixture;
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', fullData);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const aside = element.querySelector('aside');
    expect(aside?.getAttribute('aria-label')).toBe('Skills and profile details');

    const skillsSection = element.querySelector('section#skills');
    expect(skillsSection?.getAttribute('data-resume-section')).toBe('');
    expect(skillsSection?.getAttribute('aria-labelledby')).toBe('skills-title');

    const profileSection = element.querySelector('section#profile');
    expect(profileSection?.getAttribute('data-resume-section')).toBe('');
    expect(profileSection?.getAttribute('aria-labelledby')).toBe('profile-title');
  });
});
