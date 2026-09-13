import type { ResumeSectionId } from '../../type/resume-section-id.type.ts';

/** Navigation metadata for one observable résumé section. */
export interface ResumeNavigationSection {
  /** Fragment identifier shared by its anchor and section element. */
  readonly id: ResumeSectionId;

  /** Reader-facing anchor label. */
  readonly label: string;
}
