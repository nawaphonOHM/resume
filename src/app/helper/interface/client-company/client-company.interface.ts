import type { CompanyLogo } from '../brand-logo/company-logo/compant-logo.interface.ts';

/** Client represented by the candidate during an outsourced engagement. */
export interface ClientCompany {
  /** Client name displayed separately from the employing company. */
  readonly name: string;

  /** Brand artwork for the client. */
  readonly logo: CompanyLogo;
}
