import { Component, InjectionToken, inject } from '@angular/core';

import type { BrandLogo } from '../../model/resume/resume.model';

/** Immutable content supplied to an overlay-hosted image preview. */
export interface ImageZoomPreviewData {
  /** Intrinsic asset and contrast-surface metadata for the enlarged image. */
  readonly logo: BrandLogo;

  /** Descriptive alternative text retained on the enlarged image. */
  readonly label: string;
}

/** Overlay-scoped dependency token carrying content for one preview instance. */
export const IMAGE_ZOOM_PREVIEW_DATA = new InjectionToken<ImageZoomPreviewData>(
  'IMAGE_ZOOM_PREVIEW_DATA',
);

/**
 * Renders intrinsic logo metadata inside the viewport limits published by the overlay service.
 *
 * @remarks The host is hidden from the accessibility tree and contains no controls because the
 * original image remains the semantic and interactive owner; the enlarged image is visual only.
 */
@Component({
  selector: 'app-image-zoom-preview',
  templateUrl: './image-zoom-preview.html',
  styleUrl: './image-zoom-preview.scss',
  host: {
    'aria-hidden': 'true',
  },
})
export class ImageZoomPreview {
  /** Content scoped to this component's overlay injector. */
  protected readonly data = inject(IMAGE_ZOOM_PREVIEW_DATA);
}
