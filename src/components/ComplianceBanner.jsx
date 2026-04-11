import { parseISO, differenceInCalendarDays, format } from 'date-fns';

function parseD(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  try { return parseISO(s); } catch { return null; }
}

function fmtDate(s) {
  const d = parseD(s);
  if (!d) return null;
  return format(d, 'EEE, MMM d, yyyy');
}

export function computeCompliance(primary) {
  if (!primary) {
    return { status: 'pending', message: 'Enter patient data to compute compliance', detail: null };
  }
  const target = parseD(primary.surgeryTarget);
  const rtEnd = parseD(primary.rtEndDateWithBoost || primary.rtEndDate);
  const acc = primary.surgeryWindowAcceptable;
  const opt = primary.surgeryWindowOptimal;

  if (!target || !rtEnd) {
    return { status: 'pending', message: 'Awaiting schedule', detail: null };
  }

  const daysPostRt = differenceInCalendarDays(target, rtEnd);
  const targetLabel = fmtDate(target);

  const accStart = parseD(acc?.start);
  const accEnd = parseD(acc?.end);
  const optStart = parseD(opt?.start);
  const optEnd = parseD(opt?.end);

  if (accStart && accEnd && (target < accStart || target > accEnd)) {
    return {
      status: 'error',
      message: 'Protocol deviation',
      detail: `Target surgery ${targetLabel} · day ${daysPostRt} post-RT is outside the acceptable window. Review required.`,
    };
  }

  if (optStart && optEnd && target >= optStart && target <= optEnd) {
    return {
      status: 'ok',
      message: 'Schedule compliant',
      detail: `Target surgery ${targetLabel} · day ${daysPostRt} post-RT is inside the optimal window.`,
    };
  }

  if (accStart && accEnd && target >= accStart && target <= accEnd) {
    return {
      status: 'warn',
      message: 'Review recommended',
      detail: `Target surgery ${targetLabel} · day ${daysPostRt} post-RT is inside the acceptable window but outside optimal.`,
    };
  }

  return {
    status: 'pending',
    message: 'Awaiting schedule',
    detail: null,
  };
}

function Icon({ status }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2.3, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (status === 'ok') {
    return (
      <svg {...common} stroke="#16a34a" aria-hidden>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="9 12 11 14 15.5 9.5"/>
      </svg>
    );
  }
  if (status === 'warn') {
    return (
      <svg {...common} stroke="#d97706" aria-hidden>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg {...common} stroke="#dc2626" aria-hidden>
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    );
  }
  return (
    <svg {...common} stroke="#9ca3af" aria-hidden>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <circle cx="12" cy="16" r="0.6" fill="#9ca3af"/>
    </svg>
  );
}

export default function ComplianceBanner({ primary, onClick }) {
  const { status, message, detail } = computeCompliance(primary);
  const className = `compliance-banner compliance-${status}`;
  const content = (
    <>
      <Icon status={status} />
      <div className="compliance-text">
        <div className="compliance-message">{message}</div>
        {detail && <div className="compliance-detail">{detail}</div>}
      </div>
    </>
  );

  if (onClick && status !== 'pending') {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className={className} role="status">{content}</div>;
}
