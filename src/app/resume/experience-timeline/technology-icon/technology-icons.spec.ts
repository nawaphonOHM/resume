/** Verifies exact technology-label coverage, remote assets, and fallback policy. */
import { TestBed } from '@angular/core/testing';
import { resolveTechnologyIcon } from '../../../helper/injection-token/resolve-technology-icon.function.ts';
import { resumeData } from '../../../helper/injection-token/resume.data.ts';
import { TECHNOLOGY_ICONS } from '../../../helper/injection-token/technology-icons.variable.ts';
import type { TechnologyIconMetadata } from '../../../helper/interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import type { ResumeProfile } from '../../../helper/interface/resume-profile/resume-profile.interface.ts';

const TECHNOLOGY_ICON_FALLBACK_LABELS = ['REST APIs', 'Caffeine'] as const;

describe('technology icons', () => {
  let resume: ResumeProfile;
  let technologyIcons: Readonly<Record<string, TechnologyIconMetadata>>;
  let resolveIcon: (label: string) => TechnologyIconMetadata | undefined;

  beforeEach(() => {
    resume = TestBed.inject(resumeData);
    technologyIcons = TestBed.inject(TECHNOLOGY_ICONS);
    resolveIcon = TestBed.inject(resolveTechnologyIcon);
  });

  /** Independent label-to-asset contract for every branded technology. */
  const expectedIconPaths = {
    Codex: '/technology-icons/openai.svg',
    'Claude Code': '/technology-icons/claude-code.svg',
    MySQL: '/technology-icons/mysql.svg',
    PostgreSQL: '/technology-icons/postgresql.svg',
    Elasticsearch: '/technology-icons/elasticsearch.svg',
    Kubernetes: '/technology-icons/kubernetes.svg',
    Kafka: '/technology-icons/apache-kafka.svg',
    Redis: '/technology-icons/redis.svg',
    Bash: '/technology-icons/bash.svg',
    Confluence: '/technology-icons/confluence.svg',
    React: '/technology-icons/react.svg',
    Go: '/technology-icons/go.svg',
    Gin: '/technology-icons/gin.webp',
    Oracle: '/technology-icons/oracle.svg',
    'Node.js': '/technology-icons/nodejs.svg',
    'MongoDB via internal API': '/technology-icons/mongodb.svg',
    Scala: '/technology-icons/scala.svg',
    'Apache Spark': '/technology-icons/apache-spark.svg',
    AWS: '/technology-icons/aws.svg',
    'Spring Boot 2.7.x': '/technology-icons/spring.svg',
    gRPC: '/technology-icons/grpc.svg',
    GraphQL: '/technology-icons/graphql.svg',
    'Angular 7.x': '/technology-icons/angular.svg',
    'Spring Batch': '/technology-icons/spring.svg',
    'IBM Db2': '/technology-icons/ibm-db2.svg',
  } as const;

  it('maps every branded résumé technology to validated remote metadata', () => {
    expect(
      Object.fromEntries(Object.entries(technologyIcons).map(([label, icon]) => [label, icon.src])),
    ).toEqual(expectedIconPaths);

    for (const icon of Object.values(technologyIcons)) {
      expect(icon.src).toMatch(/^\/technology-icons\/[a-z0-9-]+\.(?:svg|webp)$/);
      expect(Number.isInteger(icon.width)).toBe(true);
      expect(Number.isInteger(icon.height)).toBe(true);
      expect(icon.width).toBeGreaterThan(0);
      expect(icon.height).toBeGreaterThan(0);
      expect(['light', 'dark']).toContain(icon.surface);
    }
  });

  it('categorizes every exact résumé label without changing its string data', () => {
    const technologies = resume.experience.flatMap(({ technologies }) => technologies);
    const uniqueTechnologies = [...new Set(technologies)];

    expect(technologies.every((technology) => typeof technology === 'string')).toBe(true);
    expect(uniqueTechnologies).toHaveLength(27);
    expect(
      uniqueTechnologies.filter(
        (technology) =>
          resolveIcon(technology) === undefined &&
          !TECHNOLOGY_ICON_FALLBACK_LABELS.includes(
            technology as (typeof TECHNOLOGY_ICON_FALLBACK_LABELS)[number],
          ),
      ),
    ).toEqual([]);
  });

  it('uses intentional fallbacks for labels without suitable brand marks', () => {
    expect(TECHNOLOGY_ICON_FALLBACK_LABELS).toEqual(['REST APIs', 'Caffeine']);
    expect(resolveIcon('REST APIs')).toBeUndefined();
    expect(resolveIcon('Caffeine')).toBeUndefined();
    expect(resolveIcon('Unknown technology')).toBeUndefined();
    expect(resolveIcon('toString')).toBeUndefined();
  });

  it('reuses one Spring icon definition for related labels', () => {
    expect(resolveIcon('Spring Boot 2.7.x')).toBe(resolveIcon('Spring Batch'));
  });
});
