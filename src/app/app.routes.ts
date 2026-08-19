import type { Routes } from '@angular/router';

import { ResumePage } from './resume/resume-page/resume-page';

/** The résumé remains an eager, root-only page in the initial application bundle. */
export const routes: Routes = [{ path: '', component: ResumePage, pathMatch: 'full' }];
