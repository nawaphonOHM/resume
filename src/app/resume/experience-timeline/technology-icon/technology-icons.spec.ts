/** Verifies exact technology-label coverage, remote assets, and fallback policy. */
import { TestBed } from '@angular/core/testing';
import { resolveTechnologyIcon } from '../../../helper/injection-token/resolve-technology-icon.function.ts';
import { TECHNOLOGY_ICONS } from '../../../helper/injection-token/technology-icons.variable.ts';
import type { TechnologyIconMetadata } from '../../../helper/interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import type { ResumeProfile } from '../../../helper/interface/resume-profile/resume-profile.interface.ts';
import { resumeProfileFixture } from '../../../../../test/fixtures/resume-profile.ts';

const TECHNOLOGY_ICON_FALLBACK_LABELS = ['Example API', 'Example Utility'] as const;

describe('technology icons', () => {
  let resume: ResumeProfile;
  let technologyIcons: Readonly<Record<string, TechnologyIconMetadata>>;
  let resolveIcon: (label: string) => TechnologyIconMetadata | undefined;

  beforeEach(() => {
    resume = resumeProfileFixture;
    technologyIcons = TestBed.inject(TECHNOLOGY_ICONS);
    resolveIcon = TestBed.inject(resolveTechnologyIcon);
  });

  /** Independent label-to-asset contract for every branded technology. */
  const expectedIconPaths = {
    Codex: 'https://ohm-mho.space/assets/openai.svg',
    'Claude Code': 'https://ohm-mho.space/assets/claude-code.svg',
    MySQL: 'https://ohm-mho.space/assets/mysql.svg',
    PostgreSQL: 'https://ohm-mho.space/assets/postgresql.svg',
    Elasticsearch: 'https://ohm-mho.space/assets/elasticsearch.svg',
    Kubernetes: 'https://ohm-mho.space/assets/kubernetes.svg',
    Kafka: 'https://ohm-mho.space/assets/apache-kafka.svg',
    Redis: 'https://ohm-mho.space/assets/redis.svg',
    Bash: 'https://ohm-mho.space/assets/bash.svg',
    Confluence: 'https://ohm-mho.space/assets/confluence.svg',
    React: 'https://ohm-mho.space/assets/react.svg',
    Go: 'https://ohm-mho.space/assets/go.svg',
    Gin: 'https://ohm-mho.space/assets/gin.webp',
    Oracle: 'https://ohm-mho.space/assets/oracle.svg',
    'Node.js': 'https://ohm-mho.space/assets/nodejs.svg',
    'MongoDB via internal API': 'https://ohm-mho.space/assets/mongodb.svg',
    Scala: 'https://ohm-mho.space/assets/scala.svg',
    'Apache Spark': 'https://ohm-mho.space/assets/apache-spark.svg',
    AWS: 'https://ohm-mho.space/assets/aws.svg',
    'Spring Boot 2.7.x': 'https://ohm-mho.space/assets/spring.svg',
    gRPC: 'https://ohm-mho.space/assets/grpc.svg',
    GraphQL: 'https://ohm-mho.space/assets/graphql.svg',
    'Angular 7.x': 'https://ohm-mho.space/assets/angular.svg',
    'Spring Batch': 'https://ohm-mho.space/assets/spring.svg',
    'IBM Db2': 'https://ohm-mho.space/assets/ibm-db2.svg',
  } as const;

  it('maps every branded résumé technology to validated remote metadata', () => {
    expect(
      Object.fromEntries(Object.entries(technologyIcons).map(([label, icon]) => [label, icon.src])),
    ).toEqual(expectedIconPaths);

    for (const icon of Object.values(technologyIcons)) {
      expect(icon.src).toMatch(/^https:\/\/ohm-mho\.space\/assets\/[a-z0-9-]+\.(?:svg|webp)$/);
      expect(Number.isInteger(icon.width)).toBe(true);
      expect(Number.isInteger(icon.height)).toBe(true);
      expect(icon.width).toBeGreaterThan(0);
      expect(icon.height).toBeGreaterThan(0);
      expect(['light', 'dark']).toContain(icon.surface);
    }
  });

  it('categorizes branded and fallback labels used by the synthetic fixture', () => {
    const technologies = resume.experience.flatMap(({ technologies }) => technologies);
    const uniqueTechnologies = [...new Set(technologies)];

    expect(technologies.every((technology) => typeof technology === 'string')).toBe(true);
    expect(uniqueTechnologies).toEqual(
      expect.arrayContaining(['Angular 7.x', 'PostgreSQL', ...TECHNOLOGY_ICON_FALLBACK_LABELS]),
    );
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
    expect(TECHNOLOGY_ICON_FALLBACK_LABELS).toEqual(['Example API', 'Example Utility']);
    expect(resolveIcon('Example API')).toBeUndefined();
    expect(resolveIcon('Example Utility')).toBeUndefined();
    expect(resolveIcon('Unknown technology')).toBeUndefined();
    expect(resolveIcon('toString')).toBeUndefined();
  });

  it('reuses one Spring icon definition for related labels', () => {
    expect(resolveIcon('Spring Boot 2.7.x')).toBe(resolveIcon('Spring Batch'));
  });
});
