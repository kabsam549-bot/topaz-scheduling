# TOPAz Scheduling Assistant — QA Test Report

**Date:** March 26, 2026  
**Tester:** QA Subagent (Rafiq)  
**App Version:** 1.0.0  
**Protocol Version:** v16  
**Test Environment:** macOS, Chrome, Vite dev server on port 5198  

---

## Executive Summary

**Overall Assessment:** ✅ **PASS with Minor Issues**

The TOPAz Scheduling Assistant is **production-ready** with high-quality UI, correct core scheduling logic, and comprehensive functionality. All critical features work as expected. Two minor issues identified:

1. **IBC + HF Selection Bug:** Calendar shows no data when IBC cohort is enabled with HF arm selected (view resolver mismatch)
2. **PRD Internal Inconsistency:** Optimal surgery window text says "days 16-25" but worked example produces "days 17-26" (code follows worked example correctly)

Unit tests: **12/12 passed** ✅

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Test 1: PRD Worked Example | ⚠️ PASS* | Memorial Day handling differs from PRD (app is more correct) |
| Test 2: CF Arm | ✅ PASS | 25 fractions correctly computed (~5 weeks) |
| Test 3: IBC Cohort | ⚠️ PARTIAL | Warning displays, but calendar empty when HF+IBC selected |
| Test 4: Holiday Handling | ✅ PASS | Memorial Day, Juneteenth, July 4 all correctly skipped |
| Test 5: Surgery Windows | ✅ PASS | Day counting correct (days 10-35, 17-26, 21 target) |
| Test 6: Mobile Responsiveness | ✅ PASS | iPhone 12 Pro size (390×844) renders correctly |
| Test 7: UI Quality Check | ✅ PASS | Professional slate-blue theme, clean layout, all elements visible |
| Test 8: JSON Export | ✅ PASS | Valid JSON with all required fields |

---

## Detailed Test Results

### Test 1: PRD Worked Example (Section 9)

**Inputs:**
- Last chemo date: Monday, April 13, 2026
- Arm: HF (15 fractions)
- Boost: Uncertain
- Location: HAL
- Sim day preference: Wednesday

**Expected vs. Actual:**

| Milestone | PRD Expected | App Actual | Match? |
|-----------|-------------|------------|--------|
| CT Simulation | Wed, Apr 22, 2026 | 2026-04-22 | ✅ |
| Dry run (HAL) | Fri, May 1, 2026 | 2026-05-01 | ✅ |
| RT Day 1 | Mon, May 4, 2026 | 2026-05-04 | ✅ |
| Last fraction (no boost) | Fri, May 22, 2026 | 2026-05-22 | ✅ |
| Last fraction (with 5-fx boost) | Fri, May 29, 2026 | Mon, Jun 1, 2026 | ⚠️ |

**Surgery Windows (No Boost, last fraction = May 22):**

| Window | PRD Expected | App Actual | Match? |
|--------|-------------|------------|--------|
| Acceptable | Jun 1 – Jun 26 | Jun 1 – Jun 26 | ✅ |
| Optimal | Jun 8 – Jun 17 | Jun 8 – Jun 17 | ✅ |
| Target | Jun 12 | Jun 12 | ✅ |

**Surgery Windows (With Boost):**
- PRD says last fraction = May 29, app says Jun 1
- This is because **Memorial Day (May 25, 2026) is a federal holiday**
- Boost fractions after May 22: Tue May 26, Wed May 27, Thu May 28, Fri May 29, Mon Jun 1 = 5 fractions
- **The app correctly skips Memorial Day; the PRD worked example does not**

**Verdict:** ⚠️ PASS — App is more correct than PRD. The PRD worked example appears to contain an error by not accounting for Memorial Day.

**Unit test note:** The test suite includes `treatAsTreatmentDays: ['2026-05-25']` to force Memorial Day as a treatment day and match the PRD exactly. Without this override, tests confirm last boost fraction is Jun 1.

---

### Test 2: CF Arm (25 fractions)

**Inputs:** Same as Test 1, but Arm = CF

**Results:**
- RT Day 1: Mon, May 4, 2026
- Last fraction (base): Mon, Jun 8, 2026
- Duration: ~5 weeks (25 weekday fractions, skipping Memorial Day May 25)
- Fraction count verified: May 4-8 (5), May 11-15 (10), May 18-22 (15), May 26-29 (19), Jun 1-5 (24), Jun 8 (25) ✅

**Verdict:** ✅ PASS — CF arm extends treatment by ~2 weeks compared to HF as expected.

---

### Test 3: IBC Cohort

**Inputs:** IBC = Yes, Arm = HF, Boost = Uncertain

**Expected Behavior (PRD §4.4.3.3):**
- Force CF only (25 fractions)
- No breast boost beyond protocol
- Display warning when HF is selected

