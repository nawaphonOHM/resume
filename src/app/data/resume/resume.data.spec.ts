/** Guards the canonical résumé content, ordering, privacy, and asset metadata. */
import { IMAGE_ASSET_ORIGIN, imageAssetUrl } from '../image-assets';
import { RESUME } from './resume.data';
import { ResumeLink } from '../../helper/interface/ressume-link/resume-link.interface.ts';

describe('RESUME', () => {
  it('builds image URLs from the fixed HTTPS Space origin', () => {
    expect(IMAGE_ASSET_ORIGIN).toBe('https://resume-images.ohm-mho.space');
    expect(imageAssetUrl('/company-logos/accord-innovations.png')).toBe(
      'https://resume-images.ohm-mho.space/company-logos/accord-innovations.png',
    );
  });
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
      location: 'Bangkok, Thailand',
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

  it('models the confirmed employer and client relationships', () => {
    expect(
      RESUME.experience.map((experience) => ({
        employer: experience.company,
        employerLogo: experience.companyLogo.src,
        ...('client' in experience
          ? {
              client: experience.client.name,
              clientLogo: experience.client.logo.src,
            }
          : {}),
      })),
    ).toEqual([
      {
        employer: 'Accord Innovations',
        employerLogo: 'https://resume-images.ohm-mho.space/company-logos/accord-innovations.png',
        client: 'InnovestX',
        clientLogo: 'https://resume-images.ohm-mho.space/company-logos/innovestx.png',
      },
      {
        employer: 'Saitech Solution',
        employerLogo: 'https://resume-images.ohm-mho.space/company-logos/saitech-solution.png',
        client: 'Ayudhya Capital Services (AYCAP)',
        clientLogo: 'https://resume-images.ohm-mho.space/company-logos/krungsri.png',
      },
      {
        employer: 'Nityo Infotech',
        employerLogo: 'https://resume-images.ohm-mho.space/company-logos/nityo-infotech.svg',
        client: 'TISCO Bank',
        clientLogo: 'https://resume-images.ohm-mho.space/company-logos/tisco.svg',
      },
      {
        employer: 'LINE MAN Wongnai',
        employerLogo: 'https://resume-images.ohm-mho.space/company-logos/line-man-wongnai.webp',
      },
      {
        employer: 'WiseSoft',
        employerLogo: 'https://resume-images.ohm-mho.space/company-logos/wisesoft.png',
      },
    ]);

    const outsourcedExperiences = RESUME.experience.filter((experience) => 'client' in experience);
    expect(outsourcedExperiences).toHaveLength(3);
    expect(RESUME.experience.length - outsourcedExperiences.length).toBe(2);
  });

  it('provides eight validated remote logo definitions', () => {
    const logos = RESUME.experience.flatMap((experience) => [
      experience.companyLogo,
      ...('client' in experience ? [experience.client.logo] : []),
    ]);

    expect(logos).toEqual([
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/accord-innovations.png',
        width: 250,
        height: 100,
        surface: 'dark',
      },
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/innovestx.png',
        width: 142,
        height: 27,
        surface: 'light',
      },
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/saitech-solution.png',
        width: 200,
        height: 200,
        surface: 'light',
      },
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/krungsri.png',
        width: 200,
        height: 200,
        surface: 'dark',
      },
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/nityo-infotech.svg',
        width: 4096,
        height: 1973,
        surface: 'light',
      },
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/tisco.svg',
        width: 297,
        height: 119,
        surface: 'light',
      },
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/line-man-wongnai.webp',
        width: 555,
        height: 83,
        surface: 'light',
      },
      {
        src: 'https://resume-images.ohm-mho.space/company-logos/wisesoft.png',
        width: 203,
        height: 203,
        surface: 'light',
      },
    ]);
    expect(new Set(logos.map(({ src }) => src)).size).toBe(8);

    for (const logo of logos) {
      const url = new URL(logo.src);
      expect(url.origin).toBe(IMAGE_ASSET_ORIGIN);
      expect(url.pathname).toMatch(/^\/company-logos\/[a-z0-9.-]+$/);
      expect(Number.isInteger(logo.width)).toBe(true);
      expect(Number.isInteger(logo.height)).toBe(true);
      expect(logo.width).toBeGreaterThan(0);
      expect(logo.height).toBeGreaterThan(0);
      expect(['light', 'dark']).toContain(logo.surface);
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
      institutionLogo: {
        src: 'https://resume-images.ohm-mho.space/university-logos/prince-of-songkla-university.webp',
        width: 600,
        height: 160,
        surface: 'light',
      },
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

    const logo = RESUME.education.institutionLogo;
    const logoUrl = new URL(logo.src);
    expect(logoUrl.origin).toBe(IMAGE_ASSET_ORIGIN);
    expect(logoUrl.pathname).toMatch(/^\/university-logos\/[a-z0-9.-]+$/);
    expect(Number.isInteger(logo.width)).toBe(true);
    expect(Number.isInteger(logo.height)).toBe(true);
    expect(logo.width).toBeGreaterThan(0);
    expect(logo.height).toBeGreaterThan(0);
    expect(['light', 'dark']).toContain(logo.surface);
  });

  it('brands only the GitHub link with validated remote logo metadata', () => {
    const links: readonly ResumeLink[] = RESUME.links;
    const githubLink = links.find(({ label }) => label === 'GitHub');
    const githubLogo = githubLink?.logo;

    expect(githubLink).toMatchObject({
      label: 'GitHub',
      url: 'https://github.com/nawaphonOHM',
      logo: {
        src: 'https://resume-images.ohm-mho.space/link-logos/github.svg',
        width: 98,
        height: 96,
        surface: 'light',
      },
    });
    expect(Number.isInteger(githubLogo?.width ?? Number.NaN)).toBe(true);
    expect(Number.isInteger(githubLogo?.height ?? Number.NaN)).toBe(true);
    expect(githubLogo?.width ?? 0).toBeGreaterThan(0);
    expect(githubLogo?.height ?? 0).toBeGreaterThan(0);
    expect(links.filter(({ logo }) => logo !== undefined).map(({ label }) => label)).toEqual([
      'GitHub',
    ]);
    expect(links.find(({ label }) => label === 'Personal website')).toEqual({
      label: 'Personal website',
      url: 'https://leader-board.ohm-mho.space/',
    });
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
