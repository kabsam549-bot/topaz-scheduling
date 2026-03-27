const ITEMS = [
  { bg: 'rgba(168,85,247,0.07)', border: '#a855f7', label: 'Chemo' },
  { bg: 'rgba(59,130,246,0.07)', border: '#3b82f6', label: 'Radiation' },
  { bg: 'rgba(99,102,241,0.07)', border: '#818cf8', label: 'Boost' },
  { bg: 'rgba(217,119,6,0.06)', border: '#d97706', label: 'Acceptable window (days 10-35)' },
  { bg: 'rgba(190,24,93,0.06)', border: '#be185d', label: 'Optimal window (days 16-25)' },
  { bg: 'rgba(190,24,93,0.14)', border: '#be185d', label: 'Target surgery (day 21)' },
];

export default function Legend() {
  return (
    <div className="legend">
      {ITEMS.map(({ bg, border, label }) => (
        <div key={label} className="legend-item">
          <span
            className="legend-swatch"
            style={{ background: bg, borderColor: border }}
          />
          <span className="legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
