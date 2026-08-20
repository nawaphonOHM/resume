import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from '../app/app.config';
import { App } from '../app/app';

/** Starts the CDN-dependent résumé only after runtime readiness succeeds. */
export function bootstrapResumeApplication() {
  return bootstrapApplication(App, appConfig);
}
