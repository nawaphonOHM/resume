import { InjectionToken } from '@angular/core';
import type { ImageZoomPreviewData } from '../interface/image-zoom-preview-data/image-zoom-preview-data.interface.ts';

/** Overlay-scoped dependency token carrying content for one preview instance. */
export const IMAGE_ZOOM_PREVIEW_DATA = new InjectionToken<ImageZoomPreviewData>(
  'IMAGE_ZOOM_PREVIEW_DATA',
);
