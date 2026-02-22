/**
 * Date Tracking Utilities
 *
 * Provides calendar-date awareness for the workout program.
 * Every week is anchored to a real Monday so the system can:
 *   1. Auto-advance weeks based on elapsed time.
 *   2. Back-calculate calendar dates for any historical week.
 *   3. Know the exact calendar date for any (week, dayName) pair.
 */

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return a Date set to midnight in the local timezone. */
function stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days between two dates (a − b). */
function daysBetween(a: Date, b: Date): number {
    return Math.round((stripTime(a).getTime() - stripTime(b).getTime()) / 86_400_000);
}

/** Add `n` days to a date (returns new Date). */
function addDays(d: Date, n: number): Date {
    const out = new Date(d);
    out.setDate(out.getDate() + n);
    return out;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Return the Monday on or before `date`. */
export function getMondayOfWeek(date: Date): Date {
    const d = stripTime(date);
    // JS: Sun = 0, Mon = 1 … Sat = 6
    const jsDay = d.getDay();
    const offset = jsDay === 0 ? -6 : 1 - jsDay; // Mon of same week
    return addDays(d, offset);
}

/**
 * Return the calendar start (Monday) and end (Sunday) for a given
 * absolute `weekNumber` relative to a `programStartDate`.
 *
 * Week 1 starts on `programStartDate` (which should be a Monday).
 */
export function getWeekDates(weekNumber: number, programStartDate: Date | string) {
    const start = typeof programStartDate === "string" ? new Date(programStartDate + "T00:00:00") : stripTime(programStartDate);
    const weekOffset = weekNumber - 1;
    const weekStart = addDays(start, weekOffset * 7);

    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return {
        start: weekStart,
        end: addDays(weekStart, 6),
        days,
    };
}

/**
 * Given a specific `weekNumber` and `dayName` (e.g. "Wednesday"),
 * return the calendar Date for that day.
 */
export function getDateForWeekDay(weekNumber: number, dayName: string, programStartDate: Date | string): Date {
    const dayIndex = DAY_NAMES.indexOf(dayName as typeof DAY_NAMES[number]);
    if (dayIndex === -1) throw new Error(`Invalid day name: ${dayName}`);
    const { start } = getWeekDates(weekNumber, programStartDate);
    return addDays(start, dayIndex);
}

/**
 * Determine whether the user should be auto-advanced to a later week.
 *
 * Returns how many weeks to jump (0 = no change).
 */
export function getWeeksToAdvance(currentWeekStartDate: Date | string): number {
    const weekStart = typeof currentWeekStartDate === "string" ? new Date(currentWeekStartDate + "T00:00:00") : stripTime(currentWeekStartDate);
    const today = stripTime(new Date());
    const diff = daysBetween(today, weekStart);
    return diff >= 7 ? Math.floor(diff / 7) : 0;
}

/**
 * After advancing N weeks, figure out the new phase for a given
 * absolute week number using the PHASE_RANGES constant.
 */
export function getPhaseForWeek(week: number): number {
    const RANGES: [number, number, number][] = [
        [1, 1, 8],
        [2, 9, 20],
        [3, 21, 32],
        [4, 33, 36],
        [5, 37, 52],
    ];
    for (const [phase, min, max] of RANGES) {
        if (week >= min && week <= max) return phase;
    }
    // Beyond 52 weeks → restart or cap at 5
    return 5;
}

/**
 * Back-calculate `program_start_date` for a user who says they are
 * currently on `currentWeek` as of today.
 */
export function calculateProgramStartDate(currentWeek: number, referenceDate?: Date): Date {
    const ref = referenceDate ?? new Date();
    const monday = getMondayOfWeek(ref);
    return addDays(monday, -(currentWeek - 1) * 7);
}

/**
 * Format a Date as a short label, e.g. "Feb 16".
 */
export function formatDateShort(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a Date as "Feb 16, 2026".
 */
export function formatDateFull(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Calculate the absolute week (1-indexed) based on a program start date
 * and an optional reference date (defaults to now).
 */
export function calculateAbsoluteWeek(programStartDate: Date | string, referenceDate?: Date): number {
    const start = typeof programStartDate === "string" ? new Date(programStartDate + "T00:00:00") : stripTime(programStartDate);
    const now = stripTime(referenceDate ?? new Date());

    const diff = daysBetween(now, start);
    let daysSinceStart = diff;
    if (daysSinceStart < 0) daysSinceStart = 0;

    return Math.floor(daysSinceStart / 7) + 1;
}

/**
 * Format a week range label, e.g. "Feb 10 – Feb 16".
 */
export function formatWeekRange(weekNumber: number, programStartDate: Date | string): string {
    const { start, end } = getWeekDates(weekNumber, programStartDate);
    return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}
