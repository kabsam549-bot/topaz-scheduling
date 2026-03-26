import {
  addDays,
  getDay,
  getMonth,
  getYear,
  isSameDay,
  isValid,
  isWeekend,
  parseISO,
  startOfDay,
} from 'date-fns';

function normalizeDay(value) {
  if (value instanceof Date) return startOfDay(value);
  if (typeof value === 'string') {
    const p = parseISO(value);
    return isValid(p) ? startOfDay(p) : startOfDay(new Date(value));
  }
  return startOfDay(new Date(value));
}

/**
 * Optional MD Anderson (or other) closure days, as `Date` or values parseable as dates.
 * `treatAsTreatmentDays` — calendar days that remain treatment days even if they coincide
 * with a federal observance (institution-specific; PRD §9 hand example uses May 25, 2026).
 *
 * @typedef {object} HolidayOptions
 * @property {Date[]} [closureDates]
 * @property {Date[]} [treatAsTreatmentDays]
 */

/** @param {number} year @param {number} monthIndex 0-11 @param {number} weekday 0=Sun..6=Sat @param {number} n 1-based */
function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
  let d = new Date(year, monthIndex, 1);
  let count = 0;
  while (d.getMonth() === monthIndex) {
    if (getDay(d) === weekday) {
      count += 1;
      if (count === n) return startOfDay(d);
    }
    d = addDays(d, 1);
  }
  throw new Error(`nth weekday not found: ${year}-${monthIndex + 1}`);
}

/** @param {number} year @param {number} monthIndex @param {number} weekday */
function lastWeekdayOfMonth(year, monthIndex, weekday) {
  let d = new Date(year, monthIndex + 1, 0);
  while (getMonth(d) === monthIndex && getDay(d) !== weekday) d = addDays(d, -1);
  if (getMonth(d) !== monthIndex) {
    throw new Error(`last weekday not found: ${year}-${monthIndex + 1}`);
  }
  return startOfDay(d);
}

/**
 * Weekend federal observance: Sat → prior Fri, Sun → following Mon.
 * @param {number} year
 * @param {number} monthIndex
 * @param {number} dayOfMonth
 */
function observedFixed(year, monthIndex, dayOfMonth) {
  const d = startOfDay(new Date(year, monthIndex, dayOfMonth));
  const dow = getDay(d);
  if (dow === 6) return addDays(d, -1);
  if (dow === 0) return addDays(d, 1);
  return d;
}

/**
 * US federal observed holidays for calendar year `year`.
 * Boundary cases (e.g. NY observed in adjacent year) are handled in `isHoliday`.
 * @param {number} year
 * @returns {Date[]}
 */
export function getUSFederalHolidays(year) {
  const y = year;
  return [
    observedFixed(y, 0, 1),
    nthWeekdayOfMonth(y, 0, 1, 3),
    nthWeekdayOfMonth(y, 1, 1, 3),
    lastWeekdayOfMonth(y, 4, 1),
    observedFixed(y, 5, 19),
    observedFixed(y, 6, 4),
    nthWeekdayOfMonth(y, 8, 1, 1),
    nthWeekdayOfMonth(y, 9, 1, 2),
    observedFixed(y, 10, 11),
    nthWeekdayOfMonth(y, 10, 4, 4),
    observedFixed(y, 11, 25),
  ];
}

/**
 * @param {Date} date
 * @param {HolidayOptions} [options]
 */
export function isHoliday(date, options = {}) {
  const d = startOfDay(date);
  const openDays = (options.treatAsTreatmentDays ?? []).map((c) => normalizeDay(c));
  if (openDays.some((c) => isSameDay(c, d))) return false;
  const closures = (options.closureDates ?? []).map((c) => normalizeDay(c));
  if (closures.some((c) => c.getTime() === d.getTime())) return true;
  const y = getYear(d);
  for (const delta of [-1, 0, 1]) {
    for (const h of getUSFederalHolidays(y + delta)) {
      if (isSameDay(h, d)) return true;
    }
  }
  return false;
}

/**
 * @param {Date} date
 * @param {HolidayOptions} [options]
 */
export function isWeekendOrHoliday(date, options = {}) {
  return isWeekend(date) || isHoliday(date, options);
}

/**
 * Mon–Fri and not federal holiday / closure (valid RT, sim, dry-run treatment day).
 * @param {Date} date
 * @param {HolidayOptions} [options]
 */
export function isTreatmentDay(date, options = {}) {
  return !isWeekendOrHoliday(date, options);
}

/**
 * @param {Date} date
 * @param {HolidayOptions} [options]
 */
export function nextTreatmentDayOnOrAfter(date, options = {}) {
  let d = startOfDay(date);
  while (!isTreatmentDay(d, options)) d = addDays(d, 1);
  return d;
}

/**
 * First treatment day strictly after `date`.
 * @param {Date} date
 * @param {HolidayOptions} [options]
 */
export function nextTreatmentDayAfter(date, options = {}) {
  return nextTreatmentDayOnOrAfter(addDays(startOfDay(date), 1), options);
}
