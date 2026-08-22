import { imageAssetUrl } from '../../../data/image-assets.ts';
import { BrandLogo } from '../../../helper/brand-logo/brand-logo.interface.ts';

/** Remote SVG metadata used to decorate a technology label. */
export interface TechnologyIconMetadata extends BrandLogo {
  /** Absolute Space URL generated from a compile-time constrained image path. */
  readonly src: string;
}

/** Shared artwork metadata for Spring products that use the same brand mark. */
const SPRING_ICON = {
  src: imageAssetUrl('/technology-icons/spring.svg'),
  width: 24,
  height: 24,
  surface: 'light',
} as const satisfies TechnologyIconMetadata;

/**
 * Validated remote icon registry keyed by exact résumé technology labels.
 * Dimensions and surface metadata keep each brand mark legible and correctly
 * proportioned in chips and zoom previews.
 */
export const TECHNOLOGY_ICONS = {
  Codex: {
    src: imageAssetUrl('/technology-icons/openai.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Claude Code': {
    src: imageAssetUrl('/technology-icons/claude-code.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  MySQL: {
    src: imageAssetUrl('/technology-icons/mysql.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  PostgreSQL: {
    src: imageAssetUrl('/technology-icons/postgresql.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Elasticsearch: {
    src: imageAssetUrl('/technology-icons/elasticsearch.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Kubernetes: {
    src: imageAssetUrl('/technology-icons/kubernetes.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Kafka: {
    src: imageAssetUrl('/technology-icons/apache-kafka.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Redis: {
    src: imageAssetUrl('/technology-icons/redis.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Bash: {
    src: imageAssetUrl('/technology-icons/bash.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Confluence: {
    src: imageAssetUrl('/technology-icons/confluence.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  React: {
    src: imageAssetUrl('/technology-icons/react.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Go: {
    src: imageAssetUrl('/technology-icons/go.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Gin: {
    src: imageAssetUrl('/technology-icons/gin.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Oracle: {
    src: imageAssetUrl('/technology-icons/oracle.svg'),
    width: 64,
    height: 64,
    surface: 'light',
  },
  'Node.js': {
    src: imageAssetUrl('/technology-icons/nodejs.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  'MongoDB via internal API': {
    src: imageAssetUrl('/technology-icons/mongodb.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  Scala: {
    src: imageAssetUrl('/technology-icons/scala.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Apache Spark': {
    src: imageAssetUrl('/technology-icons/apache-spark.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  AWS: {
    src: imageAssetUrl('/technology-icons/aws.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Spring Boot 2.7.x': SPRING_ICON,
  gRPC: {
    src: imageAssetUrl('/technology-icons/grpc.svg'),
    width: 128,
    height: 128,
    surface: 'light',
  },
  GraphQL: {
    src: imageAssetUrl('/technology-icons/graphql.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Angular 7.x': {
    src: imageAssetUrl('/technology-icons/angular.svg'),
    width: 24,
    height: 24,
    surface: 'light',
  },
  'Spring Batch': SPRING_ICON,
  'IBM Db2': {
    src: imageAssetUrl('/technology-icons/ibm-db2.svg'),
    width: 32,
    height: 32,
    surface: 'light',
  },
} as const satisfies Readonly<Record<string, TechnologyIconMetadata>>;

/** Known résumé labels intentionally rendered without a suitable brand mark. */
export const TECHNOLOGY_ICON_FALLBACK_LABELS = ['REST APIs', 'Caffeine'] as const;

const technologyIconsByLabel: Readonly<Record<string, TechnologyIconMetadata | undefined>> =
  TECHNOLOGY_ICONS;

/**
 * Finds icon metadata for an exact, case-sensitive technology label.
 *
 * @param label - Display label to look up without normalization.
 * @returns Metadata for an own registry entry, or `undefined` for unknown and
 * intentionally unbranded labels so callers can render a text-only fallback.
 */
export function resolveTechnologyIcon(label: string): TechnologyIconMetadata | undefined {
  return Object.hasOwn(technologyIconsByLabel, label) ? technologyIconsByLabel[label] : undefined;
}
