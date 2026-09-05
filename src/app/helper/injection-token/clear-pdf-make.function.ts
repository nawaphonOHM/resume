import { InjectionToken } from '@angular/core';

export const clearPdfMake = new InjectionToken<(view: PdfMakeWindow) => void>('clearPdfMake', {
  providedIn: 'root',
  factory: () => {
    return (view: PdfMakeWindow) => {
      try {
        if (!Reflect.deleteProperty(view, 'pdfMake')) {
          view.pdfMake = undefined;
        }
      } catch {
        try {
          view.pdfMake = undefined;
        } catch {
          // A hostile pre-existing global may be neither configurable nor writable.
        }
      }
    };
  },
});
