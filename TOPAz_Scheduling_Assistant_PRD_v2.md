# TOPAz Scheduling Assistant — Product Requirements Document v2.0

**Multidisciplinary Treatment Scheduling Tool**
Protocol #2022-0880 — Version 16

| | |
|---|---|
| **PRD Version:** | 2.0 (Draft) |
| **Date:** | March 26, 2026 |
| **Institution:** | MD Anderson Cancer Center |
| **PI:** | Dr. Benjamin D. Smith |
| **Status:** | Draft for Review |

*CONFIDENTIAL — For Internal Use Only*

---

## 1. Executive Summary

The TOPAz Scheduling Assistant is a lightweight, calendar-based web tool designed to support multidisciplinary treatment coordination for patients enrolled on the TOPAz clinical trial (Protocol #2022-0880) at MD Anderson Cancer Center. The trial evaluates preoperative radiation therapy followed by mastectomy with immediate autologous breast reconstruction, comparing hypofractionated (15 fractions) versus conventionally fractionated (25 fractions) regimens.

Scheduling these patients requires calculating date windows across sequential treatment phases—chemotherapy completion, simulation, radiation (with variable fractionation and optional nodal boosts), and surgery within a protocol-mandated 10–35 day postradiation window. Currently, this is done manually, leading to scheduling conflicts and stressful last-minute rescheduling of complex 8–12 hour surgical cases.

The tool provides a visual calendar interface where clinicians enter a few key inputs and immediately see the entire treatment timeline rendered on a real calendar, with color-coded windows for optimal versus acceptable surgical dates. Schedules can be saved and reloaded via JSON export/import, allowing the coordinator to adjust plans as new information becomes available. The MVP uses deterministic, rule-based logic—no AI—ensuring every output is traceable to a specific protocol rule.

---

## 2. Problem Statement

### 2.1 Current Workflow Pain Points

- **Manual date computation:** Each patient requires ~10 minutes of manual calendar counting across treatment phases, accounting for weekends, holidays, and individual preferences.
- **Incomplete information at enrollment:** Patients enroll at various points during neoadjuvant chemotherapy. Their full chemo schedule may not be in Epic/Beacon yet, requiring clinical estimation of the final chemo date.
- **Surgical booking lead time:** OR cases are 8–12 hours and require both a breast surgeon and a plastic surgeon for the full day. These must be booked as far in advance as possible, but radiation end dates are uncertain until boost decisions are made.
- **Narrow surgical window:** Surgery must occur 10–35 days after radiation completion per protocol (Section 4.3.4), with an optimal sweet spot of approximately days 16–25 per surgeon preference. Operating late in the window may increase complication risk from post-radiation vascular changes.
- **Boost uncertainty:** Whether a patient will receive a nodal boost (5–8 additional fractions) may not be known until simulation or treatment, widening the practical scheduling uncertainty. When boost status is unknown, the overlapping surgical window for both scenarios is narrower than either individual window.
- **Distributed decision-making:** The PI can invest the time to map out each schedule, but colleagues treating TOPAz patients cannot always allocate 10 minutes per patient. Rescheduling surgery after it has been booked is extremely difficult.

### 2.2 Stakeholder Impact

| Stakeholder | Current Pain | Desired Outcome |
|---|---|---|
| **Radiation Oncologist** | Mentally calculates dates while managing full clinical load | Instant, visual schedule output after entering a few data points |
| **Coordinator** | Pressured by surgeons for dates; cannot always provide them because radiation end date is uncertain | A printable calendar view showing surgical windows she can share with surgery scheduling |
| **Surgeon / Scheduler** | Needs firm surgical dates far in advance; gets late changes | Early visibility into acceptable and optimal windows, even as ranges |
| **PI (Dr. Smith)** | Personally reviews complicated scheduling for trial patients | Confidence that colleagues can get scheduling right on the first try |

---

## 3. Product Overview

### 3.1 What the Tool Is

A web-based, calendar-centric scheduling calculator. Users enter key treatment parameters for a TOPAz patient; the tool renders the full treatment timeline on a visual calendar with color-coded treatment blocks and surgical windows. Schedules can be exported as PDF (for sharing) or JSON (for saving and reloading).

### 3.2 What the Tool Is Not

- Not an EHR integration or Epic plugin (MVP phase)
- Not a replacement for clinical judgment on treatment decisions
- Not an AI/LLM agent—MVP uses deterministic, rule-based logic
- Not a patient-facing tool—this is for the clinical care team only

### 3.3 Design Philosophy

**Minimal clicks, maximum clarity.** The tool should feel like an intelligent calendar, not a data-entry form. Every interaction should produce immediate visual feedback on the calendar. The interface should be clean and uncluttered—white background, professional, with color used only to convey meaning (status of windows and milestones).

**Deterministic and auditable.** Every computed date traces to a specific protocol rule or configurable assumption. This makes the tool trustworthy for clinicians and suitable for operational research.

**Stateless by default, persistent by choice.** The tool stores nothing on a server. Users save and load patient schedules via JSON files on their own computer. No PHI is transmitted or stored externally.

---

## 4. User Interface Design

### 4.1 Layout

The interface uses a two-panel layout inspired by the BrachyScheduler (brachyscheduler.vercel.app):

- **Left panel (~30% width):** Compact input form. Grouped into Chemotherapy, Radiation, and Settings sections with collapsible accordion panels. Only the active section is expanded at any time.
- **Right panel (~70% width):** Full calendar view. Renders treatment phases as horizontal colored bars across calendar days. Surgical windows appear as shaded bands. This is the primary visual and the centerpiece of the tool.
- **Top bar:** Application title, scenario toggle (boost on/off/both; arm HF/CF/both), Import JSON / Export JSON / Export PDF buttons. Minimal, icon-driven where possible.

### 4.2 Visual Theme

The color scheme is inspired by the topaz gemstone—warm amber and gold tones on a clean white background, consistent with the professional medical context.

| Element | Color | Usage |
|---|---|---|
| **Background** | `#FFFFFF` | White. Clean, uncluttered. Matches BrachyScheduler aesthetic. |
| **Primary accent** | `#C49B2A` | Golden topaz. Header bar, active tab indicators, primary buttons. |
| **Dark accent** | `#8B6914` | Deep amber. Headings and application logo/title. |
| **Optimal window** | `#2E7D32` | Green band on calendar. Days 16–25 post-RT. Surgeon-preferred. |
| **Acceptable window** | `#F9A825` | Yellow band on calendar. Days 10–15 and 26–35 post-RT. |
| **Deviation / warning** | `#C62828` | Red indicator. Surgery outside 10–35 days or other protocol violation. |
| **Radiation block** | `#C49B2A` | Golden bar on calendar spanning radiation treatment days. |
| **Boost block** | `#D4A843` | Slightly lighter gold bar appended to the radiation block. |
| **Target surgery marker** | `#2E7D32` | Prominent green pin/diamond on the Day 21 date. |

### 4.3 Interaction Model

The guiding principle is: enter the minimum, see the result immediately.

1. **Enter inputs:** User fills in the left panel. The calendar updates live as each field is completed—no "Calculate" button. As soon as a chemo end date and radiation arm are entered, the calendar populates.
2. **Toggle scenarios:** Top-bar toggles switch between "Show HF," "Show CF," or "Show both" arms, and "Boost: Yes / No / Show both." When showing both, the calendar overlays both timelines with distinct opacity so the user sees where windows overlap.
3. **Drag to adjust:** Key milestones (simulation date, RT start, surgery date) can be dragged on the calendar. When moved, downstream milestones recalculate. If a dragged date violates a protocol rule, the tool shows an inline warning (red border + tooltip).
4. **Export:** PDF captures the calendar view and summary table. JSON saves all inputs and computed dates for later reloading.

### 4.4 Keeping It Simple

- No more than 8 input fields visible at once. Smart defaults and collapsible sections.
- No modals or multi-step wizards. Everything on one screen.
- The calendar is always visible. Inputs never obscure or replace the calendar.
- Warnings appear inline (colored borders, small text), not as popups or toasts.
- Advanced settings (holidays, gap durations) tucked behind a gear icon.

---

## 5. User Inputs

### 5.1 Chemotherapy

| Field | Type | Options | Notes |
|---|---|---|---|
| **Neoadjuvant chemo?** | Toggle | Yes / No | If No, skip to Radiation section. |
| **Chemo regimen** | Dropdown | dd-AC + wkly Taxol; dd-AC + Q2W Taxol; TCHP; Keynote-522; Other | Used to estimate end date only. |
| **Estimated last chemo date** | Date picker | MM/DD/YYYY | Primary anchor date. Overrides calculated estimate. |

### 5.2 Radiation

| Field | Type | Options | Notes |
|---|---|---|---|
| **Randomization arm** | Radio | HF (15 fx) / CF (25 fx) / Not randomized | If not randomized, tool shows both via toggle. |
| **Nodal boost?** | Radio | Yes / No / Uncertain | If Uncertain, tool overlays both scenarios. |
| **Boost fractions** | Dropdown | 5 / 6 / 7 / 8 | Only visible when boost = Yes. Default: 5. |
| **Treatment location** | Radio | Main / HAL | Affects dry run: Main = same day; HAL = 1 biz day before. |
| **IBC pilot cohort?** | Toggle | Yes / No | If Yes: CF only, no randomization, no pre-RT biopsy. |

### 5.3 Preferences (Collapsible)

| Field | Type | Default | Notes |
|---|---|---|---|
| **Preferred sim day** | Multi-select | Wednesday | Snaps sim date to preferred weekday. |
| **Treatment break days** | Number | 0 | Adds calendar days to RT duration. |
| **Study ID (optional)** | Text | (empty) | For printout labeling only. No PHI. |
| **Notes** | Free text | (empty) | Clinical context (e.g., "surgeon prefers Thursdays"). Saved with JSON. |

---

## 6. Scheduling Logic & Business Rules

### 6.1 Global Calendar Rules

1. **Weekday-only treatments:** All radiation fractions, dry runs, and simulations are Monday–Friday only.
2. **Holiday exclusion:** US federal holidays and MD Anderson closure days excluded. Configurable.
3. **Fraction counting:** RT end date computed by counting only business days from Day 1.

### 6.2 Phase-by-Phase Rules

#### Phase 1: Chemo Completion → Simulation

| Parameter | Rule |
|---|---|
| **Sim scheduling** | 1–2 weeks after last chemo. Snapped to preferred weekday. Default: first preferred day ≥7 calendar days post-chemo. |
| **Pre-RT biopsy** | Milestone note: "Schedule US-guided biopsy before RT start." Not a scheduling constraint. |
| **Deadline** | Pre-MRT must start within 8 weeks of chemo completion (Section 4.3.3). Warning if at risk. |

#### Phase 2: Simulation → Radiation Start

| Parameter | Rule |
|---|---|
| **Planning gap** | 7–14 calendar days from sim to RT start for treatment planning. |
| **Dry run** | HAL: 1 business day before first fraction. Main Campus: same day as first fraction. |

#### Phase 3: Radiation Treatment

| Parameter | Rule |
|---|---|
| **Base fractions** | HF: 15 fractions (~3 weeks). CF: 25 fractions (~5 weeks). Weekdays only. |
| **Boost** | 5–8 additional weekday fractions, delivered sequentially after base fractions with no break. |
| **IBC cohort** | CF only (25 fx). No breast boost beyond 5000 cGy (Section 4.4.3.3). |

#### Phase 4: Radiation Completion → Surgery

The surgical window is always counted from the **last radiation fraction, including boost** if delivered.

| Window | Days Post-RT / Display |
|---|---|
| **Acceptable (protocol)** | Days 10–35. Yellow band on calendar. (Section 4.3.4) |
| **Optimal (surgeon pref)** | Days 16–25. Green band on calendar. |
| **Target** | Day 21, snapped to weekday. Green pin marker. |
| **Deviation zones** | Days 10–15 (early) and 26–35 (late). Yellow with caution indicator. |
| **Protocol violation** | Outside days 10–35. Red indicator. |

---

## 7. Output & Export

### 7.1 Calendar View (Primary Output)

The calendar renders a month-at-a-glance view (scrollable) showing:

- Colored bars for each treatment phase (chemo tail, radiation base, boost, surgical window)
- Milestone markers (sim, dry run, Day 1, last fraction, target surgery date)
- Weekends and holidays grayed out
- When boost uncertain: two overlapping surgical windows with transparency showing overlap
- When arm not randomized: layered display of HF and CF timelines

### 7.2 Summary Table (Below Calendar)

A compact table listing each milestone with its computed date or range. Included in PDF export.

### 7.3 PDF Export

Captures: calendar view, summary table, active scenario settings, notes, study ID (if entered), protocol version, tool version, and generation timestamp. This is what the coordinator emails to the surgical scheduler.

### 7.4 JSON Import / Export

JSON export saves the complete state: all user inputs, computed dates, scenario settings, notes, and metadata (protocol version, tool version, timestamp). JSON import reloads a saved schedule, repopulating inputs and recomputing the calendar. This allows:

- Saving a schedule to the user's local computer as a `.json` file
- Reloading it later when information changes (e.g., boost decision confirmed, chemo date shifted)
- Adjusting inputs and immediately seeing how the calendar updates
- Re-exporting an updated PDF after changes

*No data is stored on any server. The JSON file lives only on the user's computer.*

---

## 8. Functional Requirements

### 8.1 Core (MVP)

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Calendar-centric UI with left input panel and right calendar view. | P0 |
| FR-02 | Compute all milestone dates per Section 6 rules, respecting weekday-only and holiday logic. | P0 |
| FR-03 | Live calendar rendering: calendar updates as inputs are entered, no submit button. | P0 |
| FR-04 | Scenario toggles for arm (HF/CF/both) and boost (yes/no/both) in top bar. | P0 |
| FR-05 | Color-coded surgical windows: green (optimal 16–25), yellow (acceptable 10–15, 26–35), red (outside protocol). | P0 |
| FR-06 | Target surgery date (Day 21) rendered as prominent marker. | P0 |
| FR-07 | PDF export of calendar view + summary table. | P0 |
| FR-08 | JSON export of all inputs, computed dates, notes, metadata. | P0 |
| FR-09 | JSON import to reload a previously saved schedule. | P0 |
| FR-10 | Protocol constraint validation with inline warnings. | P0 |
| FR-11 | Drag-and-drop adjustment of key milestones with downstream recalculation. | P1 |
| FR-12 | IBC pilot cohort mode (CF only, no randomization, no pre-RT biopsy). | P1 |
| FR-13 | Configurable holiday calendar and default parameters via settings. | P1 |
| FR-14 | Patient notes field saved with JSON export. | P1 |
| FR-15 | Treatment break days input to adjust RT end date. | P2 |

### 8.2 Future Enhancements (Post-MVP)

- **Actual vs. planned tracking:** Checkbox on each milestone to mark completed with actual date. Captures deviation data between recommendations and reality—publishable dataset for the potential protocol aim.
- **Patient pipeline list:** Sidebar listing saved patient schedules showing current phase and next milestone. Helps coordinator triage who needs attention.
- **Chemo delay what-if:** Quick mode to adjust chemo end date and watch the timeline cascade without re-entering other fields.
- **Protocol version stamping:** JSON export includes protocol version. Previously saved schedules display which version's rules were applied.
- **EHR integration:** Pull chemo regimen and dates from Beacon/Epic to auto-populate inputs.
- **Multi-patient dashboard:** All active TOPAz patients and their treatment phases in a single timeline view.

---

## 9. Worked Example

**Sample patient:** Triple-negative breast cancer, Keynote-522 regimen.

| Input | Value |
|---|---|
| Estimated last chemo date | Monday, April 13, 2026 |
| Randomization arm | Hypofractionated (15 fractions) |
| Boost | Uncertain (supraclavicular node) |
| Location | Houston-Area Location (HAL) |
| Preferred sim day | Wednesday |

**Computed Schedule (what the calendar shows):**

| Milestone | Computed Date(s) |
|---|---|
| Last chemo | Mon, April 13, 2026 |
| Pre-RT biopsy window | April 14 – May 3 (informational) |
| CT Simulation | Wed, April 22, 2026 |
| Dry run (HAL) | Fri, May 1, 2026 |
| Radiation Day 1 | Mon, May 4, 2026 |
| Last fraction — no boost | Fri, May 22, 2026 (15 weekday fx) |
| Last fraction — with 5-fx boost | Fri, May 29, 2026 (20 weekday fx) |

**Surgical windows on the calendar:**

| Scenario | Acceptable (Yellow) | Optimal (Green) |
|---|---|---|
| No boost | June 1 – June 26 | June 8 – June 17 (target: June 12) |
| With 5-fx boost | June 8 – July 3 | June 15 – June 24 (target: June 19) |
| **Overlap (safe for either)** | **June 8 – June 26** | **June 15 – June 17** |

*Danielle can tell the surgical scheduler: "Book the OR between June 15–17 to be safe regardless of boost. If boost is ruled out, window opens to June 8–17."*

---

## 10. Technical Approach

### 10.1 Architecture (MVP)

Single-page web application. All computation is client-side. No backend, no server, no database.

- **Framework:** React (.jsx). State management handles live calendar updates.
- **Calendar rendering:** Custom calendar grid (similar to BrachyScheduler) or lightweight library. Must support colored range overlays and draggable markers.
- **Date computation:** Built-in Date object or date-fns for business-day counting with holiday exclusion.
- **PDF export:** Client-side (e.g., html2canvas + jsPDF, or react-pdf).
- **JSON export/import:** Native File API. Export triggers download; import opens file picker.
- **Hosting:** Static file. Any web server, local, or Vercel.

### 10.2 Deployment Path

1. **Prototype:** Build interactive React artifact. Test with PI and Danielle using 3–5 real cases.
2. **Refinement:** Iterate on UI/UX, validate holiday handling, get surgeon input on window display.
3. **Soft launch:** Share with 2–3 additional radiation oncologists. Collect feedback.
4. **Operational deployment:** Deploy as internal tool. Consider adding to protocol as operational quality aim.

---

## 11. Success Criteria

| Metric | Target | Measurement |
|---|---|---|
| Schedule accuracy | 100% of dates match protocol rules | Verification against 10+ historical patients |
| Time to generate | < 2 minutes from entry to printable PDF | User timing during testing |
| Scheduling conflicts | Reduction in surgery rescheduling events | Coordinator feedback |
| User adoption | ≥3 clinicians + coordinator within 3 months | Usage observation |
| Team satisfaction | Positive feedback from PI, coordinator, surgeons | Informal survey |

---

## 12. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Incorrect date computation | **High** | Extensive testing against historical patients. All rules traceable to protocol sections. Prominent disclaimer. |
| Over-reliance without verification | Medium | Dates labeled "suggested." Disclaimer on every output. |
| Holiday calendar not updated | Low | Default US federal holidays. Configurable. Year-boundary prompt. |
| Protocol amendment changes rules | Medium | All parameters are named constants. Tool versioned with protocol. |
| Low adoption | Medium | < 60 seconds data entry. PI endorsement. Calendar UI is intuitive. |

---

## 13. Appendix

### 13.1 Protocol References

| Rule | Protocol Section |
|---|---|
| Pre-MRT must start within 8 weeks of chemo | Section 4.3.3 |
| Surgery window: 10–35 days post-RT | Section 4.3.4 |
| HF arm: 40.05 Gy in 15 fractions | Section 4.4.3.1 |
| CF arm: 50 Gy in 25 fractions | Section 4.4.3.2 |
| Nodal boost: 200 cGy × 5–8 fractions | Sections 4.4.3.1–4.4.3.2 |
| IBC cohort: CF only, no breast boost | Section 4.4.3.3 |
| Treatment breaks: allowed but discouraged | Section 4.4.7 |

### 13.2 Configurable Defaults

| Parameter | Default | Source |
|---|---|---|
| Chemo-to-sim gap | 7–14 calendar days | Clinical practice |
| Sim-to-RT-start gap | 7–14 calendar days | Clinical practice |
| Dry run offset (HAL) | 1 business day before | Meeting discussion |
| Dry run offset (Main) | Same day as Day 1 | Meeting discussion |
| Preferred sim day | Wednesday | PI preference |
| Surgery target | Day 21 post-RT | Protocol / consensus |
| Optimal window | Days 16–25 | Surgeon preference |
| Acceptable window | Days 10–35 | Protocol Section 4.3.4 |

### 13.3 JSON Schema (Reference)

| Field | Description |
|---|---|
| `toolVersion` | Version of the scheduling tool (e.g., "1.0.0") |
| `protocolVersion` | Protocol version used for rules (e.g., "v16") |
| `exportTimestamp` | ISO 8601 timestamp of export |
| `studyId` | Optional study ID entered by user |
| `inputs.chemoEndDate` | Estimated or known last chemo date |
| `inputs.chemoRegimen` | Selected regimen (if any) |
| `inputs.arm` | HF / CF / not_randomized |
| `inputs.boost` | yes / no / uncertain |
| `inputs.boostFractions` | 5–8 (if applicable) |
| `inputs.location` | main / hal |
| `inputs.ibcCohort` | true / false |
| `inputs.simDayPreference` | Array of weekday names |
| `inputs.breakDays` | Number of treatment break days |
| `inputs.notes` | Free-text clinical notes |
| `computed.simDate` | Computed simulation date |
| `computed.dryRunDate` | Computed dry run date |
| `computed.rtStartDate` | Computed radiation Day 1 |
| `computed.rtEndDate` | Computed last fraction (base) |
| `computed.rtEndDateWithBoost` | Computed last fraction (base + boost) |
| `computed.surgeryWindowAcceptable` | `{ start, end }` for days 10–35 |
| `computed.surgeryWindowOptimal` | `{ start, end }` for days 16–25 |
| `computed.surgeryTarget` | Day 21 date |

---

*End of Document*
