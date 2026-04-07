import { useState, useRef, useEffect, useCallback } from 'react';

const TABS = ['Scheduling Rules', 'Holidays', 'About'];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * US federal holidays for 2026 and 2027 pre-populated.
 */
const DEFAULT_HOLIDAYS = [
  { name: "New Year's Day", date: '2026-01-01', tag: 'National' },
  { name: 'MLK Day', date: '2026-01-19', tag: 'National' },
  { name: "Presidents' Day", date: '2026-02-16', tag: 'National' },
  { name: 'Memorial Day', date: '2026-05-25', tag: 'National' },
  { name: 'Juneteenth', date: '2026-06-19', tag: 'National' },
  { name: 'Independence Day', date: '2026-07-03', tag: 'National' },
  { name: 'Labor Day', date: '2026-09-07', tag: 'National' },
  { name: 'Columbus Day', date: '2026-10-12', tag: 'National' },
  { name: 'Veterans Day', date: '2026-11-11', tag: 'National' },
  { name: 'Thanksgiving', date: '2026-11-26', tag: 'National' },
  { name: 'Christmas Day', date: '2026-12-25', tag: 'National' },
  { name: "New Year's Day", date: '2027-01-01', tag: 'National' },
  { name: 'MLK Day', date: '2027-01-18', tag: 'National' },
  { name: "Presidents' Day", date: '2027-02-15', tag: 'National' },
  { name: 'Memorial Day', date: '2027-05-31', tag: 'National' },
  { name: 'Juneteenth', date: '2027-06-18', tag: 'National' },
  { name: 'Independence Day', date: '2027-07-05', tag: 'National' },
  { name: 'Labor Day', date: '2027-09-06', tag: 'National' },
  { name: 'Columbus Day', date: '2027-10-11', tag: 'National' },
  { name: 'Veterans Day', date: '2027-11-11', tag: 'National' },
  { name: 'Thanksgiving', date: '2027-11-25', tag: 'National' },
  { name: 'Christmas Day', date: '2027-12-24', tag: 'National' },
];

export const DEFAULT_SETTINGS = {
  chemoToSimGap: 7,
  simToRtGap: 7,
  surgeryAcceptableStart: 10,
  surgeryAcceptableEnd: 35,
  surgeryOptimalStart: 16,
  surgeryOptimalEnd: 25,
  surgeryTarget: 21,
  treatmentDays: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true },
  allowSaturday: false,
  allowSunday: false,
  holidays: [...DEFAULT_HOLIDAYS],
};

