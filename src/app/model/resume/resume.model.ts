/** A secure external destination displayed with optional brand artwork. */
export interface ResumeLink {
  /** Human-readable text that identifies the destination. */
  readonly label: string;

  /** HTTPS address opened for the destination. */
  readonly url: `https://${string}`;

  /**
   * Optional decorative logo metadata; consumers omit brand artwork when it is
   * absent.
   */
  readonly logo?: BrandLogo;
}

/** Public personal details rendered in the profile sidebar. */
export interface ResumeDetails {
  /** Display-ready city and country of residence. */
  readonly location: string;

  /** Privacy-preserving replacement for a public telephone number. */
  readonly phoneLabel: 'Available on request';

  /** Public email address used for direct contact. */
  readonly email: string;

  /** Display-ready nationality label. */
  readonly nationality: string;

  /** Display-ready birth date; consumers need not parse it as a date value. */
  readonly birthDate: string;
}

/** A named project with a secure external destination. */
export interface ResumeProject {
  /** Project name shown to readers. */
  readonly name: string;

  /** HTTPS address of the project's public resource. */
  readonly url: `https://${string}`;
}

/** Rendering metadata for brand artwork and its contrast-preserving frame. */
export interface BrandLogo {
  /** Asset URL loaded by logo images and zoom previews. */
  readonly src: string;

  /** Intrinsic asset width in pixels, used to preserve its aspect ratio. */
  readonly width: number;

  /** Intrinsic asset height in pixels, used to preserve its aspect ratio. */
  readonly height: number;

  /** Background tone on which the artwork retains its intended contrast. */
  readonly surface: 'light' | 'dark';
}

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
  readonly seniorProject: ResumeProject;
}

/** Supported engagement categories for an employment record. */
export type EmploymentType = 'Internship' | 'Permanent' | 'Contract';

/** Brand artwork used specifically for employer and client identities. */
export interface CompanyLogo extends BrandLogo {}

/** Client represented by the candidate during an outsourced engagement. */
export interface ClientCompany {
  /** Client name displayed separately from the employing company. */
  readonly name: string;

  /** Brand artwork for the client. */
  readonly logo: CompanyLogo;
}

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
