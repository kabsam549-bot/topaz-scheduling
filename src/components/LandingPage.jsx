const STEPS = [
  {
    num: 1,
    title: 'Neoadjuvant chemotherapy — Yes or No?',
    body: 'Toggle whether the patient received neoadjuvant chemo. Yes unlocks the chemo end date field and applies the protocol-required minimum 7-day gap before simulation.',
  },
  {
    num: 2,
    title: 'Enter the last chemotherapy date',
    body: 'This single date anchors the entire timeline. Simulation, RT start, and all surgery windows are calculated forward from here according to protocol constraints.',
  },
  {
    num: 3,
    title: 'Select the radiation arm',
    body: 'Choose HF (15 fractions), CF (25 fractions), or leave as Not Randomized to preview both arms side-by-side in the calendar.',
  },
  {
    num: 4,
    title: 'Set the boost fractions',
    body: 'Choose Yes, No, or Uncertain. Uncertain shows a conservative merged surgery window that accounts for both scenarios — no dates are lost if randomization is still pending.',
  },
  {
    num: 5,
    title: 'Read the calendar and compliance banner',
    body: 'Once inputs are set the calendar auto-populates with color-coded phases: chemotherapy, simulation, RT, boost, and surgery windows. The status banner at the top of the calendar turns green (optimal), amber (acceptable), or red (outside protocol) based on the surgery target date.',
  },
  {
    num: 6,
    title: 'Drag milestones to adjust',
    body: 'You can drag the simulation or RT start markers directly on the calendar to override the auto-calculated date. Downstream milestones update live and the compliance banner recalculates.',
  },
];

export default function LandingPage({ onStart }) {
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
          Generate a complete treatment timeline in under a minute. Enter a few patient details
          and the tool calculates simulation, RT, and surgery windows against protocol constraints.
        </p>

        <ol className="landing-steps">
          {STEPS.map((s) => (
            <li key={s.num} className="landing-step">
              <div className="landing-step-num" aria-hidden="true">{s.num}</div>
              <div className="landing-step-body">
                <div className="landing-step-title">{s.title}</div>
                <div className="landing-step-desc">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="landing-actions">
          <button type="button" className="landing-cta" onClick={onStart}>
            Start Scheduling Trial
          </button>
          <p className="landing-disclaimer">
            Dates are scheduling suggestions. Verify against the official protocol document
            and institutional policies before finalizing any treatment schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
