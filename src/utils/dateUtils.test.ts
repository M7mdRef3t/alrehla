import { describe, it, expect, vi, afterEach } from 'vitest';
import { getLocalDayString, isValidDayString } from './dateUtils';

describe('dateUtils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getLocalDayString', () => {
    it('returns correct local day string when timezone offset is 0', () => {
      const date = new Date('2023-10-15T12:00:00Z');
      vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(0);

      const result = getLocalDayString(date);
      expect(result).toBe('2023-10-15');
    });

    it('returns correct local day string when timezone offset is positive (behind UTC)', () => {
      // e.g., PST is UTC-8, so offset is 480 minutes
      const date = new Date('2023-10-16T04:00:00Z'); // It's 4 AM UTC on Oct 16
      vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(480); // 8 hours behind, so local time is 2023-10-15 20:00:00

      const result = getLocalDayString(date);
      expect(result).toBe('2023-10-15');
    });

    it('returns correct local day string when timezone offset is negative (ahead of UTC)', () => {
      // e.g., JST is UTC+9, so offset is -540 minutes
      const date = new Date('2023-10-15T20:00:00Z'); // It's 8 PM UTC on Oct 15
      vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(-540); // 9 hours ahead, so local time is 2023-10-16 05:00:00

      const result = getLocalDayString(date);
      expect(result).toBe('2023-10-16');
    });

    it('uses current date if no date is provided', () => {
      const result = getLocalDayString();
      expect(isValidDayString(result)).toBe(true);
    });
  });

  describe('isValidDayString', () => {
    it('returns true for valid YYYY-MM-DD strings', () => {
      expect(isValidDayString('2023-10-15')).toBe(true);
      expect(isValidDayString('2000-01-01')).toBe(true);
      expect(isValidDayString('9999-12-31')).toBe(true);
    });

    it('returns false for invalid strings', () => {
      expect(isValidDayString('2023/10/15')).toBe(false);
      expect(isValidDayString('15-10-2023')).toBe(false);
      expect(isValidDayString('2023-1-5')).toBe(false); // missing leading zeros
      expect(isValidDayString('2023-10')).toBe(false); // missing day
      expect(isValidDayString('2023-10-15T12:00:00Z')).toBe(false); // includes time
      expect(isValidDayString('invalid date')).toBe(false);
      expect(isValidDayString('')).toBe(false);
    });
  });
});
