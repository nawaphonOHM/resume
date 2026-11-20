import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appPlayerFrameDirective]',
})
export class PlayerFrameDirective {
  private readonly _playerFrame = inject<ElementRef<HTMLIFrameElement>>(ElementRef);

  get playerFrame(): ElementRef<HTMLIFrameElement> {
    return this._playerFrame;
  }
}
