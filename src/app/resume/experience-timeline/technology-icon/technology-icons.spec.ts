/** Verifies exact technology-label coverage, remote assets, and fallback policy. */
import { TestBed } from '@angular/core/testing';
import { IMAGE_ASSET_ORIGIN } from '../../../helper/injection-token/image-asset-origin.variable.ts';
import { resolveTechnologyIcon } from '../../../helper/injection-token/resolve-technology-icon.function.ts';
import { resumeData } from '../../../helper/injection-token/resume.data.ts';
import { TECHNOLOGY_ICONS } from '../../../helper/injection-token/technology-icons.variable.ts';
import type { TechnologyIconMetadata } from '../../../helper/interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import type { ResumeProfile } from '../../../helper/interface/resume-profile/resume-profile.interface.ts';

const TECHNOLOGY_ICON_FALLBACK_LABELS = ['REST APIs', 'Caffeine'] as const;

describe('technology icons', () => {
  let imageAssetOrigin: string;
  let resume: ResumeProfile;
  let technologyIcons: Readonly<Record<string, TechnologyIconMetadata>>;
  let resolveIcon: (label: string) => TechnologyIconMetadata | undefined;

  beforeEach(() => {
    imageAssetOrigin = TestBed.inject(IMAGE_ASSET_ORIGIN);
    resume = TestBed.inject(resumeData);
    technologyIcons = TestBed.inject(TECHNOLOGY_ICONS);
    resolveIcon = TestBed.inject(resolveTechnologyIcon);
  });

  /** Independent label-to-asset contract for every branded technology. */
  const expectedIconPaths = {
    Codex: 'https://resume-images.ohm-mho.space/technology-icons/openai.svg',
    'Claude Code': 'https://resume-images.ohm-mho.space/technology-icons/claude-code.svg',
    MySQL: 'https://resume-images.ohm-mho.space/technology-icons/mysql.svg',
    PostgreSQL: 'https://resume-images.ohm-mho.space/technology-icons/postgresql.svg',
    Elasticsearch: 'https://resume-images.ohm-mho.space/technology-icons/elasticsearch.svg',
    Kubernetes: 'https://resume-images.ohm-mho.space/technology-icons/kubernetes.svg',
    Kafka: 'https://resume-images.ohm-mho.space/technology-icons/apache-kafka.svg',
    Redis: 'https://resume-images.ohm-mho.space/technology-icons/redis.svg',
    Bash: 'https://resume-images.ohm-mho.space/technology-icons/bash.svg',
    Confluence: 'https://resume-images.ohm-mho.space/technology-icons/confluence.svg',
    React: 'https://resume-images.ohm-mho.space/technology-icons/react.svg',
    Go: 'https://resume-images.ohm-mho.space/technology-icons/go.svg',
    Gin: 'https://resume-images.ohm-mho.space/technology-icons/gin.webp',
    Oracle: 'https://resume-images.ohm-mho.space/technology-icons/oracle.svg',
    'Node.js': 'https://resume-images.ohm-mho.space/technology-icons/nodejs.svg',
    'MongoDB via internal API': 'https://resume-images.ohm-mho.space/technology-icons/mongodb.svg',
    Scala: 'https://resume-images.ohm-mho.space/technology-icons/scala.svg',
    'Apache Spark': 'https://resume-images.ohm-mho.space/technology-icons/apache-spark.svg',
    AWS: 'https://resume-images.ohm-mho.space/technology-icons/aws.svg',
    'Spring Boot 2.7.x': 'https://resume-images.ohm-mho.space/technology-icons/spring.svg',
    gRPC: 'https://resume-images.ohm-mho.space/technology-icons/grpc.svg',
    GraphQL: 'https://resume-images.ohm-mho.space/technology-icons/graphql.svg',
    'Angular 7.x': 'https://resume-images.ohm-mho.space/technology-icons/angular.svg',
    'Spring Batch': 'https://resume-images.ohm-mho.space/technology-icons/spring.svg',
    'IBM Db2': 'https://resume-images.ohm-mho.space/technology-icons/ibm-db2.svg',
  } as const;

  it('maps every branded résumé technology to validated remote metadata', () => {
    expect(
      Object.fromEntries(
        Object.entries(technologyIcons).map(([label, icon]) => [label, icon.src]),
      ),
    ).toEqual(expectedIconPaths);

    for (const icon of Object.values(technologyIcons)) {
      const url = new URL(icon.src);
      expect(url.origin).toBe(imageAssetOrigin);
      expect(url.pathname).toMatch(/^\/technology-icons\/[a-z0-9-]+\.(?:svg|webp)$/);
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
