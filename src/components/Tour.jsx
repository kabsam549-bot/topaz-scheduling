import { useCallback, useEffect, useState } from 'react';

const STEPS = [
  {
    selector: '.input-section--chemo',
    title: 'Chemotherapy',
    body: 'Start with the neoadjuvant chemo toggle — Yes adds the protocol-required minimum gap before simulation. Enter the last chemo date; this single date anchors the entire downstream timeline.',
    placement: 'right',
  },
  {
    selector: '.input-section--radiation',
    title: 'Radiation Arm & Boost',
    body: 'Choose 15-fraction (HF) or 25-fraction (CF), or Compare Both to see both arms side-by-side. Setting Boost to Uncertain shows a conservative merged surgery window that covers both scenarios.',
    placement: 'right',
  },
  {
    selector: '.compliance-banner',
    title: 'Protocol Compliance',
    body: 'Updates live as you adjust dates. Green = surgery target in the optimal window (day 16–25 post-RT). Amber = acceptable but outside optimal. Red = outside protocol — review required.',
    placement: 'below',
  },
  {
    selector: '.cal-panel',
    title: 'Treatment Calendar',
    body: 'Color-coded phases auto-populate once a chemo date is set: chemotherapy, simulation, RT, boost, and surgery windows. Drag the simulation or RT start markers to override dates — milestones update in real time.',
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