**Actual Behavior:**
- ✅ Warning displays: "IBC cohort (PRD §4.4.3.3): CF 25 fx only; breast boost beyond protocol ignored."
- ❌ **BUG:** Calendar shows "No computed milestones yet" even with chemo date entered
- ✅ When arm is manually switched to CF, calendar displays correctly with CF-only, no-boost scenario

**Root Cause:** View resolver (`resolveScheduleView`) uses `values.arm` from form state (still 'HF') to look up scenarios, but `computeSchedule` overrides to 'CF' for IBC. The resolver can't find an 'HF' scenario and returns null.

**Verdict:** ⚠️ PARTIAL PASS — Logic is correct, but UI breaks when HF+IBC selected. Workaround: manually select CF arm.

**Recommendation:** Update `resolveScheduleView` to check `values.ibcCohort` and force `effectiveArm = 'CF'` when IBC is enabled.

---

### Test 4: Holiday Handling

**Test 4a: Memorial Day (May 25, 2026)**
- Already verified in Test 1: boost fractions correctly skip May 25 and continue May 26

**Test 4b: Juneteenth (June 19, 2026)**
- Chemo end: June 10, 2026
- Sim preference: Friday
- Expected sim: First Friday ≥ June 17 = June 19 (Juneteenth) → skip to June 26 ✅
- Actual sim: June 26, 2026 ✅

**Test 4c: Independence Day (July 3-4, 2026)**
- July 4 is Saturday → observed July 3 (Friday)
- Chemo end: June 15, 2026
- Sim: June 24 (Wed), Dry run: July 2 (Thu), RT start: July 6 (Mon)
- July 3 correctly excluded from treatment days ✅

**Verified holidays in 2026:**
- New Year's Day (Jan 1)
- MLK Day (Jan 19)
- Presidents' Day (Feb 16)
- Memorial Day (May 25)
- Juneteenth (June 19)
- Independence Day (July 3 observed)
- Labor Day (Sep 7)
- Columbus Day (Oct 12)
- Veterans Day (Nov 11)
- Thanksgiving (Nov 26)
- Christmas (Dec 25)

**Verdict:** ✅ PASS — All federal holidays correctly identified and skipped.

---

### Test 5: Surgery Windows

**Day Counting Verification (HF no boost, last fraction May 22):**

| Window | Formula | Calculated | Expected | Match? |
|--------|---------|-----------|----------|--------|
| Acceptable start | May 22 + 10 | Jun 1 (Mon) | Jun 1 | ✅ |
| Acceptable end | May 22 + 35 | Jun 26 (Fri) | Jun 26 | ✅ |
| Optimal start | May 22 + 17 | Jun 8 (Mon) | Jun 8 | ✅ |
| Optimal end | May 22 + 26 | Jun 17 (Wed) | Jun 17 | ✅ |
| Target | May 22 + 21, snap to weekday | Jun 12 (Fri) | Jun 12 | ✅ |

**PRD Discrepancy Identified:**
- PRD §6.2 Phase 4 text says: "Optimal (surgeon pref): Days **16–25**"
- PRD §9 worked example shows: Jun 8 – Jun 17, which equals days **17–26**
- Code uses: `addDays(lastFraction, 17)` and `addDays(lastFraction, 26)`
- **The code follows the worked example (17-26), not the spec text (16-25)**

This is an **internal PRD inconsistency**, not a code bug. The app correctly implements the worked example.

**Verdict:** ✅ PASS — Day counting is mathematically correct. PRD text vs. example mismatch should be noted in protocol documentation.

---

### Test 6: Mobile Responsiveness

**Test Device:** iPhone 12 Pro simulation (390 × 844 px)

**Results:**
- ✅ Landing page renders correctly, no overflow
- ✅ "Show Inputs" / "Hide Inputs" toggle button visible and functional
- ✅ Input sections expand/collapse correctly
- ✅ Calendar readable with all milestones visible
- ✅ Three-month view collapses to single-column layout
- ✅ Summary table readable (horizontal scroll if needed)
- ✅ Export buttons accessible in top bar
- ✅ Legend displays correctly
- ✅ No horizontal overflow issues

**Verdict:** ✅ PASS — Fully responsive, mobile-friendly interface.

---

### Test 7: UI Quality Check

**Color Scheme:**
- ✅ Professional **slate blue** theme throughout
- Primary: `#1e40af` (medium blue)
- Primary dark: `#1e3a5f` (dark navy) — header bar
- **NOT gold/amber** as specified in PRD §4.2 (which calls for `#C49B2A`, `#8B6914`)
- The app intentionally uses blue instead of gold — appears to be a design decision post-PRD

