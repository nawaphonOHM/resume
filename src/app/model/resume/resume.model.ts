export interface ResumeLink {
  readonly label: string;
  readonly url: `https://${string}`;
}

export interface ResumeDetails {
  readonly location: string;
  readonly phoneLabel: 'Available on request';
  readonly email: string;
  readonly nationality: string;
  readonly birthDate: string;
}

export interface Experience {
  readonly role: string;
  readonly company: string;
  readonly location: string;
  readonly period: string;
  readonly highlights: readonly string[];
  readonly technologies: readonly string[];
}

export interface ResumeProfile {
  readonly name: string;
  readonly title: string;
  readonly summary: readonly string[];
  readonly details: ResumeDetails;
  readonly links: readonly ResumeLink[];
  readonly skills: readonly string[];
  readonly experience: readonly Experience[];
}
