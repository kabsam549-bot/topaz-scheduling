import { addDays, startOfDay } from 'date-fns';
import { isWeekendOrHoliday } from './holidays.js';

/**
 * @typedef {import('./holidays.js').HolidayOptions} HolidayOptions
 */

/**
 * @typedef {object} BusinessDayOptions
 * @property {HolidayOptions} [holidays]
 */

function holidayOpts(options) {
  return options.holidays ?? {};
}

/**
 * Next calendar day that is a treatment (business) day.
 * @param {Date} date
 * @param {import('./businessDays.js').BusinessDayOptions} [options]
 */
export function nextBusinessDayAfter(date, options = {}) {
  let d = addDays(startOfDay(date), 1);
  while (isWeekendOrHoliday(d, holidayOpts(options))) d = addDays(d, 1);
  return d;
}

/**
 * First treatment day on or after `date`.
 * @param {Date} date
 * @param {BusinessDayOptions} [options]
 */
export function nextBusinessDayOnOrAfter(date, options = {}) {
  let d = startOfDay(date);
  while (isWeekendOrHoliday(d, holidayOpts(options))) d = addDays(d, 1);
  return d;
}

/**
 * Last treatment day on or before `date`.
 * @param {Date} date
 * @param {BusinessDayOptions} [options]
 */
export function previousBusinessDayOnOrBefore(date, options = {}) {
  let d = startOfDay(date);
  while (isWeekendOrHoliday(d, holidayOpts(options))) d = addDays(d, -1);
  return d;
}

/**
 * Add business (treatment) days — same stepping rules as date-fns `addBusinessDays` (skips weekends/holidays).
 * @param {Date} fromDate
 * @param {number} n
 * @param {BusinessDayOptions} [options]
 */
export function addBusinessDays(fromDate, n, options = {}) {
  const ho = holidayOpts(options);
  let d = startOfDay(fromDate);
  if (n === 0) return d;
  const sign = n < 0 ? -1 : 1;
  let remaining = Math.abs(n);
  while (remaining > 0) {
    d = addDays(d, sign);
    if (!isWeekendOrHoliday(d, ho)) remaining -= 1;
  }
  return d;
}

/**
 * @param {Date} fromDate
 * @param {number} n
 * @param {BusinessDayOptions} [options]
 */
export function subtractBusinessDays(fromDate, n, options = {}) {
  return addBusinessDays(fromDate, -n, options);
}
