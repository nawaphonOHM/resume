import type { Routes } from '@angular/router';

import { WebsiteUnavailable } from './website-unavailable/website-unavailable';

/** Keeps the unavailable view active for both root and deep-linked URLs. */
export const fallbackRoutes: Routes = [
  { path: '', component: WebsiteUnavailable, pathMatch: 'full' },
  { path: '**', component: WebsiteUnavailable },
];
