import type { ResumeProfile } from '../../src/app/helper/interface/resume-profile/resume-profile.interface.ts';

export const resumeProfileFixture = {
  name: 'Taylor Example',
  title: 'Software Test Engineer',
  summary: [
    'This fictional profile supports presentation tests.',
    'Its reserved example links and labels do not identify a real person.',
    'Sample records exercise client and direct employment histories.',
    'The fixture covers accessible profile content and mixed technologies.',
  ],
  details: {
    location: 'Example City',
    phoneLabel: 'Available on request',
    email: 'taylor@example.com',
    nationality: 'Fictional',
    birthDate: '1 January 2000',
  },
  links: [
    {
      label: 'GitHub',
      url: 'https://code.example.com/taylor',
      logo: {
        src: 'https://assets.example.com/assets/fixture-profile.svg',
        width: 128,
        height: 128,
        surface: 'light',
      },
    },
    {
      label: 'Portfolio',
      url: 'https://portfolio.example.com/taylor',
    },
  ],
  skills: ['Angular', 'TypeScript', 'Node.js', 'PostgreSQL', 'Accessibility', 'Testing'],
  experience: [
    {
      role: 'Test Engineer',
      company: 'Example Works',
      companyLogo: {
        src: 'https://assets.example.com/assets/fixture-company-one.svg',
        width: 160,
        height: 160,
        surface: 'light',
      },
      client: {
        name: 'Sample Client One',
        logo: {
          src: 'https://assets.example.com/assets/fixture-client-one.svg',
          width: 160,
          height: 160,
          surface: 'light',
        },
      },
      location: 'Example City',
      period: '2024 — Present',
      employmentTypes: ['Contract'],
      highlights: [
        'Built sample services for a fictional product team.',
        'Improved test coverage with accessible, maintainable examples.',
      ],
      technologies: ['Angular 7.x', 'PostgreSQL', 'Example API'],
    },
    {
      role: 'Software Developer',
      company: 'Sample Studio',
      companyLogo: {
        src: 'https://assets.example.com/assets/fixture-company-two.svg',
        width: 160,
        height: 160,
        surface: 'light',
      },
      client: {
        name: 'Demo Client Two',
        logo: {
          src: 'https://assets.example.com/assets/fixture-client-two.svg',
          width: 160,
          height: 160,
          surface: 'light',
        },
      },
      location: 'Test Town',
      period: '2022 — 2024',
      employmentTypes: ['Contract'],
      highlights: ['Delivered demo integrations and responsive sample pages.'],
      technologies: ['Node.js', 'GraphQL', 'Example Utility'],
    },
    {
      role: 'Application Developer',
      company: 'Demo Services',
      companyLogo: {
        src: 'https://assets.example.com/assets/fixture-company-three.svg',
        width: 160,
        height: 160,
        surface: 'light',
      },
      client: {
        name: 'Fixture Client Three',
        logo: {
          src: 'https://assets.example.com/assets/fixture-client-three.svg',
          width: 160,
          height: 160,
          surface: 'light',
        },
      },
      location: 'Example City',
      period: '2020 — 2022',
      employmentTypes: ['Contract'],
      highlights: ['Created small example utilities for a fictional business.'],
      technologies: ['Bash'],
    },
    {
      role: 'Junior Developer',
      company: 'Fixture Lab',
      companyLogo: {
        src: 'https://assets.example.com/assets/fixture-company-four.svg',
        width: 160,
        height: 160,
        surface: 'light',
      },
      location: 'Test Town',
      period: '2019 — 2020',
      employmentTypes: ['Permanent'],
      highlights: ['Practiced building accessible internal demo tools.'],
      technologies: [],
    },
    {
      role: 'Test Intern',
      company: 'Example Works',
      companyLogo: {
        src: 'https://assets.example.com/assets/fixture-company-five.svg',
        width: 160,
        height: 160,
        surface: 'light',
      },
      location: 'Example City',
      period: '2018 — 2019',
      employmentTypes: ['Internship', 'Permanent'],
      highlights: ['Documented sample workflows for a fictional team.'],
      technologies: ['Example Utility'],
    },
  ],
  education: {
    degree: 'Certificate in Software Testing',
    institution: 'Example Academy',
    institutionLogo: {
      src: 'https://assets.example.com/assets/fixture-school.svg',
      width: 160,
      height: 160,
      surface: 'light',
    },
    period: '2016 — 2018',
    gpax: '3.75',
    seniorProject: {
      name: 'Sample Accessibility Demo',
      url: 'https://projects.example.com/accessibility-demo',
    },
  },
} satisfies ResumeProfile;
