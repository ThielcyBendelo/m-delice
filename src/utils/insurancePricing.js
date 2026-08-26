const COVERAGE_OPTIONS = {
  essentiel: { label: 'Essentiel', multiplier: 0.8, annualLimit: 3500 },
  confort: { label: 'Confort', multiplier: 1, annualLimit: 5000 },
  premium: { label: 'Premium', multiplier: 1.4, annualLimit: 7500 },
};

const INSURANCE_OPTIONS = {
  health: { label: 'Santé / Médical', branch: 'Santé', basePrice: 30 },
  auto: { label: 'RC Automobile', branch: 'Automobile', basePrice: 20 },
  student: { label: 'Scolarité', branch: 'Scolaire', basePrice: 12 },
  voyage: { label: 'Voyage', branch: 'Voyage', basePrice: 50 },
};

export function calculateInsuranceQuote({ insuranceType = 'health', beneficiariesCount = 1, coverageLevel = 'confort', basePrice } = {}) {
  const insurance = INSURANCE_OPTIONS[insuranceType] || INSURANCE_OPTIONS.health;
  const coverage = COVERAGE_OPTIONS[coverageLevel] || COVERAGE_OPTIONS.confort;
  const members = Math.max(1, Math.min(6, Number(beneficiariesCount) || 1));
  const referencePrice = Number(basePrice) > 0 ? Number(basePrice) : insurance.basePrice;
  const memberPrice = referencePrice * coverage.multiplier;
  const total = memberPrice + Math.max(0, members - 1) * memberPrice * 0.9;
  const aggregateAnnualLimit = coverage.annualLimit * members;

  return {
    insuranceType,
    branch: insurance.branch,
    insuranceLabel: insurance.label,
    coverageLevel,
    coverageLabel: coverage.label,
    beneficiariesCount: members,
    monthlyPrice: Math.round(total * 100) / 100,
    annualLimit: aggregateAnnualLimit,
    annualLimitPerMember: coverage.annualLimit,
    coverageLimit: `Plafond annuel total : ${aggregateAnnualLimit.toLocaleString('fr-FR')} USD (${coverage.annualLimit.toLocaleString('fr-FR')} USD par membre)`,
    familyDiscount: members > 1 ? 10 : 0,
  };
}

export function quoteFromPack(pack, beneficiariesCount = 1, coverageLevel = 'confort') {
  const typeByBranch = { Santé: 'health', Automobile: 'auto', Scolaire: 'student', Voyage: 'voyage' };
  const typeByCategory = { Santé: 'health', Automobile: 'auto', Scolaire: 'student', Voyage: 'voyage' };
  return calculateInsuranceQuote({
    insuranceType: pack?.insuranceType || typeByBranch[pack?.branch] || typeByCategory[pack?.category] || 'health',
    beneficiariesCount,
    coverageLevel: String(coverageLevel || pack?.coverageLevel || 'confort').toLowerCase(),
    basePrice: pack?.price,
  });
}

export { COVERAGE_OPTIONS, INSURANCE_OPTIONS };
