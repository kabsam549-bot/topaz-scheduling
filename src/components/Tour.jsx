import { useCallback, useEffect, useState } from 'react';

const STEPS = [
  {
    selector: '.input-section--chemo',
    title: '1 · Chemotherapy',
    body: 'Start with the neoadjuvant chemo toggle — Yes adds the protocol-required minimum gap before simulation. Enter the last chemo date; this single date anchors the entire downstream timeline.',
    placement: 'right',
  },
  {
    selector: '.input-section--radiation',
    title: '2 · Radiation Arm & Boost',
    body: 'Choose 15-fraction (HF) or 25-fraction (CF), or Compare Both to see both arms side-by-side. Setting Boost to Uncertain shows a conservative merged surgery window that covers both scenarios.',
    placement: 'right',
  },
  {
    selector: '.compliance-banner',
    title: '3 · Protocol Compliance',
    body: 'Updates live. Green = surgery target in the optimal window (day 16–25 post-RT). Amber = acceptable but outside optimal. Red = outside the protocol window — requires review. Click the banner to scroll to the calendar.',
    placement: 'below',
  },
  {
    selector: '.cal-panel',
    title: '4 · Treatment Calendar',
    body: 'Color-coded phases fill in automatically: chemotherapy (purple), simulation (slate), RT (blue), boost (indigo), and surgery windows (pink optimal, amber acceptable). Each month is shown as a grid.',
    placement: 'below',
  },
  {
    selector: '.tl-wrap',
    title: '5 · Timeline',
    body: 'The horizontal bar at the bottom of the calendar maps every phase as a proportional strip. Drag the Sim or RT start handles to override auto-calculated dates — the compliance banner and surgery windows update in real time. Use Generate to revert to auto-calculated dates.',
    placement: 'above',
  },
  {
    selector: '[data-tour="settings-btn"]',
    title: '6 · Settings',
    body: 'Configure scheduling rules: chemo-to-sim gap, sim-to-RT gap, surgery windows, treatment days, and holidays. Changes apply to the current session and are reflected live in the calendar.',
    placement: 'below',
  },
  {
    selector: '[data-tour="menu-btn"]',
    title: '7 · Save & Export',
    body: 'Save schedule to computer saves a JSON file you can reload later or share. Export printable PDF generates a letter-size one-page schedule stamped with your name, the date, and protocol version — ready to attach to a chart or forward to surgery scheduling.',
    placement: 'below',
  },
];

const CARD_W = 288;
const PAD = 6;

export default function Tour({ active, onDone }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  const measure = useCallback((idx) => {
    const el = document.querySelector(STEPS[idx].selector);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setRect(el.getBoundingClientRect()), 320);
  }, []);

  useEffect(() => {
    if (!active) { setStep(0); setRect(null); return; }
    measure(step);
  }, [active, step, measure]);

  useEffect(() => {
    if (!active) return;
    const handler = (e) => { if (e.key === 'Escape') onDone(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onDone]);

  if (!active || !rect) return null;

  const s = STEPS[step];

  // Spotlight box
  const spotStyle = {
    position: 'fixed',
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
    borderRadius: 10,
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.40)',
    outline: '2px solid rgba(190,24,93,0.7)',
    pointerEvents: 'none',
    zIndex: 2000,
  };

  // Tooltip card position
  let cardTop = rect.top;
  let cardLeft = rect.right + PAD + 10;
  if (s.placement === 'below') {
    cardTop = rect.bottom + PAD + 10;
    cardLeft = rect.left;
  } else if (s.placement === 'above') {
    cardTop = rect.top - 240 - PAD;
    cardLeft = rect.left;
  }
  // Clamp to viewport
  cardLeft = Math.max(8, Math.min(cardLeft, window.innerWidth - CARD_W - 8));
  cardTop = Math.max(8, Math.min(cardTop, window.innerHeight - 240));

  return (
    <>
      <div style={spotStyle} aria-hidden />
      <div
        className="tour-card"
        role="dialog"
        aria-label={`Tour step ${step + 1}: ${s.title}`}
        style={{ position: 'fixed', top: cardTop, left: cardLeft, width: CARD_W, zIndex: 2001 }}
      >
        <div className="tour-progress">
          {STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === step ? ' active' : ''}`} />
          ))}
        </div>
        <div className="tour-card-title">{s.title}</div>
        <p className="tour-card-body">{s.body}</p>
        <div className="tour-card-actions">
          {step > 0 && (
            <button type="button" className="tour-btn tour-btn--back" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="tour-btn tour-btn--next" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="tour-btn tour-btn--next" onClick={onDone}>
              Done
            </button>
          )}
          <button type="button" className="tour-btn tour-btn--skip" onClick={onDone}>
            Skip
          </button>
        </div>
      </div>
    </>
  );
}
