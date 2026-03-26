import { useCallback, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import TopBar from './components/TopBar.jsx';
import InputPanel from './components/InputPanel.jsx';
import CalendarView from './components/CalendarView.jsx';
import SummaryTable from './components/SummaryTable.jsx';
import Legend from './components/Legend.jsx';
import Assumptions from './components/Assumptions.jsx';
import { useTopazSchedule } from './hooks/useTopazSchedule.js';
import {
  buildArmsAndBoostScenarios,
  exportComputedForInputs,
} from './scheduling';

const TOOL_VERSION = '1.0.0';
const PROTOCOL_VERSION = 'v16';

function formatStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export default function App() {
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);

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
  } = useTopazSchedule();

  const buildExportDoc = useCallback(() => {
    const snap = result ? buildArmsAndBoostScenarios(result) : null;
    return {
      toolVersion: TOOL_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      exportTimestamp: new Date().toISOString(),
      studyId: state.studyId,
      notes: state.notes,
      inputs: {
        neoadjuvantChemo: state.neoadjuvantChemo,
        chemoEndDate: state.chemoEndDate,
        chemoRegimen: state.chemoRegimen,
        arm: state.arm,
        boost: state.boost,
        boostFractions: state.boostFractions,
        location: state.location,
        ibcCohort: state.ibcCohort,
        simDayPreference: state.simDayPreference,
        breakDays: state.breakDays,
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
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
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
      setImportError(err?.message || 'PDF export failed.');
    }
  };

  const showScenarioToggles =
    state.arm === 'not_randomized' || state.boost === 'uncertain';

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
      />

      <InputPanel values={state} onChange={setField} warnings={warnings} />

      {computeError && (
        <div className="inline-error" role="alert">{computeError}</div>
      )}
      {importError && (
        <div className="inline-error" role="alert">{importError}</div>
      )}

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
          displayToggles={showScenarioToggles ? displayToggles : null}
          onDisplayChange={showScenarioToggles ? (k, v) => setDisplayToggle(k, v) : null}
          onMilestoneDrag={handleMilestoneDrag}
        />

        <Legend />

        <div className="below-calendar">
          <Assumptions />

          <SummaryTable
            primary={view.primary}
            secondary={view.secondary}
            labels={view.labels}
          />
        </div>

        <p className="export-disclaimer">
          Suggested dates only — verify against protocol.
        </p>
      </div>
    </div>
  );
}
