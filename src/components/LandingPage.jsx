export default function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-card">
        <div className="landing-badge">Protocol #2022-0880 v16</div>
        <h1 className="landing-title">TOPAz Scheduling Assistant</h1>
        <p className="landing-subtitle">
          Multidisciplinary treatment scheduling for preoperative radiation therapy
          followed by mastectomy with immediate autologous breast reconstruction.
        </p>

        <div className="landing-features">
          <div className="landing-feature">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div className="feature-label">Visual Timeline</div>
              <div className="feature-desc">Color-coded calendar with treatment phases and surgical windows</div>
            </div>
          </div>
          <div className="landing-feature">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <div className="feature-label">Scenario Comparison</div>
              <div className="feature-desc">Compare HF vs CF arms, boost vs no boost, overlapping windows</div>
            </div>
          </div>
          <div className="landing-feature">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="feature-label">PDF & JSON Export</div>
              <div className="feature-desc">Save schedules, share with surgical schedulers, reload anytime</div>
            </div>
          </div>
        </div>

        <button type="button" className="landing-cta" onClick={onStart}>
          Open Scheduler
        </button>

        <div className="landing-footer">
          <p>MD Anderson Cancer Center</p>
          <p>Deterministic, rule-based logic. No AI. No PHI stored.</p>
        </div>
      </div>
    </div>
  );
}
