import { inject, InjectionToken } from '@angular/core';
import { TechnologyIconMetadata } from '../interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import { imageAssetUrl } from './image-asset-url.function.ts';
import { SPRING_ICON } from './spring-icon.variable.ts';

/**
 * Validated remote icon registry keyed by exact résumé technology labels.
 * Dimensions and surface metadata keep each brand mark legible and correctly
 * proportioned in chips and zoom previews.
 */
export const TECHNOLOGY_ICONS = new InjectionToken<
  Readonly<Record<string, TechnologyIconMetadata>>
>('TECHNOLOGY_ICONS', {
  providedIn: 'root',
  factory: () => {
    const imageAssetUrlToken = inject(imageAssetUrl);

    return {
      Codex: {
        src: imageAssetUrlToken + '/technology-icons/openai.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Claude Code': {
        src: imageAssetUrlToken + '/technology-icons/claude-code.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      MySQL: {
        src: imageAssetUrlToken + '/technology-icons/mysql.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      PostgreSQL: {
        src: imageAssetUrlToken + '/technology-icons/postgresql.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Elasticsearch: {
        src: imageAssetUrlToken + '/technology-icons/elasticsearch.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Kubernetes: {
        src: imageAssetUrlToken + '/technology-icons/kubernetes.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Kafka: {
        src: imageAssetUrlToken + '/technology-icons/apache-kafka.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Redis: {
        src: imageAssetUrlToken + '/technology-icons/redis.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Bash: {
        src: imageAssetUrlToken + '/technology-icons/bash.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Confluence: {
        src: imageAssetUrlToken + '/technology-icons/confluence.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      React: {
        src: imageAssetUrlToken + '/technology-icons/react.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Go: {
        src: imageAssetUrlToken + '/technology-icons/go.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Gin: {
        src: imageAssetUrlToken + '/technology-icons/gin.webp',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Oracle: {
        src: imageAssetUrlToken + '/technology-icons/oracle.svg',
        width: 64,
        height: 64,
        surface: 'light',
      },
      'Node.js': {
        src: imageAssetUrlToken + '/technology-icons/nodejs.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      'MongoDB via internal API': {
        src: imageAssetUrlToken + '/technology-icons/mongodb.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      Scala: {
        src: imageAssetUrlToken + '/technology-icons/scala.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Apache Spark': {
        src: imageAssetUrlToken + '/technology-icons/apache-spark.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      AWS: {
        src: imageAssetUrlToken + '/technology-icons/aws.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Spring Boot 2.7.x': inject(SPRING_ICON),
      gRPC: {
        src: imageAssetUrlToken + '/technology-icons/grpc.svg',
        width: 128,
        height: 128,
        surface: 'light',
      },
      GraphQL: {
        src: imageAssetUrlToken + '/technology-icons/graphql.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Angular 7.x': {
        src: imageAssetUrlToken + '/technology-icons/angular.svg',
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Spring Batch': inject(SPRING_ICON),
      'IBM Db2': {
        src: imageAssetUrlToken + '/technology-icons/ibm-db2.svg',
        width: 32,
        height: 32,
        surface: 'light',
      },
    };
  },
});
