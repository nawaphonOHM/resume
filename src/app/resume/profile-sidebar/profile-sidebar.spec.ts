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
    const displayedLinks = fullData.links.filter(
      (link) => link.label.trim().toLowerCase() !== 'github',
    );

    expect(linkButtons.length).toBe(displayedLinks.length);
    for (let i = 0; i < displayedLinks.length; i++) {
      const link = displayedLinks[i];
      const btn = linkButtons[i];

      expect(btn.getAttribute('href')).toBe(link.url);
      expect(btn.getAttribute('target')).toBe('_blank');
      expect(btn.getAttribute('rel')).toBe('noopener noreferrer');
      expect(btn.textContent).toContain(link.label);
    }
  });

  it('filters GitHub labels regardless of case or surrounding whitespace without changing profile data', () => {
    const githubLinks = [
      { label: '  gItHuB ', url: 'https://code.example.com/first' },
      { label: 'Portfolio', url: 'https://portfolio.example.com/taylor' },
      { label: 'GITHUB', url: 'https://code.example.com/second' },
      { label: 'Blog', url: 'https://blog.example.com/taylor' },
    ] as const;
    const profile = { ...resumeProfileFixture, links: githubLinks };
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', profile);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('.links-list a[mat-stroked-button]'),
    );

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://portfolio.example.com/taylor',
      'https://blog.example.com/taylor',
    ]);
    expect(
      links.map((link) => link.querySelector('.link-label')?.textContent.trim()),
    ).toEqual(['Portfolio', 'Blog']);
    expect(profile.links).toBe(githubLinks);
    expect(profile.links).toEqual(githubLinks);
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('updates the displayed links when the profile input changes', async () => {
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', {
      ...resumeProfileFixture,
      links: [resumeProfileFixture.links[0]],
    });
    await fixture.whenStable();

    let element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.links-list a[mat-stroked-button]')).toHaveLength(0);

    fixture.componentRef.setInput('profile', {
      ...resumeProfileFixture,
      links: [resumeProfileFixture.links[1]],
    });
    await fixture.whenStable();

    element = fixture.nativeElement as HTMLElement;
    const visibleLink = element.querySelector<HTMLAnchorElement>(
      '.links-list a[mat-stroked-button]',
    );
    expect(visibleLink?.getAttribute('href')).toBe(resumeProfileFixture.links[1].url);
    expect(visibleLink?.textContent).toContain(resumeProfileFixture.links[1].label);
  });

  it('renders the GitRanks profile badge with an accessible external link', () => {
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', resumeProfileFixture);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const gitRanksLink = element.querySelector<HTMLAnchorElement>('.gitranks-link');
    const badge = gitRanksLink?.querySelector<HTMLImageElement>('img');

    expect(gitRanksLink?.getAttribute('href')).toBe('https://gitranks.com/profile/nawaphonOHM');
    expect(gitRanksLink?.getAttribute('target')).toBe('_blank');
    expect(gitRanksLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(gitRanksLink?.getAttribute('aria-label')).toBe(
      "View nawaphonOHM's GitRanks profile (opens in a new tab)",
    );
    expect(badge?.getAttribute('src')).toBe(
      'https://gitranks.com/badge/user/nawaphonOHM/profile-card.svg?scheme=violet',
    );
    expect(badge?.getAttribute('width')).toBe('400');
    expect(badge?.getAttribute('height')).toBe('140');
    expect(badge?.getAttribute('alt')).toBe('');
    expect(gitRanksLink?.querySelector('.gitranks-print-label')?.textContent.trim()).toBe(
      'GitRanks profile: nawaphonOHM',
    );
  });

  it('keeps the GitRanks link usable when the badge fails to load', () => {
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', resumeProfileFixture);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const badge = element.querySelector<HTMLImageElement>('.gitranks-link img');
    badge?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const gitRanksLink = element.querySelector<HTMLAnchorElement>('.gitranks-link');
    expect(gitRanksLink?.getAttribute('href')).toBe('https://gitranks.com/profile/nawaphonOHM');
    expect(gitRanksLink?.textContent).toContain('View nawaphonOHM on GitRanks');
    expect(gitRanksLink?.querySelector('img')).toBeNull();
    expect(gitRanksLink?.querySelector('.gitranks-print-label')?.textContent.trim()).toBe(
      'GitRanks profile: nawaphonOHM',
    );
    expect(gitRanksLink?.getAttribute('aria-label')).toBe(
      "View nawaphonOHM's GitRanks profile (opens in a new tab)",
    );
  });

  it('keeps the print label hidden on screen and visible only in print styles', () => {
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', resumeProfileFixture);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const printLabel = element.querySelector<HTMLElement>('.gitranks-print-label');
    const componentStyles = Array.from(document.head.querySelectorAll<HTMLStyleElement>('style'))
      .map((style) => style.textContent)
      .find((styles) => styles.includes('gitranks-print-label'));

    expect(printLabel).not.toBeNull();
    expect(printLabel && getComputedStyle(printLabel).display).toBe('none');
    expect(componentStyles).toMatch(/\.gitranks-print-label[^{}]*\{\s*display:\s*none\s*;?\s*\}/);
    expect(componentStyles).toMatch(
      /@media\s+print[^{]*\{[\s\S]*?\.gitranks-print-label[^{}]*\{\s*display:\s*inline\s*;?\s*\}/,
    );
  });

  it('renders the GitRanks profile when the API-provided links array is empty', () => {
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', { ...resumeProfileFixture, links: [] });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.gitranks-link')).not.toBeNull();
    expect(element.querySelectorAll('.links-list a[mat-stroked-button]')).toHaveLength(0);
  });

  it('keeps API links when none is labeled GitHub', () => {
    const profile = {
      ...resumeProfileFixture,
      links: [resumeProfileFixture.links[1]],
    };
    const fixture = TestBed.createComponent(ProfileSidebar);
    fixture.componentRef.setInput('profile', profile);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>(
      '.links-list a[mat-stroked-button]',
    );

    expect(link?.getAttribute('href')).toBe(profile.links[0].url);
    expect(link?.textContent).toContain(profile.links[0].label);
    expect(element.querySelector('.gitranks-link')).not.toBeNull();
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
