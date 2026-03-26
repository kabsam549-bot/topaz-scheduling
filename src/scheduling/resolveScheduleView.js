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

export function resolveScheduleView(result, values, toggles = {}) {
  if (!result?.scenarios?.length) {
    return { primary: null, secondary: null, labels: [] };
  }

  const armView = toggles.arm ?? 'HF';
  const boostView = toggles.boost ?? 'yes';

  let useBoost = values.boost === 'yes';
  if (values.boost === 'no') useBoost = false;
  if (values.boost === 'uncertain') {
    if (boostView === 'yes') useBoost = true;
    else if (boostView === 'no') useBoost = false;
  }

  const effectiveArm =
    values.arm === 'HF' || values.arm === 'CF'
      ? values.arm
      : armView === 'CF'
        ? 'CF'
        : armView === 'HF'
          ? 'HF'
          : 'HF';

  if (values.arm === 'not_randomized' && armView === 'both') {
    const p = findScenario(result, 'HF', useBoost);
    const q = findScenario(result, 'CF', useBoost);
    return {
      primary: scenarioToComputed(p),
      secondary: scenarioToComputed(q),
      labels: [
        `HF (15 fx)${useBoost ? ', boost' : ''}`,
        `CF (25 fx)${useBoost ? ', boost' : ''}`,
      ],
    };
  }

  if (values.boost === 'uncertain' && boostView === 'both') {
    const p = findScenario(result, effectiveArm, false);
    const q = findScenario(result, effectiveArm, true);
    return {
      primary: scenarioToComputed(p),
      secondary: scenarioToComputed(q),
      labels: ['No boost', 'With boost'],
    };
  }

  const single = findScenario(result, effectiveArm, useBoost);
  return {
    primary: scenarioToComputed(single),
    secondary: null,
    labels: [],
  };
}
