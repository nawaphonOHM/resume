import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appPlayerHostDirective]',
})
export class PlayerHostDirective {
  private readonly _playerHost = inject<ElementRef<HTMLElement>>(ElementRef);

  get playerHost(): ElementRef<HTMLElement> {
    return this._playerHost;
  }
}
