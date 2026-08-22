import type { ResumeProfile } from '../../helper/resume/resume.model';
import { imageAssetUrl } from '../image-assets.ts';

/**
 * Canonical, deeply immutable content source rendered by the résumé.
 *
 * `satisfies ResumeProfile` validates the domain contract while `as const`
 * preserves exact labels and ordering for presentation and icon lookup.
 */
export const RESUME = {
  name: 'Nawaphon Isarathanachaikul',
  title: 'Backend Software Engineer',
  summary: [
    'Backend-focused software engineer with experience across banking, fintech, food-tech, and tax platforms, backed by a full-stack development foundation.',
    'Design and deliver APIs, CRUD services, database integrations, event-driven processing, and caching with Spring Boot, Go, Node.js, Kafka, Redis, Caffeine, and relational databases.',
    'Build responsive Angular and React interfaces and data-driven features, including regulatory reporting, Excel exports, and secure cross-system integrations.',
    'Support end-to-end delivery through AI-assisted development, automated pipelines and smoke tests, Elasticsearch and Kubernetes diagnostics, SIT/UAT deployments, documentation, and DevOps coordination.',
  ],
  details: {
    location: 'Bangkok, Thailand',
    phoneLabel: 'Available on request',
    email: 'nawaphon2539@gmail.com',
    nationality: 'Thai',
    birthDate: '9 September 1996',
  },
  links: [
    {
      label: 'GitHub',
      url: 'https://github.com/nawaphonOHM',
      logo: {
        src: imageAssetUrl('/link-logos/github.svg'),
        width: 98,
        height: 96,
        surface: 'light',
      },
    },
    {
      label: 'Personal website',
      url: 'https://leader-board.ohm-mho.space/',
    },
  ],
  skills: ['Spring Boot', 'RDBMS', 'Kafka', 'Redis', 'Angular', 'React'],
  experience: [
    {
      role: 'Back End Developer',
      company: 'Accord Innovations',
      companyLogo: {
        src: imageAssetUrl('/company-logos/accord-innovations.png'),
        width: 250,
        height: 100,
        surface: 'dark',
      },
      client: {
        name: 'InnovestX',
        logo: {
          src: imageAssetUrl('/company-logos/innovestx.png'),
          width: 142,
          height: 27,
          surface: 'light',
        },
      },
      location: 'Bangkok',
      period: 'Apr 2026 — Present',
      employmentTypes: ['Contract'],
      highlights: [
        'Work in a hybrid outsourcing role at InnovestX.',
        'Complete wording-change tasks in each sprint.',
        'Use Claude Code as an agent to complete routine coding tasks that follow technical designs from the lead.',
        'Use Claude Code as an agent for tasks without a lead-provided technical design, including clarifying requirements with the project manager and designing REST APIs and RDBMS tables with recommendations from the lead.',
        'Fix bugs raised by QA using approaches including Elasticsearch and Kubernetes pod logs.',
        'Deploy completed tasks to SIT and UAT environments.',
        'Coordinate with DevOps on infrastructure needs, including API routing, API keys for new microservices, request-path permissions, HTTP-method allowlisting in the internal firewall, and public API gateway changes.',
        'Write Bash smoke-test scripts with AI assistance.',
        'Document technical API details for callers and QA engineers in Confluence.',
        'Deliver CRUD features, process Kafka topic data to meet business requirements, use Caffeine and Redis caches, and send data to the notification system managed by InnovestX.',
      ],
      technologies: [
        'Codex',
        'Claude Code',
        'REST APIs',
        'MySQL',
        'PostgreSQL',
        'Elasticsearch',
        'Kubernetes',
        'Kafka',
        'Caffeine',
        'Redis',
        'Bash',
        'Confluence',
      ],
    },
    {
      role: 'Software Engineer',
      company: 'Saitech Solution',
      companyLogo: {
        src: imageAssetUrl('/company-logos/saitech-solution.png'),
        width: 200,
        height: 200,
        surface: 'light',
      },
      client: {
        name: 'Ayudhya Capital Services (AYCAP)',
        logo: {
          src: imageAssetUrl('/company-logos/krungsri.png'),
          width: 200,
          height: 200,
          surface: 'dark',
        },
      },
      location: 'Bangkok',
      period: 'May 2024 — Jun 2025',
      employmentTypes: ['Contract'],
      highlights: [
        'Worked as an outsourced onsite engineer at Aycap, a subsidiary of Bank of Ayudhya.',
        "Built a Regulatory Data Transformation (RDT) feature that shows the bank's client credit card usage by categories defined by the Bank of Thailand (BOT).",
        'Built an RDT feature that allows users to download data in Excel format.',
        'Built integrations with other systems, including email and an encrypted system that notifies the Bank of Thailand of updates.',
      ],
      technologies: ['React', 'Go', 'Gin', 'Oracle'],
    },
    {
      role: 'Software Engineer',
      company: 'Nityo Infotech',
      companyLogo: {
        src: imageAssetUrl('/company-logos/nityo-infotech.svg'),
        width: 4096,
        height: 1973,
        surface: 'light',
      },
      client: {
        name: 'TISCO Bank',
        logo: {
          src: imageAssetUrl('/company-logos/tisco.svg'),
          width: 297,
          height: 119,
          surface: 'light',
        },
      },
      location: 'Bangkok',
      period: 'Jan 2023 — Dec 2023',
      employmentTypes: ['Contract'],
      highlights: [
        'Worked as an outsourced onsite engineer at TISCO Bank.',
        'Maintained the source code and updated it in response to requirement changes.',
      ],
      technologies: ['Node.js', 'MongoDB via internal API', 'Scala', 'Apache Spark', 'AWS'],
    },
    {
      role: 'Software Engineer Backend',
      company: 'LINE MAN Wongnai',
      companyLogo: {
        src: imageAssetUrl('/company-logos/line-man-wongnai.webp'),
        width: 555,
        height: 83,
        surface: 'light',
      },
      location: 'Bangkok',
      period: 'May 2022 — Jul 2022',
      employmentTypes: ['Permanent'],
      highlights: [
        'Maintained the restaurant system to reflect changing requirements and technical concerns.',
      ],
      technologies: ['Spring Boot 2.7.x', 'Go', 'Gin', 'gRPC', 'GraphQL', 'PostgreSQL', 'AWS'],
    },
    {
      role: 'Full-Stack Software Developer',
      company: 'WiseSoft',
      companyLogo: {
        src: imageAssetUrl('/company-logos/wisesoft.png'),
        width: 203,
        height: 203,
        surface: 'light',
      },
      location: 'Bangkok',
      period: 'Jan 2020 — Apr 2022',
      employmentTypes: ['Internship', 'Permanent'],
      highlights: [
        "Helped the team create a tax system that presents companies' paid-tax history according to Thailand's tax laws.",
      ],
      technologies: ['Angular 7.x', 'Spring Boot 2.7.x', 'Spring Batch', 'IBM Db2'],
    },
  ],
  education: {
    degree: 'Bachelor of Engineering (Computer Engineering)',
    institution: 'Prince of Songkla University',
    institutionLogo: {
      src: imageAssetUrl('/university-logos/prince-of-songkla-university.webp'),
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
  },
} as const satisfies ResumeProfile;
