/**
 * Standard REST API envelope wrapper returned by the backend server.
 */
export interface ApiResponse<T> {
  /** Indicates whether the API operation succeeded. */
  readonly success: boolean;

  /** Domain payload encapsulated within the response envelope. */
  readonly data: T;

  /** ISO 8601 timestamp string representing when the response was generated. */
  readonly timestamp: string;
}