export default function SettingsModal({ open, onClose, settings, onSettingsChange, onOpenAdmin }) {
  const [tab, setTab] = useState(0);
  const overlayRef = useRef(null);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  const updateSetting = useCallback(
    (key, value) => {
      onSettingsChange({ ...settings, [key]: value });
    },
    [settings, onSettingsChange]
  );

  const toggleDay = useCallback(
    (day) => {
      const next = { ...settings.treatmentDays, [day]: !settings.treatmentDays[day] };
      onSettingsChange({ ...settings, treatmentDays: next });
    },
    [settings, onSettingsChange]
  );

  const addHoliday = useCallback(() => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    const holiday = { name: newHolidayName.trim(), date: newHolidayDate, tag: 'Custom' };
    const next = [...settings.holidays, holiday].sort((a, b) => a.date.localeCompare(b.date));
    onSettingsChange({ ...settings, holidays: next });
    setNewHolidayName('');
    setNewHolidayDate('');
  }, [newHolidayName, newHolidayDate, settings, onSettingsChange]);

  const removeHoliday = useCallback(
    (idx) => {
      const next = settings.holidays.filter((_, i) => i !== idx);
      onSettingsChange({ ...settings, holidays: next });
    },
    [settings, onSettingsChange]
  );

  if (!open) return null;

  const rules = [
    { key: 'chemoToSimGap', label: 'Chemo to Sim gap (days)', min: 7, max: 14 },
    { key: 'simToRtGap', label: 'Sim to RT gap (days)', min: 7, max: 14 },
    { key: 'surgeryAcceptableStart', label: 'Surgery acceptable start (days post-RT)', min: 1, max: 60 },
    { key: 'surgeryAcceptableEnd', label: 'Surgery acceptable end (days post-RT)', min: 1, max: 90 },
    { key: 'surgeryOptimalStart', label: 'Surgery optimal start (days post-RT)', min: 1, max: 60 },
    { key: 'surgeryOptimalEnd', label: 'Surgery optimal end (days post-RT)', min: 1, max: 60 },
    { key: 'surgeryTarget', label: 'Surgery target (days post-RT)', min: 1, max: 60 },
  ];

  return (
    <div className="settings-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="settings-modal">
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button
            type="button"
            className="admin-btn"
            style={{ marginLeft: 'auto', marginRight: '0.75rem', fontSize: '0.72rem', padding: '0.3rem 0.75rem' }}
            onClick={() => { onClose(); onOpenAdmin?.(); }}
          >
            Admin Panel
          </button>
          <button type="button" className="settings-close" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              type="button"
              className={`settings-tab${tab === i ? ' active' : ''}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="settings-body">
          {tab === 0 && (
            <div className="settings-rules">
              <div className="rules-grid">
                {rules.map((r) => (
                  <div className="rule-item" key={r.key}>
                    <label className="rule-label">{r.label}</label>
                    <input
                      type="number"
                      className="rule-input"
                      value={settings[r.key]}
                      min={r.min}
                      max={r.max}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v)) updateSetting(r.key, v);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="rules-section">
                <h4 className="rules-section-title">Treatment Days</h4>
                <div className="tx-day-toggles">
                  {DAY_NAMES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`tx-day-pill${settings.treatmentDays[d] ? ' active' : ''}`}
                      onClick={() => toggleDay(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rules-section">
                <h4 className="rules-section-title">Weekend Scheduling</h4>
                <div className="weekend-checks">
                  <label className="weekend-check">
                    <input
                      type="checkbox"
                      checked={settings.allowSaturday}
                      onChange={(e) => updateSetting('allowSaturday', e.target.checked)}
                    />
                    <span>Allow Saturday</span>
                  </label>
                  <label className="weekend-check">
                    <input
                      type="checkbox"
                      checked={settings.allowSunday}
                      onChange={(e) => updateSetting('allowSunday', e.target.checked)}
                    />
                    <span>Allow Sunday</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="settings-holidays">
              <div className="holiday-add-form">
                <input
                  type="text"
                  className="holiday-name-input"
                  placeholder="Holiday name"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                />
                <input
                  type="date"
                  className="holiday-date-input"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                />
                <button
                  type="button"
                  className="holiday-add-btn"
                  onClick={addHoliday}
                  disabled={!newHolidayName.trim() || !newHolidayDate}
                >
                  Add
                </button>
              </div>

              <div className="holiday-list">
                {settings.holidays.map((h, i) => (
                  <div className="holiday-row" key={`${h.date}-${h.name}-${i}`}>
                    <div className="holiday-info">
                      <span className="holiday-name">{h.name}</span>
                      <span className={`holiday-tag${h.tag === 'National' ? ' national' : ' custom'}`}>
                        {h.tag}
                      </span>
                    </div>
                    <span className="holiday-date">{h.date}</span>
                    <button
                      type="button"
                      className="holiday-remove"
                      onClick={() => removeHoliday(i)}
                      title="Remove holiday"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="settings-about">
              <div className="about-block">
                <h4>TOPAz Scheduling Assistant</h4>
                <p>
                  A clinical trial treatment scheduling tool designed for the TOPAz protocol. 
                  Generates RT, simulation, and surgery window timelines based on protocol-defined 
                  constraints, arm randomization, and boost scenarios.
                </p>
              </div>
              <div className="about-block">
                <h4>Version</h4>
                <p>1.0.0</p>
              </div>
              <div className="about-block">
                <h4>Protocol Reference</h4>
                <p>
                  TOPAz (Tailored Optimal Post-mastectomy Adjuvant therapy) — a randomized trial 
                  comparing hypofractionated (15 fx) and conventionally fractionated (25 fx) 
                  post-mastectomy radiation therapy with optional tumor-bed boost, followed by 
                  delayed reconstruction surgery within defined windows.
                </p>
              </div>
              <div className="about-block about-disclaimer">
                <h4>Disclaimer</h4>
                <p>
                  This tool provides scheduling suggestions based on protocol parameters. All dates 
                  are estimates and must be verified against the official protocol document, 
                  institutional policies, and individual patient considerations. This tool does not 
                  constitute medical advice. Always consult the treating physician and study 
                  coordinator before finalizing any treatment schedule.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
