const ITEMS = [
  { cls: 'swatch-rt', label: 'Radiation (base)' },
  { cls: 'swatch-boost', label: 'Boost fractions' },
  { cls: 'swatch-acceptable', label: 'Surgery acceptable (days 10–35)' },
  { cls: 'swatch-optimal', label: 'Surgery optimal (days 16–25)' },
  { cls: 'swatch-target', label: 'Target surgery (day 21)' },
  { cls: 'swatch-milestone', label: 'Milestone (SIM / dry run)' },
];

export default function Legend() {
  return (
    <div className="legend">
      {ITEMS.map(({ cls, label }) => (
        <div key={cls} className="legend-item">
          <span className={`legend-swatch ${cls}`} />
          <span className="legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
