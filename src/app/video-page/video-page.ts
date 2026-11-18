import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ThemeService } from '../helper/core/theme.service.ts';
import { MainContentDirective } from './directive/main-content.directive.ts';
import { PlayerFrameDirective } from './directive/player-frame.directive.ts';

@Component({
  selector: 'app-video-page',
  imports: [RouterLink, MainContentDirective, PlayerFrameDirective],
  host: {
    '(document:keydown)': 'cancelPendingFocusRestoration()',
    '(document:pointerdown)': 'cancelPendingFocusRestoration()',
  },
  templateUrl: './video-page.html',
  styleUrl: './video-page.scss',
})
export default class VideoPage {
  private readonly mainContent = viewChild.required(MainContentDirective);
  private readonly playerFrame = viewChild.required(PlayerFrameDirective);
  private readonly document = inject(DOCUMENT);
  private shouldRestoreFocus = true;

  constructor() {
    inject(ThemeService);

    afterNextRender(() => {
      this.mainContent().mainContent.nativeElement.focus({ preventScroll: true });
    });
  }

  cancelPendingFocusRestoration(): void {
    this.shouldRestoreFocus = false;
  }

  restorePageFocusAfterPlayerLoad(): void {
    if (!this.shouldRestoreFocus) {
      return;
    }

    this.shouldRestoreFocus = false;
    if (this.document.activeElement === this.playerFrame().playerFrame.nativeElement) {
      this.mainContent().mainContent.nativeElement.focus({ preventScroll: true });
    }
  }
}
