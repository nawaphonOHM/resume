import type { Routes } from '@angular/router';

/** The résumé remains an eager, root-only page in the initial application bundle. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./resume/resume-page/resume-page').then((m) => m.ResumePage),
    pathMatch: 'full',
  },
];
