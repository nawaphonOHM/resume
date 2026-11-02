/**
 * Unit tests for unwrapApiResponse utility.
 */
import { describe, expect, it } from 'vitest';
import { unwrapApiResponse } from './api-response.helper.ts';
import type { ApiResponse } from '../interface/api-response/api-response.interface.ts';

describe('unwrapApiResponse', () => {
  describe('enveloped responses', () => {
    it('extracts string data from a valid ApiResponse envelope', () => {
      const envelope: ApiResponse<string> = {
        success: true,
        data: 'Jane Doe',
        timestamp: '2026-11-02T19:44:20Z',
      };

      const result = unwrapApiResponse<string>(envelope);

      expect(result).toBe('Jane Doe');
    });

    it('extracts array data from a valid ApiResponse envelope', () => {
      const summaries = ['Summary 1', 'Summary 2'];
      const envelope: ApiResponse<readonly string[]> = {
        success: true,
        data: summaries,
        timestamp: '2026-11-02T19:44:20Z',
      };

      const result = unwrapApiResponse<readonly string[]>(envelope);

      expect(result).toEqual(summaries);
      expect(result).toBe(summaries);
    });

    it('extracts nested object data from a valid ApiResponse envelope', () => {
      const details = {
        location: 'Bangkok, Thailand',
        phoneLabel: 'Available on request' as const,
        email: 'jane@example.com',
        nationality: 'Thai',
        birthDate: '1 January 1995',
      };
      const envelope: ApiResponse<typeof details> = {
        success: true,
        data: details,
        timestamp: '2026-11-02T19:44:20Z',
      };

      const result = unwrapApiResponse<typeof details>(envelope);

      expect(result).toEqual(details);
      expect(result).toBe(details);
    });

    it('extracts falsy primitive values correctly when present in envelope data', () => {
      expect(
        unwrapApiResponse<number>({
          success: true,
          data: 0,
          timestamp: '2026-11-02T19:44:20Z',
        }),
      ).toBe(0);

      expect(
        unwrapApiResponse<string>({
          success: true,
          data: '',
          timestamp: '2026-11-02T19:44:20Z',
        }),
      ).toBe('');

      expect(
        unwrapApiResponse<boolean>({
          success: true,
          data: false,
          timestamp: '2026-11-02T19:44:20Z',
        }),
      ).toBe(false);

      expect(
        unwrapApiResponse<null>({
          success: true,
          data: null,
          timestamp: '2026-11-02T19:44:20Z',
        }),
      ).toBeNull();
    });
  });

  describe('direct / un-enveloped fallback payloads', () => {
    it('returns raw string as-is when not wrapped in envelope', () => {
      const raw = 'Direct String';
      expect(unwrapApiResponse<string>(raw)).toBe('Direct String');
    });

    it('returns raw array as-is when not wrapped in envelope', () => {
      const rawArray = ['Skill 1', 'Skill 2'];
      expect(unwrapApiResponse<readonly string[]>(rawArray)).toBe(rawArray);
    });

    it('returns raw plain object as-is when not wrapped in envelope', () => {
      const rawObject = { custom: 'value', nested: { a: 1 } };
      expect(unwrapApiResponse<typeof rawObject>(rawObject)).toBe(rawObject);
    });

    it('returns object with data but missing success as-is', () => {
      const objWithoutSuccess = { data: 'some data' };
      expect(unwrapApiResponse<typeof objWithoutSuccess>(objWithoutSuccess)).toBe(
        objWithoutSuccess,
      );
    });

    it('returns object with success but missing data as-is', () => {
      const objWithoutData = { success: true };
      expect(unwrapApiResponse<typeof objWithoutData>(objWithoutData)).toBe(objWithoutData);
    });

    it('returns null and undefined as-is', () => {
      expect(unwrapApiResponse<null>(null)).toBeNull();
      const undefinedResult = unwrapApiResponse<unknown>(undefined);
      expect(undefinedResult).toBeUndefined();
    });

    it('returns primitive numbers and booleans as-is', () => {
      expect(unwrapApiResponse<number>(42)).toBe(42);
      expect(unwrapApiResponse<boolean>(true)).toBe(true);
      expect(unwrapApiResponse<boolean>(false)).toBe(false);
    });

    it('returns object with data and success but missing timestamp as-is', () => {
      const ambiguous = { data: 'some data', success: true };
      expect(unwrapApiResponse<typeof ambiguous>(ambiguous)).toBe(ambiguous);
    });

    it('returns object with data and non-boolean success as-is', () => {
      const ambiguous = { data: 1, success: 'yes', timestamp: '2026-11-02T19:44:20Z' };
      expect(unwrapApiResponse<typeof ambiguous>(ambiguous)).toBe(ambiguous);
    });

    it('returns object with data, success and non-string timestamp as-is', () => {
      const ambiguous = { data: 1, success: true, timestamp: 1730576660 };
      expect(unwrapApiResponse<typeof ambiguous>(ambiguous)).toBe(ambiguous);
    });
  });

  describe('unknown-typed input (as supplied by httpResource parse)', () => {
    it('unwraps a JSON-parsed envelope typed as unknown', () => {
      const raw: unknown = JSON.parse(
        '{"success":true,"data":"Nawaphon Isarathanachaikul","timestamp":"2026-11-02T19:44:20Z"}',
      );

      expect(unwrapApiResponse<string>(raw)).toBe('Nawaphon Isarathanachaikul');
    });

    it('returns a JSON-parsed raw array typed as unknown as-is', () => {
      const raw: unknown = JSON.parse('["Skill 1","Skill 2"]');

      expect(unwrapApiResponse<readonly string[]>(raw)).toEqual(['Skill 1', 'Skill 2']);
    });

    it('does not mutate the envelope passed as unknown', () => {
      const raw: unknown = {
        success: true,
        data: ['Summary 1'],
        timestamp: '2026-11-02T19:44:20Z',
      };
      const snapshot = JSON.stringify(raw);

      unwrapApiResponse<readonly string[]>(raw);

      expect(JSON.stringify(raw)).toBe(snapshot);
    });
  });
});
