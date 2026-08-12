export const ARCA_TAX_RATE = Number(process.env.ARCA_TAX_RATE || 0.1);

export function annualLimit(coverageLevel) {
  const lvl = String(coverageLevel || "").toLowerCase();
  if (lvl.includes("premium") || lvl.includes("prestige")) return 7500;
  if (lvl.includes("essentiel") || lvl.includes("basic")) return 2000;
  return 3500;
}

export function endDatePlusOneYear(from = new Date()) {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}
