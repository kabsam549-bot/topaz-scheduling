import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';
import { computeSchedule, normalizeSimDayPreference } from './computeSchedule.js';
import { isHoliday, isWeekendOrHoliday } from './holidays.js';
import { addBusinessDays, subtractBusinessDays } from './businessDays.js';

const iso = (d) => format(d, 'yyyy-MM-dd');

describe('normalizeSimDayPreference', () => {
  it('defaults to Wednesday (3)', () => {
    expect(normalizeSimDayPreference()).toEqual([3]);
  });
  it('accepts weekday names', () => {
    expect(normalizeSimDayPreference(['Wednesday', 'Friday'])).toEqual([3, 5]);
  });
});

describe('holidays & businessDays', () => {
  it('Memorial Day 2026 is a federal holiday unless overridden', () => {
    const md = new Date(2026, 4, 25);
    expect(isHoliday(md, {})).toBe(true);
    expect(isWeekendOrHoliday(md, {})).toBe(true);
    expect(isHoliday(md, { treatAsTreatmentDays: [md] })).toBe(false);
  });
  it('HAL dry run: one business day before Monday first fraction', () => {
    const ho = {};
    const rt = new Date(2026, 4, 4);
    expect(iso(subtractBusinessDays(rt, 1, { holidays: ho }))).toBe('2026-05-01');
  });
  it('addBusinessDays matches stepping behavior', () => {
    const ho = {};
    const mon = new Date(2026, 4, 4);
    expect(iso(addBusinessDays(mon, 1, { holidays: ho }))).toBe('2026-05-05');
  });
});

/**
 * PRD §9 uses May 29 as last boost day with Memorial Day 2026 still counted as a treatment day.
 * Default US federal rules close 2026-05-25; pass `treatAsTreatmentDays: ['2026-05-25']` to align
 * with the published worked example.
 */
describe('computeSchedule — PRD §9 worked example', () => {
  const base = {
    chemoEndDate: '2026-04-13',
    arm: 'HF',
    boost: 'uncertain',
    boostFractions: 5,
    location: 'hal',
    simDayPreference: [3],
    breakDays: 0,
    neoadjuvantChemo: true,
    treatAsTreatmentDays: ['2026-05-25'],
  };

  it('matches key milestone dates (sim, dry run, RT, fractions)', () => {
    const { scenarios } = computeSchedule(base);
    const no = scenarios.find((s) => s.id === 'hf-noBoost');
    const yes = scenarios.find((s) => s.id === 'hf-withBoost');
    expect(iso(no.milestones.sim)).toBe('2026-04-22');
    expect(iso(no.milestones.dryRun)).toBe('2026-05-01');
    expect(iso(no.milestones.rtStart)).toBe('2026-05-04');
    expect(iso(no.milestones.rtEndBase)).toBe('2026-05-22');
    expect(iso(no.milestones.lastFractionForSurgery)).toBe('2026-05-22');
    expect(iso(yes.milestones.lastFractionForSurgery)).toBe('2026-05-29');
  });

  it('matches per-scenario surgical windows and overlap (Table 9)', () => {
    const { scenarios, overlap } = computeSchedule(base);
    const no = scenarios.find((s) => s.id === 'hf-noBoost');
    const yes = scenarios.find((s) => s.id === 'hf-withBoost');
    expect(iso(no.milestones.surgeryAcceptableStart)).toBe('2026-06-01');
    expect(iso(no.milestones.surgeryAcceptableEnd)).toBe('2026-06-26');
    expect(iso(no.milestones.surgeryOptimalStart)).toBe('2026-06-07');
    expect(iso(no.milestones.surgeryOptimalEnd)).toBe('2026-06-16');
    expect(iso(no.milestones.surgeryTarget)).toBe('2026-06-12');

    expect(iso(yes.milestones.surgeryAcceptableStart)).toBe('2026-06-08');
    expect(iso(yes.milestones.surgeryAcceptableEnd)).toBe('2026-07-03');
    expect(iso(yes.milestones.surgeryOptimalStart)).toBe('2026-06-14');
    expect(iso(yes.milestones.surgeryOptimalEnd)).toBe('2026-06-23');
    expect(iso(yes.milestones.surgeryTarget)).toBe('2026-06-19');

    expect(overlap).not.toBeNull();
    expect(iso(overlap.surgeryAcceptable.start)).toBe('2026-06-08');
    expect(iso(overlap.surgeryAcceptable.end)).toBe('2026-06-26');
    expect(iso(overlap.surgeryOptimal.start)).toBe('2026-06-14');
    expect(iso(overlap.surgeryOptimal.end)).toBe('2026-06-16');
  });

  it('without Memorial override, last boost lands on next treatment day after holiday', () => {
    const { scenarios } = computeSchedule({ ...base, treatAsTreatmentDays: [] });
    const yes = scenarios.find((s) => s.id === 'hf-withBoost');
    expect(iso(yes.milestones.lastFractionForSurgery)).toBe('2026-06-01');
  });
});

