import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaShieldAlt,
  FaSearch,
  FaHeartbeat,
  FaPlaneDeparture,
  FaGraduationCap,
  FaCar,
  FaUsers,
  FaHardHat,
  FaCheckCircle,
  FaInfoCircle,
  FaFilter,
  FaTimes,
  FaChevronRight,
  FaLayerGroup,
  FaHeadset,
  FaArrowRight
} from 'react-icons/fa';

// ============================================================================
// 1. DONNÉES : 6 CATÉGORIES × 5 SOUS-CATÉGORIES (30 PACKS D'ASSURANCE)
// ============================================================================
const CATEGORIES_DATA = [
  {
    id: 'sante',
    label: 'Santé',
    icon: <FaHeartbeat />,
    packs: [
      {
        id: 'sante-1',
        name: 'Santé Essentiel RDC',
        category: 'Santé',
        tagline: 'Soins courants & consultations',
        price: '15',
        period: 'Mois',
        coverageLimit: '2 500 USD / an',
        isPopular: false,
        icon: <FaHeartbeat size={20} />,
        description: 'Couverture médicale de base idéale pour les consultations généralistes, analyses de laboratoire et médicaments génériques dans le réseau agréé.',
        guarantees: [
          'Consultations généralistes et spécialistes à 80%',
          'Frais pharmaceutiques et examens biologiques',
          'Accès direct aux cliniques partenaires sans avance de frais',
          'Téléconsultation médicale 24h/24 incluse'
        ]
      },
      {
        id: 'sante-2',
        name: 'Santé Famille Sérénité',
        category: 'Santé',
        tagline: 'Protection complète foyer & enfants',
        price: '45',
        period: 'Mois',
        coverageLimit: '10 000 USD / an',
        isPopular: true,
        icon: <FaHeartbeat size={20} />,
        description: 'La formule préférée des familles et de la diaspora pour sécuriser parents et enfants face aux hospitalisations et soins pédiatriques.',
        guarantees: [
          'Hospitalisation médicale et chirurgicale à 90%',
          'Suivi pédiatrique, maternité et vaccinations',
          'Soins dentaires et optique de base inclus',
          'Carte numérique QR Code avec tiers payant immédiat'
        ]
      },
      {
        id: 'sante-3',
        name: 'Santé Diaspora Parents',
        category: 'Santé',
        tagline: 'Souscription à distance pour proches',
        price: '65',
        period: 'Mois',
        coverageLimit: '15 000 USD / an',
        isPopular: false,
        icon: <FaHeartbeat size={20} />,
        description: 'Conçu spécialement pour les résidents à l’étranger souhaitant garantir une prise en charge médicale d’excellence à leurs parents au pays.',
        guarantees: [
          'Bilan de santé annuel complet préventif',
          'Prise en charge des pathologies chroniques (hypertension, diabète)',
          'Notifications en temps réel au souscripteur lors de chaque soin',
          'Assistance ambulance et transfert inter-hospitalier'
        ]
      },
      {
        id: 'sante-4',
        name: 'Santé Maternité & Bébé',
        category: 'Santé',
        tagline: 'Suivi prénatal & accouchement',
        price: '35',
        period: 'Mois',
        coverageLimit: '5 000 USD / an',
        isPopular: false,
        icon: <FaHeartbeat size={20} />,
        description: 'Accompagnement intégral de la future maman, des échographies trimestrielles jusqu’aux soins post-nataux du nouveau-né.',
        guarantees: [
          'Consultations prénatales et échographies obligatoires',
          'Forfait accouchement normal ou césarienne en clinique agréée',
          'Soins néonatals durant les 30 premiers jours',
          'Chambre individuelle garantie selon disponibilité'
        ]
      },
      {
        id: 'sante-5',
        name: 'Santé Prestige VIP',
        category: 'Santé',
        tagline: 'Couverture internationale & évacuation',
        price: '120',
        period: 'Mois',
        coverageLimit: '50 000 USD / an',
        isPopular: false,
        icon: <FaHeartbeat size={20} />,
        description: 'Protection haut de gamme offrant un remboursement à 100% et une évacuation sanitaire régionale en cas d’urgence majeure.',
        guarantees: [
          'Remboursement à 100% des frais réels dans les centres VIP',
          'Évacuation sanitaire (Afrique du Sud, Europe, Maroc)',
          'Forfait optique et prothèses dentaires renforcé',
          'Conciergerie médicale dédiée 7j/7'
        ]
      }
    ]
  },
  {
    id: 'voyage',
    label: 'Voyage',
    icon: <FaPlaneDeparture />,
    packs: [
      {
        id: 'voyage-1',
        name: 'Visa Schengen Conformité',
        category: 'Voyage',
        tagline: 'Attestation officielle 30 000 EUR',
        price: '25',
        period: 'Séjour',
        coverageLimit: '30 000 EUR',
        isPopular: true,
        icon: <FaPlaneDeparture size={20} />,
        description: 'Conforme aux exigences strictes des consulats et ambassades de l’espace Schengen. Émission immédiate avec QR Code vérifiable.',
        guarantees: [
          'Frais médicaux et d’hospitalisation d’urgence jusqu’à 30 000 EUR',
          'Rapatriement sanitaire et transport médicalisé à 100%',
          'Attestation PDF certifiée délivrée en 2 minutes',
          'Valable dans les 29 pays de l’espace Schengen'
        ]
      },
      {
        id: 'voyage-2',
        name: 'Voyage Afrique & Régional',
        category: 'Voyage',
        tagline: 'Déplacements COMESA, SADC & Afrique',
        price: '18',
        period: 'Séjour',
        coverageLimit: '15 000 USD',
        isPopular: false,
        icon: <FaPlaneDeparture size={20} />,
        description: 'Sécurisez vos déplacements professionnels ou familiaux sur l’ensemble du continent africain.',
        guarantees: [
          'Prise en charge médicale d’urgence et soins dentaires',
          'Rapatriement sanitaire vers le pays de résidence',
          'Assistance juridique et avance de caution pénale',
          'Indemnisation en cas de perte de bagages enregistrés'
        ]
      },
      {
        id: 'voyage-3',
        name: 'Voyage Monde & Amériques',
        category: 'Voyage',
        tagline: 'USA, Canada, Asie & Moyen-Orient',
        price: '45',
        period: 'Séjour',
        coverageLimit: '100 000 USD',
        isPopular: false,
        icon: <FaPlaneDeparture size={20} />,
        description: 'Plafond médical élevé adapté aux destinations où les coûts hospitaliers sont particulièrement onéreux.',
        guarantees: [
          'Frais médicaux d’urgence jusqu’à 100 000 USD',
          'Rapatriement sanitaire et billet aller-retour pour un proche',
          'Responsabilité civile vie privée à l’étranger',
          'Plateforme d’assistance multilingue 24h/24'
        ]
      },
      {
        id: 'voyage-4',
        name: 'Pack Étudiant International',
        category: 'Voyage',
        tagline: 'Séjours académiques longue durée',
        price: '140',
        period: 'An',
        coverageLimit: '50 000 EUR / an',
        isPopular: false,
        icon: <FaPlaneDeparture size={20} />,
        description: 'Couverture annuelle conçue pour les étudiants inscrits dans une université ou école à l’étranger.',
        guarantees: [
          'Couverture santé complète pour toute l’année universitaire',
          'Assistance psychologique et rapatriement médical',
          'Responsabilité civile locative et stages incluse',
          'Renouvellement simplifié en ligne'
        ]
      },
      {
        id: 'voyage-5',
        name: 'Business Multi-Voyages',
        category: 'Voyage',
        tagline: 'Dirigeants & grands voyageurs',
        price: '180',
        period: 'An',
        coverageLimit: '150 000 USD / an',
        isPopular: false,
        icon: <FaPlaneDeparture size={20} />,
        description: 'Couvre un nombre illimité de déplacements internationaux de moins de 90 jours chacun sur 12 mois.',
        guarantees: [
          'Voyages illimités dans le monde entier pendant 1 an',
          'Compensation retard de vol et perte de matériel professionnel',
          'Frais médicaux et évacuation d’urgence VIP',
          'Annulation ou interruption de voyage couverte'
        ]
      }
    ]
  },
  {
    id: 'scolarite',
    label: 'Scolarité',
    icon: <FaGraduationCap />,
    packs: [
      {
        id: 'scolarite-1',
        name: 'Scolaire Essentiel Élève',
        category: 'Scolarité',
        tagline: 'Protection trajets & enceinte scolaire',
        price: '12',
        period: 'An',
        coverageLimit: '1 500 USD / an',
        isPopular: false,
        icon: <FaGraduationCap size={20} />,
        description: 'Assurance individuelle accident couvrant l’élève sur le chemin de l’école et durant toutes les activités scolaires.',
        guarantees: [
          'Frais médicaux suite à un accident scolaire ou de trajet',
          'Responsabilité civile dommages causés à autrui',
          'Frais de transport d’urgence vers l’hôpital le plus proche',
          'Attestation immédiate pour l’inscription administrative'
        ]
      },
      {
        id: 'scolarite-2',
        name: 'Garantie Études & Rente',
        category: 'Scolarité',
        tagline: 'Continuité des études en cas de coup dur',
        price: '30',
        period: 'An',
        coverageLimit: '5 000 USD / an',
        isPopular: true,
        icon: <FaGraduationCap size={20} />,
        description: 'Garantit le paiement des frais de scolarité jusqu’à la fin du cycle en cas de décès ou d’invalidité du parent payeur.',
        guarantees: [
          'Prise en charge directe des frais scolaires auprès de l’école',
          'Versement d’une rente éducation annuelle garantie',
          'Couverture individuelle accident 24h/24 et 7j/7',
          'Soutien scolaire à domicile en cas d’immobilisation'
        ]
      },
            {
        id: 'scolarite-3',
        name: 'Pack Campus Universitaire',
        category: 'Scolarité',
        tagline: 'Étudiants en instituts & universités',
        price: '20',
        period: 'An',
        coverageLimit: '3 000 USD / an',
        isPopular: false,
        icon: <FaGraduationCap size={20} />,
        description: 'Protection adaptée aux étudiants du supérieur incluant les stages en entreprise et activités sportives.',
        guarantees: [
          'Couverture accidents durant les cours, laboratoires et stages',
          'Responsabilité civile professionnelle stagiaire',
          'Remboursement frais optiques et dentaires accidentels',
          'Carte étudiant assuré numérique'
        ]
      },
      {
        id: 'scolarite-4',
        name: 'Scolarité Multi-Enfants',
        category: 'Scolarité',
        tagline: 'Tarif dégressif dès 3 enfants',
        price: '55',
        period: 'An',
        coverageLimit: '12 000 USD / an',
        isPopular: false,
        icon: <FaGraduationCap size={20} />,
        description: 'Regroupez la protection scolaire et la rente éducation de toute votre fratrie sur un seul contrat simplifié.',
        guarantees: [
          'Jusqu’à 5 enfants couverts sur une même police',
          'Rente éducation garantie pour chaque enfant inscrit',
          'Protection 24h/24 même pendant les vacances scolaires',
          'Gestion centralisée des attestations par établissement'
        ]
      },
      {
        id: 'scolarite-5',
        name: 'Établissement & Crèche Pro',
        category: 'Scolarité',
        tagline: 'Couverture collective pour écoles',
        price: '250',
        period: 'An',
        coverageLimit: '50 000 USD / an',
        isPopular: false,
        icon: <FaGraduationCap size={20} />,
        description: 'Solution clé en main permettant aux promoteurs d’écoles d’assurer l’ensemble de leurs élèves et locaux.',
        guarantees: [
          'Responsabilité civile chef d’établissement',
          'Couverture collective accidents pour tous les inscrits',
          'Assistance médicale d’urgence sur le campus',
          'Tableau de bord de gestion pour l’administration scolaire'
        ]
      }
    ]
  },
  {
    id: 'automobile',
    label: 'Automobile',
    icon: <FaCar />,
    packs: [
      {
        id: 'auto-1',
        name: 'Auto Responsabilité Civile',
        category: 'Automobile',
        tagline: 'Couverture légale obligatoire',
        price: '85',
        period: 'An',
        coverageLimit: 'Selon barème légal',
        isPopular: false,
        icon: <FaCar size={20} />,
        description: 'L’assurance obligatoire pour circuler en toute légalité et couvrir les dommages matériels et corporels causés aux tiers.',
        guarantees: [
          'Dommages corporels et matériels causés aux tiers',
          'Défense pénale et recours suite à accident',
          'Vignette et attestation numérique vérifiable par QR Code',
          'Souscription et renouvellement en 3 minutes'
        ]
      },
      {
        id: 'auto-2',
        name: 'Auto Tiers Confort +',
        category: 'Automobile',
        tagline: 'RC + Vol, Incendie & Bris de glace',
        price: '190',
        period: 'An',
        coverageLimit: 'Valeur vénale',
        isPopular: true,
        icon: <FaCar size={20} />,
        description: 'Le meilleur équilibre budget-protection pour sécuriser votre véhicule contre les risques majeurs du quotidien.',
        guarantees: [
          'Responsabilité civile obligatoire incluse',
          'Garantie Vol, tentative de vol et Incendie',
          'Bris de glace (pare-brise, lunette arrière, vitres latérales)',
          'Assistance dépannage et remorquage 24h/24 en ville'
        ]
      },
      {
        id: 'auto-3',
        name: 'Auto Tous Risques Intégral',
        category: 'Automobile',
        tagline: 'Protection maximale même responsable',
        price: '420',
        period: 'An',
        coverageLimit: 'Valeur à neuf / vénale',
        isPopular: false,
        icon: <FaCar size={20} />,
        description: 'Couverture complète pour véhicules récents ou haut de gamme, incluant les dommages tous accidents.',
        guarantees: [
          'Dommages tous accidents (collision, choc, vandalisme)',
          'Vol, incendie, catastrophes naturelles et bris de glace',
          'Sécurité du conducteur et des passagers transportés',
          'Prise en charge rapide dans notre réseau de garages agréés'
        ]
      },
      {
        id: 'auto-4',
        name: 'Pack Taxi & VTC Pro',
        category: 'Automobile',
        tagline: 'Transport urbain de personnes',
        price: '140',
        period: 'An',
        coverageLimit: 'Couverture passagers',
        isPopular: false,
        icon: <FaCar size={20} />,
        description: 'Formule dédiée aux chauffeurs indépendants et exploitants VTC avec protection renforcée des passagers.',
        guarantees: [
          'Responsabilité civile transport public de voyageurs',
          'Protection individuelle des passagers transportés',
          'Option paiement fractionné trimestriel disponible',
          'Assistance remorquage prioritaire pour limiter l’immobilisation'
        ]
      },
      {
        id: 'auto-5',
        name: 'Flotte Entreprise & Logistique',
        category: 'Automobile',
        tagline: 'Gestion multi-véhicules B2B',
        price: '650',
        period: 'An',
        coverageLimit: 'Sur mesure flotte',
        isPopular: false,
        icon: <FaCar size={20} />,
        description: 'Centralisez l’assurance de vos véhicules utilitaires, camions et voitures de fonction sur un portail unique.',
        guarantees: [
          'Tarification préférentielle dès 3 véhicules assurés',
          'Ajout ou retrait de véhicules en temps réel en ligne',
          'Suivi centralisé des sinistres et échéances',
          'Gestionnaire de compte dédié aux entreprises'
        ]
      }
    ]
  },
  {
    id: 'collective',
    label: 'Collective & Mutuelle',
    icon: <FaUsers />,
    packs: [
      {
        id: 'coll-1',
        name: 'Start-up & PME (5 à 20 sal.)',
        category: 'Collective & Mutuelle',
        tagline: 'Santé collective agile pour équipes',
        price: '18',
        period: 'Salarié / Mois',
        coverageLimit: '5 000 USD / salarié',
        isPopular: false,
        icon: <FaUsers size={20} />,
        description: 'Attirez et fidélisez vos talents avec une couverture santé moderne, simple à piloter par les ressources humaines.',
        guarantees: [
          'Soins ambulatoires, pharmacie et analyses à 80%',
          'Hospitalisation médicale et chirurgicale incluse',
          'Portail RH pour ajouter ou retirer un salarié en 1 clic',
          'Cartes digitales immédiates sur smartphone pour chaque agent'
        ]
      },
      {
        id: 'coll-2',
        name: 'Santé Entreprise Croissance',
        category: 'Collective & Mutuelle',
        tagline: 'Couverture salariés & ayants droit',
        price: '35',
        period: 'Salarié / Mois',
        coverageLimit: '15 000 USD / famille',
        isPopular: true,
        icon: <FaUsers size={20} />,
        description: 'La solution de référence pour les PME et ONG souhaitant couvrir le salarié, son conjoint et ses enfants.',
        guarantees: [
          'Couverture étendue au conjoint et aux enfants à charge',
          'Maternité, soins dentaires et forfait optique inclus',
          'Tiers payant intégral dans plus de 150 cliniques agréées',
          'Reporting trimestriel anonyme de consommation santé'
        ]
      },
      {
        id: 'coll-3',
        name: 'Mutuelle Coopérative & Asbl',
        category: 'Collective & Mutuelle',
        tagline: 'Solidarité pour associations & syndicats',
        price: '12',
        period: 'Membre / Mois',
        coverageLimit: '3 000 USD / membre',
        isPopular: false,
        icon: <FaUsers size={20} />,
        description: 'Structuration de mutuelles de santé pour les regroupements professionnels, églises, marchés et associations.',
        guarantees: [
          'Cotisations mutualisées accessibles à tous les membres',
          'Prise en charge des soins primaires et urgences',
          'Collecte des cotisations via Mobile Money automatisée',
          'Tableaux de bord transparents pour le bureau de la mutuelle'
        ]
      },
      {
        id: 'coll-4',
        name: 'Prévoyance Décès & Obsèques',
        category: 'Collective & Mutuelle',
        tagline: 'Capital immédiat pour les familles',
        price: '10',
        period: 'Salarié / Mois',
        coverageLimit: '10 000 USD capital',
        isPopular: false,
        icon: <FaUsers size={20} />,
        description: 'Protégez les familles de vos collaborateurs avec le versement rapide d’un capital en cas de disparition.',
        guarantees: [
          'Versement d’un capital obsèques sous 48h ouvrées',
          'Capital décès supplémentaire équivalent à 12 mois de salaire',
          'Couverture invalidité absolue et définitive',
          'Accompagnement administratif des bénéficiaires'
        ]
      },
      {
        id: 'coll-5',
        name: 'Corporate & Grands Comptes',
        category: 'Collective & Mutuelle',
        tagline: 'Programme sur mesure +100 salariés',
        price: '75',
        period: 'Salarié / Mois',
        coverageLimit: '50 000 USD / famille',
        isPopular: false,
        icon: <FaUsers size={20} />,
        description: 'Architecture santé et prévoyance internationale pour banques, télécoms, mines et multinationales.',
        guarantees: [
          'Remboursement jusqu’à 100% et évacuation sanitaire régionale',
          'Intégration API avec votre logiciel SIRH existant',
          'Campagnes de dépistage et médecine préventive sur site',
          'Directeur de clientèle et ligne d’assistance dédiés 24/7'
        ]
      }
    ]
  },
  {
    id: 'accidents-travail',
    label: 'Accidents du Travail',
    icon: <FaHardHat />,
    packs: [
      {
        id: 'at-1',
        name: 'Complémentaire CNSS Base',
        category: 'Accidents du Travail',
        tagline: 'Relais & renfort du régime obligatoire',
        price: '14',
        period: 'Salarié / Mois',
        coverageLimit: '10 000 USD',
        isPopular: false,
        icon: <FaHardHat size={20} />,
        description: 'Complète les prestations légales de la CNSS pour garantir une indemnisation rapide et digne de vos équipes.',
        guarantees: [
          'Couverture des accidents sur le lieu de travail et en trajet',
          'Prise en charge immédiate des premiers soins d’urgence',
          'Indemnité journalière complémentaire en cas d’arrêt',
          'Conformité avec les obligations de protection employeur'
        ]
      },
      {
        id: 'at-2',
        name: 'Protection Chantier & BTP',
        category: 'Accidents du Travail',
        tagline: 'Sécurité des équipes techniques & terrain',
        price: '25',
        period: 'Salarié / Mois',
        coverageLimit: '25 000 USD',
        isPopular: true,
        icon: <FaHardHat size={20} />,
        description: 'Indispensable pour les entreprises de construction, ingénierie, maintenance et industrie exposées aux risques physiques.',
        guarantees: [
          'Prise en charge des frais de secours et transport d’urgence',
          'Frais médicaux, chirurgicaux et rééducation fonctionnelle',
          'Capital invalidité permanente totale ou partielle',
          'Couverture temporaire possible pour sous-traitants et journaliers'
        ]
      },
      {
        id: 'at-3',
        name: 'Individuelle Accident Pro 24/7',
        category: 'Accidents du Travail',
        tagline: 'Vie professionnelle & vie privée',
        price: '22',
        period: 'Salarié / Mois',
        coverageLimit: '20 000 USD',
        isPopular: false,
        icon: <FaHardHat size={20} />,
        description: 'Protège vos cadres, commerciaux et techniciens aussi bien durant leurs missions qu’en dehors des heures de bureau.',
        guarantees: [
          'Protection mondiale 24h/24, 7j/7 (travail, trajets, domicile)',
          'Rente d’incapacité temporaire ou permanente pour le salarié',
          'Capital décès accidentel versé aux ayants droit',
          'Frais de prothèses et d’appareillage inclus'
        ]
      },
      {
        id: 'at-4',
        name: 'Pack Mines & Industrie Lourde',
        category: 'Accidents du Travail',
        tagline: 'Haute protection sites isolés',
        price: '55',
        period: 'Salarié / Mois',
        coverageLimit: '75 000 USD',
        isPopular: false,
        icon: <FaHardHat size={20} />,
        description: 'Conçu pour les opérations minières, énergétiques et industrielles nécessitant des moyens d’évacuation rapides.',
        guarantees: [
          'Évacuation médicale aérienne depuis les sites isolés',
          'Indemnisation élevée en cas de décès accidentel ou invalidité',
          'Prise en charge des maladies professionnelles reconnues',
          'Audit prévention et accompagnement HSE inclus'
        ]
      },
      {
        id: 'at-5',
        name: 'Indépendants & Artisans',
        category: 'Accidents du Travail',
        tagline: 'Maintien de revenu travailleurs autonomes',
        price: '16',
        period: 'Mois',
        coverageLimit: '8 000 USD',
        isPopular: false,
        icon: <FaHardHat size={20} />,
        description: 'Protégez votre capacité de travail et vos revenus en tant qu’entrepreneur, consultant ou artisan indépendant.',
        guarantees: [
          'Versement d’une indemnité journalière dès le 4e jour d’arrêt',
          'Remboursement des soins suite à un accident professionnel',
          'Capital reconversion en cas d’invalidité partielle',
          'Souscription sans questionnaire médical complexe'
        ]
      }
    ]
  }
];

