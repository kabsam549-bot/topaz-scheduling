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

function cellClasses(day, layers, hasSecondary) {
  const hits = layers.filter((l) =>
    isWithinInterval(day, { start: l.start, end: l.end })
  );
  if (hits.length === 0) return '';
  hits.sort((a, b) => (TYPE_PRIORITY[b.type] || 0) - (TYPE_PRIORITY[a.type] || 0));
  const cls = [];
  const seen = new Set();
  for (const h of hits) {
    if (seen.has(h.type)) continue;
    seen.add(h.type);
    const ov = hasSecondary && h.scenarioIdx === 1 ? ' overlay' : '';
    cls.push(`cell-${h.type}${ov}`);
  }
  return cls.join(' ');
}

function getMilestoneInfo(day, primary, secondary, chemoEndDate) {
  const hits = [];

  // Check chemo end date
  const chemoD = parseD(chemoEndDate);
  if (chemoD && isSameDay(day, chemoD)) {
    hits.push({ field: 'chemoEnd', name: 'Last Chemo', label: '', draggable: false });
  }

  const check = (c, label) => {
    if (!c) return;
    for (const [field, name] of Object.entries(DRAGGABLE_MILESTONES)) {
      const d = parseD(c[field]);
      if (d && isSameDay(day, d)) hits.push({ field, name, label, draggable: true });
    }
    const dryD = parseD(c.dryRunDate);
    if (dryD && isSameDay(day, dryD)) hits.push({ field: 'dryRunDate', name: 'Dry Run', label, draggable: false });
    const endD = parseD(c.rtEndDateWithBoost || c.rtEndDate);
    if (endD && isSameDay(day, endD)) hits.push({ field: 'rtEnd', name: 'RT End', label, draggable: false });
  };
  check(primary, 'A');
  if (secondary) check(secondary, 'B');
  return hits;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({
  primary,
  secondary,
  labels = [],
  chemoEndDate,
  onMilestoneDrag,
}) {
  const layers = useMemo(() => buildLayers(primary, secondary), [primary, secondary]);

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
    // Include chemo end date as an anchor so calendar starts earlier
    if (chemoEndDate) dates.push(chemoEndDate);
    return dates.map(parseD).filter(Boolean);
  }, [primary, secondary, chemoEndDate]);

  const autoMonth = anchors.length > 0
    ? startOfMonth(anchors.reduce((a, b) => (a < b ? a : b), anchors[0]))
    : startOfMonth(new Date());

  const [viewMonths, setViewMonths] = useState(3);
  const viewOptions = [1, 2, 3];
  const [navMonth, setNavMonth] = useState(null);
  const baseMonth = navMonth || autoMonth;

  const prev = () => setNavMonth(subMonths(navMonth || autoMonth, viewMonths === 1 ? 1 : 3));
  const next = () => setNavMonth(addMonths(navMonth || autoMonth, viewMonths === 1 ? 1 : 3));
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
    <div className="calendar-panel" id="topaz-calendar-export">
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button type="button" className="cal-nav-btn" onClick={prev}>&#8249;</button>
          <span className="cal-nav-label">
            {viewMonths === 1
              ? format(baseMonth, 'MMMM yyyy')
              : `${format(months[0], 'MMM yyyy')} \u2013 ${format(months[months.length - 1], 'MMM yyyy')}`}
          </span>
          <button type="button" className="cal-nav-btn" onClick={next}>&#8250;</button>
          <button type="button" className="cal-nav-btn cal-today-btn" onClick={today}>Today</button>
        </div>

        <div className="cal-controls">
          <div className="seg-group">
            {viewOptions.map((n) => (
              <button
                key={n}
                type="button"
                className={`seg-btn${viewMonths === n ? ' active' : ''}`}
                onClick={() => setViewMonths(n)}
              >
                {n} Mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {!primary && (
        <div className="cal-empty">
          Enter a last chemo date to see the treatment timeline.
        </div>
      )}

      {primary && (
        <div className={`cal-grid-wrap months-${viewMonths}`}>
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
    <div className="month-block">
      <div className="month-header">{format(monthStart, 'MMMM yyyy')}</div>
      <div className="dow-row">
        {DOW.map((d) => (
          <div key={d} className="dow-cell">{d}</div>
        ))}
      </div>
      <div className="day-grid">
        {cells.map((day, idx) =>
          day ? (
            <DayCell
              key={format(day, 'yyyy-MM-dd')}
              day={day}
              layers={layers}
              primary={primary}
              secondary={secondary}
              chemoEndDate={chemoEndDate}
              hasSecondary={hasSecondary}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isDragging={isDragging}
            />
          ) : (
            <div key={`pad-${idx}`} className="day-cell pad" />
          )
        )}
      </div>
    </div>
  );
}

function DayCell({
  day, layers, primary, secondary, chemoEndDate, hasSecondary,
  onDragStart, onDrop, onDragEnd, isDragging,
}) {
  const we = isWeekend(day);
  const cls = cellClasses(day, layers, hasSecondary);
  const milestones = getMilestoneInfo(day, primary, secondary, chemoEndDate);
  const isTarget = milestones.some((m) => m.field === 'surgeryTarget');
  const isChemoEnd = milestones.some((m) => m.field === 'chemoEnd');

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

  const isToday = isSameDay(day, new Date());

  return (
    <div
      className={[
        'day-cell',
        we && 'weekend',
        cls,
        isTarget && 'cell-target',
        isChemoEnd && 'cell-chemo-end',
        isToday && 'cell-today',
        isDragging && !we && 'drop-target',
      ].filter(Boolean).join(' ')}
      onDragOver={handleDragOver}
      onDrop={handleDropEvt}
    >
      <span className="day-num">{format(day, 'd')}</span>
      {milestones.length > 0 && (
        <div className="milestone-tags">
          {milestones.map((m, i) => (
            <span
              key={i}
              className={`mtag${m.draggable ? ' draggable' : ''}${m.field === 'chemoEnd' ? ' mtag-chemo' : ''}`}
              draggable={m.draggable}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', m.field);
                onDragStart(m.field);
              }}
              onDragEnd={onDragEnd}
              title={m.draggable ? `Drag to reschedule ${m.name}` : m.name}
            >
              {m.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
