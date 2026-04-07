import { useState, useEffect } from 'react';
import { REGIMEN_DATA } from '../scheduling/regimenData.js';
import { DEFAULT_SETTINGS } from './SettingsModal.jsx';

const ADMIN_TABS = ['Scheduling Rules', 'Holidays', 'Regimens'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function AdminPanel({ open, onClose, settings, onSettingsChange }) {
  const [tab, setTab] = useState(0);
  const [localSettings, setLocalSettings] = useState(() => ({ ...settings }));
  const [regimens, setRegimens] = useState(() =>
    Object.entries(REGIMEN_DATA).map(([name, data]) => ({
      name,
      totalDurationWeeks: data.totalDurationWeeks,
      totalDurationDays: data.totalDurationDays,
      phases: data.phases.map((p) => ({ ...p })),
    }))
  );
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  useEffect(() => {
    if (open) setLocalSettings({ ...settings });
  }, [open, settings]);

  if (!open) return null;

  const updateRule = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applySettings = () => {
    onSettingsChange(localSettings);
  };

  const addHoliday = () => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    const next = {
      ...localSettings,
      holidays: [
        ...localSettings.holidays,
        { name: newHolidayName.trim(), date: newHolidayDate, tag: 'Custom' },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    };
    setLocalSettings(next);
    setNewHolidayName('');
    setNewHolidayDate('');
  };

  const removeHoliday = (idx) => {
    setLocalSettings((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== idx),
    }));
  };

  const exportConfig = () => {
    const config = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      schedulingRules: {
        chemoToSimGap: localSettings.chemoToSimGap,
        simToRtGap: localSettings.simToRtGap,
        surgeryAcceptableStart: localSettings.surgeryAcceptableStart,
        surgeryAcceptableEnd: localSettings.surgeryAcceptableEnd,
        surgeryOptimalStart: localSettings.surgeryOptimalStart,
        surgeryOptimalEnd: localSettings.surgeryOptimalEnd,
        surgeryTarget: localSettings.surgeryTarget,
        treatmentDays: localSettings.treatmentDays,
        allowSaturday: localSettings.allowSaturday,
        allowSunday: localSettings.allowSunday,
      },
      holidays: localSettings.holidays,
      regimens: regimens.reduce((acc, r) => {
        acc[r.name] = {
          totalDurationWeeks: r.totalDurationWeeks,
          totalDurationDays: r.totalDurationDays,
          phases: r.phases,
        };
        return acc;
      }, {}),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topaz-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const RULES = [
    { key: 'chemoToSimGap', label: 'Chemo → Sim gap (days)', min: 1, max: 30 },
    { key: 'simToRtGap', label: 'Sim → RT gap (days)', min: 1, max: 30 },
    { key: 'surgeryAcceptableStart', label: 'Surgery acceptable start (days post-RT)', min: 1, max: 60 },
    { key: 'surgeryAcceptableEnd', label: 'Surgery acceptable end (days post-RT)', min: 1, max: 90 },
    { key: 'surgeryOptimalStart', label: 'Surgery optimal start (days post-RT)', min: 1, max: 60 },
    { key: 'surgeryOptimalEnd', label: 'Surgery optimal end (days post-RT)', min: 1, max: 60 },
    { key: 'surgeryTarget', label: 'Surgery target (days post-RT)', min: 1, max: 60 },
  ];

  return (
    <div className="admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="admin-btn" onClick={onClose}>Close</button>
        </div>

        <div className="admin-tabs">
          {ADMIN_TABS.map((t, i) => (
            <button
              key={t}
              className={`admin-tab${tab === i ? ' active' : ''}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="admin-body">
          {/* Scheduling Rules */}
          {tab === 0 && (
            <>
              <div className="admin-section">
                <h3>Timing Rules</h3>
                <div className="rules-grid">
                  {RULES.map((r) => (
                    <div key={r.key} className="rule-field">
                      <label className="rule-label">{r.label}</label>
                      <input
                        type="number"
                        min={r.min}
                        max={r.max}
                        value={localSettings[r.key]}
                        onChange={(e) => updateRule(r.key, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-section">
                <h3>Treatment Days</h3>
                <div className="pill-group" style={{ maxWidth: 300 }}>
                  {DAY_NAMES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`pill${localSettings.treatmentDays?.[d] ? ' active' : ''}`}
                      onClick={() =>
                        updateRule('treatmentDays', {
                          ...localSettings.treatmentDays,
                          [d]: !localSettings.treatmentDays?.[d],
                        })
                      }
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Holidays */}
          {tab === 1 && (
            <div className="admin-section">
              <h3>Holidays</h3>
              <div className="holiday-add-form" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Holiday name"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                />
                <button className="admin-btn" onClick={addHoliday}>Add</button>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {localSettings.holidays?.map((h, i) => (
                  <div
                    key={`${h.date}-${i}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid var(--border-light)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span>{h.name} — {h.date}</span>
                    <button
                      className="admin-btn"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => removeHoliday(i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regimens */}
          {tab === 2 && (
            <div className="admin-section">
              <h3>Chemotherapy Regimens</h3>
              <table className="regimen-table">
                <thead>
                  <tr>
                    <th>Regimen</th>
                    <th>Weeks</th>
                    <th>Days</th>
                    <th>Phases</th>
                  </tr>
                </thead>
                <tbody>
                  {regimens.map((r, ri) => (
                    <tr key={r.name}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>
                        <input
                          type="number"
                          value={r.totalDurationWeeks}
                          onChange={(e) => {
                            const next = [...regimens];
                            next[ri] = { ...next[ri], totalDurationWeeks: Number(e.target.value) };
                            setRegimens(next);
                          }}
                          style={{ width: 60 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={r.totalDurationDays}
                          onChange={(e) => {
                            const next = [...regimens];
                            next[ri] = { ...next[ri], totalDurationDays: Number(e.target.value) };
                            setRegimens(next);
                          }}
                          style={{ width: 60 }}
                        />
                      </td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {r.phases.map((p) => p.name || p.drug).join(' → ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-actions">
          <button className="admin-btn" onClick={applySettings}>Apply Settings</button>
          <button className="admin-btn admin-btn--primary" onClick={exportConfig}>
            Export Config
          </button>
        </div>
      </div>
    </div>
  );
}
