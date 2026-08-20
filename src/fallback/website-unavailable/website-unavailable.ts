import { Component, inject, InjectionToken } from '@angular/core';

export const PAGE_RELOAD = new InjectionToken<() => void>('PAGE_RELOAD', {
  providedIn: 'root',
  factory: () => () => globalThis.location.reload(),
});

/** Explains terminal startup failure and lets the visitor begin a fresh attempt. */
@Component({
  selector: 'fallback-website-unavailable',
  templateUrl: './website-unavailable.html',
  styleUrl: './website-unavailable.scss',
})
export class WebsiteUnavailable {
  private readonly reloadPage = inject(PAGE_RELOAD);

  retry(): void {
    this.reloadPage();
  }
}
