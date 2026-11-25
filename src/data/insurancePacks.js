export const CATEGORIES_META = [
  {
    id: 'sante',
    label: 'Santé',
    fullName: 'Assurance Santé & Médicale',
    prefix: 'Santé',
    basePrice: 25,
    baseCeiling: 5000,
    target: 'Particuliers, familles en RDC et proches de la diaspora',
    summary: 'Couverture complète des frais médicaux, hospitalisations, soins courants et urgences dans les cliniques partenaires en RDC.',
    guarantees: [
      'Consultations généralistes et spécialistes en réseau agréé',
      'Hospitalisation médicale et chirurgicale (chambre et soins)',
      'Analyses de laboratoire et imagerie médicale (radio, scanner)',
      'Frais pharmaceutiques et médicaments essentiels prescrits',
      'Évacuation sanitaire d’urgence vers Kinshasa ou Lubumbashi'
    ],
    exclusions: 'Chirurgie esthétique non réparatrice, cures thermales, soins hors réseau sans accord préalable.'
  },
  {
    id: 'auto',
    label: 'Automobile',
    fullName: 'Assurance Automobile & Moto',
    prefix: 'Auto',
    basePrice: 40,
    baseCeiling: 15000,
    target: 'Propriétaires de véhicules particuliers, taxis, motos et flottes',
    summary: 'Protection obligatoire et tous risques conforme à la réglementation ARCA pour circuler sereinement sur les routes de la RDC.',
    guarantees: [
      'Responsabilité Civile Automobile obligatoire (dommages aux tiers)',
      'Défense pénale et recours suite à accident de la circulation',
      'Garantie Vol total, braquage et tentative d’effraction',
      'Incendie, explosion et forces de la nature',
      'Bris de glace (pare-brise, lunette arrière, vitres latérales)'
    ],
    exclusions: 'Conduite en état d’ivresse, défaut de permis valide, usage compétition.'
  },
  {
    id: 'scolaire',
    label: 'Scolaire',
    fullName: 'Assurance Scolaire & Étudiant',
    prefix: 'Scolaire',
    basePrice: 10,
    baseCeiling: 3000,
    target: 'Élèves du primaire, secondaire et étudiants universitaires en RDC',
    summary: 'Protection de l’enfant à l’école, sur le trajet domicile-établissement et lors des activités parascolaires.',
    guarantees: [
      'Frais médicaux et pharmaceutiques suite à un accident scolaire',
      'Responsabilité civile scolaire (dommages causés à autrui)',
      'Garantie invalidité permanente partielle ou totale',
      'Capital décès accidentel et frais funéraires',
      'Frais de rattrapage scolaire à domicile en cas d’immobilisation'
    ],
    exclusions: 'Maladies non consécutives à un accident, rixes volontaires.'
  },
  {
    id: 'voyage',
    label: 'Voyage',
    fullName: 'Assurance Voyage & Diaspora',
    prefix: 'Voyage',
    basePrice: 15,
    baseCeiling: 30000,
    target: 'Voyageurs depuis/vers la RDC et membres de la diaspora en séjour',
    summary: 'Assistance médicale internationale et couverture voyage conforme aux exigences consulaires (Schengen, Afrique, Monde).',
    guarantees: [
      'Prise en charge des frais médicaux et d’hospitalisation à l’étranger',
      'Rapatriement sanitaire et transport médicalisé 24h/24',
      'Indemnisation en cas de perte, vol ou retard de bagages',
      'Assurance annulation ou interruption de voyage justifiée',
      'Responsabilité civile vie privée à l’étranger'
    ],
    exclusions: 'Maladies chroniques préexistantes non stabilisées, sports extrêmes.'
  },
  {
    id: 'habitation',
    label: 'Habitation',
    fullName: 'Multirisque Habitation',
    prefix: 'Habitat',
    basePrice: 30,
    baseCeiling: 25000,
    target: 'Locataires et propriétaires de maisons ou appartements',
    summary: 'Sécurisation de votre logement, de vos biens mobiliers et de votre responsabilité civile familiale.',
    guarantees: [
      'Incendie, explosion, foudre et dégâts électriques',
      'Dégâts des eaux, infiltrations et recherche de fuites',
      'Vol avec effraction, vandalisme et détériorations immobilières',
      'Responsabilité civile chef de famille et recours des voisins',
      'Frais de relogement temporaire après sinistre majeur'
    ],
    exclusions: 'Usure normale, défaut d’entretien manifeste, espèces et bijoux non déclarés.'
  },
  {
    id: 'collectives',
    label: 'Assurances Collectives',
    fullName: 'Assurances Collectives & Entreprises',
    prefix: 'Collectif',
    basePrice: 55,
    baseCeiling: 50000,
    target: 'Entreprises, ONG, écoles et associations souhaitant couvrir leurs employés',
    summary: 'Couverture santé, prévoyance et invalidité de groupe pour fidéliser et protéger vos équipes en RDC.',
    guarantees: [
      'Couverture santé collective pour employés et ayants droit',
      'Capital décès et invalidité permanente de groupe',
      'Prise en charge maternité et soins pédiatriques',
      'Tiers payant intégral dans le réseau médical agréé',
      'Reporting RH mensuel et carte digitale par collaborateur'
    ],
    exclusions: 'Effectif inférieur à 3 salariés, pathologies antérieures non déclarées.'
  },
  {
    id: 'prevoyance',
    label: 'Accidents Travail & Prévoyance',
    fullName: 'Accidents du Travail & Prévoyance',
    prefix: 'Prévoyance',
    basePrice: 35,
    baseCeiling: 40000,
    target: 'Travailleurs, indépendants, techniciens et chefs de famille',
    summary: 'Indemnisation rapide en cas d’accident professionnel, d’arrêt de travail ou d’invalidité.',
    guarantees: [
      'Indemnités journalières en cas d’incapacité temporaire de travail',
      'Rente ou capital en cas d’invalidité permanente partielle ou totale',
      'Prise en charge des frais médicaux et de rééducation professionnelle',
      'Versement d’un capital décès aux bénéficiaires désignés',
      'Assistance sociale et accompagnement familial'
    ],
    exclusions: 'Faute intentionnelle de l’assuré, état d’ébriété sur le lieu de travail.'
  },
  {
    id: 'obseques',
    label: 'Obsèques & Rapatriement',
    fullName: 'Assurance Obsèques & Rapatriement',
    prefix: 'Sérénité',
    basePrice: 12,
    baseCeiling: 10000,
    target: 'Familles en RDC et diaspora souhaitant anticiper les frais funéraires',
    summary: 'Financement immédiat et organisation complète des funérailles ou du rapatriement de corps vers la RDC.',
    guarantees: [
      'Déblocage rapide sous 48h du capital funéraire pour la famille',
      'Rapatriement international du corps depuis l’étranger vers la RDC',
      'Prise en charge du cercueil, de la conservation et des formalités',
      'Billet d’avion aller-retour pour un proche accompagnateur',
      'Assistance administrative et logistique 24h/24'
    ],
    exclusions: 'Délai de carence de 6 mois pour décès par maladie (immédiat si accident).'
  },
  {
    id: 'pme',
    label: 'Multirisque PME',
    fullName: 'Multirisque PME & Commerces',
    prefix: 'Business',
    basePrice: 60,
    baseCeiling: 40000,
    target: 'Boutiques, pharmacies, restaurants, bureaux et PME congolaises',
    summary: 'Protection globale des locaux professionnels, stocks de marchandises, équipements et pertes d’exploitation.',
    guarantees: [
      'Dommages aux locaux commerciaux, stocks et matériel professionnel',
      'Couverture contre le vol de marchandises et bris de vitrine',
      'Indemnisation des pertes d’exploitation après sinistre garanti',
      'Responsabilité civile exploitation vis-à-vis des clients et tiers',
      'Dommages électriques sur équipements informatiques et frigorifiques'
    ],
    exclusions: 'Pertes financières dues à une mauvaise gestion, vol sans effraction.'
  },
  {
    id: 'transport',
    label: 'Transport & Fret',
    fullName: 'Transport & Marchandises',
    prefix: 'Fret',
    basePrice: 80,
    baseCeiling: 60000,
    target: 'Importateurs, exportateurs, transitaires et transporteurs',
    summary: 'Sécurisation des cargaisons acheminées par voie routière, fluviale, maritime ou aérienne.',
    guarantees: [
      'Couverture Tous Risques de magasin à magasin (Matadi, Kinshasa, Lubumbashi)',
      'Dommages matériels suite à accident de transport ou naufrage',
      'Vol total de cargaison et disparition de colis entiers',
      'Contribution aux avaries communes et frais de sauvetage',
      'Couverture durant les opérations de chargement et déchargement'
    ],
    exclusions: 'Vice propre de la marchandise, emballage défectueux.'
  },
  {
    id: 'agricole',
    label: 'Agricole & Élevage',
    fullName: 'Assurance Agricole & Élevage',
    prefix: 'Agri',
    basePrice: 45,
    baseCeiling: 20000,
    target: 'Exploitants agricoles, coopératives et éleveurs',
    summary: 'Protection des récoltes, plantations et cheptels contre les aléas climatiques et sanitaires.',
    guarantees: [
      'Indemnisation en cas de sécheresse prolongée ou d’inondation',
      'Couverture incendie des récoltes sur pied et entreposées',
      'Mortalité du bétail suite à maladie contagieuse ou accident',
      'Dommages aux équipements agricoles et systèmes d’irrigation',
      'Assistance technique agronomique préventive'
    ],
    exclusions: 'Négligence sanitaire avérée, défaut de vaccination.'
  },
  {
    id: 'rc_pro',
    label: 'RC Professionnelle',
    fullName: 'Responsabilité Civile Pro',
    prefix: 'RC Pro',
    basePrice: 50,
    baseCeiling: 35000,
    target: 'Consultants, médecins, ingénieurs, cabinets et prestataires IT',
    summary: 'Couverture des conséquences financières des erreurs, omissions ou fautes professionnelles.',
    guarantees: [
      'Fautes professionnelles, erreurs de conception ou retards préjudiciables',
      'Atteinte involontaire aux données ou documents confiés par les clients',
      'Frais de défense juridique et honoraires d’avocats en cas de litige',
      'Dommages corporels et matériels causés lors d’une prestation sur site',
      'Protection de la réputation et gestion de crise'
    ],
    exclusions: 'Faute intentionnelle ou dolosive, amendes pénales.'
  },
  {
    id: 'chantier',
    label: 'Chantier & BTP',
    fullName: 'Tous Risques Chantier & BTP',
    prefix: 'BTP',
    basePrice: 120,
    baseCeiling: 100000,
    target: 'Entreprises de construction, promoteurs immobiliers et maîtres d’ouvrage',
    summary: 'Couverture complète des ouvrages en cours de construction, engins et responsabilité envers les tiers.',
    guarantees: [
      'Dommages matériels à l’ouvrage en construction (effondrement, tempête)',
      'Vol et détérioration des matériaux entreposés sur le chantier',
      'Bris de machine sur engins de génie civil et grues',
      'Responsabilité civile chantier envers les riverains et passants',
      'Garantie maintenance après réception provisoire des travaux'
    ],
    exclusions: 'Erreurs de calcul d’ingénierie non garanties.'
  },
  {
    id: 'micro',
    label: 'Micro-Assurance',
    fullName: 'Micro-Assurance & Mobile',
    prefix: 'Micro',
    basePrice: 5,
    baseCeiling: 1500,
    target: 'Travailleurs informels, petits commerçants et jeunes actifs',
    summary: 'Protections accessibles dès quelques dollars par mois, souscrites et indemnisées par Mobile Money.',
    guarantees: [
      'Forfait hospitalisation journalière en cas d’accident ou paludisme grave',
      'Indemnité forfaitaire en cas d’immobilisation temporaire de travail',
      'Capital décès accidentel immédiat versé sur le compte Mobile Money',
      'Protection contre le vol avec agression de téléphone et effets personnels',
      'Souscription sans bilan médical ni paperasse administrative'
    ],
    exclusions: 'Hospitalisations de moins de 24 heures.'
  },
  {
    id: 'cyber',
    label: 'Cyber-Risques',
    fullName: 'Cyber-Risques & Digital',
    prefix: 'Cyber',
    basePrice: 70,
    baseCeiling: 50000,
    target: 'Startups, fintechs, banques, e-commerces et entreprises connectées',
    summary: 'Protection contre les cyberattaques, ransomwares, fuites de données et interruptions de systèmes informatiques.',
    guarantees: [
      'Assistance technique d’urgence 24h/24 par des experts en cybersécurité',
      'Frais de récupération des données et restauration des serveurs',
      'Indemnisation des pertes d’exploitation suite à indisponibilité réseau',
      'Gestion des notifications légales et protection de l’e-réputation',
      'Couverture de la responsabilité civile en cas de fuite de données clients'
    ],
    exclusions: 'Logiciels piratés sans licence.'
  }
];

