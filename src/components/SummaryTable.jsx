import { parseISO, differenceInCalendarDays, format } from 'date-fns';

function parseD(s) {
  if (!s) return null;
  try { return parseISO(s); } catch { return null; }
}

function fmtDate(s) {
  const d = parseD(s);
  if (!d) return null;
  return format(d, 'MMM d, yyyy');
}

function fmtShort(s) {
  const d = parseD(s);
  if (!d) return null;
  return format(d, 'MMM d');
}

function fmtWindow(w) {
  if (!w || !w.start) return null;
  return `${fmtShort(w.start)} \u2013 ${fmtShort(w.end)}`;
}

function getStatus(key, computed) {
  if (!computed) return 'pending';

  switch (key) {
    case 'lastChemoDate':
      return computed.lastChemoDate ? 'ok' : 'pending';

    case 'simDate': {
      const chemo = parseD(computed.lastChemoDate);
      const sim = parseD(computed.simDate);
      if (!chemo || !sim) return 'pending';
      const gap = differenceInCalendarDays(sim, chemo);
      if (gap < 7) return 'error';
      if (gap > 14) return 'warn';
      return 'ok';
    }

    case 'dryRunDate': {
      const dry = parseD(computed.dryRunDate);
      const rt = parseD(computed.rtStartDate);
      if (!dry || !rt) return 'pending';
      if (differenceInCalendarDays(rt, dry) < 0) return 'error';
      return 'ok';
    }

    case 'rtStartDate': {
      const chemo = parseD(computed.lastChemoDate);
      const sim = parseD(computed.simDate);
      const rt = parseD(computed.rtStartDate);
      if (!rt) return 'pending';
      if (sim && differenceInCalendarDays(rt, sim) < 1) return 'error';
      if (chemo && differenceInCalendarDays(rt, chemo) > 56) return 'warn';
      if (sim) {
        const planGap = differenceInCalendarDays(rt, sim);
        if (planGap < 7 || planGap > 14) return 'warn';
      }
      return 'ok';
    }

    case 'rtEndDate':
      return (computed.rtEndDateWithBoost || computed.rtEndDate) ? 'ok' : 'pending';

    case 'surgeryWindowAcceptable':
      return computed.surgeryWindowAcceptable?.start ? 'ok' : 'pending';

    case 'surgeryWindowOptimal':
      return computed.surgeryWindowOptimal?.start ? 'ok' : 'pending';

    case 'surgeryTarget':
      return computed.surgeryTarget ? 'ok' : 'pending';

    default:
      return 'pending';
  }
}

function StatusDot({ status }) {
  const colors = {
    ok: '#16a34a',
    warn: '#d97706',
    error: '#dc2626',
    pending: '#d1d5db',
  };
  return (
    <span className="tl-dot" style={{ background: colors[status] || colors.pending }} />
  );
}

const MILESTONES = [
  { key: 'lastChemoDate', label: 'Chemotherapy', icon: 'chemo' },
  { key: 'simDate', label: 'CT Simulation', icon: 'sim' },
  { key: 'dryRunDate', label: 'Dry Run', icon: 'dry' },
  { key: 'rtStartDate', label: 'RT Day 1', icon: 'rt' },
  { key: 'rtEndDate', label: 'Last Fraction', icon: 'rt' },
  { key: 'surgeryWindowAcceptable', label: 'Acceptable Window', icon: 'window' },
  { key: 'surgeryWindowOptimal', label: 'Optimal Window', icon: 'window' },
  { key: 'surgeryTarget', label: 'Target Surgery', icon: 'surgery' },
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
        return `${gap}d after chemo`;
      }
      return null;
    }
    case 'rtStartDate': {
      const sim = parseD(computed.simDate);
      const rt = parseD(computed.rtStartDate);
      if (sim && rt) {
        const gap = differenceInCalendarDays(rt, sim);
        return `${gap}d after sim`;
      }
      return null;
    }
    case 'rtEndDate': {
      const base = fmtDate(computed.rtEndDate);
      const boost = fmtDate(computed.rtEndDateWithBoost);
      if (boost && boost !== base) return `Base: ${base}`;
      return null;
    }
    default:
      return null;
  }
}

export default function SummaryTable({ primary, secondary, labels = [], warnings = [] }) {
  return (
    <div className="tl-wrap">
      <h2 className="panel-heading">Treatment Timeline</h2>
      {!primary && <p className="muted">No computed milestones yet.</p>}
      {primary && (
        <div className="tl-list">
          {MILESTONES.map(({ key, label, icon }, idx) => {
            const status = getStatus(key, primary);
            const value = getValue(primary, key);
            const subtext = getSubtext(key, primary);
            const isLast = idx === MILESTONES.length - 1;

            return (
              <div key={key} className={`tl-row tl-${status}`}>
                <div className="tl-indicator">
                  <StatusDot status={status} />
                  {!isLast && <div className="tl-line" />}
                </div>
                <div className="tl-content">
                  <div className="tl-top">
                    <span className="tl-label">{label}</span>
                    <span className="tl-value">{value}</span>
                  </div>
                  {subtext && <div className="tl-sub">{subtext}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
