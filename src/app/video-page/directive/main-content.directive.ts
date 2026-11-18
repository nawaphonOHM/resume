import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appMainContentDirective]',
})
export class MainContentDirective {
  private readonly _mainContent = inject<ElementRef<HTMLElement>>(ElementRef);

  get mainContent(): ElementRef<HTMLElement> {
    return this._mainContent;
  }
}
