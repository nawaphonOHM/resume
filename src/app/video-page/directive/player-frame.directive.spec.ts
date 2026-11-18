import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PlayerFrameDirective } from './player-frame.directive.ts';

@Component({
  imports: [PlayerFrameDirective],
  template: `
    <iframe appPlayerFrameDirective [attr.data-host]="hostName" title="first player"></iframe>
    <iframe appPlayerFrameDirective title="second player"></iframe>
    <iframe title="without directive"></iframe>
  `,
})
class PlayerFrameHost {
  readonly hostName = 'player-frame-host';
}

describe('PlayerFrameDirective', () => {
  let fixture: ComponentFixture<PlayerFrameHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlayerFrameHost] }).compileComponents();
    fixture = TestBed.createComponent(PlayerFrameHost);
    fixture.detectChanges();
  });

  it('matches only frames with the player-frame selector', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(PlayerFrameDirective));

    expect(directiveHosts).toHaveLength(2);
    expect(directiveHosts.map((host) => (host.nativeElement as HTMLIFrameElement).title)).toEqual([
      'first player',
      'second player',
    ]);
  });

  it('exposes the native frame that owns the directive', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(PlayerFrameDirective));

    for (const host of directiveHosts) {
      const directive = host.injector.get(PlayerFrameDirective);

      expect(directive.playerFrame.nativeElement).toBe(host.nativeElement);
    }
  });

  it('provides an isolated frame reference for each host', () => {
    const directiveHosts = fixture.debugElement.queryAll(By.directive(PlayerFrameDirective));
    const [firstHost, secondHost] = directiveHosts;
    const firstDirective = firstHost.injector.get(PlayerFrameDirective);
    const secondDirective = secondHost.injector.get(PlayerFrameDirective);

    expect(firstDirective.playerFrame).not.toBe(secondDirective.playerFrame);
    expect(firstDirective.playerFrame.nativeElement).not.toBe(
      secondDirective.playerFrame.nativeElement,
    );
  });
});
