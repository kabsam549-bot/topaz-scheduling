import { useState, useEffect } from 'react';
import { REGIMEN_DATA } from '../scheduling/regimenData.js';
import { DEFAULT_SETTINGS } from './SettingsModal.jsx';

const EXPECTED = '706e41';
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).slice(-6);
}

const ADMIN_TABS = ['Scheduling Rules', 'Holidays', 'Regimens'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function AdminPanel({ open, onClose, settings, onSettingsChange }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pwValue, setPwValue] = useState('');
  const [pwError, setPwError] = useState(false);
  const [pwShake, setPwShake] = useState(false);
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // { ok, message }

  useEffect(() => {
    if (open) {
      setLocalSettings({ ...settings });
      setPwValue('');
      setPwError(false);
      setSaveResult(null);
    }
    if (!open) {
      setAuthenticated(false);
      setAdminPassword('');
    }
  }, [open, settings]);

  if (!open) return null;

  const handlePwSubmit = (e) => {
    e.preventDefault();
    if (simpleHash(pwValue) === EXPECTED) {
      setAuthenticated(true);
      setAdminPassword(pwValue);
      setPwError(false);
    } else {
      setPwError(true);
      setPwShake(true);
      setTimeout(() => setPwShake(false), 500);
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={`pw-card${pwShake ? ' pw-shake' : ''}`}>
          <div className="pw-icon">TOPAz</div>
          <p className="pw-subtitle">Admin Access</p>
          <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="pw-label" htmlFor="admin-pw">Enter admin password</label>
            <input
              id="admin-pw"
              className="pw-input"
              type="password"
              autoFocus
              autoComplete="off"
              placeholder="Password"
              value={pwValue}
              onChange={(e) => { setPwValue(e.target.value); setPwError(false); }}
            />
            {pwError && <p className="pw-error">Incorrect password</p>}
            <button className="pw-btn" type="submit">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  const updateRule = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
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

  const handleApply = () => {
    setSaveResult(null);
    setConfirmOpen(true);
  };

  const handleConfirmApply = async () => {
    setConfirmOpen(false);
    setSaving(true);
    setSaveResult(null);

    const config = {
      version: '1.0.0',
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
    };

    try {
      const res = await fetch('/api/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onSettingsChange(localSettings);
        setSaveResult({ ok: true, message: 'Settings saved. App will redeploy in ~30 seconds.' });
      } else {
        setSaveResult({ ok: false, message: data.error || 'Failed to save settings.' });
      }
    } catch (err) {
      setSaveResult({ ok: false, message: 'Network error. Could not reach server.' });
    } finally {
      setSaving(false);
    }
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
    { key: 'chemoToSimGap', label: 'Chemo -> Sim gap (days)', min: 1, max: 30 },
    { key: 'simToRtGap', label: 'Sim -> RT gap (days)', min: 1, max: 30 },
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
                    <span>{h.name} -- {h.date}</span>
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
                        {r.phases.map((p) => p.name || p.drug).join(' -> ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status messages */}
        {saveResult && (
          <div style={{
            padding: '0.75rem 1.5rem',
            background: saveResult.ok ? '#f0fdf4' : '#fef2f2',
            color: saveResult.ok ? '#166534' : '#991b1b',
            fontSize: '0.85rem',
            fontWeight: 500,
            borderTop: '1px solid ' + (saveResult.ok ? '#bbf7d0' : '#fecaca'),
          }}>
            {saveResult.message}
          </div>
        )}

        <div className="admin-actions">
          <button className="admin-btn" onClick={handleApply} disabled={saving}>
            {saving ? 'Saving...' : 'Apply Settings'}
          </button>
          <button className="admin-btn admin-btn--primary" onClick={exportConfig}>
            Export Config
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div className="admin-overlay" style={{ zIndex: 300 }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}>
          <div className="pw-card" style={{ gap: '1rem' }}>
            <div className="pw-icon" style={{ fontSize: '1.2rem' }}>Confirm Changes</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sec)' }}>
              This will update the live app config for <strong>all users</strong>. The app will redeploy automatically. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="admin-btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="pw-btn" style={{ padding: '0.5rem 1.5rem' }} onClick={handleConfirmApply}>Yes, Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
