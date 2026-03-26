import { useState } from 'react';

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
      <div className="input-section">
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
            onChange={(e) => onChange('chemoRegimen', e.target.value)}
          >
            {CHEMO_REGIMENS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className={`ifield${warnFields.has('chemoEndDate') ? ' warn' : ''}`}>
          <span className="ifield-label">Last chemo date</span>
          <input
            type="date"
            value={values.chemoEndDate}
            onChange={(e) => onChange('chemoEndDate', e.target.value)}
          />
        </div>
      </div>

      {/* Radiation */}
      <div className="input-section">
        <h3 className="section-header">Radiation</h3>

        <div className="ifield">
          <span className="ifield-label">Arm</span>
          <div className="pill-group">
            <Pill active={values.arm === 'HF'} onClick={() => onChange('arm', 'HF')}>HF (15fx)</Pill>
            <Pill active={values.arm === 'CF'} onClick={() => onChange('arm', 'CF')}>CF (25fx)</Pill>
            <Pill active={values.arm === 'not_randomized'} onClick={() => onChange('arm', 'not_randomized')}>Both</Pill>
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
            <Pill active={values.location === 'main'} onClick={() => onChange('location', 'main')}>Main Campus</Pill>
            <Pill active={values.location === 'hal'} onClick={() => onChange('location', 'hal')}>HAL</Pill>
          </div>
        </div>

        <div className="ifield">
          <span className="ifield-label">IBC cohort</span>
          <div className="pill-group">
            <Pill active={values.ibcCohort} onClick={() => onChange('ibcCohort', true)}>Yes</Pill>
            <Pill active={!values.ibcCohort} onClick={() => onChange('ibcCohort', false)}>No</Pill>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="input-section">
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

        <div className="ifield">
          <span className="ifield-label">Break days</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.breakDays}
            onChange={(e) => onChange('breakDays', Number(e.target.value))}
          />
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
            <div className="ifield" style={{ marginTop: '0.5rem' }}>
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
    </aside>
  );
}
