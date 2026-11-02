/**
 * Verifies ResumeDataService HTTP resource instantiation, base URL injection,
 * request headers, partial/full progress aggregation, error handling, and reloadAll.
 */
import { ApplicationRef } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumeDataService } from './resume-data.service.ts';
import { resumeApiRetryInterceptor } from '../interceptor/resume-api-retry.interceptor.ts';
import { RESUME_API_RETRY_COUNT } from '../injection-token/resume-api-retry-count.variable.ts';
import { RESUME_API_RETRY_DELAY_MS } from '../injection-token/resume-api-retry-delay-ms.variable.ts';
import { RESUME_API_RETRY_DELAY_MULTIPLIER } from '../injection-token/resume-api-retry-delay-multiplier.variable.ts';
import { RESUME_DATA_API_BASE_URL } from '../injection-token/resume-data-api-base-url.variable.ts';
import type { ResumeDetails } from '../interface/resume-details/resume-details.interface.ts';
import type { ResumeLink } from '../interface/ressume-link/resume-link.interface.ts';
import type { Experience } from '../interface/experience/experience.interface.ts';
import type { ResumeEducation } from '../interface/resume-education/resume-education.interface.ts';
import type { ResumeProfile } from '../interface/resume-profile/resume-profile.interface.ts';
import type { ApiResponse } from '../interface/api-response/api-response.interface.ts';

