import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';

import { FallbackApp } from './fallback-app';

describe('FallbackApp', () => {
  it('hosts the fallback router outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [FallbackApp],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(FallbackApp);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(RouterOutlet))).not.toBeNull();
  });
});
