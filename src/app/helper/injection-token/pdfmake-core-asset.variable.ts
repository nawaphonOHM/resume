import { InjectionToken } from '@angular/core';
import type { ResumePdfCdnAsset } from '../interface/resume-pdf-cdn-asset/resume-pdf-cdn-asset.interface.ts';

export const PDFMAKE_CORE_ASSET = new InjectionToken<ResumePdfCdnAsset>('PDFMAKE_CORE_ASSET', {
  providedIn: 'root',
  factory: () => {
    return {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/pdfmake.min.js',
      integrity:
        'sha512-EkS5jkn3vXRWIdphIy51xskMZggNip3Or8kpe/FlM5XaQeiK2GZJ9OwrIEbXl6txKWsHNtm4OXtxzkkz41Mspw==',
    } as ResumePdfCdnAsset;
  },
});
