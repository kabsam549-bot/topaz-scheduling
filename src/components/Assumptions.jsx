import { useState } from 'react';

const DEFAULTS = [
  { label: 'Chemo to Sim gap', value: '7-14 calendar days' },
  { label: 'Sim to RT start', value: '7-14 calendar days' },
  { label: 'Dry run (HAL)', value: '1 business day before RT' },
  { label: 'Dry run (Main)', value: 'Same day as RT day 1' },
  { label: 'HF fractions', value: '15 weekday fractions' },
  { label: 'CF fractions', value: '25 weekday fractions' },
  { label: 'Boost', value: '5-8 additional fractions' },
  { label: 'Acceptable window', value: 'Days 10-35 post RT' },
  { label: 'Optimal window', value: 'Days 16-25 post RT' },
  { label: 'Surgery target', value: 'Day 21, weekday' },
  { label: 'Excluded days', value: 'Weekends + US holidays' },
];

export default function Assumptions({ inline = false }) {
  const [open, setOpen] = useState(false);

  // Inline mode: render just the table (for dropdown menu)
  if (inline) {
    return (
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
    );
  }

  // Standalone mode with toggle
  return (
    <div className="assumptions-panel">
      <button
        type="button"
        className="assumptions-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="assumptions-icon">{open ? '\u25BE' : '\u25B8'}</span>
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
        </div>
      )}
    </div>
  );
}
