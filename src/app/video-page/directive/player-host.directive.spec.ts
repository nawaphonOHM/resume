import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PlayerHostDirective } from './player-host.directive.ts';

@Component({
  imports: [PlayerHostDirective],
  template: `
    <div appPlayerHostDirective [attr.data-host-name]="hostName" id="primary-player-host"></div>
    <section
      appPlayerHostDirective
      [attr.data-host-name]="hostName"
      id="secondary-player-host"
    ></section>
    <footer id="without-directive"></footer>
  `,
})
class PlayerHostComponent {
  readonly hostName = 'player-host';
}

describe('PlayerHostDirective', () => {
  let fixture: ComponentFixture<PlayerHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlayerHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(PlayerHostComponent);
    fixture.detectChanges();
  });

  it('matches only elements with the player-host selector', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(PlayerHostDirective));

    expect(directiveHosts).toHaveLength(2);
    expect(directiveHosts.map((host) => (host.nativeElement as HTMLElement).id)).toEqual([
      'primary-player-host',
      'secondary-player-host',
    ]);
  });

  it('exposes the native element that owns the directive', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(PlayerHostDirective));

    for (const host of directiveHosts) {
      const directive = host.injector.get(PlayerHostDirective);

      expect(directive.playerHost.nativeElement).toBe(host.nativeElement);
    }
  });

  it('provides an isolated element reference for each host', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(PlayerHostDirective));
    const [firstHost, secondHost] = directiveHosts;
    const firstDirective = firstHost.injector.get(PlayerHostDirective);
    const secondDirective = secondHost.injector.get(PlayerHostDirective);

    expect(firstDirective.playerHost).not.toBe(secondDirective.playerHost);
    expect(firstDirective.playerHost.nativeElement).not.toBe(
      secondDirective.playerHost.nativeElement,
    );
  });
});
