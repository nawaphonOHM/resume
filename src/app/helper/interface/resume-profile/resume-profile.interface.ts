import type {ResumeLink} from '../ressume-link/resume-link.interface.ts';
import type {ResumeDetails} from '../resume-details/resume-details.interface.ts';
import type { ResumeEducation } from '../resume-education/resume-education.interface.ts';
import type { Experience } from '../experience/experience.interface.ts';

/** Canonical data contract consumed by the résumé's presentation sections. */
export interface ResumeProfile {
  /** Candidate's display name. */
  readonly name: string;

  /** Current professional headline. */
  readonly title: string;

  /** Ordered summary paragraphs describing the candidate's experience. */
  readonly summary: readonly string[];

  /** Public personal and contact details. */
  readonly details: ResumeDetails;

  /** Ordered external profile and portfolio destinations. */
  readonly links: readonly ResumeLink[];

  /** Curated skill labels shown in display order. */
  readonly skills: readonly string[];

  /** Employment records ordered from newest to oldest. */
  readonly experience: readonly Experience[];

  /** Highest-education record shown in the résumé. */
  readonly education: ResumeEducation;
}
