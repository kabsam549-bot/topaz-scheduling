import { useCallback, useMemo, useState } from 'react';
import {
  computeSchedule,
  resolveScheduleView,
} from '../scheduling';

const WARNING_FIELDS = {
  CHEMO_END_ESTIMATED: 'chemoEndDate',
  SIM_OUTSIDE_7_14: 'simDayPreference',
  PRE_MRT_LATE: 'chemoEndDate',
  PLANNING_GAP_OUTSIDE_7_14: 'simDayPreference',
  RT_START_PRE_MRT_LATE: 'chemoEndDate',
  IBC_CF_ONLY: 'arm',
};

export const DEFAULT_FORM_STATE = {
  neoadjuvantChemo: true,
  chemoRegimen: 'dd-AC + wkly Taxol',
  chemoEndDate: '',
  arm: 'not_randomized',
  boost: 'uncertain',
  boostFractions: 5,
  location: 'hal',
  ibcCohort: false,
  simDayPreference: ['Wednesday'],
  breakDays: 0,
  studyId: '',
  notes: '',
  simDate: null,
  rtStartDate: null,
};

const DEFAULT_DISPLAY_TOGGLES = {
  arm: 'HF',
  boost: 'yes',
};

export function useTopazSchedule() {
  const [state, setState] = useState(() => ({ ...DEFAULT_FORM_STATE }));
  const [displayToggles, setDisplayToggles] = useState(() => ({
    ...DEFAULT_DISPLAY_TOGGLES,
  }));

  const setField = useCallback((field, value) => {
    setState((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'chemoEndDate') {
        next.simDate = null;
        next.rtStartDate = null;
      }
      return next;
    });
  }, []);

  const setDisplayToggle = useCallback((key, value) => {
    setDisplayToggles((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleMilestoneDrag = useCallback((field, dateStr) => {
    setState((prev) => {
      const chemoEnd = prev.chemoEndDate || null;
      const simDate = prev.simDate || null;

      if (field === 'simDate') {
        // Cannot drag sim before chemo end
        if (chemoEnd && dateStr < chemoEnd) return prev;
        return { ...prev, simDate: dateStr, rtStartDate: null };
      } else if (field === 'rtStartDate') {
        // Cannot drag RT start before sim
        const effectiveSim = simDate || (chemoEnd ? null : null);
        if (effectiveSim && dateStr <= effectiveSim) return prev;
        if (chemoEnd && dateStr <= chemoEnd) return prev;
        return { ...prev, rtStartDate: dateStr };
      } else if (field === 'surgeryTarget') {
        return { ...prev, surgeryTargetOverride: dateStr };
      }
      return prev;
    });
  }, []);

  const { result, computeError } = useMemo(() => {
    try {
      const r = computeSchedule(state);
      return { result: r, computeError: null };
    } catch (e) {
      return {
        result: null,
        computeError: e?.message || 'Schedule computation failed.',
      };
    }
  }, [state]);

  const warnings = useMemo(() => {
    if (!result?.warnings) return [];
    return result.warnings.map((w) => ({
      ...w,
      field: WARNING_FIELDS[w.code],
      message: w.message,
    }));
  }, [result]);

  const view = useMemo(
    () => resolveScheduleView(result, state, displayToggles),
    [result, state, displayToggles]
  );

  const applyImportedJson = useCallback((doc) => {
    const ins = doc?.inputs;
    if (!ins || typeof ins !== 'object') return false;
    setState((prev) => ({
      ...prev,
      neoadjuvantChemo:
        typeof ins.neoadjuvantChemo === 'boolean'
          ? ins.neoadjuvantChemo
          : prev.neoadjuvantChemo,
      chemoEndDate: ins.chemoEndDate ?? prev.chemoEndDate,
      chemoRegimen: ins.chemoRegimen ?? prev.chemoRegimen,
      arm: ins.arm ?? prev.arm,
      boost: ins.boost ?? prev.boost,
      boostFractions: ins.boostFractions ?? prev.boostFractions,
      location:
        ins.location === 'main' || ins.location === 'hal'
          ? ins.location
          : prev.location,
      ibcCohort:
        typeof ins.ibcCohort === 'boolean' ? ins.ibcCohort : prev.ibcCohort,
      simDayPreference: Array.isArray(ins.simDayPreference)
        ? ins.simDayPreference
        : prev.simDayPreference,
      breakDays:
        typeof ins.breakDays === 'number' ? ins.breakDays : prev.breakDays,
      studyId: doc.studyId ?? ins.studyId ?? prev.studyId,
      notes: ins.notes ?? doc.notes ?? prev.notes,
      simDate: null,
      rtStartDate: null,
    }));
    const dt = doc.computedSnapshot?.displayToggles;
    if (dt && typeof dt === 'object') {
      setDisplayToggles((p) => ({
        ...p,
        ...(typeof dt.arm === 'string' ? { arm: dt.arm } : {}),
        ...(typeof dt.boost === 'string' ? { boost: dt.boost } : {}),
      }));
    }
    return true;
  }, []);

  return {
    state,
    setField,
    result,
    computeError,
    warnings,
    displayToggles,
    setDisplayToggle,
    view,
    applyImportedJson,
    handleMilestoneDrag,
  };
}
