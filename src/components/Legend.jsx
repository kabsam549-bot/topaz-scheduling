const FILLS = [
  { bg: 'rgba(168,85,247,0.12)', border: '#a855f7', label: 'Chemo' },
  { bg: 'rgba(59,130,246,0.12)', border: '#3b82f6', label: 'Radiation' },
  { bg: 'rgba(99,102,241,0.12)', border: '#818cf8', label: 'Boost' },
  { bg: 'rgba(245,158,11,0.10)', border: '#d97706', label: 'Acceptable window' },
  { bg: 'rgba(190,24,93,0.10)', border: '#be185d', label: 'Optimal window' },
  { bg: 'rgba(190,24,93,0.22)', border: '#be185d', label: 'Target surgery' },
];

export default function Legend() {
  return (
    <div className="legend">
      {FILLS.map(({ bg, border, label }) => (
        <div key={label} className="legend-item">
          <span className="legend-swatch" style={{ background: bg, borderColor: border }} />
          <span className="legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
