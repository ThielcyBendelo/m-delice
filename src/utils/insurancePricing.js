const COVERAGE_OPTIONS = {
  essentiel: { label: 'Essentiel', multiplier: 0.8, annualLimit: 3500 },
  standard: { label: 'Standard', multiplier: 0.9, annualLimit: 4200 },
  confort: { label: 'Confort', multiplier: 1.0, annualLimit: 5000 },
  plus: { label: 'Plus', multiplier: 1.15, annualLimit: 6000 },
  famille: { label: 'Famille', multiplier: 1.25, annualLimit: 7000 },
  senior: { label: 'Senior', multiplier: 1.3, annualLimit: 7000 },
  pro: { label: 'Pro', multiplier: 1.35, annualLimit: 7200 },
  premium: { label: 'Premium', multiplier: 1.4, annualLimit: 7500 },
  gold: { label: 'Gold', multiplier: 1.6, annualLimit: 9000 },
  prestige: { label: 'Prestige', multiplier: 1.85, annualLimit: 12000 },
};

const INSURANCE_OPTIONS = {
  health: { label: 'Santé / Médical', branch: 'Santé', basePrice: 30 },
  auto: { label: 'RC Automobile', branch: 'Automobile', basePrice: 20 },
  student: { label: 'Scolarité', branch: 'Scolaire', basePrice: 12 },
  voyage: { label: 'Voyage', branch: 'Voyage', basePrice: 50 },
  habitation: { label: 'Habitation Pro', branch: 'Habitation', basePrice: 30 },
  collective: { label: 'Collective & Mutuelle', branch: 'Assurances Collectives', basePrice: 55 },
  work_accident: { label: 'Accidents Travail', branch: 'Accidents Travail & Prévoyance', basePrice: 35 },
  obseques: { label: 'Obsèques & Rapatriement', branch: 'Obsèques & Rapatriement', basePrice: 12 },
  pme: { label: 'Multirisque PME', branch: 'Multirisque PME', basePrice: 60 },
  transport: { label: 'Transport & Fret', branch: 'Transport & Fret', basePrice: 80 },
  agricole: { label: 'Agricole & Élevage', branch: 'Agricole & Élevage', basePrice: 45 },
  rc_pro: { label: 'RC Professionnelle', branch: 'RC Professionnelle', basePrice: 50 },
  chantier: { label: 'Chantier & BTP', branch: 'Chantier & BTP', basePrice: 120 },
  micro: { label: 'Micro-Assurance', branch: 'Micro-Assurance', basePrice: 5 },
  cyber: { label: 'Cyber-Risques', branch: 'Cyber-Risques', basePrice: 70 },
};

export function calculateInsuranceQuote({
  insuranceType = 'health',
  beneficiariesCount = 1,
  coverageLevel = 'confort',
  basePrice,
} = {}) {
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
  const typeByBranch = {
    Santé: 'health',
    Automobile: 'auto',
    Scolaire: 'student',
    Voyage: 'voyage',
    Habitation: 'habitation',
    'Assurances Collectives': 'collective',
    'Accidents Travail & Prévoyance': 'work_accident',
    'Obsèques & Rapatriement': 'obseques',
    'Multirisque PME': 'pme',
    'Transport & Fret': 'transport',
    'Agricole & Élevage': 'agricole',
    'RC Professionnelle': 'rc_pro',
    'Chantier & BTP': 'chantier',
    'Micro-Assurance': 'micro',
    'Cyber-Risques': 'cyber',
  };

  return calculateInsuranceQuote({
    insuranceType:
      pack?.insuranceType ||
      typeByBranch[pack?.branch] ||
      typeByBranch[pack?.category] ||
      'health',
    beneficiariesCount,
    coverageLevel: String(coverageLevel || pack?.coverageLevel || 'confort').toLowerCase(),
    basePrice: pack?.price,
  });
}

export { COVERAGE_OPTIONS, INSURANCE_OPTIONS };
