import { Component, InjectionToken, inject } from '@angular/core';

import type { BrandLogo } from '../../model/resume/resume.model';

export interface ImageZoomPreviewData {
  readonly logo: BrandLogo;
  readonly label: string;
}

export const IMAGE_ZOOM_PREVIEW_DATA = new InjectionToken<ImageZoomPreviewData>(
  'IMAGE_ZOOM_PREVIEW_DATA',
);

@Component({
  selector: 'app-image-zoom-preview',
  templateUrl: './image-zoom-preview.html',
  styleUrl: './image-zoom-preview.scss',
  host: {
    'aria-hidden': 'true',
  },
})
export class ImageZoomPreview {
  protected readonly data = inject(IMAGE_ZOOM_PREVIEW_DATA);
}
