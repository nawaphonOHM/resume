import { inject, InjectionToken } from '@angular/core';
import type { TechnologyIconMetadata } from '../interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import { assetUrlBuilder } from './asset-url-builder.function.ts';
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
    const urlBuilder = inject(assetUrlBuilder);

    return {
      Codex: {
        src: urlBuilder.file('openai.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Claude Code': {
        src: urlBuilder.file('claude-code.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      MySQL: {
        src: urlBuilder.file('mysql.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      PostgreSQL: {
        src: urlBuilder.file('postgresql.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Elasticsearch: {
        src: urlBuilder.file('elasticsearch.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Kubernetes: {
        src: urlBuilder.file('kubernetes.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Kafka: {
        src: urlBuilder.file('apache-kafka.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Redis: {
        src: urlBuilder.file('redis.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Bash: {
        src: urlBuilder.file('bash.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Confluence: {
        src: urlBuilder.file('confluence.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      React: {
        src: urlBuilder.file('react.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Go: {
        src: urlBuilder.file('go.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Gin: {
        src: urlBuilder.file('gin.webp'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Oracle: {
        src: urlBuilder.file('oracle.svg'),
        width: 64,
        height: 64,
        surface: 'light',
      },
      'Node.js': {
        src: urlBuilder.file('nodejs.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      'MongoDB via internal API': {
        src: urlBuilder.file('mongodb.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      Scala: {
        src: urlBuilder.file('scala.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Apache Spark': {
        src: urlBuilder.file('apache-spark.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      AWS: {
        src: urlBuilder.file('aws.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Spring Boot 2.7.x': inject(SPRING_ICON),
      gRPC: {
        src: urlBuilder.file('grpc.svg'),
        width: 128,
        height: 128,
        surface: 'light',
      },
      GraphQL: {
        src: urlBuilder.file('graphql.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Angular 7.x': {
        src: urlBuilder.file('angular.svg'),
        width: 24,
        height: 24,
        surface: 'light',
      },
      'Spring Batch': inject(SPRING_ICON),
      'IBM Db2': {
        src: urlBuilder.file('ibm-db2.svg'),
        width: 32,
        height: 32,
        surface: 'light',
      },
    };
  },
});