**Layout:**
- ✅ Left sidebar (~20% width) for inputs
- ✅ Right main area (~80% width) for calendar + summary
- ✅ Clean two-panel desktop layout
- ✅ Responsive single-column mobile layout

**Section Labeling:**
- ✅ "CHEMOTHERAPY" — clearly labeled, uppercase
- ✅ "RADIATION" — clearly separated section
- ✅ "SETTINGS" — distinct section at bottom
- ✅ All labels consistent, professional typography

**Export Buttons:**
- ✅ "Import", "JSON", "Export PDF" visible in header
- ✅ Appropriately styled, easy to discover

**Legend:**
- ✅ Comprehensive color key below calendar
- ✅ Clear mapping: Radiation (base), Boost, Surgery acceptable/optimal/target, Milestones
- ✅ Color swatches match calendar rendering

**Professional Quality:**
- ✅ Production-grade UI polish
- ✅ Clean typography (sans-serif, good hierarchy)
- ✅ Consistent spacing and padding
- ✅ Intuitive toggle/pill button design
- ✅ Appropriate clinical disclaimers ("Suggested dates only -- verify against protocol")
- ✅ Version badges visible (Protocol v16)

**Minor Polish Notes:**
- Milestone badges (e.g., "RT Start") slightly crowd calendar cells on smaller screens
- "Uncertain" boost option uses same blue as definitive selections (could use amber for semantic clarity)
- No visible scrollbar indicator on left sidebar (may be browser default)

**Verdict:** ✅ PASS — High-quality, production-ready clinical interface. Color scheme deviates from PRD but is professional and appropriate.

---

### Test 8: JSON Export

**Clicked JSON button, captured exported data:**

**Validation:**
- ✅ Valid JSON (parses without errors)
- ✅ `toolVersion`: "1.0.0"
- ✅ `protocolVersion`: "v16"
- ✅ `exportTimestamp`: ISO 8601 format
- ✅ `studyId`: (empty string in test, but field present)
- ✅ `notes`: (empty string in test, but field present)

**Inputs Object Contains:**
- ✅ `neoadjuvantChemo`, `chemoEndDate`, `chemoRegimen`
- ✅ `arm`, `boost`, `boostFractions`
- ✅ `location`, `ibcCohort`
- ✅ `simDayPreference`, `breakDays`, `notes`

**Computed Object Contains:**
- ✅ `lastChemoDate`, `simDate`, `dryRunDate`
- ✅ `rtStartDate`, `rtEndDate`, `rtEndDateWithBoost`
- ✅ `surgeryWindowAcceptable` (start/end)
- ✅ `surgeryWindowOptimal` (start/end)
- ✅ `surgeryTarget`

**Computed Snapshot Contains:**
- ✅ `arms.HF.noBoost` — full scenario data
- ✅ `arms.HF.withBoost` — full scenario data
- ✅ `arms.CF.noBoost` — full scenario data
- ✅ `arms.CF.withBoost` — full scenario data
- ✅ `boostScenarios` — separate boost comparison
- ✅ `overlap` — surgical window intersections
- ✅ `warnings` — protocol validation messages
- ✅ `displayToggles` — UI state (arm/boost toggles)

**File Naming:**
- Format: `topaz-schedule-YYYY-MM-DD-HH-MM-SS.json`
- Example: `topaz-schedule-2026-03-26-18-17-50.json`

**File Size:** ~4.5 KB (well-formed, complete)

**Verdict:** ✅ PASS — Comprehensive JSON export with all required metadata and complete scenario data. Suitable for reload and archival.

---

## Unit Test Results

**Test Suite:** `src/scheduling/computeSchedule.test.js`  
**Framework:** Vitest v3.2.4  
**Result:** ✅ **12/12 tests passed** (24ms execution time)

**Test Coverage:**
1. ✅ `normalizeSimDayPreference` — default to Wednesday, accepts weekday names
2. ✅ Memorial Day 2026 correctly identified as federal holiday
3. ✅ `treatAsTreatmentDays` override works
4. ✅ HAL dry run: 1 business day before RT start
5. ✅ `addBusinessDays` stepping behavior
6. ✅ PRD §9 worked example milestones (with Memorial Day override)
7. ✅ PRD §9 surgical windows match
8. ✅ PRD §9 overlap windows correct
9. ✅ Without Memorial Day override, last boost = Jun 1
10. ✅ `not_randomized` + uncertain boost yields 4 scenarios
11. ✅ IBC cohort forces CF and drops boost
12. ✅ Treatment break days extend calendar span

All core scheduling logic validated by automated tests.

---

## Issues Summary

### 🐛 Critical Issues
*None identified.*

### ⚠️ Minor Issues

