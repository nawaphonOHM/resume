/**
 * Verifies Router-managed section fragments, responsive active presentation, accessible control
 * names, and parent-facing navigation interactions.
 */
import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
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
    expect(navigationLinks.every((link) => link.getAttribute('aria-busy') === null)).toBe(true);
    expect(element.querySelector('nav mat-progress-spinner')).toBeNull();
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

  it('provides accessible labels for theme, menu, and download controls', () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'dark');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const download = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Download résumé as PDF"]',
    );

    expect(element.querySelector('[aria-label="Switch to light theme"]')).not.toBeNull();
    expect(download?.type).toBe('button');
    expect(download?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(element.querySelector('[aria-label="Open section menu"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Print résumé"]')).toBeNull();
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

  it('disables both download controls and renders indeterminate spinner on download start', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadPending', true);
    fixture.componentRef.setInput('downloadProgress', null);
    fixture.detectChanges();
    const downloadRequested = vi.fn();
    fixture.componentInstance.downloadRequested.subscribe(downloadRequested);
    const element = fixture.nativeElement as HTMLElement;
    const desktopDownload = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Downloading résumé PDF"]',
    );
    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Downloading résumé PDF"]',
    );

    expect(desktopDownload?.disabled).toBe(true);
    expect(desktopDownload?.getAttribute('aria-busy')).toBe('true');
    expect(desktopDownload?.querySelector('mat-icon')).toBeNull();
    const desktopSpinnerDebug = fixture.debugElement.query(
      By.css('button.desktop-control[aria-label="Downloading résumé PDF"] mat-progress-spinner'),
    );
    expect(desktopSpinnerDebug).not.toBeNull();
    const desktopSpinner = desktopSpinnerDebug.componentInstance as MatProgressSpinner;
    expect(desktopSpinner.diameter).toBe(18);
    expect(desktopSpinner.strokeWidth).toBe(2.5);
    expect(desktopSpinner.mode).toBe('indeterminate');
    expect(desktopSpinner.value).toBe(0);
    expect(desktopSpinnerDebug.nativeElement.getAttribute('aria-hidden')).toBe('true');
    expect(desktopSpinnerDebug.nativeElement.classList.contains('navigation-spinner')).toBe(true);

    expect(mobileDownload?.disabled).toBe(true);
    expect(mobileDownload?.getAttribute('aria-busy')).toBe('true');
    expect(mobileDownload?.querySelector('mat-icon')).toBeNull();
    const mobileSpinnerDebug = fixture.debugElement.query(
      By.css('button[aria-label="Downloading résumé PDF"] mat-progress-spinner.menu-spinner'),
    );
    expect(mobileSpinnerDebug).not.toBeNull();
    const mobileSpinner = mobileSpinnerDebug.componentInstance as MatProgressSpinner;
    expect(mobileSpinner.mode).toBe('indeterminate');
    expect(mobileSpinner.value).toBe(0);
    expect(mobileSpinnerDebug.nativeElement.getAttribute('aria-hidden')).toBe('true');
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe('Downloading PDF…');

    desktopDownload?.click();
    mobileDownload?.click();
    expect(downloadRequested).not.toHaveBeenCalled();
  });

  it('switches to determinate spinner with explicit progress values and accessible labels', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadPending', true);
    fixture.componentRef.setInput('downloadProgress', 50);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const desktopDownload = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Downloading résumé PDF (50%)"]',
    );
    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Downloading résumé PDF (50%)"]',
    );

    const desktopSpinner = fixture.debugElement.query(
      By.css('button.desktop-control mat-progress-spinner'),
    ).componentInstance as MatProgressSpinner;
    const mobileSpinner = fixture.debugElement.query(
      By.css('button.mat-mdc-menu-item mat-progress-spinner'),
    ).componentInstance as MatProgressSpinner;

    expect(desktopDownload?.disabled).toBe(true);
    expect(desktopDownload?.getAttribute('aria-busy')).toBe('true');
    expect(desktopDownload?.getAttribute('aria-label')).toBe('Downloading résumé PDF (50%)');
    expect(desktopSpinner.mode).toBe('determinate');
    expect(desktopSpinner.value).toBe(50);

    expect(mobileDownload?.disabled).toBe(true);
    expect(mobileDownload?.getAttribute('aria-busy')).toBe('true');
    expect(mobileDownload?.getAttribute('aria-label')).toBe('Downloading résumé PDF (50%)');
    expect(mobileSpinner.mode).toBe('determinate');
    expect(mobileSpinner.value).toBe(50);
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe(
      'Downloading PDF (50%)',
    );

    // Progress updates to 100%
    fixture.componentRef.setInput('downloadProgress', 100);
    fixture.detectChanges();

    expect(desktopDownload?.getAttribute('aria-label')).toBe('Downloading résumé PDF (100%)');
    expect(desktopSpinner.value).toBe(100);
    expect(mobileDownload?.getAttribute('aria-label')).toBe('Downloading résumé PDF (100%)');
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe(
      'Downloading PDF (100%)',
    );
  });

  it('restores download controls and labels to idle state after download finishes', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadPending', true);
    fixture.componentRef.setInput('downloadProgress', 75);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const desktopDownload = element.querySelector<HTMLButtonElement>('button.desktop-control');
    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>('button.mat-mdc-menu-item');

    expect(desktopDownload?.disabled).toBe(true);
    expect(mobileDownload?.disabled).toBe(true);

    // Reset to idle
    fixture.componentRef.setInput('downloadPending', false);
    fixture.componentRef.setInput('downloadProgress', null);
    fixture.detectChanges();

    expect(desktopDownload?.disabled).toBe(false);
    expect(desktopDownload?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(desktopDownload?.getAttribute('aria-busy')).toBe('false');
    expect(desktopDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(desktopDownload?.querySelector('mat-progress-spinner')).toBeNull();

    expect(mobileDownload?.disabled).toBe(false);
    expect(mobileDownload?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(mobileDownload?.getAttribute('aria-busy')).toBe('false');
    expect(mobileDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(mobileDownload?.querySelector('mat-progress-spinner')).toBeNull();
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

  it('renders file_download_off icon and updated accessible labels and tooltips when download is unavailable', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadAvailable', false);
    fixture.componentRef.setInput('downloadPending', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const desktopDownload = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Download résumé as PDF (file may be unavailable)"]',
    );
    const desktopTooltip = fixture.debugElement
      .query(By.css('button.desktop-control'))
      .injector.get(MatTooltip);

    expect(desktopDownload).not.toBeNull();
    expect(desktopDownload?.disabled).toBe(false);
    expect(desktopDownload?.getAttribute('aria-busy')).toBe('false');
    expect(desktopDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'file_download_off',
    );
    expect(desktopTooltip.message).toBe('Download résumé as PDF (file may be unavailable)');

    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Download résumé as PDF (file may be unavailable)"]',
    );

    expect(mobileDownload).not.toBeNull();
    expect(mobileDownload?.disabled).toBe(false);
    expect(mobileDownload?.getAttribute('aria-busy')).toBe('false');
    expect(mobileDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'file_download_off',
    );
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe(
      'Download PDF (unavailable)',
    );
  });

  it('emits download requests from both responsive controls in unavailable state', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadAvailable', false);
    fixture.componentRef.setInput('downloadPending', false);
    fixture.detectChanges();

    const downloadRequested = vi.fn();
    fixture.componentInstance.downloadRequested.subscribe(downloadRequested);
    const element = fixture.nativeElement as HTMLElement;

    element
      .querySelector<HTMLButtonElement>(
        'button.desktop-control[aria-label="Download résumé as PDF (file may be unavailable)"]',
      )
      ?.click();

    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Download résumé as PDF (file may be unavailable)"]',
    );
    mobileDownload?.click();

    expect(downloadRequested).toHaveBeenCalledTimes(2);
  });

  it('prioritizes pending download progress presentation over unavailable indicator', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadAvailable', false);
    fixture.componentRef.setInput('downloadPending', true);
    fixture.componentRef.setInput('downloadProgress', 25);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const desktopDownload = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Downloading résumé PDF (25%)"]',
    );
    const menu = await openMobileMenu(fixture);
    const mobileDownload = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Downloading résumé PDF (25%)"]',
    );

    expect(desktopDownload?.disabled).toBe(true);
    expect(desktopDownload?.querySelector('mat-icon')).toBeNull();
    expect(desktopDownload?.querySelector('mat-progress-spinner')).not.toBeNull();

    expect(mobileDownload?.disabled).toBe(true);
    expect(mobileDownload?.querySelector('mat-icon')).toBeNull();
    expect(mobileDownload?.querySelector('mat-progress-spinner')).not.toBeNull();
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe(
      'Downloading PDF (25%)',
    );
  });

  it('updates responsive presentation when download availability changes dynamically', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('downloadAvailable', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    let desktopDownload = element.querySelector<HTMLButtonElement>('button.desktop-control');

    expect(desktopDownload?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(desktopDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');

    // Switch to unavailable
    fixture.componentRef.setInput('downloadAvailable', false);
    fixture.detectChanges();

    desktopDownload = element.querySelector<HTMLButtonElement>('button.desktop-control');
    expect(desktopDownload?.getAttribute('aria-label')).toBe(
      'Download résumé as PDF (file may be unavailable)',
    );
    expect(desktopDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'file_download_off',
    );

    // Switch back to available
    fixture.componentRef.setInput('downloadAvailable', true);
    fixture.detectChanges();

    desktopDownload = element.querySelector<HTMLButtonElement>('button.desktop-control');
    expect(desktopDownload?.getAttribute('aria-label')).toBe('Download résumé as PDF');
    expect(desktopDownload?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
  });
});
