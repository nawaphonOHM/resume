/** Verifies exact technology-label coverage, remote assets, and fallback policy. */
import { IMAGE_ASSET_ORIGIN } from '../../data/image-assets';
import { RESUME } from '../../data/resume/resume.data';
import {
  TECHNOLOGY_ICON_FALLBACK_LABELS,
  TECHNOLOGY_ICONS,
  resolveTechnologyIcon,
} from './technology-icons';

describe('technology icons', () => {
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
    Gin: 'https://resume-images.ohm-mho.space/technology-icons/gin.svg',
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
        Object.entries(TECHNOLOGY_ICONS).map(([label, icon]) => [label, icon.src]),
      ),
    ).toEqual(expectedIconPaths);

    for (const icon of Object.values(TECHNOLOGY_ICONS)) {
      const url = new URL(icon.src);
      expect(url.origin).toBe(IMAGE_ASSET_ORIGIN);
      expect(url.pathname).toMatch(/^\/technology-icons\/[a-z0-9-]+\.svg$/);
      expect(Number.isInteger(icon.width)).toBe(true);
      expect(Number.isInteger(icon.height)).toBe(true);
      expect(icon.width).toBeGreaterThan(0);
      expect(icon.height).toBeGreaterThan(0);
      expect(['light', 'dark']).toContain(icon.surface);
    }
  });

  it('categorizes every exact résumé label without changing its string data', () => {
    const technologies = RESUME.experience.flatMap(({ technologies }) => technologies);
    const uniqueTechnologies = [...new Set(technologies)];

    expect(technologies.every((technology) => typeof technology === 'string')).toBe(true);
    expect(uniqueTechnologies).toHaveLength(27);
    expect(
      uniqueTechnologies.filter(
        (technology) =>
          resolveTechnologyIcon(technology) === undefined &&
          !TECHNOLOGY_ICON_FALLBACK_LABELS.includes(
            technology as (typeof TECHNOLOGY_ICON_FALLBACK_LABELS)[number],
          ),
      ),
    ).toEqual([]);
  });

  it('uses intentional fallbacks for labels without suitable brand marks', () => {
    expect(TECHNOLOGY_ICON_FALLBACK_LABELS).toEqual(['REST APIs', 'Caffeine']);
    expect(resolveTechnologyIcon('REST APIs')).toBeUndefined();
    expect(resolveTechnologyIcon('Caffeine')).toBeUndefined();
    expect(resolveTechnologyIcon('Unknown technology')).toBeUndefined();
    expect(resolveTechnologyIcon('toString')).toBeUndefined();
  });

  it('reuses one Spring icon definition for related labels', () => {
    expect(resolveTechnologyIcon('Spring Boot 2.7.x')).toBe(resolveTechnologyIcon('Spring Batch'));
  });
});
