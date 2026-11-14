import { inject, InjectionToken } from '@angular/core';
import { PROJECT_LOGO_ORIGIN } from './project-logo-origin.variable.ts';
import { PROJECT_LOGO_FILE_NAME_FOR_PATH } from './project-logo-file-name-for-path.function.ts';

export const PROJECT_LOGO_FILE_NAME_FROM_SOURCE = new InjectionToken<
  (source: unknown) => string | undefined
>('PROJECT_LOGO_FILE_NAME_FROM_SOURCE', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      projectLogoFileNameForPath: (path: string) => string | undefined,
      projectLogoOrigin: string,
    ) => {
      return (source: unknown) => {
        if (typeof source !== 'string') {
          return undefined;
        }

        const rootRelativeFileName = projectLogoFileNameForPath(source);

        if (rootRelativeFileName) {
          return rootRelativeFileName;
        }

        try {
          const url = new URL(source);
          if (
            url.origin !== projectLogoOrigin ||
            url.username !== '' ||
            url.password !== '' ||
            `${url.origin}${url.pathname}` !== source
          ) {
            return undefined;
          }

          return projectLogoFileNameForPath(url.pathname);
        } catch {
          return undefined;
        }
      };
    };

    return fn(inject(PROJECT_LOGO_FILE_NAME_FOR_PATH), inject(PROJECT_LOGO_ORIGIN));
  },
});
