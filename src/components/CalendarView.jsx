import { useCallback, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isWeekend,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';

function parseD(s) {
  if (!s) return null;
  if (s instanceof Date) return startOfDay(s);
  const d = parseISO(s);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

const DRAGGABLE_MILESTONES = {
  simDate: 'SIM',
  rtStartDate: 'RT Start',
  surgeryTarget: 'Surgery',
};

function buildLayers(primary, secondary) {
  const layers = [];
  if (!primary) return layers;

  const push = (start, end, type, idx = 0) => {
    const s = parseD(start);
    const e = parseD(end);
    if (s && e) layers.push({ start: s, end: e, type, scenarioIdx: idx });
  };

  const addFromComputed = (c, idx) => {
    if (!c) return;
    push(c.rtStartDate, c.rtEndDate, 'rt', idx);
    if (c.rtEndDateWithBoost && c.rtEndDateWithBoost !== c.rtEndDate) {
      const bs = parseD(c.rtEndDate);
      if (bs) push(addDays(bs, 1), c.rtEndDateWithBoost, 'boost', idx);
    }
    const acc = c.surgeryWindowAcceptable;
    if (acc) push(acc.start, acc.end, 'acceptable', idx);
    const opt = c.surgeryWindowOptimal;
    if (opt) push(opt.start, opt.end, 'optimal', idx);
  };

  addFromComputed(primary, 0);
  if (secondary) addFromComputed(secondary, 1);
  return layers;
}

const TYPE_PRIORITY = { target: 6, optimal: 5, acceptable: 3, boost: 2, rt: 1 };

function cellType(day, layers) {
  const hits = layers.filter((l) =>
    isWithinInterval(day, { start: l.start, end: l.end })
  );
  if (hits.length === 0) return null;
  hits.sort((a, b) => (TYPE_PRIORITY[b.type] || 0) - (TYPE_PRIORITY[a.type] || 0));
  return hits[0].type;
}

function getMilestoneInfo(day, primary, secondary, chemoEndDate) {
  const hits = [];

  const chemoD = parseD(chemoEndDate);
  if (chemoD && isSameDay(day, chemoD)) {
    hits.push({ field: 'chemoEnd', code: 'Chemo End', draggable: false });
  }

  const check = (c) => {
    if (!c) return;
    for (const [field, code] of Object.entries(DRAGGABLE_MILESTONES)) {
      const d = parseD(c[field]);
      if (d && isSameDay(day, d)) hits.push({ field, code, draggable: true });
    }
    const dryD = parseD(c.dryRunDate);
    if (dryD && isSameDay(day, dryD)) hits.push({ field: 'dryRunDate', code: 'Dry Run', draggable: false });
    const endD = parseD(c.rtEndDateWithBoost || c.rtEndDate);
    if (endD && isSameDay(day, endD)) hits.push({ field: 'rtEnd', code: 'RT End', draggable: false });
  };
  check(primary);
  if (secondary) check(secondary);
  return hits;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEW_LABELS = { 1: '1 Month', 2: '2 Months', 3: '3 Months' };

export default function CalendarView({
  primary,
  secondary,
  labels = [],
  chemoEndDate,
  onMilestoneDrag,
  forceViewMonths,
}) {
  const layers = useMemo(() => buildLayers(primary, secondary), [primary, secondary]);

  // Default snap: surgery target month if available, else earliest anchor
  const surgeryMonth = useMemo(() => {
    const target = parseD(primary?.surgeryTarget);
    if (target) return startOfMonth(target);
    const optStart = parseD(primary?.surgeryWindowOptimal?.start);
    if (optStart) return startOfMonth(optStart);
    return null;
  }, [primary]);

  const anchors = useMemo(() => {
    const dates = [
      primary?.simDate,
      primary?.rtStartDate,
      primary?.rtEndDate,
      primary?.rtEndDateWithBoost,
      primary?.surgeryWindowAcceptable?.end,
      secondary?.rtEndDateWithBoost,
      secondary?.surgeryWindowAcceptable?.end,
    ];
    if (chemoEndDate) dates.push(chemoEndDate);
    return dates.map(parseD).filter(Boolean);
  }, [primary, secondary, chemoEndDate]);

  const earliestMonth = anchors.length > 0
    ? startOfMonth(anchors.reduce((a, b) => (a < b ? a : b), anchors[0]))
    : startOfMonth(new Date());

  // Default to 1 month, snapped to surgery
  const [_viewMonths, setViewMonths] = useState(1);
  const viewMonths = forceViewMonths ?? _viewMonths;
  const viewOptions = [1, 2, 3];
  const [navMonth, setNavMonth] = useState(null);

  const baseMonth = navMonth || (viewMonths === 1 && surgeryMonth ? surgeryMonth : earliestMonth);

  const prev = () => setNavMonth(subMonths(navMonth || baseMonth, 1));
  const next = () => setNavMonth(addMonths(navMonth || baseMonth, 1));
  const today = () => setNavMonth(null);

  const months = useMemo(() => {
    const arr = [];
    for (let i = 0; i < viewMonths; i++) arr.push(addMonths(baseMonth, i));
    return arr;
  }, [baseMonth, viewMonths]);

  const [dragField, setDragField] = useState(null);

  const handleDragStart = useCallback((field) => {
    setDragField(field);
  }, []);

  const handleDrop = useCallback(
    (day) => {
      if (dragField && onMilestoneDrag) {
        onMilestoneDrag(dragField, format(day, 'yyyy-MM-dd'));
      }
      setDragField(null);
    },
    [dragField, onMilestoneDrag]
  );

  const handleDragEnd = useCallback(() => setDragField(null), []);

  return (
    <div className="cal-panel" id="topaz-calendar-export">
      <div className="cal-header">
        <div className="cal-nav">
          <button type="button" className="cal-arrow" onClick={prev}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 className="cal-title">
            {viewMonths === 1
              ? format(baseMonth, 'MMMM yyyy')
              : `${format(months[0], 'MMM')} \u2013 ${format(months[months.length - 1], 'MMM yyyy')}`}
          </h2>
          <button type="button" className="cal-arrow" onClick={next}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div className="cal-actions">
          <button type="button" className="cal-today" onClick={today}>Today</button>
          <div className="cal-view-toggle">
            {viewOptions.map((n) => (
              <button
                key={n}
                type="button"
                className={`cal-view-btn${viewMonths === n ? ' active' : ''}`}
                onClick={() => { setViewMonths(n); setNavMonth(null); }}
              >
                {VIEW_LABELS[n]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!primary && (
        <div className="cal-empty">
          Enter a last chemo date to generate the treatment timeline.
        </div>
      )}

      {primary && (
        <div className="cal-months cal-months-stack">
          {months.map((ms) => (
            <MonthGrid
              key={format(ms, 'yyyy-MM')}
              monthStart={ms}
              layers={layers}
              primary={primary}
              secondary={secondary}
              chemoEndDate={chemoEndDate}
              hasSecondary={!!secondary}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={!!dragField}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  monthStart, layers, primary, secondary, chemoEndDate, hasSecondary,
  onDragStart, onDrop, onDragEnd, isDragging,
}) {
  const start = startOfMonth(monthStart);
  const end = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start, end });
  const leadPad = getDay(start);
  const cells = [];
  for (let i = 0; i < leadPad; i++) cells.push(null);
  days.forEach((d) => cells.push(d));

  return (
    <div className="cal-month">
      <div className="cal-month-name">{format(monthStart, 'MMMM yyyy')}</div>
      <div className="cal-dow">
        {DOW.map((d, i) => (
          <div key={i} className="cal-dow-cell">{d}</div>
        ))}
      </div>
      <div className="cal-days">
        {cells.map((day, idx) =>
          day ? (
            <DayCell
              key={format(day, 'yyyy-MM-dd')}
              day={day}
              layers={layers}
              primary={primary}
              secondary={secondary}
              chemoEndDate={chemoEndDate}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isDragging={isDragging}
            />
          ) : (
            <div key={`pad-${idx}`} className="cal-day empty" />
          )
        )}
      </div>
    </div>
  );
}

function DayCell({
  day, layers, primary, secondary, chemoEndDate,
  onDragStart, onDrop, onDragEnd, isDragging,
}) {
  const we = isWeekend(day);
  const type = cellType(day, layers);
  const milestones = getMilestoneInfo(day, primary, secondary, chemoEndDate);
  const isTarget = milestones.some((m) => m.field === 'surgeryTarget');
  const isChemoEnd = milestones.some((m) => m.field === 'chemoEnd');
  const isToday = isSameDay(day, new Date());

  const handleDragOver = (e) => {
    if (isDragging && !we) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDropEvt = (e) => {
    e.preventDefault();
    onDrop(day);
  };

  const classes = [
    'cal-day',
    we && 'we',
    type && `t-${type}`,
    isTarget && 't-target',
    isChemoEnd && 't-chemo',
    isToday && 'today',
    isDragging && !we && 'droppable',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onDragOver={handleDragOver}
      onDrop={handleDropEvt}
    >
      <span className={`cal-num${isToday ? ' cal-num-today' : ''}`}>{format(day, 'd')}</span>
      {milestones.length > 0 && (
        <div className="cal-events">
          {/* Show only one label if multiple overlap -- pick the most important */}
          {(() => {
            const priority = ['surgeryTarget', 'rtStartDate', 'simDate', 'chemoEnd', 'rtEnd', 'dryRunDate'];
            const seen = new Set();
            return milestones
              .sort((a, b) => priority.indexOf(a.field) - priority.indexOf(b.field))
              .filter(m => {
                if (seen.size > 0) return false; // only show one label per cell
                seen.add(m.field);
                return true;
              })
              .map((m, i) => (
                <span
                  key={i}
                  className={`cal-tag tag-${m.field}${m.draggable ? ' draggable' : ''}`}
                  draggable={m.draggable}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', m.field);
                    onDragStart(m.field);
                  }}
                  onDragEnd={onDragEnd}
                  title={m.draggable ? `Drag to reschedule` : m.code}
                >
                  {m.code}
                </span>
              ));
          })()}
        </div>
      )}
    </div>
  );
}
