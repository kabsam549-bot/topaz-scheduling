import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import LandingPage from './components/LandingPage.jsx';
import TopBar from './components/TopBar.jsx';
import InputPanel from './components/InputPanel.jsx';
import CalendarView from './components/CalendarView.jsx';
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

function formatStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export default function App() {
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS }));
  const [configLoaded, setConfigLoaded] = useState(false);

  // Fetch persisted config on mount (overrides hardcoded defaults)
  useEffect(() => {
    fetch('/config.json?' + Date.now())
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        if (cfg) {
          setSettings((prev) => ({
            ...prev,
            ...(cfg.schedulingRules || {}),
            holidays: cfg.holidays || prev.holidays,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
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
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const ratio = Math.min(pageW / imgW, pageH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
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
        onStart={() => setShowLanding(false)}
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
        onBack={() => setShowLanding(true)}
        onOpenSettings={() => setSettingsOpen(true)}
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
        </div>
      </div>
    </div>
  );
}
