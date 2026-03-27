import { parseISO, differenceInCalendarDays, format } from 'date-fns';

function parseD(s) {
  if (!s) return null;
  try { return parseISO(s); } catch { return null; }
}

function fmtDate(s) {
  const d = parseD(s);
  if (!d) return null;
  return format(d, 'EEE, MMM d, yyyy');
}

function fmtWindow(w) {
  if (!w || !w.start) return null;
  const s = fmtDate(w.start);
  const e = fmtDate(w.end);
  if (e && w.end !== w.start) return `${s} \u2192 ${e}`;
  return s;
}

/**
 * Determine status for each milestone:
 * - 'ok' = within protocol constraints (green check)
 * - 'warn' = outside recommended range (yellow warning)
 * - 'error' = violates protocol requirement (red X)
 * - 'pending' = no data yet
 */
function getStatus(key, computed, warnings) {
  if (!computed) return 'pending';
  const warnCodes = new Set((warnings || []).map(w => w.code));

  switch (key) {
    case 'lastChemoDate':
      return computed.lastChemoDate ? 'ok' : 'pending';

    case 'simDate': {
      const chemo = parseD(computed.lastChemoDate);
      const sim = parseD(computed.simDate);
      if (!chemo || !sim) return 'pending';
      const gap = differenceInCalendarDays(sim, chemo);
      if (gap < 7) return 'error'; // too early
      if (gap > 14) return 'warn'; // late but not protocol violation
      return 'ok';
    }

    case 'dryRunDate': {
      const dry = parseD(computed.dryRunDate);
      const rt = parseD(computed.rtStartDate);
      if (!dry || !rt) return 'pending';
      // Dry run should be on or before RT start
      const gap = differenceInCalendarDays(rt, dry);
      if (gap < 0) return 'error';
      return 'ok';
    }

    case 'rtStartDate': {
      const chemo = parseD(computed.lastChemoDate);
      const sim = parseD(computed.simDate);
      const rt = parseD(computed.rtStartDate);
      if (!rt) return 'pending';
      // RT must be after sim
      if (sim && differenceInCalendarDays(rt, sim) < 1) return 'error';
      // Within 8 weeks of chemo
      if (chemo) {
        const gap = differenceInCalendarDays(rt, chemo);
        if (gap > 56) return 'warn';
      }
      // Planning gap 7-14 days from sim
      if (sim) {
        const planGap = differenceInCalendarDays(rt, sim);
        if (planGap < 7) return 'warn';
        if (planGap > 14) return 'warn';
      }
      return 'ok';
    }

    case 'rtEndDate':
      return (computed.rtEndDateWithBoost || computed.rtEndDate) ? 'ok' : 'pending';

    case 'surgeryWindowOptimal':
      return computed.surgeryWindowOptimal?.start ? 'ok' : 'pending';

    case 'surgeryWindowAcceptable':
      return computed.surgeryWindowAcceptable?.start ? 'ok' : 'pending';

    case 'surgeryTarget':
      return computed.surgeryTarget ? 'ok' : 'pending';

    default:
      return 'pending';
  }
}

function StatusIcon({ status }) {
  if (status === 'ok') {
    return (
      <span className="status-icon status-ok">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </span>
    );
  }
  if (status === 'warn') {
    return (
      <span className="status-icon status-warn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="status-icon status-error">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="status-icon status-pending">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </span>
  );
}

const MILESTONES = [
  { key: 'lastChemoDate', label: 'Chemotherapy' },
  { key: 'simDate', label: 'CT Simulation' },
  { key: 'dryRunDate', label: 'Dry Run' },
  { key: 'rtStartDate', label: 'RT Day 1' },
  { key: 'rtEndDate', label: 'Last Fraction' },
  { key: 'surgeryWindowAcceptable', label: 'Acceptable Window' },
  { key: 'surgeryWindowOptimal', label: 'Optimal Window' },
  { key: 'surgeryTarget', label: 'Target Surgery' },
];

function getValue(computed, key) {
  if (!computed) return '\u2014';
  if (key === 'surgeryWindowOptimal' || key === 'surgeryWindowAcceptable') {
    return fmtWindow(computed[key]) || '\u2014';
  }
  if (key === 'rtEndDate') {
    const boost = fmtDate(computed.rtEndDateWithBoost);
    const base = fmtDate(computed.rtEndDate);
    if (boost && boost !== base) return boost;
    return base || '\u2014';
  }
  return fmtDate(computed[key]) || '\u2014';
}

function getSubtext(key, computed) {
  if (!computed) return null;
  switch (key) {
    case 'simDate': {
      const chemo = parseD(computed.lastChemoDate);
      const sim = parseD(computed.simDate);
      if (chemo && sim) {
        const gap = differenceInCalendarDays(sim, chemo);
        return `${gap} days after last chemo (target: 7-14)`;
      }
      return null;
    }
    case 'rtStartDate': {
      const sim = parseD(computed.simDate);
      const rt = parseD(computed.rtStartDate);
      if (sim && rt) {
        const gap = differenceInCalendarDays(rt, sim);
        return `${gap} days after sim (planning: 7-14)`;
      }
      return null;
    }
    case 'rtEndDate': {
      const base = fmtDate(computed.rtEndDate);
      const boost = fmtDate(computed.rtEndDateWithBoost);
      if (boost && boost !== base) {
        return `Base: ${base}`;
      }
      return null;
    }
    default:
      return null;
  }
}

export default function SummaryTable({ primary, secondary, labels = [], warnings = [] }) {
  return (
    <div className="summary-checklist-wrap">
      <h2 className="panel-heading">Treatment Timeline</h2>
      {!primary && <p className="muted">No computed milestones yet.</p>}
      {primary && (
        <div className="summary-checklist">
          {MILESTONES.map(({ key, label }) => {
            const status = getStatus(key, primary, warnings);
            const value = getValue(primary, key);
            const subtext = getSubtext(key, primary);
            const secondaryValue = secondary ? getValue(secondary, key) : null;

            return (
              <div key={key} className={`checklist-row checklist-${status}`}>
                <StatusIcon status={status} />
                <div className="checklist-content">
                  <div className="checklist-label">{label}</div>
                  <div className="checklist-value">{value}</div>
                  {subtext && <div className="checklist-subtext">{subtext}</div>}
                  {secondaryValue && secondaryValue !== value && (
                    <div className="checklist-secondary">
                      {labels[1] || 'Alt'}: {secondaryValue}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
