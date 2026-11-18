import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MainContentDirective } from './main-content.directive.ts';

@Component({
  imports: [MainContentDirective],
  template: `
    <main appMainContentDirective [attr.data-host]="hostName" id="primary-content"></main>
    <section appMainContentDirective id="secondary-content"></section>
    <footer id="without-directive"></footer>
  `,
})
class MainContentHost {
  readonly hostName = 'main-content-host';
}

describe('MainContentDirective', () => {
  let fixture: ComponentFixture<MainContentHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MainContentHost] }).compileComponents();
    fixture = TestBed.createComponent(MainContentHost);
    fixture.detectChanges();
  });

  it('matches only elements with the main-content selector', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(MainContentDirective));

    expect(directiveHosts).toHaveLength(2);
    expect(directiveHosts.map((host) => (host.nativeElement as HTMLElement).id)).toEqual([
      'primary-content',
      'secondary-content',
    ]);
  });

  it('exposes the native element that owns the directive', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(MainContentDirective));

    for (const host of directiveHosts) {
      const directive = host.injector.get(MainContentDirective);

      expect(directive.mainContent.nativeElement).toBe(host.nativeElement);
    }
  });

  it('provides an isolated element reference for each host', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(MainContentDirective));
    const [firstHost, secondHost] = directiveHosts;
    const firstDirective = firstHost.injector.get(MainContentDirective);
    const secondDirective = secondHost.injector.get(MainContentDirective);

    expect(firstDirective.mainContent).not.toBe(secondDirective.mainContent);
    expect(firstDirective.mainContent.nativeElement).not.toBe(
      secondDirective.mainContent.nativeElement,
    );
  });
});
