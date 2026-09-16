import type { ImageZoomRequest } from '../interface/image-zoom-request/image-zoom-request.interface.ts';

/** Signal-derived preview data that must invalidate an attached same-origin overlay when changed. */
export type ImageZoomPayload = Omit<ImageZoomRequest, 'origin' | 'activation'>;
