import { InjectionToken } from '@angular/core';
import type { ResumePdfCdnAsset } from '../interface/resume-pdf-cdn-asset/resume-pdf-cdn-asset.interface.ts';

export const PDFMAKE_FONT_ASSET = new InjectionToken<ResumePdfCdnAsset>('PDFMAKE_FONT_ASSET', {
  providedIn: 'root',
  factory: () => {
    return {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/vfs_fonts.min.js',
      integrity:
        'sha512-rpvsrDF7BNgiFOXqkKyyoJ46jZ8nwQ3NJJAmpYnYKuZHfzwR2wpz5cAaPX09RCj9un5E+ErATIqy4CZBcuNogA==',
    } as ResumePdfCdnAsset;
  },
});
