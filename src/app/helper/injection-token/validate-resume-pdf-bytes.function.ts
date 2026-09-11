import { inject, InjectionToken } from '@angular/core';
import type { ResumeProfile } from '../interface/resume-profile/resume-profile.interface.ts';
import { isUint8Array } from './is-uint8-array.function.ts';
import { PDF_HEADER } from './pdf_header.variable.ts';
import { MINIMUM_PDF_SIZE } from './minimum-pdf-size.variable.ts';

/** Validates generated PDF bytes before browser download side effects occur. */
export const validateResumePdfBytes = new InjectionToken<
  (pdf: unknown, profile: ResumeProfile) => asserts pdf is Uint8Array
>('validateResumePdfBytes', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      isUint8ArrayFn: (value: unknown) => value is Uint8Array,
      pdfHeader: readonly number[],
      minimumPdfSize: number,
    ) => {
      return (pdf: unknown, profile: ResumeProfile): asserts pdf is Uint8Array => {
        if (
          !isUint8ArrayFn(pdf) ||
          pdfHeader.some((expectedByte, index) => pdf[index] !== expectedByte)
        ) {
          throw new Error('Generated output is not a PDF document.');
        }

        if (pdf.byteLength < minimumPdfSize) {
          throw new Error(`Generated PDF is unexpectedly small (${pdf.byteLength} bytes).`);
        }

        const pdfSource = new TextDecoder('latin1').decode(pdf);
        const requiredLinks = [
          `mailto:${profile.details.email}`,
          profile.education.seniorProject.url,
          ...profile.links.map(({ url }) => url),
        ];

        for (const requiredLink of requiredLinks) {
          if (!pdfSource.includes(requiredLink)) {
            throw new Error(`Generated PDF is missing a link annotation: ${requiredLink}`);
          }
        }

        if (/tel:/i.test(pdfSource)) {
          throw new Error('Generated PDF contains a telephone link and cannot be published.');
        }
      };
    };

    return fn(inject(isUint8Array), inject(PDF_HEADER), inject(MINIMUM_PDF_SIZE));
  },
});
