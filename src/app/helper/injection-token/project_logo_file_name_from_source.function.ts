import { inject, InjectionToken } from '@angular/core';
import { PROJECT_LOGO_ORIGIN } from './project-logo-origin.variable.ts';
import { PROJECT_LOGO_FILE_NAME_FOR_PATH } from './project-logo-file-name-for-path.function.ts';

/**
 * Resolves an accepted legacy project-logo source to its canonical asset filename.
 *
 * @remarks
 * Recognized root-relative paths are checked first; otherwise an absolute URL must use the configured
 * project-logo origin and map to a known path. Other origins, credentials, malformed URLs, queries,
 * and fragments are rejected; requiring `origin + pathname === source` excludes query and fragment text.
 */
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
