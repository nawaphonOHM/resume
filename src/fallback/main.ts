import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { FallbackApp } from './fallback-app';
import { fallbackRoutes } from './fallback.routes';

bootstrapApplication(FallbackApp, {
  providers: [provideRouter(fallbackRoutes)],
}).catch((error: unknown) => console.error(error));
