/**
 * Counts the days in the specified month and year, limiting to today if in the current month.
 * @param year The full year (e.g., 2024).
 * @param month The month (1 for January, 12 for December).
 * @returns The number of days to count in that month.
 */
export function countDaysInMonth(year: number, month: number): number {
    // Get the last day of the month by setting day to 0 for the next month
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    const today = new Date();

    // If the specified month/year is in the future, return 0
    if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)) {
        return 0;
    }

    // If the month and year are current, only count up to today's date
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
        return today.getDate();
    }

    // Otherwise, return the total days in the month
    return lastDayOfMonth;
}


/**
 * Counts the days in the specified year, limiting to today if it’s the current year.
 * @param year The full year (e.g., 2024).
 * @returns The number of days to count in that year.
 */
export function countDaysInYear(year: number): number {
    // Check if it's a leap year: 366 days if true, otherwise 365
    const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDaysInYear = isLeapYear(year) ? 366 : 365;

    const today = new Date();

    // If the specified year is in the future, return 0
    if (year > today.getFullYear()) {
        return 0;
    }

    // If the specified year is the current year, return up to today's day of the year
    if (year === today.getFullYear()) {
        const startOfYear = new Date(year, 0, 1); // January 1st
        const diffInMillis = today.getTime() - startOfYear.getTime();
        const dayOfYear = Math.floor(diffInMillis / (1000 * 60 * 60 * 24)) + 1;
        return dayOfYear;
    }

    // Otherwise, return the total days in the year
    return totalDaysInYear;
}