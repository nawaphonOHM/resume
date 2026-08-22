import { BrandLogo } from '../brand-logo/brand-logo.interface.ts';

/** A secure external destination displayed with optional brand artwork. */
export interface ResumeLinkInterface {
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
