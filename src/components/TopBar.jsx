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
    <header className="header">
      <div className="header-left">
        {onBack && (
          <button type="button" className="header-btn" onClick={onBack} title="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <div className="header-brand">
          <span className="header-logo">T</span>
          <div className="header-titles">
            <h1 className="header-name">TOPAz</h1>
            <span className="header-tagline">Scheduling Assistant</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="header-btn"
            onClick={() => setMenuOpen((v) => !v)}
            title="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <button type="button" className="dropdown-item" onClick={() => { onImportClick(); setMenuOpen(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Import schedule
                </button>
                <button type="button" className="dropdown-item" onClick={() => { onExportJson(); setMenuOpen(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Save as JSON
                </button>
                <button
                  type="button"
                  className={`dropdown-item${disabledPdf ? ' disabled' : ''}`}
                  onClick={() => { if (!disabledPdf) { onExportPdf(); setMenuOpen(false); } }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Export as PDF
                </button>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-section">
                <div className="dropdown-label">Scheduling Rules</div>
                <div className="dropdown-assumptions">
                  <Assumptions inline />
                </div>
              </div>
              <div className="dropdown-footer">
                Dates are suggestions only. Always verify against protocol.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
