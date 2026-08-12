import { RESUME } from './resume.data';

describe('RESUME', () => {
  it('contains the complete public profile and six unique skills', () => {
    expect(RESUME.name).toBe('Nawaphon Isarathanachaikul');
    expect(RESUME.title).toBe('Backend Software Engineer');
    expect(RESUME.summary).toEqual([
      'Backend-focused software engineer with experience across banking, fintech, food-tech, and tax platforms, backed by a full-stack development foundation.',
      'Design and deliver APIs, CRUD services, database integrations, event-driven processing, and caching with Spring Boot, Go, Node.js, Kafka, Redis, Caffeine, and relational databases.',
      'Build responsive Angular and React interfaces and data-driven features, including regulatory reporting, Excel exports, and secure cross-system integrations.',
      'Support end-to-end delivery through AI-assisted development, automated pipelines and smoke tests, Elasticsearch and Kubernetes diagnostics, SIT/UAT deployments, documentation, and DevOps coordination.',
    ]);
    expect(RESUME.details).toEqual({
      location: 'Bangkok, Bangkok, Thailand',
      phoneLabel: 'Available on request',
      email: 'nawaphon2539@gmail.com',
      nationality: 'Thai',
      birthDate: '9 September 1996',
    });
    expect(RESUME.skills).toEqual(['Spring Boot', 'RDBMS', 'Kafka', 'Redis', 'Angular', 'React']);
    expect(new Set(RESUME.skills).size).toBe(RESUME.skills.length);
  });

  it('keeps every employment record in newest-first résumé order', () => {
    expect(
      RESUME.experience.map(({ role, company, period }) => ({ role, company, period })),
    ).toEqual([
      {
        role: 'Back End Developer',
        company: 'Accord Innovations',
        period: 'Apr 2026 — Present',
      },
      {
        role: 'Software Engineer',
        company: 'Saitech Solution',
        period: 'May 2024 — Jun 2025',
      },
      {
        role: 'Software Engineer',
        company: 'Nityo Infotech',
        period: 'Jan 2023 — Dec 2023',
      },
      {
        role: 'Software Engineer Backend',
        company: 'LINE MAN Wongnai',
        period: 'May 2022 — Jul 2022',
      },
      {
        role: 'Full-Stack Software Developer',
        company: 'WiseSoft',
        period: 'Jan 2020 — Apr 2022',
      },
    ]);

    for (const experience of RESUME.experience) {
      expect(experience.highlights.length).toBeGreaterThan(0);
      expect(experience.technologies.length).toBeGreaterThan(0);
    }
  });

  it('classifies every employment record and preserves the WiseSoft progression', () => {
    expect(
      Object.fromEntries(
        RESUME.experience.map(({ company, employmentTypes }) => [company, employmentTypes]),
      ),
    ).toEqual({
      'Accord Innovations': ['Contract'],
      'Saitech Solution': ['Contract'],
      'Nityo Infotech': ['Contract'],
      'LINE MAN Wongnai': ['Permanent'],
      WiseSoft: ['Internship', 'Permanent'],
    });

    expect(RESUME.experience.find(({ company }) => company === 'WiseSoft')).toMatchObject({
      period: 'Jan 2020 — Apr 2022',
      employmentTypes: ['Internship', 'Permanent'],
    });
  });

  it('contains the complete highest-education record and its secure project link', () => {
    expect(RESUME.education).toEqual({
      degree: 'Bachelor of Engineering (Computer Engineering)',
      institution: 'Prince of Songkla University',
      period: '2015–2019',
      gpax: '2.55',
      seniorProject: {
        name: 'CoEChatBot',
        url: 'https://github.com/nawaphonOHM/CoEChatBot',
      },
    });

    const projectUrl = new URL(RESUME.education.seniorProject.url);
    expect(projectUrl.protocol).toBe('https:');
    expect(projectUrl.hostname).not.toBe('');
  });

  it('publishes only safe HTTPS external links', () => {
    expect(RESUME.links).toHaveLength(2);

    for (const link of RESUME.links) {
      const url = new URL(link.url);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).not.toBe('');
    }
  });

  it('exposes only the censored, non-linkable phone label', () => {
    const serializedProfile = JSON.stringify(RESUME);

    expect(RESUME.details.phoneLabel).toBe('Available on request');
    expect(serializedProfile).not.toMatch(/tel:/i);
    expect(RESUME.links.some((link) => link.label.toLowerCase().includes('phone'))).toBe(false);
  });
});