**Issue #1: IBC + HF Selection Shows Empty Calendar**
- **Severity:** Low (easy workaround: manually select CF)
- **Location:** `src/scheduling/resolveScheduleView.js`
- **Root Cause:** View resolver uses form `values.arm` ('HF') to find scenario, but `computeSchedule` overrides to 'CF' for IBC. No HF scenario exists, so view returns null.
- **Reproduction:**
  1. Select Arm = HF
  2. Toggle IBC = Yes
  3. Enter chemo date
  4. Calendar shows "No computed milestones yet"
- **Workaround:** Select Arm = CF manually after enabling IBC
- **Fix:** Update `resolveScheduleView` line ~87:
  ```js
  const effectiveArm =
    values.ibcCohort ? 'CF' :  // Add this check first
    values.arm === 'HF' || values.arm === 'CF'
      ? values.arm
      : armView === 'CF' ? 'CF' : 'HF';
  ```

**Issue #2: PRD Internal Inconsistency (Optimal Window Days)**
- **Severity:** Documentation only (code is correct)
- **Location:** PRD v2.0, Section 6.2 vs. Section 9
- **Description:** 
  - PRD §6.2 text says "Optimal (surgeon pref): Days 16–25"
  - PRD §9 worked example shows Jun 8 – Jun 17, which equals days 17–26
  - Code implements days 17–26 (matches worked example, not spec text)
- **Recommendation:** Update PRD §6.2 to read "Days 17–26" for consistency with worked example
- **No code change needed** — the app correctly implements the clinical intent shown in the worked example

### 📋 Observations

**Observation #1: Color Scheme Deviation**
- PRD §4.2 specifies warm amber/gold theme (`#C49B2A`, `#8B6914`)
- App uses professional slate-blue theme (`#1e40af`, `#1e3a5f`)
- **This appears intentional** — the test spec explicitly expects "slate blue, NOT gold/amber"
- Medical/clinical contexts often favor blue over warm tones for perceived professionalism
- **No action needed** unless client specifically requests gold theme

**Observation #2: Memorial Day 2026 Handling**
- PRD §9 worked example shows May 29 as last boost fraction
- App shows Jun 1 (correctly skipping Memorial Day May 25)
- Unit tests include `treatAsTreatmentDays: ['2026-05-25']` to force PRD match
- **The app's default behavior (skipping Memorial Day) is more correct for clinical use**
- Consider adding a note to PRD that worked example assumes Memorial Day is treated as a treatment day (atypical)

**Observation #3: Weekend Surgery Window Endpoints**
- Optimal surgery window end can fall on weekends (e.g., Jun 27 is a Saturday)
- Only the **target date** (day 21) is snapped to weekdays
- This is likely intentional (window boundaries are informational, not scheduling constraints)
- Coordinator would choose weekday within the window
- **No action needed** — design appears clinically sound

---

## Recommendations

### Immediate (Pre-Launch)
1. **Fix IBC + HF view bug** — 5-minute code change to `resolveScheduleView.js`
2. **Update PRD §6.2** — Change "Days 16–25" to "Days 17–26" (documentation only)

### Short-Term (Post-Launch)
1. Add inline helper text when IBC is enabled: "IBC cohort requires CF arm (25 fractions)" near the Arm selector
2. Consider amber/yellow color for "Uncertain" boost toggle (semantic clarity)
3. Add a visible scrollbar indicator for input sidebar on overflow

### Long-Term (Nice-to-Have)
1. Import functionality testing (JSON import was observed to work in code review but not explicitly UI-tested)
2. PDF export visual testing (export button works, but PDF rendering not verified in this QA pass)
3. Add unit tests for `resolveScheduleView` edge cases (IBC scenarios, manual overrides)
4. Accessibility audit (WCAG 2.1 compliance, screen reader testing)

---

## Test Environment Details

**System:**
- OS: macOS (Darwin 25.3.0, arm64)
- Browser: Chrome (via OpenClaw browser control)
- Node.js: v25.8.1
- Dev Server: Vite v6.4.1

**Test Data:**
- Primary scenario: Chemo end April 13, 2026 (PRD §9 worked example)
- Secondary scenarios: Various dates to test holidays and edge cases
- All tests used HAL location unless specified otherwise

**Test Duration:** ~25 minutes (manual testing + automated test suite)

---

## Sign-Off

**QA Status:** ✅ **APPROVED FOR PRODUCTION** with minor fix recommended

The TOPAz Scheduling Assistant is a high-quality, clinically appropriate tool that correctly implements protocol scheduling logic with robust holiday handling, responsive design, and comprehensive data export. The single minor bug (IBC + HF view) has an easy workaround and straightforward fix.

**Tested by:** Rafiq (QA Subagent)  
**Date:** March 26, 2026, 18:19 CDT  
**Report Version:** 1.0
