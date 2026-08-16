import type { BrandLogo } from '../../model/resume/resume.model';

export interface TechnologyIconMetadata extends BrandLogo {
  readonly src: `/images/technology-icons/${string}.svg`;
}

const SPRING_ICON = {
  src: '/images/technology-icons/spring.svg',
  width: 24,
  height: 24,
  surface: 'light',
} as const satisfies TechnologyIconMetadata;

export const TECHNOLOGY_ICONS = {
  Codex: {
    src: '/images/technology-icons/openai.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Claude Code': {
    src: '/images/technology-icons/claude-code.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  MySQL: {
    src: '/images/technology-icons/mysql.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  PostgreSQL: {
    src: '/images/technology-icons/postgresql.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Elasticsearch: {
    src: '/images/technology-icons/elasticsearch.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Kubernetes: {
    src: '/images/technology-icons/kubernetes.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Kafka: {
    src: '/images/technology-icons/apache-kafka.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Redis: {
    src: '/images/technology-icons/redis.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Bash: {
    src: '/images/technology-icons/bash.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Confluence: {
    src: '/images/technology-icons/confluence.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  React: {
    src: '/images/technology-icons/react.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Go: {
    src: '/images/technology-icons/go.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Gin: {
    src: '/images/technology-icons/gin.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Oracle: {
    src: '/images/technology-icons/oracle.svg',
    width: 64,
    height: 64,
    surface: 'light',
  },
  'Node.js': {
    src: '/images/technology-icons/nodejs.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  'MongoDB via internal API': {
    src: '/images/technology-icons/mongodb.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  Scala: {
    src: '/images/technology-icons/scala.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Apache Spark': {
    src: '/images/technology-icons/apache-spark.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  AWS: {
    src: '/images/technology-icons/aws.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Spring Boot 2.7.x': SPRING_ICON,
  gRPC: {
    src: '/images/technology-icons/grpc.svg',
    width: 128,
    height: 128,
    surface: 'light',
  },
  GraphQL: {
    src: '/images/technology-icons/graphql.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Angular 7.x': {
    src: '/images/technology-icons/angular.svg',
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Spring Batch': SPRING_ICON,
  'IBM Db2': {
    src: '/images/technology-icons/ibm-db2.svg',
    width: 32,
    height: 32,
    surface: 'light',
  },
} as const satisfies Readonly<Record<string, TechnologyIconMetadata>>;

export const TECHNOLOGY_ICON_FALLBACK_LABELS = ['REST APIs', 'Caffeine'] as const;

const technologyIconsByLabel: Readonly<Record<string, TechnologyIconMetadata | undefined>> =
  TECHNOLOGY_ICONS;

export function resolveTechnologyIcon(label: string): TechnologyIconMetadata | undefined {
  return Object.hasOwn(technologyIconsByLabel, label) ? technologyIconsByLabel[label] : undefined;
}
