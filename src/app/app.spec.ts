/** Verifies the routed root shell's bootstrap contract and primary outlet. */
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('creates the root component', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes the primary router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const outlet = fixture.debugElement.query(By.directive(RouterOutlet));

    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    expect(outlet).not.toBeNull();
    expect(outlet.injector.get(RouterOutlet).name).toBe('primary');
  });
});
