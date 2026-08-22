import type { CompanyLogo } from '../brand-logo/company-logo/compant-logo.interface.ts';
import type { ClientCompany } from '../client-company/client-company.interface.ts';
import type { EmploymentType } from '../employment-type/employment-type.type.ts';

/** A single employment engagement and its résumé-ready presentation data. */
export interface Experience {
  /** Job title held during the engagement. */
  readonly role: string;

  /** Employing organization, distinct from an optional client assignment. */
  readonly company: string;

  /** Brand artwork for the employing organization. */
  readonly companyLogo: CompanyLogo;

  /** Client assignment, present only for outsourced engagements. */
  readonly client?: ClientCompany;

  /** Display-ready work location. */
  readonly location: string;

  /** Display-ready employment period. */
  readonly period: string;

  /** Ordered, non-empty set of engagement categories. */
  readonly employmentTypes: readonly [EmploymentType, ...EmploymentType[]];

  /** Ordered accomplishment statements rendered as résumé bullets. */
  readonly highlights: readonly string[];

  /**
   * Exact display labels for technologies used during the engagement; labels
   * may also key optional brand-icon metadata.
   */
  readonly technologies: readonly string[];
}
