import { describe, it, expect, vi, afterEach } from 'vitest';
import { getLocalDayString, isValidDayString } from './dateUtils';

describe('dateUtils', () => {
    describe('getLocalDayString', () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should return the correct local day string when offset is negative (ahead of UTC)', () => {
            // Mock Date.prototype.getTimezoneOffset to return -120 (UTC+2)
            vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);

            // Assume the UTC date is 2023-10-25T23:00:00.000Z
            // In UTC+2, the local time should be 2023-10-26T01:00:00.000
            // The function calculates: new Date(utc - (-120 * 60 * 1000))
            const testDate = new Date('2023-10-25T23:00:00.000Z');

            expect(getLocalDayString(testDate)).toBe('2023-10-26');
        });

        it('should return the correct local day string when offset is positive (behind UTC)', () => {
            // Mock Date.prototype.getTimezoneOffset to return 240 (UTC-4)
            vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);

            // Assume the UTC date is 2023-10-26T02:00:00.000Z
            // In UTC-4, the local time should be 2023-10-25T22:00:00.000
            const testDate = new Date('2023-10-26T02:00:00.000Z');

            expect(getLocalDayString(testDate)).toBe('2023-10-25');
        });

        it('should return the correct local day string when offset is zero (UTC)', () => {
            // Mock Date.prototype.getTimezoneOffset to return 0 (UTC)
            vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);

            const testDate = new Date('2023-10-25T15:00:00.000Z');

            expect(getLocalDayString(testDate)).toBe('2023-10-25');
        });

        it('should work with default parameter (current date)', () => {
            // Mock the system time and timezone offset to test default parameter predictably
            const mockDate = new Date('2024-05-15T12:00:00.000Z');
            vi.useFakeTimers();
            vi.setSystemTime(mockDate);
            vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);

            expect(getLocalDayString()).toBe('2024-05-15');

            vi.useRealTimers();
        });
    });

    describe('isValidDayString', () => {
        it('should return true for valid YYYY-MM-DD strings', () => {
            expect(isValidDayString('2023-10-25')).toBe(true);
            expect(isValidDayString('2000-01-01')).toBe(true);
            expect(isValidDayString('9999-12-31')).toBe(true);
        });

        it('should return false for invalid string formats', () => {
            // Incorrect separators
            expect(isValidDayString('2023/10/25')).toBe(false);
            expect(isValidDayString('2023.10.25')).toBe(false);

            // Incorrect order
            expect(isValidDayString('10-25-2023')).toBe(false);
            expect(isValidDayString('25-10-2023')).toBe(false);

            // Missing parts
            expect(isValidDayString('2023-10')).toBe(false);
            expect(isValidDayString('10-25')).toBe(false);

            // Extra parts
            expect(isValidDayString('2023-10-25-12')).toBe(false);
            expect(isValidDayString('2023-10-25T12:00:00Z')).toBe(false);

            // Not numbers
            expect(isValidDayString('YYYY-MM-DD')).toBe(false);
            expect(isValidDayString('202a-10-25')).toBe(false);

            // Incorrect lengths
            expect(isValidDayString('23-10-25')).toBe(false);
            expect(isValidDayString('2023-1-25')).toBe(false);
            expect(isValidDayString('2023-10-5')).toBe(false);

            // Empty string
            expect(isValidDayString('')).toBe(false);

            // Only spaces
            expect(isValidDayString('          ')).toBe(false);
        });
    });
});
