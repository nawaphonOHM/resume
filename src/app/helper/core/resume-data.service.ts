import { httpResource } from '@angular/common/http';
import { computed, inject, Service } from '@angular/core';
import type { BrandLogo } from '../interface/brand-logo/brand-logo.interface.ts';
import type { Experience } from '../interface/experience/experience.interface.ts';
import type { ResumeDetails } from '../interface/resume-details/resume-details.interface.ts';
import type { ResumeEducation } from '../interface/resume-education/resume-education.interface.ts';
import type { ResumeLink } from '../interface/ressume-link/resume-link.interface.ts';
import type { ResumeProfile } from '../interface/resume-profile/resume-profile.interface.ts';
import { assetUrlBuilder } from '../injection-token/asset-url-builder.function.ts';
import { RESUME_DATA_API_BASE_URL } from '../injection-token/resume-data-api-base-url.variable.ts';
import { unwrapApiResponse } from './api-response.helper.ts';

const PROJECT_LOGO_ORIGIN = 'https://ohm-mho.space';
const projectLogoFileNamesByPath = new Map<string, string>([
  ['/link-logos/github.svg', 'github.svg'],
  ['/company-logos/accord-innovations.png', 'accord-innovations.png'],
  ['/company-logos/innovestx.png', 'innovestx.png'],
  ['/company-logos/saitech-solution.png', 'saitech-solution.png'],
  ['/company-logos/krungsri.png', 'krungsri.png'],
  ['/company-logos/nityo-infotech.svg', 'nityo-infotech.svg'],
  ['/company-logos/tisco.svg', 'tisco.svg'],
  ['/company-logos/line-man-wongnai.webp', 'line-man-wongnai.webp'],
  ['/company-logos/wisesoft.png', 'wisesoft.png'],
  ['/university-logos/prince-of-songkla-university.webp', 'prince-of-songkla-university.webp'],
]);

function projectLogoFileNameForPath(path: string): string | undefined {
  return projectLogoFileNamesByPath.get(path);
}

function projectLogoFileNameFromSource(source: unknown): string | undefined {
  if (typeof source !== 'string') {
    return undefined;
  }

  const rootRelativeFileName = projectLogoFileNameForPath(source);
  if (rootRelativeFileName) {
    return rootRelativeFileName;
  }

  try {
    const url = new URL(source);
    if (
      url.origin !== PROJECT_LOGO_ORIGIN ||
      url.username !== '' ||
      url.password !== '' ||
      `${url.origin}${url.pathname}` !== source
    ) {
      return undefined;
    }

    return projectLogoFileNameForPath(url.pathname);
  } catch {
    return undefined;
  }
}

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
  private readonly urlBuilder = inject(assetUrlBuilder);

  /** Resource for candidate display name. */
  readonly names = httpResource<string>(
    () => ({
      url: `${this.baseUrl}/api/v1/names`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<string>(raw) },
  );

  /** Resource for candidate professional headline. */
  readonly titles = httpResource<string>(
    () => ({
      url: `${this.baseUrl}/api/v1/titles`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<string>(raw) },
  );

  /** Resource for candidate summary paragraphs. */
  readonly summaries = httpResource<readonly string[]>(
    () => ({
      url: `${this.baseUrl}/api/v1/summaries`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<readonly string[]>(raw) },
  );

  /** Resource for candidate contact and personal details. */
  readonly details = httpResource<ResumeDetails>(
    () => ({
      url: `${this.baseUrl}/api/v1/details`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<ResumeDetails>(raw) },
  );

  /** Resource for candidate external links and brand metadata. */
  readonly links = httpResource<readonly ResumeLink[]>(
    () => ({
      url: `${this.baseUrl}/api/v1/links`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<readonly ResumeLink[]>(raw) },
  );

  /** Resource for candidate curated skill tags. */
  readonly skills = httpResource<readonly string[]>(
    () => ({
      url: `${this.baseUrl}/api/v1/skills`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<readonly string[]>(raw) },
  );

  /** Resource for candidate employment experiences. */
  readonly experiences = httpResource<readonly Experience[]>(
    () => ({
      url: `${this.baseUrl}/api/v1/experiences`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<readonly Experience[]>(raw) },
  );

  /** Resource for candidate highest education record. */
  readonly educations = httpResource<ResumeEducation>(
    () => ({
      url: `${this.baseUrl}/api/v1/educations`,
      headers: { 'X-Api-Type': 'resume-data' },
    }),
    { parse: (raw) => unwrapApiResponse<ResumeEducation>(raw) },
  );

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

    const links = this.links.value().map((link) => {
      if (!link.logo || typeof link.logo !== 'object') {
        return link;
      }

      const logo = this.normalizeProjectLogo(link.logo);
      return logo === link.logo ? link : { ...link, logo };
    });
    const experience = this.experiences.value().map((record) => {
      const companyLogo = record.companyLogo;
      const normalizedCompanyLogo = this.normalizeProjectLogo(companyLogo);
      const client = record.client;
      const clientLogo = client?.logo;
      let normalizedClient = client;
      if (client && clientLogo) {
        const normalizedClientLogo = this.normalizeProjectLogo(clientLogo);
        if (clientLogo !== normalizedClientLogo) {
          normalizedClient = { ...client, logo: normalizedClientLogo };
        }
      }

      if (companyLogo === normalizedCompanyLogo && client === normalizedClient) {
        return record;
      }

      return {
        ...record,
        companyLogo: normalizedCompanyLogo,
        ...(normalizedClient ? { client: normalizedClient } : {}),
      };
    });
    const education = this.educations.value();
    const institutionLogo = this.normalizeProjectLogo(education.institutionLogo);

    return {
      name: this.names.value(),
      title: this.titles.value(),
      summary: this.summaries.value(),
      details: this.details.value(),
      links,
      skills: this.skills.value(),
      experience,
      education:
        institutionLogo === education.institutionLogo
          ? education
          : { ...education, institutionLogo },
    };
  });

  private normalizeProjectLogo<T extends BrandLogo>(logo: T): T {
    const fileName = projectLogoFileNameFromSource(logo.src);
    return fileName ? { ...logo, src: this.urlBuilder.file(fileName) } : logo;
  }

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
