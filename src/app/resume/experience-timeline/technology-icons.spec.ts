import { RESUME } from '../../data/resume/resume.data';
import {
  TECHNOLOGY_ICON_FALLBACK_LABELS,
  TECHNOLOGY_ICONS,
  resolveTechnologyIcon,
} from './technology-icons';

describe('technology icons', () => {
  const expectedIconPaths = {
    Codex: '/images/technology-icons/openai.svg',
    'Claude Code': '/images/technology-icons/claude-code.svg',
    MySQL: '/images/technology-icons/mysql.svg',
    PostgreSQL: '/images/technology-icons/postgresql.svg',
    Elasticsearch: '/images/technology-icons/elasticsearch.svg',
    Kubernetes: '/images/technology-icons/kubernetes.svg',
    Kafka: '/images/technology-icons/apache-kafka.svg',
    Redis: '/images/technology-icons/redis.svg',
    Bash: '/images/technology-icons/bash.svg',
    Confluence: '/images/technology-icons/confluence.svg',
    React: '/images/technology-icons/react.svg',
    Go: '/images/technology-icons/go.svg',
    Gin: '/images/technology-icons/gin.svg',
    Oracle: '/images/technology-icons/oracle.svg',
    'Node.js': '/images/technology-icons/nodejs.svg',
    'MongoDB via internal API': '/images/technology-icons/mongodb.svg',
    Scala: '/images/technology-icons/scala.svg',
    'Apache Spark': '/images/technology-icons/apache-spark.svg',
    AWS: '/images/technology-icons/aws.svg',
    'Spring Boot 2.7.x': '/images/technology-icons/spring.svg',
    gRPC: '/images/technology-icons/grpc.svg',
    GraphQL: '/images/technology-icons/graphql.svg',
    'Angular 7.x': '/images/technology-icons/angular.svg',
    'Spring Batch': '/images/technology-icons/spring.svg',
    'IBM Db2': '/images/technology-icons/ibm-db2.svg',
  } as const;

  it('maps every branded résumé technology to validated local metadata', () => {
    expect(
      Object.fromEntries(
        Object.entries(TECHNOLOGY_ICONS).map(([label, icon]) => [label, icon.src]),
      ),
    ).toEqual(expectedIconPaths);

    for (const icon of Object.values(TECHNOLOGY_ICONS)) {
      expect(icon.src).toMatch(/^\/images\/technology-icons\/[a-z0-9-]+\.svg$/);
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
