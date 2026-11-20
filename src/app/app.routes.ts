import type { Routes } from '@angular/router';
import { ThemeService } from './helper/core/theme.service.ts';

/** The empty-path parent provides ThemeService to its lazy résumé-page child. */
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
    ],
  },
];
