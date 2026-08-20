import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Root shell for the locally bundled unavailable application. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class FallbackApp {}
