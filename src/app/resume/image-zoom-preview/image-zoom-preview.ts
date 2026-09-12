import { Component, inject } from '@angular/core';

import { NgOptimizedImage } from '@angular/common';
import { IMAGE_ZOOM_PREVIEW_DATA } from '../../helper/injection-token/image-zoom-preview-data.variable.ts';

/**
 * Renders intrinsic logo metadata inside the viewport limits published by the overlay service.
 *
 * @remarks The host is hidden from the accessibility tree and contains no controls because the
 * original image remains the semantic and interactive owner; the enlarged image is visual only.
 */
@Component({
  selector: 'app-image-zoom-preview-preview',
  templateUrl: './image-zoom-preview.html',
  styleUrl: './image-zoom-preview.scss',
  host: {
    'aria-hidden': 'true',
  },
  imports: [NgOptimizedImage],
})
export class ImageZoomPreview {
  /** Content scoped to this component's overlay injector. */
  protected readonly data = inject(IMAGE_ZOOM_PREVIEW_DATA);
}
