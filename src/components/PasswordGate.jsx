import { useState } from 'react';

const EXPECTED = '706e41';

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).slice(-6);
}

export default function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (simpleHash(value) === EXPECTED) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="pw-gate">
      <form className={`pw-card${shake ? ' pw-shake' : ''}`} onSubmit={handleSubmit}>
        <div className="pw-icon">TOPAz</div>
        <p className="pw-subtitle">Scheduling Assistant</p>
        <label className="pw-label" htmlFor="pw-input">Enter access code</label>
        <input
          id="pw-input"
          className="pw-input"
          type="password"
          autoFocus
          autoComplete="off"
          placeholder="Password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
        />
        {error && <p className="pw-error">Incorrect password</p>}
        <button className="pw-btn" type="submit">Unlock</button>
      </form>
    </div>
  );
}