export const TIERS = [
  { level: 'Essentiel', mult: 1.0, rate: 70, waitingDays: 30, deductible: '15%', badge: 'Éco', isPopular: false },
  { level: 'Standard', mult: 1.3, rate: 75, waitingDays: 30, deductible: '10%', badge: 'Populaire', isPopular: true },
  { level: 'Confort', mult: 1.6, rate: 80, waitingDays: 15, deductible: '10%', badge: 'Recommandé', isPopular: false },
  { level: 'Plus', mult: 1.9, rate: 85, waitingDays: 15, deductible: '5%', badge: 'Étendu', isPopular: false },
  { level: 'Famille', mult: 2.2, rate: 85, waitingDays: 15, deductible: '5%', badge: 'Famille', isPopular: false },
  { level: 'Senior', mult: 2.4, rate: 85, waitingDays: 30, deductible: '5%', badge: 'Spécial Senior', isPopular: false },
  { level: 'Pro', mult: 2.8, rate: 90, waitingDays: 7, deductible: '0%', badge: 'Entreprise', isPopular: false },
  { level: 'Premium', mult: 3.2, rate: 95, waitingDays: 0, deductible: '0%', badge: 'VIP', isPopular: false },
  { level: 'Gold', mult: 3.8, rate: 98, waitingDays: 0, deductible: '0%', badge: 'Haut de gamme', isPopular: false },
  { level: 'Prestige', mult: 4.5, rate: 100, waitingDays: 0, deductible: '0%', badge: 'Intégral 100%', isPopular: false }
];

