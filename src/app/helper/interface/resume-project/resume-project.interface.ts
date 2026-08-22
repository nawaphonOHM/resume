/** A named project with a secure external destination. */
export interface ResumeProjectInterface {
  /** Project name shown to readers. */
  readonly name: string;

  /** HTTPS address of the project's public resource. */
  readonly url: `https://${string}`;
}
