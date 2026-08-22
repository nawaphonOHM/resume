import type { BrandLogo } from '../brand-logo/brand-logo.interface.ts';
import type { ResumeProjectInterface } from '../resume-project/resume-project.interface.ts';

/** Highest-education record presented in the résumé. */
export interface ResumeEducation {
  /** Display-ready academic qualification. */
  readonly degree: string;

  /** Name of the awarding institution. */
  readonly institution: string;

  /** Brand artwork for the awarding institution. */
  readonly institutionLogo: BrandLogo;

  /** Display-ready attendance or completion period. */
  readonly period: string;

  /** Display-ready cumulative grade value. */
  readonly gpax: string;

  /** Senior project associated with the qualification. */
  readonly seniorProject: ResumeProjectInterface;
}