export function buildInsuranceCatalog() {
  const catalog = [];

  CATEGORIES_META.forEach((cat) => {
    TIERS.forEach((tier, index) => {
      const priceUSD = Math.round(cat.basePrice * tier.mult);
      const ceilingUSD = Math.round(cat.baseCeiling * tier.mult);
      const packGuarantees = [
        ...cat.guarantees,
        index >= 4
          ? 'Tiers payant direct sans avance de frais dans tout le réseau partenaire RDC'
          : 'Remboursement express sous 48h par Mobile Money ou virement',
        index >= 7
          ? 'Gestionnaire de compte dédié et assistance prioritaire 24h/24'
          : 'Attestation officielle sécurisée avec QR Code instantané'
      ];

      catalog.push({
        id: `${cat.id}-${index + 1}`,
        categoryId: cat.id,
        category: cat.label,
        categoryName: cat.fullName,
        title: `Pack ${cat.prefix} ${tier.level}`,
        name: `Pack ${cat.prefix} ${tier.level}`,
        tagline: `Couverture ${tier.rate}% • Plafond ${ceilingUSD.toLocaleString('fr-FR')} USD/an`,
        badge: tier.badge,
        isPopular: tier.isPopular,
        priceUSD,
        price: priceUSD,
        period: 'mois',
        annualPriceUSD: Math.round(priceUSD * 12 * 0.9),
        annualPrice: Math.round(priceUSD * 12 * 0.9),
        ceilingUSD,
        ceiling: ceilingUSD,
        coverageLimit: `${ceilingUSD.toLocaleString('fr-FR')} USD`,
        coverageRate: `${tier.rate}%`,
        deductible: tier.deductible,
        waitingPeriod: tier.waitingDays === 0 ? 'Immédiate (0 jour)' : `${tier.waitingDays} jours`,
        targetAudience: cat.target,
        shortDescription: cat.summary,
        description: cat.summary,
        fullDescription: `Le Pack ${cat.prefix} ${tier.level} garantit une prise en charge à hauteur de ${tier.rate}% avec un plafond annuel de ${ceilingUSD.toLocaleString('fr-FR')} USD. ${cat.summary}`,
        guarantees: packGuarantees,
        features: packGuarantees,
        benefits: packGuarantees,
        items: packGuarantees,
        exclusions: cat.exclusions,
        paymentMethods: ['M-Pesa', 'Airtel Money', 'Orange Money', 'Carte Visa / Mastercard (Diaspora)']
      });
    });
  });

  return catalog;
}

export const insurancePacks = buildInsuranceCatalog();

export const CATEGORIES_DATA = CATEGORIES_META.map((cat) => ({
  id: cat.id,
  label: cat.label,
  name: cat.fullName,
  summary: cat.summary,
  packs: insurancePacks.filter((p) => p.categoryId === cat.id)
}));

export const CATEGORIES_CONFIG = CATEGORIES_META;
