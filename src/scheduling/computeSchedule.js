/**
 * TOPAz PRD v2 §6 scheduling — deterministic milestones and scenario branching.
 *
 * **Chemo break days (`chemoBreakDays`):** Calendar days added to the last chemo date to account
 * for treatment breaks during the chemotherapy phase. This shifts the chemo completion anchor
 * forward, cascading to simulation, RT start, and all downstream milestones.
 *
 * **Surgery windows** match PRD §9 worked example: acceptable = last fraction +10..+35 calendar
 * days; optimal = +17..+26; target = weekday snap of last fraction +21.
 */

import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  isValid,
  isWeekend,
  parseISO,
  startOfDay,
} from 'date-fns';
import { nextTreatmentDayAfter, nextTreatmentDayOnOrAfter, isTreatmentDay } from './holidays.js';
import { subtractBusinessDays } from './businessDays.js';

const HF_FX = 15;
const CF_FX = 25;

/** @type {Record<string, number>} */
const WEEKDAY_NAME_TO_NUM = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Preferred simulation weekday: `number[]` with **0 = Sunday … 6 = Saturday** (JavaScript `getDay`),
 * or English weekday names (case-insensitive). Default `[3]` = Wednesday.
 */

/**
 * @param {unknown} value
 * @returns {Date | null}
 */
function parseInputDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isValid(value) ? startOfDay(value) : null;
  if (typeof value === 'string') {
    const d = parseISO(value);
    return isValid(d) ? startOfDay(d) : null;
  }
  const d = new Date(value);
  return isValid(d) ? startOfDay(d) : null;
}

/**
 * @param {unknown} pref
 * @returns {number[]}
 */
export function normalizeSimDayPreference(pref) {
  if (pref == null) return [3];
  if (typeof pref === 'number' && pref >= 0 && pref <= 6) return [pref];
  if (!Array.isArray(pref) || pref.length === 0) return [3];
  const out = [];
  for (const p of pref) {
    if (typeof p === 'number' && p >= 0 && p <= 6) out.push(p);
    else if (typeof p === 'string') {
      const n = WEEKDAY_NAME_TO_NUM[p.trim().toLowerCase()];
      if (n !== undefined) out.push(n);
    }
  }
  return out.length ? [...new Set(out)].sort((a, b) => a - b) : [3];
}

/**
 * @param {Date} anchor
 * @param {number[]} preferredDayNumbers 0=Sun..6=Sat
 * @param {import('./holidays.js').HolidayOptions} ho
 */
function firstPreferredTreatmentDayOnOrAfter(anchor, preferredDayNumbers, ho) {
  let d = startOfDay(anchor);
  for (let i = 0; i < 400; i += 1) {
    if (preferredDayNumbers.includes(getDay(d)) && isTreatmentDay(d, ho)) return d;
    d = addDays(d, 1);
  }
  return startOfDay(anchor);
}

/** First Monday on or after `date` (calendar). */
function firstMondayOnOrAfter(date) {
  let d = startOfDay(date);
  const day = getDay(d);
  if (day === 0) return addDays(d, 1);
  if (day === 1) return d;
  return addDays(d, 8 - day);
}

function snapSurgeryTarget(date) {
  let d = startOfDay(date);
  while (isWeekend(d)) d = addDays(d, 1);
  return d;
}

/**
 * @param {import('./holidays.js').HolidayOptions} ho
 */
function defaultRtStartFromSim(simDate, ho) {
  const anchor = addDays(simDate, 7);
  return nextTreatmentDayOnOrAfter(firstMondayOnOrAfter(anchor), ho);
}

/**
 * Schedules fraction dates consecutively on treatment days (Mon–Fri, not holiday).
 * No internal RT break — chemo breaks are handled upstream by shifting chemoEnd.
 */
function scheduleFractionDates(rtStart, baseFx, boostFx, ho) {
  const total = baseFx + boostFx;
  if (total <= 0) {
    return {
      allDates: [],
      baseEnd: null,
      lastDate: null,
      boostStartIndex: null,
    };
  }
  const dates = [];
  let cursor = nextTreatmentDayOnOrAfter(rtStart, ho);
  dates.push(cursor);
  for (let i = 1; i < total; i += 1) {
    cursor = nextTreatmentDayAfter(dates[i - 1], ho);
    dates.push(cursor);
  }
  const baseEnd = dates[baseFx - 1] ?? null;
  const lastDate = dates[total - 1] ?? null;
  const boostStartIndex = boostFx > 0 ? baseFx : null;
  return { allDates: dates, baseEnd, lastDate, boostStartIndex };
}

function surgeryFromLastFraction(lastFraction) {
  return {
    acceptable: {
      start: addDays(lastFraction, 10),
      end: addDays(lastFraction, 35),
    },
    optimal: {
      start: addDays(lastFraction, 16),
      end: addDays(lastFraction, 25),
    },
    target: snapSurgeryTarget(addDays(lastFraction, 21)),
  };
}

