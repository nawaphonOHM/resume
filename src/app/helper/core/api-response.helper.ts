import type { ApiResponse } from '../interface/api-response/api-response.interface.ts';

/**
 * Checks whether an unknown payload is a full backend envelope.
 *
 * @remarks
 * Requires `data`, a boolean `success`, and a string `timestamp`, so that a raw
 * domain object which merely contains `data` or `success` is not unwrapped.
 */
function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'success' in value &&
    'timestamp' in value &&
    typeof value.success === 'boolean' &&
    typeof value.timestamp === 'string'
  );
}

/**
 * Defensive parser function to extract domain data from an API envelope or raw input.
 *
 * @remarks
 * Accepts `unknown` so it can be passed directly as an `httpResource` `parse` option.
 * If the payload is a full `ApiResponse<T>` envelope, the inner `data` payload is returned.
 * Otherwise, the input is returned as-is for graceful fallback and backward compatibility.
 * The input is never mutated.
 *
 * @typeParam T - The expected domain data type.
 * @param response - Payload received from the network or static fallback, typed as `unknown`.
 * @returns The inner `data` payload if wrapped in an `ApiResponse`, or the input as-is.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T selects the domain type at call sites (e.g. parse: (raw) => unwrapApiResponse<T>(raw))
export function unwrapApiResponse<T>(response: unknown): T {
  if (isApiResponse(response)) {
    return response.data as T;
  }
  return response as T;
}
