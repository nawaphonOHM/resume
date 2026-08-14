export interface ResumeLink {
  readonly label: string;
  readonly url: `https://${string}`;
  readonly logo?: BrandLogo;
}

export interface ResumeDetails {
  readonly location: string;
  readonly phoneLabel: 'Available on request';
  readonly email: string;
  readonly nationality: string;
  readonly birthDate: string;
}

export interface ResumeProject {
  readonly name: string;
  readonly url: `https://${string}`;
}

export interface BrandLogo {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly surface: 'light' | 'dark';
}

export interface ResumeEducation {
  readonly degree: string;
  readonly institution: string;
  readonly institutionLogo: BrandLogo;
  readonly period: string;
  readonly gpax: string;
  readonly seniorProject: ResumeProject;
}

export type EmploymentType = 'Internship' | 'Permanent' | 'Contract';

export interface CompanyLogo extends BrandLogo {}

export interface ClientCompany {
  readonly name: string;
  readonly logo: CompanyLogo;
}

export interface Experience {
  readonly role: string;
  readonly company: string;
  readonly companyLogo: CompanyLogo;
  readonly client?: ClientCompany;
  readonly location: string;
  readonly period: string;
  readonly employmentTypes: readonly [EmploymentType, ...EmploymentType[]];
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
  readonly education: ResumeEducation;
}
