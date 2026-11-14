import { inject, InjectionToken } from '@angular/core';
import { PROJECT_LOGO_FILE_NAMES_BY_PATH } from './project-logo-file-names-by-path.variable.ts';

export const PROJECT_LOGO_FILE_NAME_FOR_PATH = new InjectionToken<
  (path: string) => string | undefined
>('projectLogoFileNameForPath', {
  providedIn: 'root',
  factory: () => {
    const fn = (fileNames: Map<string, string>) => {
      return (path: string) => {
        return fileNames.get(path);
      };
    };

    return fn(inject(PROJECT_LOGO_FILE_NAMES_BY_PATH));
  },
});
