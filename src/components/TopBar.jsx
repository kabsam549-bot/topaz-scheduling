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
          <button type="button" className="topbar-icon-btn" onClick={onBack} title="Back to home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <h1 className="app-title">TOPAz</h1>
      </div>

      <div className="top-bar-right">
        <div className="menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setMenuOpen((v) => !v)}
            title="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <button type="button" className="dropdown-item" onClick={() => { onImportClick(); setMenuOpen(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Import JSON
                </button>
                <button type="button" className="dropdown-item" onClick={() => { onExportJson(); setMenuOpen(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export JSON
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => { if (!disabledPdf) { onExportPdf(); setMenuOpen(false); } }}
                  disabled={disabledPdf}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Export PDF
                </button>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-section">
                <div className="dropdown-header">Scheduling Assumptions</div>
                <div className="dropdown-assumptions">
                  <Assumptions inline />
                </div>
              </div>
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
