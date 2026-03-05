// ─── SALARY RANGES BY PROFESSION, CITY, AND SENIORITY ───────────────────────
// Source: docs/data-sources.md (compiled March 2026)
// All values are gross annual salary in EUR, 25th–75th percentile.
// City multipliers vs Munich: Frankfurt 0.96, Hamburg 0.94, Stuttgart 0.97,
// Berlin 0.91, Dusseldorf 0.93, Cologne 0.92, Karlsruhe 0.94, Mannheim 0.93,
// Nuremberg 0.90, Dresden 0.87, Leipzig 0.86.

export const SALARY_RANGES: Record<string, Record<string, Record<string, [number, number]>>> = {

  'Software Engineer / IT': {
    // Source: Gehalt.de (median €69,816), tech-careers.de (city breakdown)
    Munich:     { junior: [48000, 60000], mid: [65000, 82000], senior: [82000, 105000] },
    Frankfurt:  { junior: [46000, 57000], mid: [62000, 79000], senior: [79000, 101000] },
    Hamburg:    { junior: [45000, 55000], mid: [60000, 76000], senior: [77000,  99000] },
    Stuttgart:  { junior: [47000, 58000], mid: [63000, 80000], senior: [80000, 103000] },
    Berlin:     { junior: [44000, 54000], mid: [59000, 75000], senior: [75000,  96000] },
    Dusseldorf: { junior: [44000, 55000], mid: [60000, 77000], senior: [76000,  98000] },
    Cologne:    { junior: [44000, 54000], mid: [60000, 76000], senior: [75000,  97000] },
    Karlsruhe:  { junior: [45000, 56000], mid: [61000, 78000], senior: [77000,  99000] },
    Mannheim:   { junior: [44000, 55000], mid: [60000, 77000], senior: [76000,  98000] },
    Nuremberg:  { junior: [43000, 53000], mid: [58000, 74000], senior: [74000,  95000] },
    Dresden:    { junior: [42000, 51000], mid: [56000, 72000], senior: [71000,  91000] },
    Leipzig:    { junior: [41000, 51000], mid: [56000, 71000], senior: [71000,  90000] },
  },

  'Data / ML Engineer': {
    // Source: terratern.com (junior €44–54K, mid €65–85K, senior €85K+), levels.fyi (median €76,542)
    Munich:     { junior: [50000, 63000], mid: [68000, 88000], senior: [88000, 115000] },
    Frankfurt:  { junior: [48000, 60000], mid: [65000, 85000], senior: [85000, 110000] },
    Hamburg:    { junior: [47000, 59000], mid: [64000, 83000], senior: [83000, 107000] },
    Stuttgart:  { junior: [49000, 61000], mid: [66000, 86000], senior: [85000, 110000] },
    Berlin:     { junior: [46000, 57000], mid: [62000, 80000], senior: [80000, 103000] },
    Dusseldorf: { junior: [47000, 58000], mid: [63000, 82000], senior: [81000, 105000] },
    Cologne:    { junior: [46000, 57000], mid: [62000, 81000], senior: [81000, 104000] },
    Karlsruhe:  { junior: [47000, 59000], mid: [64000, 83000], senior: [83000, 107000] },
    Mannheim:   { junior: [47000, 58000], mid: [63000, 82000], senior: [81000, 105000] },
    Nuremberg:  { junior: [45000, 56000], mid: [61000, 79000], senior: [79000, 102000] },
    Dresden:    { junior: [44000, 54000], mid: [59000, 77000], senior: [77000,  98000] },
    Leipzig:    { junior: [43000, 54000], mid: [58000, 76000], senior: [76000,  97000] },
  },

  'Mechanical Engineer': {
    // Source: jobvector (avg €61,727, range €52,762–€71,500, entry €56,711), PayScale (€52,822 avg)
    Munich:     { junior: [43000, 54000], mid: [58000, 72000], senior: [72000, 92000] },
    Frankfurt:  { junior: [41000, 52000], mid: [56000, 69000], senior: [69000, 88000] },
    Hamburg:    { junior: [41000, 51000], mid: [55000, 68000], senior: [68000, 87000] },
    Stuttgart:  { junior: [42000, 53000], mid: [56000, 70000], senior: [70000, 90000] },
    Berlin:     { junior: [39000, 49000], mid: [53000, 66000], senior: [66000, 84000] },
    Dusseldorf: { junior: [40000, 50000], mid: [54000, 67000], senior: [67000, 86000] },
    Cologne:    { junior: [40000, 50000], mid: [53000, 67000], senior: [66000, 85000] },
    Karlsruhe:  { junior: [41000, 51000], mid: [55000, 68000], senior: [68000, 87000] },
    Mannheim:   { junior: [40000, 50000], mid: [54000, 67000], senior: [67000, 86000] },
    Nuremberg:  { junior: [39000, 49000], mid: [52000, 65000], senior: [65000, 83000] },
    Dresden:    { junior: [37000, 47000], mid: [50000, 63000], senior: [63000, 80000] },
    Leipzig:    { junior: [37000, 46000], mid: [50000, 62000], senior: [62000, 79000] },
  },

  'Electrical Engineer': {
    // Source: ingenieur.de/VDI (entry median €52,060, Fach/Projektingenieur €64K, Abteilungsleiter €91,676)
    Munich:     { junior: [44000, 55000], mid: [60000, 75000], senior: [74000, 96000] },
    Frankfurt:  { junior: [42000, 53000], mid: [58000, 72000], senior: [71000, 92000] },
    Hamburg:    { junior: [41000, 52000], mid: [56000, 70000], senior: [70000, 90000] },
    Stuttgart:  { junior: [43000, 54000], mid: [58000, 73000], senior: [72000, 93000] },
    Berlin:     { junior: [40000, 50000], mid: [55000, 68000], senior: [67000, 87000] },
    Dusseldorf: { junior: [41000, 51000], mid: [56000, 70000], senior: [69000, 89000] },
    Cologne:    { junior: [41000, 51000], mid: [55000, 69000], senior: [68000, 88000] },
    Karlsruhe:  { junior: [42000, 52000], mid: [57000, 71000], senior: [70000, 91000] },
    Mannheim:   { junior: [41000, 51000], mid: [56000, 70000], senior: [69000, 89000] },
    Nuremberg:  { junior: [40000, 50000], mid: [54000, 68000], senior: [67000, 86000] },
    Dresden:    { junior: [38000, 48000], mid: [52000, 65000], senior: [64000, 83000] },
    Leipzig:    { junior: [38000, 47000], mid: [51000, 64000], senior: [64000, 82000] },
  },

  'Civil / Structural Engineer': {
    // Source: ingenieur.de (Bauingenieur median €66,770, Leitungsfunktion €65,750), VDI entry €48,144
    Munich:     { junior: [40000, 50000], mid: [55000, 68000], senior: [66000, 85000] },
    Frankfurt:  { junior: [38000, 48000], mid: [53000, 65000], senior: [63000, 82000] },
    Hamburg:    { junior: [38000, 48000], mid: [52000, 64000], senior: [62000, 80000] },
    Stuttgart:  { junior: [39000, 49000], mid: [53000, 66000], senior: [64000, 83000] },
    Berlin:     { junior: [37000, 46000], mid: [50000, 62000], senior: [60000, 77000] },
    Dusseldorf: { junior: [37000, 47000], mid: [51000, 63000], senior: [62000, 79000] },
    Cologne:    { junior: [37000, 46000], mid: [51000, 63000], senior: [61000, 79000] },
    Karlsruhe:  { junior: [38000, 47000], mid: [52000, 64000], senior: [62000, 80000] },
    Mannheim:   { junior: [37000, 47000], mid: [51000, 63000], senior: [62000, 79000] },
    Nuremberg:  { junior: [36000, 45000], mid: [49000, 61000], senior: [60000, 77000] },
    Dresden:    { junior: [35000, 43000], mid: [47000, 59000], senior: [57000, 73000] },
    Leipzig:    { junior: [34000, 43000], mid: [46000, 58000], senior: [56000, 72000] },
  },

  'Finance / Accounting': {
    // Source: Glassdoor Germany (accountant €45–65K), Stepstone regional, Frankfurt finance hub premium
    Munich:     { junior: [42000, 52000], mid: [57000, 72000], senior: [ 72000,  94000] },
    Frankfurt:  { junior: [46000, 58000], mid: [64000, 81000], senior: [ 82000, 108000] },
    Hamburg:    { junior: [41000, 51000], mid: [56000, 70000], senior: [ 70000,  91000] },
    Stuttgart:  { junior: [40000, 50000], mid: [55000, 69000], senior: [ 69000,  89000] },
    Berlin:     { junior: [38000, 48000], mid: [52000, 66000], senior: [ 66000,  86000] },
    Dusseldorf: { junior: [40000, 50000], mid: [55000, 69000], senior: [ 69000,  90000] },
    Cologne:    { junior: [39000, 49000], mid: [54000, 68000], senior: [ 68000,  88000] },
    Karlsruhe:  { junior: [39000, 49000], mid: [54000, 67000], senior: [ 67000,  87000] },
    Mannheim:   { junior: [39000, 49000], mid: [54000, 67000], senior: [ 67000,  87000] },
    Nuremberg:  { junior: [38000, 47000], mid: [52000, 65000], senior: [ 65000,  84000] },
    Dresden:    { junior: [36000, 45000], mid: [49000, 62000], senior: [ 62000,  80000] },
    Leipzig:    { junior: [35000, 44000], mid: [48000, 61000], senior: [ 61000,  79000] },
  },

  'Product Manager': {
    // Source: terratern.com (senior Munich €85K, 8–12% YoY growth); range adjusted to €85–115K senior
    Munich:     { junior: [50000, 63000], mid: [70000, 88000], senior: [85000, 115000] },
    Frankfurt:  { junior: [48000, 60000], mid: [67000, 85000], senior: [82000, 110000] },
    Hamburg:    { junior: [47000, 59000], mid: [65000, 83000], senior: [80000, 107000] },
    Stuttgart:  { junior: [47000, 59000], mid: [66000, 83000], senior: [82000, 110000] },
    Berlin:     { junior: [46000, 57000], mid: [64000, 80000], senior: [77000, 103000] },
    Dusseldorf: { junior: [46000, 58000], mid: [64000, 82000], senior: [79000, 106000] },
    Cologne:    { junior: [45000, 57000], mid: [63000, 81000], senior: [78000, 104000] },
    Karlsruhe:  { junior: [47000, 58000], mid: [65000, 82000], senior: [79000, 106000] },
    Mannheim:   { junior: [46000, 58000], mid: [64000, 81000], senior: [79000, 105000] },
    Nuremberg:  { junior: [44000, 55000], mid: [61000, 78000], senior: [76000, 101000] },
    Dresden:    { junior: [43000, 53000], mid: [59000, 75000], senior: [73000,  97000] },
    Leipzig:    { junior: [42000, 52000], mid: [58000, 74000], senior: [72000,  96000] },
  },

};

/**
 * Returns the [low, high] salary range for a given profession, city, and seniority.
 * Returns null for 'Other' profession or if the city/profession combination is not found.
 */
export function getMarketRange(field: string, city: string, seniority: string): [number, number] | null {
  if (field === 'Other') return null;
  const cityData = SALARY_RANGES[field]?.[city];
  if (!cityData) return null;
  const key = seniority.startsWith('Junior') ? 'junior' : seniority.startsWith('Senior') ? 'senior' : 'mid';
  return cityData[key] ?? null;
}
