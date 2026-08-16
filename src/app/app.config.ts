import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/**
 * Application-wide providers used during standalone bootstrap.
 *
 * Browser global error listeners route uncaught application errors through
 * Angular's error handling infrastructure.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
