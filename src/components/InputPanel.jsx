import { useState } from 'react';
import { REGIMEN_DATA, calculateLastChemoDate } from '../scheduling/regimenData.js';

const CHEMO_REGIMENS = [
  'dd-AC + wkly Taxol',
  'dd-AC + Q2W Taxol',
  'TCHP',
  'Keynote-522',
  'Other',
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`pill${active ? ' active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function InputPanel({ values, onChange, warnings = [] }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileCollapsed, setMobileCollapsed] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(false);
  const simSet = new Set(values.simDayPreference || []);
  const showBoostFx = values.boost === 'yes';

  const toggleSimDay = (day) => {
    const next = new Set(simSet);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange('simDayPreference', [...next]);
  };

  const warnFields = new Set(warnings.map((w) => w.field).filter(Boolean));

  return (
    <aside className={`input-sidebar${mobileCollapsed ? ' collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setMobileCollapsed((v) => !v)}
      >
        {mobileCollapsed ? 'Show Inputs' : 'Hide Inputs'}
      </button>

      {/* Chemotherapy */}
      <div className="input-section input-section--chemo">
        <h3 className="section-header">Chemotherapy</h3>

        <div className="ifield">
          <span className="ifield-label">Neoadjuvant chemo</span>
          <div className="pill-group">
            <Pill active={values.neoadjuvantChemo} onClick={() => onChange('neoadjuvantChemo', true)}>Yes</Pill>
            <Pill active={!values.neoadjuvantChemo} onClick={() => onChange('neoadjuvantChemo', false)}>No</Pill>
          </div>
        </div>

        <div className="ifield">
          <span className="ifield-label">Regimen</span>
          <select
            value={values.chemoRegimen}
            onChange={(e) => {
              const regimen = e.target.value;
              onChange('chemoRegimen', regimen);
              // Recalculate last chemo if start date exists
              if (values.chemoStartDate && regimen !== 'Other' && REGIMEN_DATA[regimen]) {
                try {
                  const result = calculateLastChemoDate(values.chemoStartDate, regimen);
                  onChange('chemoEndDate', result.lastDate);
                } catch {}
              }
            }}
          >
            {CHEMO_REGIMENS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="ifield">
          <span className="ifield-label">First chemo date <span className="ifield-optional">(optional)</span></span>
          <input
            type="date"
            value={values.chemoStartDate || ''}
            onChange={(e) => {
              const startDate = e.target.value;
              onChange('chemoStartDate', startDate);
              // Auto-calculate last chemo date if regimen is known
              if (startDate && values.chemoRegimen && values.chemoRegimen !== 'Other') {
                try {
                  const result = calculateLastChemoDate(startDate, values.chemoRegimen);
                  onChange('chemoEndDate', result.lastDate);
                } catch {}
              }
            }}
          />
          {values.chemoStartDate && values.chemoRegimen && values.chemoRegimen !== 'Other' && REGIMEN_DATA[values.chemoRegimen] && (
            <span className="ifield-hint">
              {REGIMEN_DATA[values.chemoRegimen].totalDurationWeeks} weeks total
            </span>
          )}
        </div>

        <div className={`ifield${warnFields.has('chemoEndDate') ? ' warn' : ''}`}>
          <span className="ifield-label">Last chemo date</span>
          <input
            type="date"
            value={values.chemoEndDate}
            onChange={(e) => onChange('chemoEndDate', e.target.value)}
          />
        </div>

        <div className="ifield">
          <span className="ifield-label">Chemo break days</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.chemoBreakDays}
            onChange={(e) => onChange('chemoBreakDays', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Radiation */}
      <div className="input-section input-section--radiation">
        <h3 className="section-header">Radiation</h3>

        <div className="ifield">
          <span className="ifield-label">Arm</span>
          <div className="pill-group">
            <Pill active={values.arm === 'HF'} onClick={() => onChange('arm', 'HF')}>15-fraction</Pill>
            <Pill active={values.arm === 'CF'} onClick={() => onChange('arm', 'CF')}>25-fraction</Pill>
            <Pill active={values.arm === 'not_randomized'} onClick={() => onChange('arm', 'not_randomized')}>Compare both</Pill>
          </div>
        </div>

        <div className="ifield">
          <span className="ifield-label">Boost</span>
          <div className="pill-group">
            <Pill active={values.boost === 'yes'} onClick={() => onChange('boost', 'yes')}>Yes</Pill>
            <Pill active={values.boost === 'no'} onClick={() => onChange('boost', 'no')}>No</Pill>
            <Pill active={values.boost === 'uncertain'} onClick={() => onChange('boost', 'uncertain')}>Uncertain</Pill>
          </div>
        </div>

        {showBoostFx && (
          <div className="ifield">
            <span className="ifield-label">Boost fractions</span>
            <select
              value={values.boostFractions}
              onChange={(e) => onChange('boostFractions', Number(e.target.value))}
            >
              {[5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        <div className="ifield">
          <span className="ifield-label">Location</span>
          <div className="pill-group">
            <Pill active={values.location === 'main'} onClick={() => { onChange('location', 'main'); onChange('dryRunGap', 0); }}>Main Campus</Pill>
            <Pill active={values.location === 'hal'} onClick={() => { onChange('location', 'hal'); onChange('dryRunGap', 1); }}>HAL</Pill>
          </div>
        </div>

        <div className="ifield">
          <span className="ifield-label">Dry run gap (business days)</span>
          <input
            type="number"
            min={0}
            max={5}
            step={1}
            value={values.dryRunGap}
            onChange={(e) => onChange('dryRunGap', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="input-section input-section--settings">
        <h3 className="section-header">Settings</h3>

        <div className="ifield">
          <span className="ifield-label">Preferred sim day</span>
          <div className="pill-group">
            {WEEKDAYS.map((d) => (
              <Pill key={d} active={simSet.has(d)} onClick={() => toggleSimDay(d)}>
                {d.slice(0, 2)}
              </Pill>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="more-btn"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? 'Hide details' : 'Study ID & Notes'}
        </button>

        {showAdvanced && (
          <>
            <div className="ifield" style={{ marginTop: '0.625rem' }}>
              <span className="ifield-label">Study ID</span>
              <input
                type="text"
                value={values.studyId}
                onChange={(e) => onChange('studyId', e.target.value)}
                placeholder="TOPAz-001"
              />
            </div>

            <div className="ifield">
              <span className="ifield-label">Notes</span>
              <input
                type="text"
                value={values.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                placeholder="Clinical context..."
              />
            </div>
          </>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="input-section">
          <div className="input-warnings">
            {warnings.map((w, i) => (
              <span key={i} className="input-warn-tag">{w.message}</span>
            ))}
          </div>
        </div>
      )}

      <div className="input-section input-section--actions">
        <button
          type="button"
          className="generate-btn"
          title="Clear manual date overrides and recalculate from inputs"
          onClick={() => {
            onChange('simDate', null);
            onChange('rtStartDate', null);
            onChange('surgeryTargetOverride', null);
          }}
        >
          Generate
        </button>
        <button
          type="button"
          className="reset-btn"
          onClick={() => setResetConfirm(true)}
        >
          Reset All
        </button>
      </div>

      {resetConfirm && (
        <div className="admin-overlay" style={{ zIndex: 300 }} onClick={(e) => { if (e.target === e.currentTarget) setResetConfirm(false); }}>
          <div className="pw-card" style={{ gap: '1rem' }}>
            <div className="pw-icon" style={{ fontSize: '1.2rem' }}>Reset All Fields?</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sec)' }}>
              This will clear all inputs and return them to default values. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="admin-btn" onClick={() => setResetConfirm(false)}>Cancel</button>
              <button className="pw-btn" style={{ padding: '0.5rem 1.5rem' }} onClick={() => {
                onChange('chemoEndDate', '');
                onChange('chemoStartDate', '');
                onChange('chemoRegimen', 'dd-AC + wkly Taxol');
                onChange('neoadjuvantChemo', true);
                onChange('arm', 'not_randomized');
                onChange('boost', 'uncertain');
                onChange('boostFractions', 5);
                onChange('location', 'hal');
                onChange('simDayPreference', ['Wednesday']);
                onChange('chemoBreakDays', 0);
                onChange('dryRunGap', 1);
                onChange('studyId', '');
                onChange('notes', '');
                setResetConfirm(false);
              }}>Yes, Reset</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
