import { useState, useRef, useEffect } from 'react';
import Assumptions from './Assumptions.jsx';

export default function TopBar({
  onImportClick,
  onExportJson,
  onExportPdf,
  disabledPdf,
  onBack,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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
        <div className="menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="action-btn hamburger-btn"
            onClick={() => setMenuOpen((v) => !v)}
            title="About & assumptions"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">Scheduling Assumptions</div>
              <Assumptions inline />
              <div className="dropdown-footer">
                Suggested dates only. Verify against protocol.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