describe('computeSchedule — scenarios & IBC', () => {
  it('not_randomized + uncertain boost yields four scenarios', () => {
    const { scenarios } = computeSchedule({
      chemoEndDate: '2026-04-13',
      arm: 'not_randomized',
      boost: 'uncertain',
      boostFractions: 5,
      location: 'main',
      simDayPreference: ['wednesday'],
      treatAsTreatmentDays: ['2026-05-25'],
    });
    expect(scenarios.map((s) => s.id).sort()).toEqual([
      'cf-noBoost',
      'cf-withBoost',
      'hf-noBoost',
      'hf-withBoost',
    ]);
  });

  it('IBC cohort forces CF and drops boost fractions', () => {
    const { scenarios, warnings } = computeSchedule({
      chemoEndDate: '2026-04-13',
      arm: 'HF',
      boost: 'yes',
      boostFractions: 8,
      ibcCohort: true,
      treatAsTreatmentDays: ['2026-05-25'],
    });
    expect(warnings.some((w) => w.code === 'IBC_CF_ONLY')).toBe(true);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].arm).toBe('CF');
    expect(scenarios[0].milestones.rtEndWithBoost).toBeNull();
  });
});

describe('treatment break days', () => {
  it('extends calendar span by inserting days before the final fraction', () => {
    const { scenarios } = computeSchedule({
      chemoEndDate: '2026-04-13',
      arm: 'HF',
      boost: 'no',
      breakDays: 5,
      location: 'hal',
      simDayPreference: [3],
      treatAsTreatmentDays: ['2026-05-25'],
    });
    const s = scenarios[0];
    const withoutBreak = computeSchedule({
      chemoEndDate: '2026-04-13',
      arm: 'HF',
      boost: 'no',
      breakDays: 0,
      location: 'hal',
      simDayPreference: [3],
      treatAsTreatmentDays: ['2026-05-25'],
    }).scenarios[0];
    expect(s.milestones.lastFractionForSurgery.getTime()).toBeGreaterThan(
      withoutBreak.milestones.lastFractionForSurgery.getTime()
    );
    expect(s.ranges.breakDaysInsertedBeforeLastFraction).toBe(5);
  });
});

describe('manual overrides', () => {
  it('honors simDate and rtStartDate overrides', () => {
    const { scenarios } = computeSchedule({
      chemoEndDate: '2026-04-13',
      arm: 'HF',
      boost: 'no',
      simDate: '2026-04-24',
      rtStartDate: '2026-05-05',
      location: 'main',
    });
    const m = scenarios[0].milestones;
    expect(iso(m.sim)).toBe('2026-04-24');
    expect(iso(m.rtStart)).toBe('2026-05-05');
    expect(iso(m.dryRun)).toBe('2026-05-05');
  });
});
