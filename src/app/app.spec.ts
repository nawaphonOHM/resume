/** Verifies the root shell's bootstrap contract and primary page landmark. */
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('creates the root component', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders an accessible primary landmark without router content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const main = compiled.querySelector('main#main-content');

    expect(main).not.toBeNull();
    expect(compiled.querySelector('h1')?.textContent).toContain('Nawaphon Isarathanachaikul');
    expect(compiled.querySelector('router-outlet')).toBeNull();
  });
});
