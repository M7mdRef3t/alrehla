/**
 * Returns a local date string in YYYY-MM-DD format.
 * This avoids UTC offset issues where Date.toISOString() flips the date too early or late.
 */
export function getLocalDayString(date: Date = new Date()): string {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
}

/**
 * Validates if a string is a valid YYYY-MM-DD date.
 */
export function isValidDayString(day: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(day);
}
