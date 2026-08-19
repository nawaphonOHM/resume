/**
 * Verifies Router-managed section fragments, responsive active presentation, accessible control
 * names, and parent-facing navigation interactions.
 */
import { Component } from '@angular/core';
import { type ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatMenuTrigger } from '@angular/material/menu';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { vi } from 'vitest';

import { ResumeNavigation } from './resume-navigation';

@Component({ template: '' })
class NavigationRouteTarget {}

async function openMobileMenu(fixture: ComponentFixture<ResumeNavigation>): Promise<HTMLElement> {
  const trigger = fixture.debugElement
    .query(By.directive(MatMenuTrigger))
    .injector.get(MatMenuTrigger);
  trigger.openMenu();
  fixture.detectChanges();
  await fixture.whenStable();

  const menu = document.querySelector<HTMLElement>('[role="menu"]');
  expect(menu).not.toBeNull();
  return menu!;
}

describe('ResumeNavigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeNavigation],
      providers: [
        provideRouter([{ path: '', component: NavigationRouteTarget, pathMatch: 'full' }]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    history.replaceState(null, '', location.pathname);
  });

  it('renders Router-managed section anchors in both responsive presentations', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'experience');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const navigationLinks = Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));

    expect(navigationLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/#about',
      '/#experience',
      '/#education',
      '/#skills',
      '/#profile',
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
        .find((link) => link.getAttribute('href') === '/#experience')
        ?.getAttribute('aria-current'),
    ).toBe('location');
    expect(element.querySelector('.brand-mark')?.getAttribute('href')).toBe('/#about');
    expect(fixture.debugElement.queryAll(By.directive(RouterLink))).toHaveLength(6);

    const menu = await openMobileMenu(fixture);
    expect(
      Array.from(menu.querySelectorAll<HTMLAnchorElement>('a')).map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(['/#about', '/#experience', '/#education', '/#skills', '/#profile']);
  });

  it('transfers the active presentation immediately without changing stable section anchors', () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const navigationLinks = Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));
    const aboutLink = navigationLinks.find((link) => link.getAttribute('href') === '/#about');
    const experienceLink = navigationLinks.find(
      (link) => link.getAttribute('href') === '/#experience',
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
    const download = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Download résumé as PDF"]',
    );

    expect(element.querySelector('[aria-label="Switch to light theme"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Print résumé"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Open section menu"]')).not.toBeNull();
    expect(download?.type).toBe('button');
    expect(download?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(element.querySelector('a[download]')).toBeNull();
  });

  it('emits download requests from both responsive controls', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();
    const downloadRequested = vi.fn();
    fixture.componentInstance.downloadRequested.subscribe(downloadRequested);
    const element = fixture.nativeElement as HTMLElement;

    element
      .querySelector<HTMLButtonElement>(
        'button.desktop-control[aria-label="Download résumé as PDF"]',
      )
      ?.click();
    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Download résumé as PDF"]',
    );

    expect(downloadRequested).toHaveBeenCalledOnce();
    expect(mobileDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe('Download PDF');
    mobileDownload?.click();
    expect(downloadRequested).toHaveBeenCalledTimes(2);
  });

  it('disables both download controls and exposes generation progress while pending', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadPending', true);
    fixture.detectChanges();
    const downloadRequested = vi.fn();
    fixture.componentInstance.downloadRequested.subscribe(downloadRequested);
    const element = fixture.nativeElement as HTMLElement;
    const desktopDownload = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Generating résumé PDF"]',
    );
    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Generating résumé PDF"]',
    );

    expect(desktopDownload?.disabled).toBe(true);
    expect(desktopDownload?.getAttribute('aria-busy')).toBe('true');
    expect(desktopDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'progress_activity',
    );
    expect(mobileDownload?.disabled).toBe(true);
    expect(mobileDownload?.getAttribute('aria-busy')).toBe('true');
    expect(mobileDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'progress_activity',
    );
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe('Generating PDF…');

    desktopDownload?.click();
    mobileDownload?.click();
    expect(downloadRequested).not.toHaveBeenCalled();

    fixture.componentRef.setInput('downloadPending', false);
    fixture.detectChanges();

    expect(desktopDownload?.disabled).toBe(false);
    expect(desktopDownload?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(desktopDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(mobileDownload?.disabled).toBe(false);
    expect(mobileDownload?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(mobileDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe('Download PDF');
  });

  it('navigates by section fragment and emits theme interactions', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();

    let themeToggled = false;
    fixture.componentInstance.themeToggled.subscribe(() => {
      themeToggled = true;
    });

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLAnchorElement>('a[href="/#education"]')?.click();
    element.querySelector<HTMLButtonElement>('[aria-label="Switch to dark theme"]')?.click();
    await fixture.whenStable();

    expect(router.url).toBe('/#education');
    expect(themeToggled).toBe(true);
  });
});
