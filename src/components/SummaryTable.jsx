const ROWS = [
  { key: 'lastChemoDate', label: 'Last chemo' },
  { key: 'simDate', label: 'CT simulation' },
  { key: 'dryRunDate', label: 'Dry run' },
  { key: 'rtStartDate', label: 'Radiation day 1' },
  { key: 'rtEndDate', label: 'Last fraction (base)' },
  { key: 'rtEndDateWithBoost', label: 'Last fraction (w/ boost)' },
  { key: 'surgeryWindowOptimal', label: 'Surgery optimal (surgeon pref.)' },
  { key: 'surgeryWindowAcceptable', label: 'Surgery acceptable (10–35 d)' },
  { key: 'surgeryTarget', label: 'Target surgery (≈ day 21)' },
];

function fmtWindow(w) {
  if (!w || !w.start) return '—';
  if (w.end && w.end !== w.start) return `${w.start} → ${w.end}`;
  return w.start;
}

export default function SummaryTable({ primary, secondary, labels = [] }) {
  return (
    <div className="summary-table-wrap">
      <h2 className="panel-heading">Summary</h2>
      {!primary && <p className="muted">No computed milestones yet.</p>}
      {primary && (
        <div className="table-scroll">
          <table className="summary-table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>{labels[0] || 'Primary'}</th>
                {secondary && <th>{labels[1] || 'Secondary'}</th>}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td>{cellValue(primary, key)}</td>
                  {secondary && <td>{cellValue(secondary, key)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function cellValue(computed, key) {
  if (!computed) return '—';
  if (key === 'surgeryWindowOptimal' || key === 'surgeryWindowAcceptable') {
    return fmtWindow(computed[key]);
  }
  return computed[key] || '—';
}
