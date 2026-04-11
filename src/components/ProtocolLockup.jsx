export default function ProtocolLockup({ version, rulesVersion, lastRuleUpdate }) {
  const versionText = version ? `v${version}` : null;
  const rulesText = rulesVersion ? `Scheduling rules v${rulesVersion}` : null;
  const updatedText = lastRuleUpdate ? `Last update ${lastRuleUpdate}` : null;

  return (
    <div className="protocol-lockup" role="contentinfo" aria-label="Protocol information">
      <div className="protocol-lockup-inner">
        <div className="protocol-lockup-left">
          <span className="protocol-lockup-trial">Protocol #2022-0880</span>
          <span className="protocol-lockup-sep">·</span>
          <span className="protocol-lockup-study">Preoperative RT with immediate autologous reconstruction</span>
        </div>
        <div className="protocol-lockup-right">
          <span className="protocol-lockup-role">
            <span className="protocol-lockup-role-label">PI</span>
            <span>Benjamin D. Smith, MD</span>
          </span>
          <span className="protocol-lockup-sep">·</span>
          <span className="protocol-lockup-role">
            <span className="protocol-lockup-role-label">Developer</span>
            <span>Ramez Kouzy, MD</span>
          </span>
          {versionText && (
            <>
              <span className="protocol-lockup-sep">·</span>
              <span className="protocol-lockup-version">{versionText}</span>
            </>
          )}
          {rulesText && (
            <>
              <span className="protocol-lockup-sep">·</span>
              <span className="protocol-lockup-rules">{rulesText}</span>
            </>
          )}
          {updatedText && (
            <>
              <span className="protocol-lockup-sep">·</span>
              <span className="protocol-lockup-updated">{updatedText}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
