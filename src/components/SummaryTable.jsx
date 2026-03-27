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
    case 'chemoStart':
      return computed.lastChemoDate ? 'ok' : 'pending';
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
      const sim = parseD(computed.simDate);
      const rt = parseD(computed.rtStartDate);
      if (!rt) return 'pending';
      if (sim && differenceInCalendarDays(rt, sim) < 1) return 'error';
      if (sim) {
        const g = differenceInCalendarDays(rt, sim);
        if (g < 7 || g > 14) return 'warn';
      }
      return 'ok';
    }
    case 'rtEndDate':
      return (computed.rtEndDateWithBoost || computed.rtEndDate) ? 'ok' : 'pending';
    case 'surgeryWindowAcceptable':
      return computed.surgeryWindowAcceptable?.start ? 'ok' : 'pending';
    case 'surgeryWindowOptimal':
      return computed.surgeryWindowOptimal?.start ? 'ok' : 'pending';
    case 'surgeryTarget': {
      if (!computed.surgeryTarget) return 'pending';
      const target = computed.surgeryTarget;
      const acc = computed.surgeryWindowAcceptable;
      if (acc && acc.start && acc.end) {
        if (target < acc.start || target > acc.end) return 'error';
      }
      const opt = computed.surgeryWindowOptimal;
      if (opt && opt.start && opt.end) {
        if (target < opt.start || target > opt.end) return 'warn';
      }
      return 'ok';
    }
    default:
      return 'pending';
  }
}

function StatusIcon({ status }) {
  if (status === 'ok') {
    return (
      <svg className="tl-icon tl-icon-ok" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    );
  }
  if (status === 'warn') {
    return (
      <svg className="tl-icon tl-icon-warn" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg className="tl-icon tl-icon-error" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    );
  }
  // pending = wireframe circle
  return (
    <svg className="tl-icon tl-icon-pending" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
}

const MILESTONES = [
  { key: 'chemoStart', label: 'Chemo Start' },
  { key: 'lastChemoDate', label: 'Chemo End' },
  { key: 'simDate', label: 'CT Simulation' },
  { key: 'dryRunDate', label: 'Dry Run' },
  { key: 'rtStartDate', label: 'RT Start' },
  { key: 'rtEndDate', label: 'Last RT Fraction' },
  { key: 'surgeryWindowAcceptable', label: 'Acceptable Surgical Window' },
  { key: 'surgeryWindowOptimal', label: 'Optimal Surgical Window' },
  { key: 'surgeryTarget', label: 'Ideal Target Surgery Date' },
];

function getValue(computed, key, chemoStartDate) {
  if (!computed) return '\u2014';
  if (key === 'chemoStart') return chemoStartDate ? fmtDate(chemoStartDate) : '\u2014';
  if (key === 'surgeryWindowOptimal' || key === 'surgeryWindowAcceptable') return fmtWindow(computed[key]) || '\u2014';
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
      if (chemo && sim) return `${differenceInCalendarDays(sim, chemo)}d after chemo end`;
      return null;
    }
    case 'rtStartDate': {
      const sim = parseD(computed.simDate);
      const rt = parseD(computed.rtStartDate);
      if (sim && rt) return `${differenceInCalendarDays(rt, sim)}d planning gap`;
      return null;
    }
    case 'rtEndDate': {
      const base = fmtDate(computed.rtEndDate);
      const boost = fmtDate(computed.rtEndDateWithBoost);
      if (boost && boost !== base) return `Base ends: ${base}`;
      return null;
    }
    case 'surgeryTarget': {
      const target = computed.surgeryTarget;
      const acc = computed.surgeryWindowAcceptable;
      const opt = computed.surgeryWindowOptimal;
      if (!target) return null;
      if (acc && (target < acc.start || target > acc.end)) return 'Outside acceptable window';
      if (opt && (target >= opt.start && target <= opt.end)) return 'Within optimal window';
      if (acc && (target >= acc.start && target <= acc.end)) return 'Within acceptable window';
      return null;
    }
    default:
      return null;
  }
}

export default function SummaryTable({ primary, secondary, labels = [], warnings = [], chemoStartDate = '' }) {
  return (
    <div className="tl-wrap">
      <h2 className="panel-heading">Treatment Timeline</h2>
      {!primary && <p className="muted">No computed milestones yet.</p>}
      {primary && (
        <div className="tl-list">
          {MILESTONES.map(({ key, label }) => {
            const status = getStatus(key, primary);
            const value = getValue(primary, key, chemoStartDate);
            const subtext = getSubtext(key, primary);

            return (
              <div key={key} className={`tl-row tl-${status}`}>
                <StatusIcon status={status} />
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
