export default function TopBar({
  onImportClick,
  onExportJson,
  onExportPdf,
  disabledPdf,
}) {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h1 className="app-title">
          TOPAz Scheduling Assistant
        </h1>
        <span className="protocol-pill">Protocol v16</span>
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
