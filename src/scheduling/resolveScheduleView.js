import { format, startOfDay } from 'date-fns';

/** @param {object | null | undefined} s scenario from `computeSchedule` */
export function scenarioToComputed(s) {
  if (!s) return null;
  const m = s.milestones;
  const iso = (d) => format(startOfDay(d), 'yyyy-MM-dd');
  const rtEndBoost = m.rtEndWithBoost ?? m.rtEndBase;
  return {
    lastChemoDate: iso(m.chemoEnd),
    simDate: iso(m.sim),
    dryRunDate: iso(m.dryRun),
    rtStartDate: iso(m.rtStart),
    rtEndDate: iso(m.rtEndBase),
    rtEndDateWithBoost: iso(rtEndBoost),
    surgeryWindowAcceptable: {
      start: iso(m.surgeryAcceptableStart),
      end: iso(m.surgeryAcceptableEnd),
    },
    surgeryWindowOptimal: {
      start: iso(m.surgeryOptimalStart),
      end: iso(m.surgeryOptimalEnd),
    },
    surgeryTarget: iso(m.surgeryTarget),
  };
}

/** @param {object} result `computeSchedule` result */
export function findScenario(result, arm, withBoost) {
  const boost = withBoost ? 'yes' : 'no';
  return (
    result.scenarios.find((sc) => sc.arm === arm && sc.boost === boost) ?? null
  );
}

export function buildArmsAndBoostScenarios(result) {
  const arms = {
    HF: {
      noBoost: scenarioToComputed(findScenario(result, 'HF', false)),
      withBoost: scenarioToComputed(findScenario(result, 'HF', true)),
    },
    CF: {
      noBoost: scenarioToComputed(findScenario(result, 'CF', false)),
      withBoost: scenarioToComputed(findScenario(result, 'CF', true)),
    },
  };
  const pickArm = result.scenarios.some((s) => s.arm === 'HF') ? 'HF' : 'CF';
  const boostScenarios = {
    noBoost: scenarioToComputed(findScenario(result, pickArm, false)),
    withBoost: scenarioToComputed(findScenario(result, pickArm, true)),
  };
  return { arms, boostScenarios };
}

/** Single `computed` for JSON export (inputs-driven, not TopBar toggles). */
export function exportComputedForInputs(result, values) {
  const arm =
    values.ibcCohort || values.arm === 'CF'
      ? 'CF'
      : values.arm === 'HF'
        ? 'HF'
        : 'HF';
  const withBoost = values.boost !== 'no';
  return scenarioToComputed(findScenario(result, arm, withBoost));
}

function applySurgeryOverride(computed, overrideDate) {
  if (!computed || !overrideDate) return computed;
  return { ...computed, surgeryTarget: overrideDate };
}

export function resolveScheduleView(result, values, toggles = {}) {
  if (!result?.scenarios?.length) {
    return { primary: null, secondary: null, labels: [] };
  }

  const effectiveArm =
    values.arm === 'HF' || values.arm === 'CF'
      ? values.arm
      : 'HF';

  // When boost is uncertain, show the WITH-boost scenario as primary
  // (conservative: plans for longer RT) but use the per-arm overlap
  // for surgery windows so the scheduled date works either way
  if (values.boost === 'uncertain') {
    const noBoost = findScenario(result, effectiveArm, false);
    const withBoost = findScenario(result, effectiveArm, true);
    const primaryComputed = scenarioToComputed(withBoost);
    const noBoostComputed = scenarioToComputed(noBoost);

    // Calculate overlap windows
    if (primaryComputed && noBoostComputed) {
      const overlapAccStart = noBoostComputed.surgeryWindowAcceptable?.start > primaryComputed.surgeryWindowAcceptable?.start
        ? noBoostComputed.surgeryWindowAcceptable.start : primaryComputed.surgeryWindowAcceptable?.start;
      const overlapAccEnd = noBoostComputed.surgeryWindowAcceptable?.end < primaryComputed.surgeryWindowAcceptable?.end
        ? noBoostComputed.surgeryWindowAcceptable.end : primaryComputed.surgeryWindowAcceptable?.end;
      const overlapOptStart = noBoostComputed.surgeryWindowOptimal?.start > primaryComputed.surgeryWindowOptimal?.start
        ? noBoostComputed.surgeryWindowOptimal.start : primaryComputed.surgeryWindowOptimal?.start;
      const overlapOptEnd = noBoostComputed.surgeryWindowOptimal?.end < primaryComputed.surgeryWindowOptimal?.end
        ? noBoostComputed.surgeryWindowOptimal.end : primaryComputed.surgeryWindowOptimal?.end;

      // Override primary's surgery windows with the overlap
      if (overlapAccStart <= overlapAccEnd) {
        primaryComputed.surgeryWindowAcceptable = { start: overlapAccStart, end: overlapAccEnd };
      }
      if (overlapOptStart <= overlapOptEnd) {
        primaryComputed.surgeryWindowOptimal = { start: overlapOptStart, end: overlapOptEnd };
      }
    }

    return {
      primary: applySurgeryOverride(primaryComputed, values.surgeryTargetOverride),
      secondary: noBoostComputed,
      labels: ['With boost', 'No boost'],
    };
  }

  // Not randomized: show both arms
  if (values.arm === 'not_randomized') {
    const useBoost = values.boost === 'yes';
    const p = findScenario(result, 'HF', useBoost);
    const q = findScenario(result, 'CF', useBoost);
    return {
      primary: applySurgeryOverride(scenarioToComputed(p), values.surgeryTargetOverride),
      secondary: applySurgeryOverride(scenarioToComputed(q), values.surgeryTargetOverride),
      labels: [
        `HF (15 fx)${useBoost ? ', boost' : ''}`,
        `CF (25 fx)${useBoost ? ', boost' : ''}`,
      ],
    };
  }

  const useBoost = values.boost === 'yes';
  const single = findScenario(result, effectiveArm, useBoost);
  return {
    primary: applySurgeryOverride(scenarioToComputed(single), values.surgeryTargetOverride),
    secondary: null,
    labels: [],
  };
}
