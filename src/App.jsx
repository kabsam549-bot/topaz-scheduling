import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import TopBar from './components/TopBar.jsx';
import LandingPage from './components/LandingPage.jsx';
import Tour from './components/Tour.jsx';
import ProtocolLockup from './components/ProtocolLockup.jsx';
import HelpModal from './components/HelpModal.jsx';
import InputPanel from './components/InputPanel.jsx';
import CalendarView from './components/CalendarView.jsx';
import ComplianceBanner from './components/ComplianceBanner.jsx';
import SummaryTable from './components/SummaryTable.jsx';
import Legend from './components/Legend.jsx';
import SettingsModal, { DEFAULT_SETTINGS } from './components/SettingsModal.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { useTopazSchedule } from './hooks/useTopazSchedule.js';
import {
  buildArmsAndBoostScenarios,
  exportComputedForInputs,
} from './scheduling';

const TOOL_VERSION = '1.0.0';
const LS_CLINICIAN = 'topaz-clinician-name';
const LS_HELP_SEEN = 'topaz-help-seen';
const LS_ONBOARDING = 'topaz-onboarding-done';

function formatStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export default function App() {
  const fileInputRef = useRef(null);
  const [showLanding, setShowLanding] = useState(() => {
    try { return !localStorage.getItem(LS_ONBOARDING); } catch { return false; }
  });
  const [tourActive, setTourActive] = useState(false);
  const [importError, setImportError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS }));
  const [configLoaded, setConfigLoaded] = useState(false);
  const [rulesVersion, setRulesVersion] = useState(null);
  const [lastRuleUpdate, setLastRuleUpdate] = useState(null);
  const [clinicianName, setClinicianName] = useState(() => {
    try { return localStorage.getItem(LS_CLINICIAN) || ''; } catch { return ''; }
  });
  const [helpPulse, setHelpPulse] = useState(() => {
    try { return !localStorage.getItem(LS_HELP_SEEN); } catch { return false; }
  });

  // Fetch persisted config on mount (overrides hardcoded defaults)
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        if (cfg) {
          setSettings((prev) => ({
            ...prev,
            ...(cfg.schedulingRules || {}),
            holidays: cfg.holidays || prev.holidays,
          }));
          if (cfg.version) setRulesVersion(cfg.version);
          if (cfg.lastRuleUpdate) setLastRuleUpdate(cfg.lastRuleUpdate);
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  const handleClinicianNameChange = useCallback((name) => {
    setClinicianName(name);
    try {
      if (name) localStorage.setItem(LS_CLINICIAN, name);
      else localStorage.removeItem(LS_CLINICIAN);
    } catch {}
  }, []);

  const handleOpenHelp = useCallback(() => {
    setHelpOpen(true);
    if (helpPulse) {
      setHelpPulse(false);
      try { localStorage.setItem(LS_HELP_SEEN, '1'); } catch {}
    }
  }, [helpPulse]);

  const handleNewSchedule = useCallback(() => {
    if (!window.confirm('Clear the current schedule and start a new one?')) return;
    window.location.reload();
  }, []);

  // Convert holiday date strings to Date objects for closureDates
  const closureDates = useMemo(
    () => settings.holidays.map((h) => new Date(h.date + 'T00:00:00')),
    [settings.holidays]
  );

  const {
    state,
    setField,
    result,
    computeError,
    warnings,
    displayToggles,
    setDisplayToggle,
    view,
    applyImportedJson,
    handleMilestoneDrag,
  } = useTopazSchedule(closureDates);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toUpperCase();
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;

      // Help shortcut ? (shift + /)
      if (!isEditable && !mod && e.key === '?') {
        e.preventDefault();
        handleOpenHelp();
        return;
      }

      // Esc closes any modal
      if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (adminOpen) setAdminOpen(false);
        return;
      }

      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        handleNewSchedule();
      } else if (key === 's') {
        e.preventDefault();
        onExportJson();
      } else if (key === 'o') {
        e.preventDefault();
        onImportClick();
      } else if (key === 'p') {
        e.preventDefault();
        if (view?.primary) onExportPdf();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpOpen, settingsOpen, adminOpen, view?.primary, handleOpenHelp, handleNewSchedule]);

  const buildExportDoc = useCallback(() => {
    const snap = result ? buildArmsAndBoostScenarios(result) : null;
    return {
      toolVersion: TOOL_VERSION,
      exportTimestamp: new Date().toISOString(),
      studyId: state.studyId,
      notes: state.notes,
      inputs: {
        neoadjuvantChemo: state.neoadjuvantChemo,
        chemoEndDate: state.chemoEndDate,
        arm: state.arm,
        boost: state.boost,
        boostFractions: state.boostFractions,
        location: state.location,
        ibcCohort: state.ibcCohort,
        simDayPreference: state.simDayPreference,
        chemoBreakDays: state.chemoBreakDays,
        dryRunGap: state.dryRunGap,
        notes: state.notes,
      },
      computed: result ? exportComputedForInputs(result, state) : undefined,
      computedSnapshot: snap
        ? {
            arms: snap.arms,
            boostScenarios: snap.boostScenarios,
            overlap: result.overlap,
            warnings: result.warnings,
            displayToggles,
          }
        : undefined,
    };
  }, [state, result, displayToggles]);

  const onExportJson = () => {
    setImportError(null);
    const doc = buildExportDoc();
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `topaz-schedule-${formatStamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const doc = JSON.parse(String(reader.result));
        const ok = applyImportedJson(doc);
        if (!ok) setImportError('JSON must include an `inputs` object.');
      } catch {
        setImportError('Could not parse JSON file.');
      }
    };
    reader.readAsText(f);
  };

  const onExportPdf = async () => {
    setImportError(null);
    const el = document.getElementById('topaz-export-root');
    if (!el) return;
    try {
      // Switch to 3-month view and print-friendly layout
      flushSync(() => setPrintMode(true));
      el.classList.add('print-mode');
      // Give the DOM a tick to re-render with 3 months
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const canvas = await html2canvas(el, { scale: 2, useCORS: true });

      el.classList.remove('print-mode');
      flushSync(() => setPrintMode(false));

      const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const w = pageW;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      pdf.save(`topaz-schedule-${formatStamp()}.pdf`);
    } catch (err) {
      el?.classList.remove('print-mode');
      setPrintMode(false);
      setImportError(err?.message || 'PDF export failed.');
    }
  };

  if (showLanding) {
    return (
      <LandingPage
        onStart={() => {
          try { localStorage.setItem(LS_ONBOARDING, '1'); } catch {}
          setShowLanding(false);
        }}
        onExplore={() => {
          // Pre-fill demo data so the calendar is populated during the tour
          setField('neoadjuvantChemo', true);
          setField('chemoEndDate', '2026-03-01');
          setField('arm', 'not_randomized');
          setField('boost', 'uncertain');
          try { localStorage.setItem(LS_ONBOARDING, '1'); } catch {}
          setShowLanding(false);
          // Start tour after a tick so the main layout is mounted
          setTimeout(() => setTourActive(true), 80);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        aria-hidden
        onChange={onFileChange}
      />

      <TopBar
        onImportClick={onImportClick}
        onExportJson={onExportJson}
        onExportPdf={onExportPdf}
        disabledPdf={!view.primary}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={handleOpenHelp}
        helpPulse={helpPulse}
        clinicianName={clinicianName}
      />

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        clinicianName={clinicianName}
        onClinicianNameChange={handleClinicianNameChange}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {computeError && (
        <div className="inline-error" role="alert">{computeError}</div>
      )}
      {importError && (
        <div className="inline-error" role="alert">{importError}</div>
      )}

      <div className="main-layout">
        <InputPanel values={state} onChange={setField} warnings={warnings} />

        <div id="topaz-export-root" className="main-content">
          {state.studyId && (
            <div className="export-meta">
              <p><strong>Study ID:</strong> {state.studyId}</p>
            </div>
          )}

          <ComplianceBanner
            primary={view.primary}
            onClick={() => {
              const el = document.querySelector('.tl-wrap');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />

          <CalendarView
            primary={view.primary}
            secondary={view.secondary}
            labels={view.labels}
            chemoEndDate={state.chemoEndDate}
            onMilestoneDrag={handleMilestoneDrag}
            forceViewMonths={printMode ? 3 : undefined}
          />

          <Legend />

          <SummaryTable
            primary={view.primary}
            secondary={view.secondary}
            labels={view.labels}
            warnings={warnings}
            chemoStartDate={state.chemoStartDate}
          />

          <div className="print-footer" aria-hidden={!printMode}>
            <div className="print-footer-row">
              <span className="print-footer-key">Generated by</span>
              <span>{clinicianName || '(unnamed clinician)'}</span>
              <span className="print-footer-sep">·</span>
              <span>{new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="print-footer-row">
              <span>TOPAz Scheduling Assistant v{TOOL_VERSION}</span>
              <span className="print-footer-sep">·</span>
              <span>Protocol #2022-0880{rulesVersion ? ` · Rules v${rulesVersion}` : ''}</span>
            </div>
            <div className="print-footer-note">
              Dates are scheduling suggestions. Verify against official protocol before treatment.
            </div>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <ProtocolLockup
          version={TOOL_VERSION}
          rulesVersion={rulesVersion}
          lastRuleUpdate={lastRuleUpdate}
        />
      </footer>

      <Tour active={tourActive} onDone={() => setTourActive(false)} />
    </div>
  );
}
