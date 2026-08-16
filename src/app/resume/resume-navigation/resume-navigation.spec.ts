/**
 * Verifies stable section fragments, responsive active presentation, accessible control names,
 * and parent-facing navigation interactions.
 */
import { TestBed } from '@angular/core/testing';

import { ResumeNavigation } from './resume-navigation';

describe('ResumeNavigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeNavigation],
    }).compileComponents();
  });

  it('renders stable section anchors and exposes the active section', () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'experience');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const navigationLinks = Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));

    expect(navigationLinks.map((link) => link.getAttribute('href'))).toEqual([
      '#about',
      '#experience',
      '#education',
      '#skills',
      '#profile',
    ]);
    expect(navigationLinks.map((link) => link.textContent?.trim())).toEqual([
      'About',
      'Experience',
      'Education',
      'Skills',
      'Profile',
    ]);
    expect(
      navigationLinks
        .find((link) => link.getAttribute('href') === '#experience')
        ?.getAttribute('aria-current'),
    ).toBe('location');
  });

  it('transfers the active presentation immediately without changing stable section anchors', () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const navigationLinks = Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));
    const aboutLink = navigationLinks.find((link) => link.getAttribute('href') === '#about');
    const experienceLink = navigationLinks.find(
      (link) => link.getAttribute('href') === '#experience',
    );
    const stableHrefs = navigationLinks.map((link) => link.getAttribute('href'));

    expect(aboutLink?.classList.contains('navigation-link-active')).toBe(true);
    expect(aboutLink?.getAttribute('aria-current')).toBe('location');
    expect(experienceLink?.classList.contains('navigation-link-active')).toBe(false);
    expect(experienceLink?.getAttribute('aria-current')).toBeNull();

    fixture.componentRef.setInput('activeSection', 'experience');
    fixture.detectChanges();

    const updatedLinks = Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));

    expect(updatedLinks.map((link) => link.getAttribute('href'))).toEqual(stableHrefs);
    updatedLinks.forEach((link, index) => expect(link).toBe(navigationLinks[index]));
    expect(aboutLink?.classList.contains('navigation-link-active')).toBe(false);
    expect(aboutLink?.getAttribute('aria-current')).toBeNull();
    expect(experienceLink?.classList.contains('navigation-link-active')).toBe(true);
    expect(experienceLink?.getAttribute('aria-current')).toBe('location');
    expect(
      updatedLinks.filter((link) => link.classList.contains('navigation-link-active')),
    ).toHaveLength(1);
  });

  it('provides accessible labels for theme, print, menu, and download controls', () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'dark');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const download = element.querySelector<HTMLAnchorElement>('a[download]');

    expect(element.querySelector('[aria-label="Switch to light theme"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Print résumé"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Open section menu"]')).not.toBeNull();
    expect(download?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(download?.getAttribute('href')).toBe('downloads/nawaphon-isarathanachaikul-resume.pdf');
  });

  it('emits section and theme interactions', () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();

    let selectedSection: string | undefined;
    let themeToggled = false;
    fixture.componentInstance.sectionSelected.subscribe((section) => {
      selectedSection = section;
    });
    fixture.componentInstance.themeToggled.subscribe(() => {
      themeToggled = true;
    });

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLAnchorElement>('a[href="#education"]')?.click();
    element.querySelector<HTMLButtonElement>('[aria-label="Switch to dark theme"]')?.click();

    expect(selectedSection).toBe('education');
    expect(themeToggled).toBe(true);
  });
});
