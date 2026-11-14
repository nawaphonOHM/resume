import { InjectionToken } from '@angular/core';

export const PROJECT_LOGO_FILE_NAMES_BY_PATH = new InjectionToken<Map<string, string>>(
  'projectLogoFileNamesByPath',
  {
    providedIn: 'root',
    factory: () =>
      new Map<string, string>([
        ['/link-logos/github.svg', 'github.svg'],
        ['/company-logos/accord-innovations.png', 'accord-innovations.png'],
        ['/company-logos/innovestx.png', 'innovestx.png'],
        ['/company-logos/saitech-solution.png', 'saitech-solution.png'],
        ['/company-logos/krungsri.png', 'krungsri.png'],
        ['/company-logos/nityo-infotech.svg', 'nityo-infotech.svg'],
        ['/company-logos/tisco.svg', 'tisco.svg'],
        ['/company-logos/line-man-wongnai.webp', 'line-man-wongnai.webp'],
        ['/company-logos/wisesoft.png', 'wisesoft.png'],
        [
          '/university-logos/prince-of-songkla-university.webp',
          'prince-of-songkla-university.webp',
        ],
      ]),
  },
);
