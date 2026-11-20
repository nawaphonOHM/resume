import type { Routes } from '@angular/router';
import { ThemeService } from './helper/core/theme.service.ts';

/** Shares the route-scoped theme service between the résumé and fallback pages. */
export const routes: Routes = [
  {
    path: '',
    providers: [ThemeService],
    children: [
      {
        path: '',
        loadComponent: () => import('./resume/resume-page/resume-page'),
        pathMatch: 'full',
      },
      {
        path: '**',
        loadComponent: () => import('./video-page/video-page'),
      },
    ],
  },
];
