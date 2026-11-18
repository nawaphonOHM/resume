import type { Routes } from '@angular/router';

/** Keep the résumé at the root and lazily render the video page for unmatched paths. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./resume/resume-page/resume-page'),
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () => import('./video-page/video-page'),
  },
];
