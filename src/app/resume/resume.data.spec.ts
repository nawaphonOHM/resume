import { RESUME } from './resume.data';

describe('RESUME', () => {
  it('contains the complete public profile and six unique skills', () => {
    expect(RESUME.name).toBe('Nawaphon Isarathanachaikul');
    expect(RESUME.title).toBe('Full Stack Developer');
    expect(RESUME.summary).toHaveLength(8);
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