/**
 * @param {{ start: Date, end: Date }[]} ranges
 * @returns {{ start: Date, end: Date } | null}
 */
function intersectInclusiveRanges(ranges) {
  if (ranges.length === 0) return null;
  const s = Math.max(...ranges.map((r) => r.start.getTime()));
  const e = Math.min(...ranges.map((r) => r.end.getTime()));
  if (s > e) return null;
  return { start: startOfDay(new Date(s)), end: startOfDay(new Date(e)) };
}

/**
 * @typedef {object} ComputeScheduleInputs
 * @property {boolean} [neoadjuvantChemo]
 * @property {Date|string|null} [chemoEndDate]
 * @property {string} [chemoRegimen]
 * @property {'HF'|'CF'|'not_randomized'} [arm]
 * @property {'yes'|'no'|'uncertain'} [boost]
 * @property {number} [boostFractions]
 * @property {'main'|'hal'} [location]
 * @property {boolean} [ibcCohort]
 * @property {number[]|string[]} [simDayPreference]
 * @property {number} [chemoBreakDays]
 * @property {Date|string|null} [simDate]
 * @property {Date|string|null} [rtStartDate]
 * @property {Date[]} [closureDates]
 * @property {(Date|string)[]} [treatAsTreatmentDays]
 */

/**
 * @param {ComputeScheduleInputs} inputs
 */