describe('ResumeDataService', () => {
  let service: ResumeDataService;
  let httpMock: HttpTestingController;
  let appRef: ApplicationRef;

  const mockName = 'Jane Doe';
  const mockTitle = 'Staff Engineer';
  const mockSummaries: readonly string[] = [
    'Experienced engineer with backend and frontend expertise.',
  ];
  const mockDetails: ResumeDetails = {
    location: 'Bangkok, Thailand',
    phoneLabel: 'Available on request',
    email: 'jane@example.com',
    nationality: 'Thai',
    birthDate: '1 January 1995',
  };
  const mockLinks: readonly ResumeLink[] = [
    {
      label: 'GitHub',
      url: 'https://github.com/janedoe',
    },
  ];
  const mockSkills: readonly string[] = ['Angular', 'TypeScript', 'Spring Boot'];
  const mockExperiences: readonly Experience[] = [
    {
      role: 'Staff Engineer',
      company: 'Acme Corp',
      companyLogo: {
        src: 'https://example.com/logo.png',
        width: 100,
        height: 100,
        surface: 'light',
      },
      location: 'Bangkok',
      period: '2022 — Present',
      employmentTypes: ['Permanent'],
      highlights: ['Led core architecture.'],
      technologies: ['Angular', 'TypeScript'],
    },
  ];
  const mockEducation: ResumeEducation = {
    degree: 'B.Eng.',
    institution: 'University',
    institutionLogo: {
      src: 'https://example.com/uni.png',
      width: 100,
      height: 100,
      surface: 'light',
    },
    period: '2015 — 2019',
    gpax: '3.50',
    seniorProject: {
      name: 'Senior Project',
      url: 'https://github.com/janedoe/project',
    },
  };

  const createEnvelope = <T>(data: T): ApiResponse<T> => ({
    success: true,
    data,
    timestamp: '2026-11-02T19:44:20Z',
  });

  const setupService = (baseUrl = ''): void => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RESUME_DATA_API_BASE_URL, useValue: baseUrl },
      ],
    });

    service = TestBed.inject(ResumeDataService);
    httpMock = TestBed.inject(HttpTestingController);
    appRef = TestBed.inject(ApplicationRef);
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('dispatches GET requests to all 8 plural endpoints with X-Api-Type header', () => {
    setupService();
    TestBed.tick();

    const reqNames = httpMock.expectOne('/api/v1/names');
    const reqTitles = httpMock.expectOne('/api/v1/titles');
    const reqSummaries = httpMock.expectOne('/api/v1/summaries');
    const reqDetails = httpMock.expectOne('/api/v1/details');
    const reqLinks = httpMock.expectOne('/api/v1/links');
    const reqSkills = httpMock.expectOne('/api/v1/skills');
    const reqExperiences = httpMock.expectOne('/api/v1/experiences');
    const reqEducations = httpMock.expectOne('/api/v1/educations');

    const requests = [
      reqNames,
      reqTitles,
      reqSummaries,
      reqDetails,
      reqLinks,
      reqSkills,
      reqExperiences,
      reqEducations,
    ];

    for (const req of requests) {
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-Api-Type')).toBe('resume-data');
    }

    expect(service.isLoading()).toBe(true);
    expect(service.hasError()).toBe(false);
    expect(service.error()).toBeUndefined();
    expect(service.progress()).toBe(0);
    expect(service.profile()).toBeUndefined();

    // Clean up open requests with valid ApiResponse envelopes
    reqNames.flush(createEnvelope(mockName));
    reqTitles.flush(createEnvelope(mockTitle));
    reqSummaries.flush(createEnvelope(mockSummaries));
    reqDetails.flush(createEnvelope(mockDetails));
    reqLinks.flush(createEnvelope(mockLinks));
    reqSkills.flush(createEnvelope(mockSkills));
    reqExperiences.flush(createEnvelope(mockExperiences));
    reqEducations.flush(createEnvelope(mockEducation));
  });

  it('prepends configured RESUME_DATA_API_BASE_URL to endpoint paths', () => {
    setupService('https://api.resume.example.com');
    TestBed.tick();

    const req = httpMock.expectOne('https://api.resume.example.com/api/v1/names');
    expect(req.request.method).toBe('GET');

    // Flush remaining requests with wrapped ApiResponse envelopes
    req.flush(createEnvelope(mockName));
    httpMock
      .expectOne('https://api.resume.example.com/api/v1/titles')
      .flush(createEnvelope(mockTitle));
    httpMock
      .expectOne('https://api.resume.example.com/api/v1/summaries')
      .flush(createEnvelope(mockSummaries));
    httpMock
      .expectOne('https://api.resume.example.com/api/v1/details')
      .flush(createEnvelope(mockDetails));
    httpMock
      .expectOne('https://api.resume.example.com/api/v1/links')
      .flush(createEnvelope(mockLinks));
    httpMock
      .expectOne('https://api.resume.example.com/api/v1/skills')
      .flush(createEnvelope(mockSkills));
    httpMock
      .expectOne('https://api.resume.example.com/api/v1/experiences')
      .flush(createEnvelope(mockExperiences));
    httpMock
      .expectOne('https://api.resume.example.com/api/v1/educations')
      .flush(createEnvelope(mockEducation));
  });

  it('aggregates all resolved resources into a canonical ResumeProfile signal from wrapped API envelopes', async () => {
    setupService();
    TestBed.tick();

    const reqNames = httpMock.expectOne('/api/v1/names');
    const reqTitles = httpMock.expectOne('/api/v1/titles');
    const reqSummaries = httpMock.expectOne('/api/v1/summaries');
    const reqDetails = httpMock.expectOne('/api/v1/details');
    const reqLinks = httpMock.expectOne('/api/v1/links');
    const reqSkills = httpMock.expectOne('/api/v1/skills');
    const reqExperiences = httpMock.expectOne('/api/v1/experiences');
    const reqEducations = httpMock.expectOne('/api/v1/educations');

    reqNames.flush(createEnvelope(mockName));
    reqTitles.flush(createEnvelope(mockTitle));
    reqSummaries.flush(createEnvelope(mockSummaries));
    reqDetails.flush(createEnvelope(mockDetails));
    reqLinks.flush(createEnvelope(mockLinks));
    reqSkills.flush(createEnvelope(mockSkills));
    reqExperiences.flush(createEnvelope(mockExperiences));
    reqEducations.flush(createEnvelope(mockEducation));

    await Promise.resolve();
    TestBed.tick();
    await appRef.whenStable();

    expect(service.isLoading()).toBe(false);
    expect(service.hasError()).toBe(false);
    expect(service.error()).toBeUndefined();
    expect(service.progress()).toBe(100);

    const expectedProfile: ResumeProfile = {
      name: mockName,
      title: mockTitle,
      summary: mockSummaries,
      details: mockDetails,
      links: mockLinks,
      skills: mockSkills,
      experience: mockExperiences,
      education: mockEducation,
    };

    expect(service.profile()).toEqual(expectedProfile);
    expect(service.names.value()).toBe(mockName);
    expect(service.titles.value()).toBe(mockTitle);
    expect(service.summaries.value()).toEqual(mockSummaries);
    expect(service.details.value()).toEqual(mockDetails);
    expect(service.links.value()).toEqual(mockLinks);
    expect(service.skills.value()).toEqual(mockSkills);
    expect(service.experiences.value()).toEqual(mockExperiences);
    expect(service.educations.value()).toEqual(mockEducation);
  });

  it('updates progress incrementally and keeps profile undefined until all resources resolve', async () => {
    setupService();
    TestBed.tick();

    const reqNames = httpMock.expectOne('/api/v1/names');
    const reqTitles = httpMock.expectOne('/api/v1/titles');
    const reqSummaries = httpMock.expectOne('/api/v1/summaries');
    const reqDetails = httpMock.expectOne('/api/v1/details');
    const reqLinks = httpMock.expectOne('/api/v1/links');
    const reqSkills = httpMock.expectOne('/api/v1/skills');
    const reqExperiences = httpMock.expectOne('/api/v1/experiences');
    const reqEducations = httpMock.expectOne('/api/v1/educations');

    expect(service.progress()).toBe(0);

    // Flush 2 of 8
    reqNames.flush(createEnvelope(mockName));
    reqTitles.flush(createEnvelope(mockTitle));
    await Promise.resolve();
    TestBed.tick();

    expect(service.progress()).toBe(25);
    expect(service.isLoading()).toBe(true);
    expect(service.profile()).toBeUndefined();

    // Flush next 2 (4 of 8)
    reqSummaries.flush(createEnvelope(mockSummaries));
    reqDetails.flush(createEnvelope(mockDetails));
    await Promise.resolve();
    TestBed.tick();

    expect(service.progress()).toBe(50);
    expect(service.isLoading()).toBe(true);
    expect(service.profile()).toBeUndefined();

    // Flush remaining 4
    reqLinks.flush(createEnvelope(mockLinks));
    reqSkills.flush(createEnvelope(mockSkills));
    reqExperiences.flush(createEnvelope(mockExperiences));
    reqEducations.flush(createEnvelope(mockEducation));
    await Promise.resolve();
    TestBed.tick();
    await appRef.whenStable();

    expect(service.progress()).toBe(100);
    expect(service.isLoading()).toBe(false);
    expect(service.profile()).toBeDefined();
  });

  it('sets hasError to true and exposes error when any endpoint fails', async () => {
    setupService();
    TestBed.tick();

    const reqNames = httpMock.expectOne('/api/v1/names');
    const reqTitles = httpMock.expectOne('/api/v1/titles');
    const reqSummaries = httpMock.expectOne('/api/v1/summaries');
    const reqDetails = httpMock.expectOne('/api/v1/details');
    const reqLinks = httpMock.expectOne('/api/v1/links');
    const reqSkills = httpMock.expectOne('/api/v1/skills');
    const reqExperiences = httpMock.expectOne('/api/v1/experiences');
    const reqEducations = httpMock.expectOne('/api/v1/educations');

    reqNames.flush(createEnvelope(mockName));
    reqTitles.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    reqSummaries.flush(createEnvelope(mockSummaries));
    reqDetails.flush(createEnvelope(mockDetails));
    reqLinks.flush(createEnvelope(mockLinks));
    reqSkills.flush(createEnvelope(mockSkills));
    reqExperiences.flush(createEnvelope(mockExperiences));
    reqEducations.flush(createEnvelope(mockEducation));
    await Promise.resolve();
    TestBed.tick();
    await appRef.whenStable();

    expect(service.hasError()).toBe(true);
    expect(service.error()).toBeDefined();
    expect(service.profile()).toBeUndefined();
  });

  it('reloads all 8 resources when reloadAll() is invoked', async () => {
    setupService();
    TestBed.tick();

    const initialRequests = [
      httpMock.expectOne('/api/v1/names'),
      httpMock.expectOne('/api/v1/titles'),
      httpMock.expectOne('/api/v1/summaries'),
      httpMock.expectOne('/api/v1/details'),
      httpMock.expectOne('/api/v1/links'),
      httpMock.expectOne('/api/v1/skills'),
      httpMock.expectOne('/api/v1/experiences'),
      httpMock.expectOne('/api/v1/educations'),
    ];

    initialRequests[0].flush(createEnvelope(mockName));
    initialRequests[1].flush(createEnvelope(mockTitle));
    initialRequests[2].flush(createEnvelope(mockSummaries));
    initialRequests[3].flush(createEnvelope(mockDetails));
    initialRequests[4].flush(createEnvelope(mockLinks));
    initialRequests[5].flush(createEnvelope(mockSkills));
    initialRequests[6].flush(createEnvelope(mockExperiences));
    initialRequests[7].flush(createEnvelope(mockEducation));

    await Promise.resolve();
    TestBed.tick();
    await appRef.whenStable();

    service.reloadAll();
    TestBed.tick();

    const reloadRequests = [
      httpMock.expectOne('/api/v1/names'),
      httpMock.expectOne('/api/v1/titles'),
      httpMock.expectOne('/api/v1/summaries'),
      httpMock.expectOne('/api/v1/details'),
      httpMock.expectOne('/api/v1/links'),
      httpMock.expectOne('/api/v1/skills'),
      httpMock.expectOne('/api/v1/experiences'),
      httpMock.expectOne('/api/v1/educations'),
    ];

    expect(reloadRequests.length).toBe(8);

    for (const req of reloadRequests) {
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-Api-Type')).toBe('resume-data');
    }

    reloadRequests[0].flush(createEnvelope(mockName));
    reloadRequests[1].flush(createEnvelope(mockTitle));
    reloadRequests[2].flush(createEnvelope(mockSummaries));
    reloadRequests[3].flush(createEnvelope(mockDetails));
    reloadRequests[4].flush(createEnvelope(mockLinks));
    reloadRequests[5].flush(createEnvelope(mockSkills));
    reloadRequests[6].flush(createEnvelope(mockExperiences));
    reloadRequests[7].flush(createEnvelope(mockEducation));

    await Promise.resolve();
    TestBed.tick();
    await appRef.whenStable();
  });

  it('handles raw un-enveloped fallback payloads gracefully for backward compatibility', async () => {
    setupService();
    TestBed.tick();

    const reqNames = httpMock.expectOne('/api/v1/names');
    const reqTitles = httpMock.expectOne('/api/v1/titles');
    const reqSummaries = httpMock.expectOne('/api/v1/summaries');
    const reqDetails = httpMock.expectOne('/api/v1/details');
    const reqLinks = httpMock.expectOne('/api/v1/links');
    const reqSkills = httpMock.expectOne('/api/v1/skills');
    const reqExperiences = httpMock.expectOne('/api/v1/experiences');
    const reqEducations = httpMock.expectOne('/api/v1/educations');

    // Flush raw data directly without ApiResponse envelope
    reqNames.flush(mockName);
    reqTitles.flush(mockTitle);
    reqSummaries.flush(mockSummaries);
    reqDetails.flush(mockDetails);
    reqLinks.flush(mockLinks);
    reqSkills.flush(mockSkills);
    reqExperiences.flush(mockExperiences);
    reqEducations.flush(mockEducation);

    await Promise.resolve();
    TestBed.tick();
    await appRef.whenStable();

    expect(service.isLoading()).toBe(false);
    expect(service.hasError()).toBe(false);
    expect(service.error()).toBeUndefined();
    expect(service.progress()).toBe(100);

    const expectedProfile: ResumeProfile = {
      name: mockName,
      title: mockTitle,
      summary: mockSummaries,
      details: mockDetails,
      links: mockLinks,
      skills: mockSkills,
      experience: mockExperiences,
      education: mockEducation,
    };

    expect(service.profile()).toEqual(expectedProfile);
    expect(service.names.value()).toBe(mockName);
    expect(service.titles.value()).toBe(mockTitle);
    expect(service.summaries.value()).toEqual(mockSummaries);
    expect(service.details.value()).toEqual(mockDetails);
    expect(service.links.value()).toEqual(mockLinks);
    expect(service.skills.value()).toEqual(mockSkills);
    expect(service.experiences.value()).toEqual(mockExperiences);
    expect(service.educations.value()).toEqual(mockEducation);
  });

  it('handles mixed responses where some endpoints return envelopes and others return raw payloads', async () => {
    setupService();
    TestBed.tick();

    const reqNames = httpMock.expectOne('/api/v1/names');
    const reqTitles = httpMock.expectOne('/api/v1/titles');
    const reqSummaries = httpMock.expectOne('/api/v1/summaries');
    const reqDetails = httpMock.expectOne('/api/v1/details');
    const reqLinks = httpMock.expectOne('/api/v1/links');
    const reqSkills = httpMock.expectOne('/api/v1/skills');
    const reqExperiences = httpMock.expectOne('/api/v1/experiences');
    const reqEducations = httpMock.expectOne('/api/v1/educations');

    // Alternate between wrapped and raw responses
    reqNames.flush(createEnvelope(mockName));
    reqTitles.flush(mockTitle);
    reqSummaries.flush(createEnvelope(mockSummaries));
    reqDetails.flush(mockDetails);
    reqLinks.flush(createEnvelope(mockLinks));
    reqSkills.flush(mockSkills);
    reqExperiences.flush(createEnvelope(mockExperiences));
    reqEducations.flush(mockEducation);

    await Promise.resolve();
    TestBed.tick();
    await appRef.whenStable();

    expect(service.isLoading()).toBe(false);
    expect(service.hasError()).toBe(false);
    expect(service.progress()).toBe(100);

    const expectedProfile: ResumeProfile = {
      name: mockName,
      title: mockTitle,
      summary: mockSummaries,
      details: mockDetails,
      links: mockLinks,
      skills: mockSkills,
      experience: mockExperiences,
      education: mockEducation,
    };

    expect(service.profile()).toEqual(expectedProfile);
    expect(service.names.value()).toBe(mockName);
    expect(service.titles.value()).toBe(mockTitle);
    expect(service.summaries.value()).toEqual(mockSummaries);
    expect(service.details.value()).toEqual(mockDetails);
    expect(service.links.value()).toEqual(mockLinks);
    expect(service.skills.value()).toEqual(mockSkills);
    expect(service.experiences.value()).toEqual(mockExperiences);
    expect(service.educations.value()).toEqual(mockEducation);
  });

  describe('integration with resumeApiRetryInterceptor', () => {
    const setupServiceWithRetry = (retryCount = 2, delayMs = 20, multiplier = 2): void => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([resumeApiRetryInterceptor])),
          provideHttpClientTesting(),
          { provide: RESUME_DATA_API_BASE_URL, useValue: '' },
          { provide: RESUME_API_RETRY_COUNT, useValue: retryCount },
          { provide: RESUME_API_RETRY_DELAY_MS, useValue: delayMs },
          { provide: RESUME_API_RETRY_DELAY_MULTIPLIER, useValue: multiplier },
        ],
      });

      service = TestBed.inject(ResumeDataService);
      httpMock = TestBed.inject(HttpTestingController);
      appRef = TestBed.inject(ApplicationRef);
    };

    it('recovers and resolves profile when transient failure is resolved on retry', async () => {
      setupServiceWithRetry(2, 20);
      TestBed.tick();

      const reqNames = httpMock.expectOne('/api/v1/names');
      const reqTitles = httpMock.expectOne('/api/v1/titles');
      const reqSummaries = httpMock.expectOne('/api/v1/summaries');
      const reqDetails = httpMock.expectOne('/api/v1/details');
      const reqLinks = httpMock.expectOne('/api/v1/links');
      const reqSkills = httpMock.expectOne('/api/v1/skills');
      const reqExperiences = httpMock.expectOne('/api/v1/experiences');
      const reqEducations = httpMock.expectOne('/api/v1/educations');

      reqTitles.flush(createEnvelope(mockTitle));
      reqSummaries.flush(createEnvelope(mockSummaries));
      reqDetails.flush(createEnvelope(mockDetails));
      reqLinks.flush(createEnvelope(mockLinks));
      reqSkills.flush(createEnvelope(mockSkills));
      reqExperiences.flush(createEnvelope(mockExperiences));
      reqEducations.flush(createEnvelope(mockEducation));

      // Names endpoint fails transiently with 500 error
      reqNames.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      // Delay passes (20ms)
      vi.advanceTimersByTime(20);
      TestBed.tick();

      const retryNames = httpMock.expectOne('/api/v1/names?retry=1');
      expect(retryNames.request.headers.get('X-Api-Type')).toBe('resume-data');
      retryNames.flush(createEnvelope(mockName));

      await Promise.resolve();
      TestBed.tick();
      await appRef.whenStable();

      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(false);
      expect(service.profile()).toEqual({
        name: mockName,
        title: mockTitle,
        summary: mockSummaries,
        details: mockDetails,
        links: mockLinks,
        skills: mockSkills,
        experience: mockExperiences,
        education: mockEducation,
      });
    });

    it('sets hasError to true when retries are exhausted across multiple attempts', async () => {
      setupServiceWithRetry(2, 20);
      TestBed.tick();

      const reqNames = httpMock.expectOne('/api/v1/names');
      const reqTitles = httpMock.expectOne('/api/v1/titles');
      const reqSummaries = httpMock.expectOne('/api/v1/summaries');
      const reqDetails = httpMock.expectOne('/api/v1/details');
      const reqLinks = httpMock.expectOne('/api/v1/links');
      const reqSkills = httpMock.expectOne('/api/v1/skills');
      const reqExperiences = httpMock.expectOne('/api/v1/experiences');
      const reqEducations = httpMock.expectOne('/api/v1/educations');

      reqNames.flush(createEnvelope(mockName));
      reqSummaries.flush(createEnvelope(mockSummaries));
      reqDetails.flush(createEnvelope(mockDetails));
      reqLinks.flush(createEnvelope(mockLinks));
      reqSkills.flush(createEnvelope(mockSkills));
      reqExperiences.flush(createEnvelope(mockExperiences));
      reqEducations.flush(createEnvelope(mockEducation));

      // Attempt 0 fails
      reqTitles.flush('500', { status: 500, statusText: 'Server Error' });

      // Attempt 1 fails (retry 1: 20ms)
      vi.advanceTimersByTime(20);
      TestBed.tick();
      const retry1 = httpMock.expectOne('/api/v1/titles?retry=1');
      retry1.flush('500', { status: 500, statusText: 'Server Error' });

      // Attempt 2 fails (retry 2: 40ms)
      vi.advanceTimersByTime(40);
      TestBed.tick();
      const retry2 = httpMock.expectOne('/api/v1/titles?retry=2');
      retry2.flush('500', { status: 500, statusText: 'Server Error' });

      await Promise.resolve();
      TestBed.tick();
      await appRef.whenStable();

      expect(service.hasError()).toBe(true);
      expect(service.profile()).toBeUndefined();
    });
  });
});
