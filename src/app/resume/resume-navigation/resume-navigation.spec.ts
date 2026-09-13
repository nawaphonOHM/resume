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

  it('provides accessible labels for theme, print, menu, and download controls', () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'dark');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const print = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Print résumé"]',
    );
    const download = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Download résumé as PDF"]',
    );

    expect(element.querySelector('[aria-label="Switch to light theme"]')).not.toBeNull();
    expect(print?.type).toBe('button');
    expect(print?.querySelector('mat-icon')?.textContent?.trim()).toBe('print');
    expect(download?.type).toBe('button');
    expect(download?.querySelector('mat-icon')?.textContent?.trim()).toBe('download');
    expect(element.querySelector('[aria-label="Open section menu"]')).not.toBeNull();
    expect(element.querySelector('a[download]')).toBeNull();
  });

  it('emits print requests from both responsive controls', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.detectChanges();
    const printRequested = vi.fn();
    fixture.componentInstance.printRequested.subscribe(printRequested);
    const element = fixture.nativeElement as HTMLElement;

    element
      .querySelector<HTMLButtonElement>('button.desktop-control[aria-label="Print résumé"]')
      ?.click();
    const menu = await openMobileMenu(fixture);
    const mobilePrint = Array.from(menu.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('Print résumé'),
    );

    expect(printRequested).toHaveBeenCalledOnce();
    expect(mobilePrint?.querySelector('mat-icon')?.textContent?.trim()).toBe('print');
    expect(mobilePrint?.querySelector('span')?.textContent?.trim()).toBe('Print résumé');
    mobilePrint?.click();
    expect(printRequested).toHaveBeenCalledTimes(2);
  });

  it('disables both print controls and exposes MatProgressSpinner while pending', async () => {
    const fixture = TestBed.createComponent(ResumeNavigation);
    fixture.componentRef.setInput('activeSection', 'about');
    fixture.componentRef.setInput('theme', 'light');
    fixture.componentRef.setInput('printPending', true);
    fixture.detectChanges();
    const printRequested = vi.fn();
    fixture.componentInstance.printRequested.subscribe(printRequested);
    const element = fixture.nativeElement as HTMLElement;
    const desktopPrint = element.querySelector<HTMLButtonElement>(
      'button.desktop-control[aria-label="Preparing résumé for printing"]',
    );
    const menu = await openMobileMenu(fixture);
    const mobilePrint = menu.querySelector<HTMLButtonElement>(
      'button[aria-label="Preparing résumé for printing"]',
    );

    expect(desktopPrint?.disabled).toBe(true);
    expect(desktopPrint?.getAttribute('aria-busy')).toBe('true');
    expect(desktopPrint?.querySelector('mat-icon')).toBeNull();
    const desktopSpinnerDebug = fixture.debugElement.query(
      By.css(
        'button.desktop-control[aria-label="Preparing résumé for printing"] mat-progress-spinner',
      ),
    );
    expect(desktopSpinnerDebug).not.toBeNull();
    const desktopSpinner = desktopSpinnerDebug.componentInstance as MatProgressSpinner;
    expect(desktopSpinner.diameter).toBe(18);
    expect(desktopSpinner.strokeWidth).toBe(2.5);
    expect(desktopSpinner.mode).toBe('indeterminate');
    expect(desktopSpinnerDebug.nativeElement.getAttribute('aria-hidden')).toBe('true');
    expect(desktopSpinnerDebug.nativeElement.classList.contains('navigation-spinner')).toBe(true);

    expect(mobilePrint?.disabled).toBe(true);
    expect(mobilePrint?.getAttribute('aria-busy')).toBe('true');
    expect(mobilePrint?.querySelector('mat-icon')).toBeNull();
    const mobileSpinner = mobilePrint?.querySelector<HTMLElement>('mat-progress-spinner');
    expect(mobileSpinner).not.toBeNull();
    expect(mobileSpinner?.getAttribute('aria-hidden')).toBe('true');
    expect(mobileSpinner?.classList.contains('menu-spinner')).toBe(true);
    expect(mobilePrint?.querySelector('span')?.textContent?.trim()).toBe('Preparing to print…');

    desktopPrint?.click();
    mobilePrint?.click();
    expect(printRequested).not.toHaveBeenCalled();

    fixture.componentRef.setInput('printPending', false);
    fixture.detectChanges();

    expect(desktopPrint?.disabled).toBe(false);
    expect(desktopPrint?.getAttribute('aria-label')).toBe('Print résumé');
    expect(desktopPrint?.getAttribute('aria-busy')).toBe('false');
    expect(desktopPrint?.querySelector('mat-icon')?.textContent?.trim()).toBe('print');
    expect(desktopPrint?.querySelector('mat-progress-spinner')).toBeNull();

    expect(mobilePrint?.disabled).toBe(false);
    expect(mobilePrint?.getAttribute('aria-label')).toBe('Print résumé');
    expect(mobilePrint?.getAttribute('aria-busy')).toBe('false');
    expect(mobilePrint?.querySelector('mat-icon')?.textContent?.trim()).toBe('print');
    expect(mobilePrint?.querySelector('mat-progress-spinner')).toBeNull();
    expect(mobilePrint?.querySelector('span')?.textContent?.trim()).toBe('Print résumé');
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

  it('disables both download controls and exposes MatProgressSpinner while pending', async () => {
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
    expect(desktopDownload?.querySelector('mat-icon')).toBeNull();
    const desktopSpinnerDebug = fixture.debugElement.query(
      By.css('button.desktop-control[aria-label="Generating résumé PDF"] mat-progress-spinner'),
    );
    expect(desktopSpinnerDebug).not.toBeNull();
    const desktopSpinner = desktopSpinnerDebug.componentInstance as MatProgressSpinner;
    expect(desktopSpinner.diameter).toBe(18);
    expect(desktopSpinner.strokeWidth).toBe(2.5);
    expect(desktopSpinner.mode).toBe('indeterminate');
    expect(desktopSpinnerDebug.nativeElement.getAttribute('aria-hidden')).toBe('true');
    expect(desktopSpinnerDebug.nativeElement.classList.contains('navigation-spinner')).toBe(true);

    expect(mobileDownload?.disabled).toBe(true);
    expect(mobileDownload?.getAttribute('aria-busy')).toBe('true');
    expect(mobileDownload?.querySelector('mat-icon')).toBeNull();
    const mobileSpinner = mobileDownload?.querySelector<HTMLElement>('mat-progress-spinner');
    expect(mobileSpinner).not.toBeNull();
    expect(mobileSpinner?.getAttribute('aria-hidden')).toBe('true');
    expect(mobileSpinner?.classList.contains('menu-spinner')).toBe(true);
    expect(mobileDownload?.querySelector('span')?.textContent?.trim()).toBe('Generating PDF…');

    desktopDownload?.click();
    mobileDownload?.click();
    expect(downloadRequested).not.toHaveBeenCalled();

    fixture.componentRef.setInput('downloadPending', false);
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
});