// ============================================================================
// 2. COMPOSANT PRINCIPAL : CATALOGUE DES PACKS & NAVIGATION SIDEBAR
// ============================================================================
const PacksCataloguePage = () => {
  const navigate = useNavigate();

  // États de navigation et de filtrage
  const [activeCategory, setActiveCategory] = useState('sante');
  const [selectedPackId, setSelectedPackId] = useState('sante-2');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Récupération de la catégorie active
  const currentCategoryObj = useMemo(
    () => CATEGORIES_DATA.find((c) => c.id === activeCategory) || CATEGORIES_DATA[0],
    [activeCategory]
  );

  // Filtrage des sous-catégories (offres) dans la sidebar selon la recherche
  const sidebarPacks = useMemo(() => {
    if (!searchQuery.trim()) return currentCategoryObj.packs;
    const q = searchQuery.toLowerCase();
    return CATEGORIES_DATA.flatMap((cat) => cat.packs).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [currentCategoryObj, searchQuery]);

  // Pack actuellement affiché dans le panneau de détails principal
  const activePack = useMemo(() => {
    const allPacks = CATEGORIES_DATA.flatMap((c) => c.packs);
    return allPacks.find((p) => p.id === selectedPackId) || currentCategoryObj.packs[0];
  }, [selectedPackId, currentCategoryObj]);

  // Changement de catégorie : sélectionne automatiquement l'offre populaire ou la 1ère
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    setSearchQuery('');
    const targetCat = CATEGORIES_DATA.find((c) => c.id === catId);
    if (targetCat && targetCat.packs.length > 0) {
      const popular = targetCat.packs.find((p) => p.isPopular) || targetCat.packs[0];
      setSelectedPackId(popular.id);
    }
  };

  // Sélection d'un pack depuis la sidebar (Desktop ou Mobile)
  const handleSelectPack = (pack) => {
    setSelectedPackId(pack.id);
    const parentCat = CATEGORIES_DATA.find((c) => c.label === pack.category);
    if (parentCat) setActiveCategory(parentCat.id);
    setIsMobileMenuOpen(false);
  };

  // Redirection vers le parcours de souscription
  const handleSubscription = (pack) => {
    navigate('/souscription', { state: { selectedPack: pack } });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col font-sans selection:bg-[#CE1126] selection:text-white pb-20 lg:pb-0">
      
      {/* ================= EN-TÊTE FINTECH SOMBRE ================= */}
      <header className="relative bg-[#090d16] border-b border-slate-900 pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/30 border-l-4 border-l-[#CE1126] rounded-none">
                Écosystème Numérique des Assurances
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
                Catalogue des <span className="text-[#CE1126]">Offres & Packs</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl font-medium">
                Explorez nos 6 branches d’assurance et 30 solutions dédiées aux particuliers, familles, diaspora et entreprises.
              </p>
            </div>

            {/* Bouton Mobile rapide intégré sous le texte */}
            <div className="lg:hidden w-full sm:w-auto">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-none active:scale-95 border border-white shadow-xl focus:outline-none"
              >
                <FaFilter size={12} className="text-[#CE1126]" />
                <span>Explorer les offres ({currentCategoryObj.label}) ↑</span>
              </button>
            </div>
          </div>

          {/* ================= BARRE DE CATÉGORIES DESKTOP (6 BRANCHES) ================= */}
          <div className="hidden lg:flex mt-8 w-full overflow-x-auto no-scrollbar border-t border-slate-900 pt-6">
            <div className="flex gap-3 whitespace-nowrap">
              {CATEGORIES_DATA.map((cat) => {
                const isActive = activeCategory === cat.id && !searchQuery;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`flex items-center gap-2.5 px-5 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all border-2 rounded-none focus:outline-none ${
                      isActive
                        ? 'border-[#CE1126] bg-[#CE1126] text-white shadow-lg'
                        : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-white hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-[#CE1126]'}>
                      {cat.icon}
                    </span>
                    <span>{cat.label}</span>
                    <span className={`ml-1 px-1.5 py-0.5 text-[9px] font-black ${
                      isActive ? 'bg-black/30 text-white' : 'bg-slate-950 text-slate-400'
                    }`}>
                      {cat.packs.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ================= CONTENEUR PRINCIPAL : SIDEBAR + VUE DÉTAILLÉE ================= */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ====================================================================
              COLONNE GAUCHE (4 cols) : SIDEBAR STYLE MESSAGERIE / FINTECH PRO
             ==================================================================== */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col bg-[#111827] border border-slate-800 rounded-none overflow-hidden sticky top-24 shadow-2xl">
            {/* En-tête Sidebar + Recherche instantanée */}
            <div className="p-4 border-b border-slate-800 bg-[#090d16] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                  <FaLayerGroup className="text-[#CE1126]" />
                  {searchQuery ? 'Résultats de recherche' : `Offres : ${currentCategoryObj.label}`}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 border border-slate-800">
                  {sidebarPacks.length} packs
                </span>
              </div>

              {/* Barre de recherche style messagerie */}
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un pack, une garantie..."
                  className="w-full bg-[#111827] border border-slate-800 focus:border-[#CE1126] text-white text-xs pl-9 pr-8 py-2.5 rounded-none focus:outline-none placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Liste verticale des 5 sous-catégories (liens cliquables) */}
            <div className="divide-y divide-slate-800/80 max-h-[540px] overflow-y-auto">
              {sidebarPacks.length > 0 ? (
                sidebarPacks.map((pack) => {
                  const isSelected = activePack.id === pack.id;
                  return (
                    <button
                      key={pack.id}
                      onClick={() => handleSelectPack(pack)}
                      className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 rounded-none focus:outline-none ${
                        isSelected
                          ? 'bg-[#CE1126]/15 border-l-4 border-l-[#CE1126]'
                          : 'hover:bg-slate-900/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 shrink-0 flex items-center justify-center border rounded-none mt-0.5 ${
                          isSelected
                            ? 'bg-[#CE1126] border-[#CE1126] text-white'
                            : 'bg-[#090d16] border-slate-800 text-[#CE1126]'
                        }`}>
                          {pack.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-black uppercase truncate ${
                              isSelected ? 'text-white' : 'text-slate-200'
                            }`}>
                              {pack.name}
                            </h4>
                            {pack.isPopular && (
                              <span className="shrink-0 w-2 h-2 bg-[#CE1126] rounded-full" title="Le plus choisi" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {pack.tagline}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-black text-white">
                              {pack.price} USD
                            </span>
                            <span className="text-[9px] uppercase text-slate-500 font-bold">
                              / {pack.period}
                            </span>
                          </div>
                        </div>
                      </div>

                      <FaChevronRight
                        size={11}
                        className={`shrink-0 mt-3 transition-transform ${
                          isSelected ? 'text-[#CE1126] translate-x-1' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Aucune offre ne correspond à « {searchQuery} ».
                </div>
              )}
            </div>

            {/* Pied de sidebar : Assistance rapide */}
            <div className="p-4 bg-[#090d16] border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FaHeadset className="text-[#CE1126]" size={16} />
                <div>
                  <p className="text-[10px] font-black uppercase text-white">Besoin d’un conseil ?</p>
                  <p className="text-[10px] text-slate-400">Un expert vous répond en direct</p>
                </div>
              </div>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-[#CE1126] hover:text-white transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </aside>

          {/* ====================================================================
              COLONNE DROITE (8 cols) : AFFICHAGE DÉTAILLÉ DU PACK SÉLECTIONNÉ
             ==================================================================== */}
          <main className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePack.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className={`bg-[#111827] border flex flex-col justify-between relative shadow-2xl rounded-none ${
                  activePack.isPopular
                    ? 'border-2 border-[#CE1126]'
                    : 'border-slate-800'
                }`}
              >
                {/* Badge "Le plus choisi" */}
                {activePack.isPopular && (
                  <span className="absolute -top-3.5 right-6 bg-[#CE1126] text-white text-[10px] uppercase font-black tracking-widest px-4 py-1.5 shadow-lg rounded-none z-10">
                    Le plus choisi
                  </span>
                )}

                {/* En-tête de la fiche détaillée */}
                <div className="p-6 md:p-10 border-b border-slate-800 bg-gradient-to-br from-[#111827] to-[#090d16]">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-950 border border-slate-800 flex items-center justify-center text-[#CE1126] rounded-none shadow-md">
                        {activePack.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-[#CE1126] px-3 py-1 rounded-none">
                          {activePack.category}
                        </span>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">
                          {activePack.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Bloc Tarifaire Blanc Contrasté */}
                    <div className="bg-white text-black px-6 py-4 border-l-4 border-l-[#CE1126] shadow-lg">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Prime à partir de
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl md:text-4xl font-black tracking-tighter text-black">
                          {activePack.price} USD
                        </span>
                        <span className="text-xs font-black uppercase text-[#CE1126]">
                          / {activePack.period}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mb-3">
                    {activePack.name}
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    {activePack.description}
                  </p>
                  </div>
                {/* Corps : Plafond & Liste complète des garanties */}
                <div className="p-6 md:p-10 space-y-8">
                  {/* Encart Plafond de couverture */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-white bg-[#CE1126]/10 px-5 py-4 border border-[#CE1126]/30 border-l-4 border-l-[#CE1126] rounded-none">
                    <div className="flex items-center gap-2.5 text-[#CE1126]">
                      <FaInfoCircle size={16} />
                      <span>Plafond de couverture garanti</span>
                    </div>
                    <span className="text-sm md:text-base text-white font-black">
                      {activePack.coverageLimit}
                    </span>
                  </div>

                  {/* Grille des garanties incluses */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-5">
                      Garanties & Services Inclus dans ce pack
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePack.guarantees.map((item, i) => (
                        <div
                          key={i}
                          className="p-4 bg-[#090d16] border border-slate-800/90 flex items-start gap-3.5 hover:border-slate-700 transition-colors"
                        >
                          <FaCheckCircle className="text-[#CE1126] shrink-0 mt-0.5" size={15} />
                          <span className="text-xs md:text-sm text-slate-200 font-medium leading-snug">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bandeau réassurance écosystème */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-center">
                    <div className="p-3 bg-[#090d16] border border-slate-800">
                      <span className="block text-xs font-black text-white uppercase">Attestation QR</span>
                      <span className="text-[10px] text-slate-400">Émission immédiate</span>
                    </div>
                    <div className="p-3 bg-[#090d16] border border-slate-800">
                      <span className="block text-xs font-black text-white uppercase">Paiement Hybride</span>
                      <span className="text-[10px] text-slate-400">Carte & Mobile Money</span>
                    </div>
                    <div className="p-3 bg-[#090d16] border border-slate-800">
                      <span className="block text-xs font-black text-white uppercase">Diaspora & Local</span>
                      <span className="text-[10px] text-slate-400">Souscription à distance</span>
                    </div>
                  </div>
                </div>

                {/* ================= VOTRE BOUTON DE REDIRECTION EXACT ================= */}
                <div className="p-6 md:p-8 pt-0">
                  <button
                    onClick={() => handleSubscription(activePack)}
                    className={`w-full py-4 md:py-5 font-black uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 rounded-none border-2 focus:outline-none ${
                      activePack.isPopular
                        ? 'bg-[#CE1126] border-[#CE1126] text-white hover:bg-transparent hover:text-white'
                        : 'bg-white border-white text-black hover:bg-transparent hover:text-white'
                    }`}
                  >
                    <FaShieldAlt size={11} /> Souscrire pour ma famille
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ================= AUTRES PACKS DE LA MÊME CATÉGORIE (ACCÈS RAPIDE) ================= */}
            <section className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Autres formules dans « {currentCategoryObj.label} »
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  5 offres disponibles
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCategoryObj.packs
                  .filter((p) => p.id !== activePack.id)
                  .map((otherPack) => (
                    <button
                      key={otherPack.id}
                      onClick={() => handleSelectPack(otherPack)}
                      className="text-left p-5 bg-[#111827] border border-slate-800 hover:border-[#CE1126] transition-all flex items-center justify-between group rounded-none"
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#CE1126]">
                          {otherPack.price} USD / {otherPack.period}
                        </span>
                        <h4 className="text-sm font-black text-white uppercase mt-1 group-hover:text-[#CE1126] transition-colors">
                          {otherPack.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {otherPack.tagline}
                        </p>
                      </div>
                      <FaArrowRight className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                    </button>
                  ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* ========================================================================
          BARRE DE NAVIGATION INFÉRIEURE MOBILE (STYLE CAPTURE MOBILE)
         ======================================================================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800 px-2 py-2">
        <div className="flex items-center justify-around">
          {CATEGORIES_DATA.slice(0, 4).map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  handleSelectCategory(cat.id);
                  setIsMobileMenuOpen(true);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-2 text-[9px] font-black uppercase tracking-wider transition-colors ${
                  isActive ? 'text-[#CE1126]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base mb-1">{cat.icon}</span>
                <span className="truncate max-w-[65px]">{cat.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 bg-[#CE1126] text-white text-[9px] font-black uppercase tracking-wider"
          >
            <FaLayerGroup className="text-base mb-1" />
            <span>Toutes (6)</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================
          MOBILE : MENU DÉROULANT PLEIN ÉCRAN (BENTO FULLSCREEN DRAWER ONYX)
         ======================================================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="lg:hidden fixed inset-0 z-[9999] bg-[#090d16] text-white flex flex-col h-screen w-screen rounded-none overflow-hidden"
          >
            {/* Barre d'en-tête interne du menu */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-slate-900 bg-[#111827] shrink-0">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white block">
                  Catalogue des Assurances
                </span>
                <span className="text-[10px] text-[#CE1126] font-bold uppercase tracking-widest">
                  6 Catégories • 30 Offres
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 bg-[#090d16] border border-slate-800 text-white hover:text-[#CE1126] transition-colors rounded-none focus:outline-none"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Pilules horizontales des 6 catégories */}
            <div className="px-4 py-3 bg-[#090d16] border-b border-slate-900 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {CATEGORIES_DATA.map((cat) => {
                const isCatActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all rounded-none ${
                      isCatActive
                        ? 'bg-[#CE1126] border-[#CE1126] text-white'
                        : 'bg-[#111827] border-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
                })}
                </div>
                            {/* Liste verticale des 5 sous-catégories de la branche sélectionnée */}
            <div className="flex-grow px-5 py-6 space-y-3 bg-[#090d16] overflow-y-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                Sélectionnez un pack ({currentCategoryObj.label}) :
              </p>

              {currentCategoryObj.packs.map((pack) => {
                const isSelected = activePack.id === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => handleSelectPack(pack)}
                    className={`w-full p-4 text-left border transition-all duration-200 rounded-none flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#CE1126] bg-[#CE1126]/15 text-white border-l-4'
                        : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-white truncate">
                          {pack.name}
                        </span>
                        {pack.isPopular && (
                          <span className="px-2 py-0.5 bg-[#CE1126] text-white text-[8px] font-black uppercase">
                            Top
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {pack.tagline}
                      </p>
                      <span className="inline-block mt-1.5 text-xs font-black text-white">
                        {pack.price} USD <span className="text-[10px] text-slate-500">/ {pack.period}</span>
                      </span>
                    </div>

                    <FaChevronRight className={isSelected ? 'text-[#CE1126]' : 'text-slate-600'} />
                  </button>
                );
              })}
            </div>

            {/* Pied décoratif minimaliste ESNAs */}
            <div className="p-5 border-t border-slate-900 bg-[#111827] text-center shrink-0">
              <div className="flex items-baseline justify-center font-black tracking-tight text-sm text-slate-500 uppercase select-none">
                ESNA<span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
};

export default PacksCataloguePage;

