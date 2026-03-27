/**
 * Neoadjuvant Chemotherapy Regimen Timing Data
 * Source: hemonc.org (accessed 2026-03-27)
 * 
 * Purpose: Calculate expected last chemo date from first chemo date
 * based on the selected regimen
 */

export const REGIMEN_DATA = {
  'dd-AC + wkly Taxol': {
    totalDurationWeeks: 20,
    totalDurationDays: 140,
    phases: [
      { 
        name: 'dd-AC (dose-dense)', 
        cycles: 4, 
        cycleLengthDays: 14,
        durationWeeks: 8,
        drugs: [
          { name: 'Doxorubicin', dose: '60 mg/m²', days: [1] },
          { name: 'Cyclophosphamide', dose: '600 mg/m²', days: [1] },
          { name: 'G-CSF', dose: 'per protocol', days: 'days 3-10' }
        ]
      },
      { 
        name: 'Weekly Paclitaxel', 
        cycles: 12,
        cycleLengthDays: 7,
        durationWeeks: 12,
        drugs: [
          { name: 'Paclitaxel', dose: '80 mg/m²', days: [1] }
        ]
      },
    ],
    notes: 'Dose-dense AC (every 2 weeks) x4, then weekly paclitaxel x12. Total 20 weeks from first to last dose.',
  },
  
  'dd-AC + Q2W Taxol': {
    totalDurationWeeks: 14,
    totalDurationDays: 98,
    phases: [
      { 
        name: 'dd-AC (dose-dense)', 
        cycles: 4, 
        cycleLengthDays: 14,
        durationWeeks: 8,
        drugs: [
          { name: 'Doxorubicin', dose: '60 mg/m²', days: [1] },
          { name: 'Cyclophosphamide', dose: '600 mg/m²', days: [1] },
          { name: 'G-CSF', dose: 'per protocol', days: 'days 3-10' }
        ]
      },
      { 
        name: 'Q2W Paclitaxel', 
        cycles: 3,
        cycleLengthDays: 14,
        durationWeeks: 6,
        drugs: [
          { name: 'Paclitaxel', dose: '175-225 mg/m²', days: [1] }
        ]
      },
    ],
    notes: 'Dose-dense AC (every 2 weeks) x4, then paclitaxel every 2 weeks x3. Total 14 weeks. Note: Q2W paclitaxel dosing may vary (175-225 mg/m²).',
  },

  'TCHP': {
    totalDurationWeeks: 18,
    totalDurationDays: 126,
    phases: [
      { 
        name: 'TCHP (all concurrent)', 
        cycles: 6, 
        cycleLengthDays: 21,
        durationWeeks: 18,
        drugs: [
          { name: 'Docetaxel', dose: '75 mg/m²', days: [1] },
          { name: 'Carboplatin', dose: 'AUC 6', days: [1] },
          { name: 'Trastuzumab', dose: '8 mg/kg loading, then 6 mg/kg', days: [1] },
          { name: 'Pertuzumab', dose: '840 mg loading, then 420 mg', days: [1] }
        ]
      },
    ],
    notes: 'All drugs given together every 3 weeks x6 cycles. HER2+ breast cancer. Standard regimen from TRYPHAENA/KRISTINE trials. Adjuvant trastuzumab + pertuzumab continues after surgery for 1 year total.',
  },

  'Keynote-522': {
    totalDurationWeeks: 24,
    totalDurationDays: 168,
    phases: [
      { 
        name: 'CP + Pembrolizumab', 
        cycles: 4, 
        cycleLengthDays: 21,
        durationWeeks: 12,
        drugs: [
          { name: 'Carboplatin', dose: 'AUC 1.5', days: [1, 8, 15] },
          { name: 'Paclitaxel', dose: '80 mg/m²', days: [1, 8, 15] },
          { name: 'Pembrolizumab', dose: '200 mg', days: [1] }
        ]
      },
      { 
        name: 'AC + Pembrolizumab', 
        cycles: 4, 
        cycleLengthDays: 21,
        durationWeeks: 12,
        drugs: [
          { name: 'Doxorubicin', dose: '60 mg/m²', days: [1] },
          { name: 'Cyclophosphamide', dose: '600 mg/m²', days: [1] },
          { name: 'Pembrolizumab', dose: '200 mg', days: [1] }
        ]
      },
    ],
    notes: 'Triple-negative breast cancer. KEYNOTE-522 trial regimen. Neoadjuvant phase is 24 weeks (8 cycles), then surgery, then adjuvant pembrolizumab continues for additional 9 cycles (every 3 weeks) for total 1 year of pembrolizumab.',
  },
};

/**
 * Calculate expected last chemo date from a start date and regimen
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} regimenName - Key from REGIMEN_DATA
 * @returns {Object} { lastDate: string, totalWeeks: number, totalDays: number }
 */
export function calculateLastChemoDate(startDate, regimenName) {
  const regimen = REGIMEN_DATA[regimenName];
  if (!regimen) {
    throw new Error(`Unknown regimen: ${regimenName}`);
  }

  const start = new Date(startDate);
  const lastDate = new Date(start);
  lastDate.setDate(lastDate.getDate() + regimen.totalDurationDays);

  return {
    lastDate: lastDate.toISOString().split('T')[0],
    totalWeeks: regimen.totalDurationWeeks,
    totalDays: regimen.totalDurationDays,
    phases: regimen.phases.map(phase => ({
      name: phase.name,
      cycles: phase.cycles,
      cycleLengthDays: phase.cycleLengthDays,
      durationWeeks: phase.durationWeeks
    }))
  };
}

/**
 * Get regimen details
 * @param {string} regimenName - Key from REGIMEN_DATA  
 * @returns {Object} Full regimen details
 */
export function getRegimenDetails(regimenName) {
  return REGIMEN_DATA[regimenName];
}

/**
 * Get list of all available regimens
 * @returns {string[]} Array of regimen names
 */
export function getAvailableRegimens() {
  return Object.keys(REGIMEN_DATA);
}
