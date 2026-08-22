/** Public personal details rendered in the profile sidebar. */
export interface ResumeDetailsInterface {
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
