import { useEffect, useState } from 'react';

export default function HelpModal({ open, onClose, clinicianName, onClinicianNameChange, onStartTour }) {
  const [draftName, setDraftName] = useState(clinicianName || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftName(clinicianName || '');
      setSaved(false);
    }
  }, [open, clinicianName]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSaveName = () => {
    const trimmed = draftName.trim();
    onClinicianNameChange(trimmed);
    if (trimmed) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  };

  return (
    <div className="help-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="help-card" role="dialog" aria-labelledby="help-title">
        <div className="help-head">
          <h2 id="help-title" className="help-title">How to use TOPAz</h2>
          <button type="button" className="help-close" onClick={onClose} aria-label="Close help">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="help-body">
          <p className="help-lede">
            TOPAz maps the full treatment timeline for a Protocol #2022-0880 patient in under a minute.
            Enter the patient's chemotherapy end date, pick the radiation arm and boost status, and the
            calendar fills in automatically with treatment phases and surgical windows.
          </p>

          <section className="help-section">
            <h3 className="help-section-title">Saving your work</h3>
            <p>
              TOPAz does not save anything on a server — nothing leaves your browser. If you want to keep
              a schedule for later or share it with a colleague, use <strong>Save schedule to computer</strong>
              from the menu. You'll get a small file you can put on your desktop, attach to an email, or
              share over Teams. To reopen it, click <strong>Open saved schedule</strong> and pick the file.
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Sharing with the coordinator</h3>
            <p>
              Use <strong>Export printable PDF</strong> for a one-page schedule the coordinator can forward
              to surgery scheduling. The PDF is stamped with your name, the date, and the current protocol
              version so it's clear where it came from.
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">The compliance banner</h3>
            <p>
              Just above the calendar you'll see a status banner. <strong>Green</strong> means the surgical
              target is in the optimal window (day 16–25 post-RT). <strong>Amber</strong> means it's in the
              acceptable window but outside optimal. <strong>Red</strong> means it falls outside the
              protocol window entirely and needs review.
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Keyboard shortcuts</h3>
            <dl className="help-shortcuts">
              <dt>⌘N / Ctrl+N</dt><dd>New schedule</dd>
              <dt>⌘S / Ctrl+S</dt><dd>Save schedule to computer</dd>
              <dt>⌘O / Ctrl+O</dt><dd>Open saved schedule</dd>
              <dt>⌘P / Ctrl+P</dt><dd>Export printable PDF</dd>
              <dt>?</dt><dd>Show this help</dd>
              <dt>Esc</dt><dd>Close modals</dd>
            </dl>
          </section>

          <section className="help-section help-section--identity">
            <h3 className="help-section-title">Your name on exports</h3>
            <p className="help-identity-blurb">
              Enter your name once and every PDF export will be stamped with it. Stored only in this
              browser — nothing is sent anywhere.
            </p>
            <div className="help-identity-row">
              <input
                type="text"
                className="help-identity-input"
                placeholder="e.g. Ramez Kouzy, MD"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                aria-label="Your name for exports"
              />
              <button type="button" className="help-identity-save" onClick={handleSaveName}>
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </section>

          {onStartTour && (
            <div className="help-tour-row">
              <button
                type="button"
                className="help-tour-btn"
                onClick={() => { onClose(); setTimeout(() => onStartTour(), 80); }}
              >
                Take an interactive tour
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}

          <p className="help-footnote">
            Questions or issues? Contact Ramez Kouzy, MD (Developer).
          </p>
        </div>
      </div>
    </div>
  );
}
