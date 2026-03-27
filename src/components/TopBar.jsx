export default function TopBar({
  onImportClick,
  onExportJson,
  onExportPdf,
  disabledPdf,
  onBack,
}) {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {onBack && (
          <button type="button" className="action-btn back-btn" onClick={onBack} title="Back to home">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <h1 className="app-title">TOPAz</h1>
      </div>

      <div className="top-bar-actions">
        <button type="button" className="action-btn" onClick={onImportClick} title="Import JSON">
          Import
        </button>
        <button type="button" className="action-btn" onClick={onExportJson} title="Export JSON">
          JSON
        </button>
        <button
          type="button"
          className="action-btn accent"
          onClick={onExportPdf}
          disabled={disabledPdf}
          title="Export PDF"
        >
          Export PDF
        </button>
      </div>
    </header>
  );
}
