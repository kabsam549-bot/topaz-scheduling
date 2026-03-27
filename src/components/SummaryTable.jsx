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

/** Check if milestone is within protocol-acceptable range */
function getStatus(key, computed) {
  if (!computed) return 'pending';

  switch (key) {
    case 'lastChemoDate':
      return computed.lastChemoDate ? 'ok' : 'pending';

    case 'simDate': {
      // 7-14 days after last chemo
      const chemo = parseD(computed.lastChemoDate);
      const sim = parseD(computed.simDate);
      if (!chemo || !sim) return 'pending';
      const gap = differenceInCalendarDays(sim, chemo);
      if (gap >= 7 && gap <= 14) return 'ok';
      return 'warn';
    }

    case 'dryRunDate':
      return computed.dryRunDate ? 'ok' : 'pending';

    case 'rtStartDate': {
      // Should be within 8 weeks of chemo end
      const chemo = parseD(computed.lastChemoDate);
      const rt = parseD(computed.rtStartDate);
      if (!chemo || !rt) return 'pending';
      const gap = differenceInCalendarDays(rt, chemo);
      if (gap <= 56) return 'ok';
      return 'warn';
    }

    case 'rtEndDate':
      return computed.rtEndDateWithBoost || computed.rtEndDate ? 'ok' : 'pending';

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
    );
  }
  if (status === 'warn') {
    return (
      <span className="status-icon status-warn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="status-icon status-pending">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </span>
  );
}

const MILESTONES = [
  { key: 'lastChemoDate', label: 'Last chemotherapy' },
  { key: 'simDate', label: 'CT simulation' },
  { key: 'dryRunDate', label: 'Dry run' },
  { key: 'rtStartDate', label: 'RT day 1' },
  { key: 'rtEndDate', label: 'Last fraction' },
  { key: 'surgeryWindowAcceptable', label: 'Surgery acceptable window' },
  { key: 'surgeryWindowOptimal', label: 'Surgery optimal window' },
  { key: 'surgeryTarget', label: 'Target surgery date' },
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

export default function SummaryTable({ primary, secondary, labels = [] }) {
  return (
    <div className="summary-checklist-wrap">
      <h2 className="panel-heading">Treatment Timeline</h2>
      {!primary && <p className="muted">No computed milestones yet.</p>}
      {primary && (
        <div className="summary-checklist">
          {MILESTONES.map(({ key, label }) => {
            const status = getStatus(key, primary);
            const value = getValue(primary, key);
            const secondaryValue = secondary ? getValue(secondary, key) : null;

            return (
              <div key={key} className={`checklist-row ${status}`}>
                <StatusIcon status={status} />
                <div className="checklist-content">
                  <div className="checklist-label">{label}</div>
                  <div className="checklist-value">{value}</div>
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
