import { useState } from 'react';

const DEFAULTS = [
  { label: 'Chemo → Sim gap', value: '7–14 calendar days (snap to preferred weekday)' },
  { label: 'Sim → RT start gap', value: '7–14 calendar days (planning time)' },
  { label: 'Dry run (HAL)', value: '1 business day before RT Day 1' },
  { label: 'Dry run (Main)', value: 'Same day as RT Day 1' },
  { label: 'RT fractions (HF)', value: '15 weekday fractions (~3 weeks)' },
  { label: 'RT fractions (CF)', value: '25 weekday fractions (~5 weeks)' },
  { label: 'Boost fractions', value: '5–8 additional weekday fractions, sequential' },
  { label: 'Surgery acceptable window', value: 'Days 10–35 post last fraction (§4.3.4)' },
  { label: 'Surgery optimal window', value: 'Days 16–25 post last fraction (surgeon pref.)' },
  { label: 'Surgery target', value: 'Day 21, snapped to weekday' },
  { label: 'Pre-MRT deadline', value: 'Must start within 8 weeks of chemo completion (§4.3.3)' },
  { label: 'Excluded days', value: 'Weekends + US federal holidays (configurable)' },
  { label: 'IBC cohort', value: 'CF only, no breast boost beyond 50 Gy (§4.4.3.3)' },
];

export default function Assumptions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="assumptions-panel">
      <button
        type="button"
        className="assumptions-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="assumptions-icon">{open ? '▾' : '▸'}</span>
        Scheduling Assumptions
      </button>
      {open && (
        <div className="assumptions-body">
          <table className="assumptions-table">
            <tbody>
              {DEFAULTS.map(({ label, value }) => (
                <tr key={label}>
                  <td className="assumption-label">{label}</td>
                  <td className="assumption-value">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="assumptions-note">
            All rules derive from Protocol #2022-0880, Version 16. Dates are suggestions only.
          </p>
        </div>
      )}
    </div>
  );
}
