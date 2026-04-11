export default function LandingPage({ onStart, onExplore }) {
  return (
    <div className="landing-shell">
      <div className="landing-card">
        <div className="landing-brand">
          <div className="landing-logo">Tz</div>
          <div>
            <h1 className="landing-title">TOPAz Scheduling Assistant</h1>
            <p className="landing-subtitle">Protocol #2022-0880 · Preoperative RT with Immediate Autologous Reconstruction</p>
          </div>
        </div>

        <p className="landing-lede">
          Generate a complete treatment timeline for Protocol TOPAz patients —
          chemotherapy gaps, simulation, RT phases, and surgery windows in one view.
        </p>

        <div className="landing-btns">
          <button type="button" className="landing-cta" onClick={onStart}>
            Go to Planner
          </button>
          <button type="button" className="landing-cta landing-cta--outline" onClick={onExplore}>
            Explore
          </button>
        </div>

        <p className="landing-disclaimer">
          Dates are scheduling suggestions. Verify against the official protocol
          and institutional policies before finalizing any treatment schedule.
        </p>
      </div>
    </div>
  );
}
