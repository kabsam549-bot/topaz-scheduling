import { useState, useRef, useEffect } from 'react';
import Assumptions from './Assumptions.jsx';

export default function TopBar({
  onImportClick,
  onExportJson,
  onExportPdf,
  disabledPdf,
  onOpenSettings,
  onOpenHelp,
  onStartTour,
  helpPulse,
  clinicianName,
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

  const displayName = clinicianName?.trim();

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="header-logo">T</span>
          <div className="header-titles">
            <h1 className="header-name">TOPAz</h1>
            <span className="header-tagline">Scheduling Assistant</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="header-identity"
          onClick={onOpenHelp}
          title={displayName ? 'Edit your name' : 'Set your name for exports'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="header-identity-text">
            {displayName || 'Set name'}
          </span>
        </button>

        <button
          type="button"
          className={`header-btn header-help${helpPulse ? ' pulsing' : ''}`}
          onClick={onOpenHelp}
          title="How to use TOPAz"
          aria-label="Help"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {helpPulse && <span className="header-help-pulse" aria-hidden />}
        </button>

        {onOpenSettings && (
          <button type="button" className="header-btn" data-tour="settings-btn" onClick={onOpenSettings} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        )}
        <div className="menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="header-btn"
            data-tour="menu-btn"
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
                  Open saved schedule
                </button>
                <button type="button" className="dropdown-item" onClick={() => { onExportJson(); setMenuOpen(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Save schedule to computer
                </button>
                <button
                  type="button"
                  className={`dropdown-item${disabledPdf ? ' disabled' : ''}`}
                  onClick={() => { if (!disabledPdf) { onExportPdf(); setMenuOpen(false); } }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Export printable PDF
                </button>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-section">
                <div className="dropdown-label">Scheduling Rules</div>
                <div className="dropdown-assumptions">
                  <Assumptions inline />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