export function computeSchedule(inputs) {
  /** @type {{ code: string, message: string, severity: 'info'|'warning'|'error' }[]} */
  const warnings = [];

  const ho = {
    closureDates: inputs.closureDates ?? [],
    treatAsTreatmentDays: inputs.treatAsTreatmentDays ?? [],
  };
  const neoadj = inputs.neoadjuvantChemo !== false;
  let chemoEnd = parseInputDate(inputs.chemoEndDate);
  if (!chemoEnd) {
    chemoEnd = startOfDay(new Date());
    if (neoadj) {
      warnings.push({
        code: 'CHEMO_END_ESTIMATED',
        message: 'No last chemo date — using today as planning anchor.',
        severity: 'warning',
      });
    } else {
      warnings.push({
        code: 'CHEMO_END_ESTIMATED',
        message: 'Neoadjuvant chemo off or date missing — using today as planning anchor.',
        severity: 'info',
      });
    }
  }

  const preferredDays = normalizeSimDayPreference(inputs.simDayPreference);
  const location = inputs.location === 'main' ? 'main' : 'hal';
  let arm = inputs.arm ?? 'not_randomized';
  const boostInput = inputs.boost ?? 'uncertain';
  let boostFx = Math.min(8, Math.max(5, Number(inputs.boostFractions) || 5));
  const chemoBreakDays = Math.max(0, Number(inputs.chemoBreakDays) || 0);

  // Shift chemo end date forward by chemo break days
  if (chemoBreakDays > 0) {
    chemoEnd = addDays(chemoEnd, chemoBreakDays);
  }
  const ibc = !!inputs.ibcCohort;

  if (ibc) {
    if (arm === 'HF') {
      warnings.push({
        code: 'IBC_CF_ONLY',
        message: 'IBC cohort (PRD §4.4.3.3): CF 25 fx only; breast boost beyond protocol ignored.',
        severity: 'warning',
      });
    }
    arm = 'CF';
    boostFx = 0;
  }

  const simMin = addDays(chemoEnd, 7);
  const simMax = addDays(chemoEnd, 14);
  let simDate =
    parseInputDate(inputs.simDate) ??
    firstPreferredTreatmentDayOnOrAfter(simMin, preferredDays, ho);
  simDate = nextTreatmentDayOnOrAfter(simDate, ho);

  const simOffset = differenceInCalendarDays(simDate, chemoEnd);
  if (simOffset < 7 || simOffset > 14) {
    warnings.push({
      code: 'SIM_OUTSIDE_7_14',
      message: `Simulation is ${simOffset} calendar days after last chemo (protocol target 7–14).`,
      severity: 'warning',
    });
  }

  const preMrtLimit = addDays(chemoEnd, 56);
  if (simDate > preMrtLimit) {
    warnings.push({
      code: 'PRE_MRT_LATE',
      message: 'Simulation starts after 8 weeks from chemo completion — verify Section 4.3.3.',
      severity: 'warning',
    });
  }

  let rtStart = parseInputDate(inputs.rtStartDate) ?? defaultRtStartFromSim(simDate, ho);
  rtStart = nextTreatmentDayOnOrAfter(rtStart, ho);

  const planningGap = differenceInCalendarDays(rtStart, simDate);
  if (planningGap < 7 || planningGap > 14) {
    warnings.push({
      code: 'PLANNING_GAP_OUTSIDE_7_14',
      message: `Sim → RT start is ${planningGap} calendar days (typical 7–14).`,
      severity: 'warning',
    });
  }

  if (rtStart > preMrtLimit) {
    warnings.push({
      code: 'RT_START_PRE_MRT_LATE',
      message: 'RT Day 1 may fall after 8 weeks from chemo completion — verify protocol.',
      severity: 'warning',
    });
  }

  const dryRun =
    location === 'hal'
      ? subtractBusinessDays(rtStart, 1, { holidays: ho })
      : rtStart;

  const armsToRun =
    ibc || arm === 'CF'
      ? ['CF']
      : arm === 'HF'
        ? ['HF']
        : ['HF', 'CF'];

  if (arm === 'not_randomized' && !ibc) {
    /* informational — UI shows both */
  }

  /** @type {{ key: 'noBoost'|'withBoost', boostCount: number }[]} */
  let boostVariants;
  if (ibc) {
    boostVariants = [{ key: 'noBoost', boostCount: 0 }];
  } else if (boostInput === 'no') {
    boostVariants = [{ key: 'noBoost', boostCount: 0 }];
  } else if (boostInput === 'yes') {
    boostVariants = [{ key: 'withBoost', boostCount: boostFx }];
  } else {
    boostVariants = [
      { key: 'noBoost', boostCount: 0 },
      { key: 'withBoost', boostCount: boostFx },
    ];
  }

  const scenarios = [];

  for (const a of armsToRun) {
    const baseFx = a === 'HF' ? HF_FX : CF_FX;
    for (const { key, boostCount } of boostVariants) {
      const { baseEnd, lastDate, allDates, boostStartIndex } = scheduleFractionDates(
        rtStart,
        baseFx,
        boostCount,
        ho
      );

      if (!lastDate || !baseEnd) continue;

      const surgery = surgeryFromLastFraction(lastDate);
      const boostStartDate =
        boostStartIndex != null && allDates[boostStartIndex]
          ? allDates[boostStartIndex]
          : null;

      const id = `${a.toLowerCase()}-${key}`;
      const label =
        key === 'noBoost'
          ? `${a} — no boost`
          : `${a} — with boost (${boostCount} fx)`;

      scenarios.push({
        id,
        label,
        arm: a,
        boost: key === 'noBoost' ? 'no' : 'yes',
        milestones: {
          chemoEnd,
          sim: simDate,
          dryRun,
          rtStart,
          rtEndBase: baseEnd,
          rtEndWithBoost: boostCount > 0 ? lastDate : null,
          lastFractionForSurgery: lastDate,
          surgeryAcceptableStart: surgery.acceptable.start,
          surgeryAcceptableEnd: surgery.acceptable.end,
          surgeryOptimalStart: surgery.optimal.start,
          surgeryOptimalEnd: surgery.optimal.end,
          surgeryTarget: surgery.target,
        },
        ranges: {
          chemoToSim: { min: simMin, max: simMax },
          planningGapCalendarDays: planningGap,
          rtBase: { start: rtStart, end: baseEnd },
          rtBoost:
            boostCount > 0 && boostStartDate
              ? { start: boostStartDate, end: lastDate }
              : null,
          chemoBreakDays,
        },
      });
    }
  }

  let overlap = null;
  if (scenarios.length > 1) {
    const acc = intersectInclusiveRanges(
      scenarios.map((s) => ({
        start: s.milestones.surgeryAcceptableStart,
        end: s.milestones.surgeryAcceptableEnd,
      }))
    );
    const opt = intersectInclusiveRanges(
      scenarios.map((s) => ({
        start: s.milestones.surgeryOptimalStart,
        end: s.milestones.surgeryOptimalEnd,
      }))
    );
    overlap = {
      surgeryAcceptable: acc,
      surgeryOptimal: opt,
    };
  }

  // Per-arm overlap (boost vs no-boost within the same arm) — matches PRD Section 9
  const perArmOverlap = {};
  for (const a of armsToRun) {
    const armScenarios = scenarios.filter((s) => s.arm === a);
    if (armScenarios.length > 1) {
      perArmOverlap[a] = {
        surgeryAcceptable: intersectInclusiveRanges(
          armScenarios.map((s) => ({
            start: s.milestones.surgeryAcceptableStart,
            end: s.milestones.surgeryAcceptableEnd,
          }))
        ),
        surgeryOptimal: intersectInclusiveRanges(
          armScenarios.map((s) => ({
            start: s.milestones.surgeryOptimalStart,
            end: s.milestones.surgeryOptimalEnd,
          }))
        ),
      };
    }
  }

  return {
    scenarios,
    overlap,
    perArmOverlap,
    warnings,
  };
}
