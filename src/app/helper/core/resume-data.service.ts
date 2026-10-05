import { httpResource } from '@angular/common/http';
import { computed, inject, Service } from '@angular/core';
import type { Experience } from '../interface/experience/experience.interface.ts';
import type { ResumeDetails } from '../interface/resume-details/resume-details.interface.ts';
import type { ResumeEducation } from '../interface/resume-education/resume-education.interface.ts';
import type { ResumeLink } from '../interface/ressume-link/resume-link.interface.ts';
import type { ResumeProfile } from '../interface/resume-profile/resume-profile.interface.ts';
import { RESUME_DATA_API_BASE_URL } from '../injection-token/resume-data-api-base-url.variable.ts';

/**
 * Fetches and aggregates individual résumé sections from REST API endpoints.
 *
 * @remarks
 * Dispatches concurrent HTTP GET requests to 8 pluralized REST endpoints
 * using Angular's `httpResource` API. Requests carry the `X-Api-Type: resume-data` header
 * and aggregate into a unified `profile` signal once all resources resolve.
 */
@Service()
export class ResumeDataService {
  private readonly baseUrl = inject(RESUME_DATA_API_BASE_URL);

  /** Resource for candidate display name. */
  readonly names = httpResource<string>(() => ({
    url: `${this.baseUrl}/api/v1/names`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Resource for candidate professional headline. */
  readonly titles = httpResource<string>(() => ({
    url: `${this.baseUrl}/api/v1/titles`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Resource for candidate summary paragraphs. */
  readonly summaries = httpResource<readonly string[]>(() => ({
    url: `${this.baseUrl}/api/v1/summaries`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Resource for candidate contact and personal details. */
  readonly details = httpResource<ResumeDetails>(() => ({
    url: `${this.baseUrl}/api/v1/details`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Resource for candidate external links and brand metadata. */
  readonly links = httpResource<readonly ResumeLink[]>(() => ({
    url: `${this.baseUrl}/api/v1/links`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Resource for candidate curated skill tags. */
  readonly skills = httpResource<readonly string[]>(() => ({
    url: `${this.baseUrl}/api/v1/skills`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Resource for candidate employment experiences. */
  readonly experiences = httpResource<readonly Experience[]>(() => ({
    url: `${this.baseUrl}/api/v1/experiences`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Resource for candidate highest education record. */
  readonly educations = httpResource<ResumeEducation>(() => ({
    url: `${this.baseUrl}/api/v1/educations`,
    headers: { 'X-Api-Type': 'resume-data' },
  }));

  /** Whether any resource is currently loading. */
  readonly isLoading = computed<boolean>(
    () =>
      this.names.isLoading() ||
      this.titles.isLoading() ||
      this.summaries.isLoading() ||
      this.details.isLoading() ||
      this.links.isLoading() ||
      this.skills.isLoading() ||
      this.experiences.isLoading() ||
      this.educations.isLoading(),
  );

  /** Whether any resource encountered an error during fetch. */
  readonly hasError = computed<boolean>(
    () =>
      this.names.error() !== undefined ||
      this.titles.error() !== undefined ||
      this.summaries.error() !== undefined ||
      this.details.error() !== undefined ||
      this.links.error() !== undefined ||
      this.skills.error() !== undefined ||
      this.experiences.error() !== undefined ||
      this.educations.error() !== undefined,
  );

  /** The first error encountered across all resources, or undefined if none. */
  readonly error = computed<unknown>(
    () =>
      this.names.error() ??
      this.titles.error() ??
      this.summaries.error() ??
      this.details.error() ??
      this.links.error() ??
      this.skills.error() ??
      this.experiences.error() ??
      this.educations.error(),
  );

  /** Progress percentage (0..100) based on resolved resources count. */
  readonly progress = computed<number>(() => {
    const loadedCount =
      Number(this.names.hasValue()) +
      Number(this.titles.hasValue()) +
      Number(this.summaries.hasValue()) +
      Number(this.details.hasValue()) +
      Number(this.links.hasValue()) +
      Number(this.skills.hasValue()) +
      Number(this.experiences.hasValue()) +
      Number(this.educations.hasValue());

    return (loadedCount / 8) * 100;
  });

  /**
   * Aggregated canonical résumé profile.
   * Emits undefined until all 8 resources have successfully resolved.
   */
  readonly profile = computed<ResumeProfile | undefined>(() => {
    if (
      !this.names.hasValue() ||
      !this.titles.hasValue() ||
      !this.summaries.hasValue() ||
      !this.details.hasValue() ||
      !this.links.hasValue() ||
      !this.skills.hasValue() ||
      !this.experiences.hasValue() ||
      !this.educations.hasValue()
    ) {
      return undefined;
    }

    return {
      name: this.names.value(),
      title: this.titles.value(),
      summary: this.summaries.value(),
      details: this.details.value(),
      links: this.links.value(),
      skills: this.skills.value(),
      experience: this.experiences.value(),
      education: this.educations.value(),
    };
  });

  /**
   * Triggers a reload on all 8 underlying HTTP resources.
   */
  reloadAll(): void {
    this.names.reload();
    this.titles.reload();
    this.summaries.reload();
    this.details.reload();
    this.links.reload();
    this.skills.reload();
    this.experiences.reload();
    this.educations.reload();
  }
}
