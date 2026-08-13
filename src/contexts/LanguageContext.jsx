import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext(null);
const originalTextNodes = new WeakMap();

const translations = {
  'Assurances': 'Insurance',
  'Services': 'Services',
  'Home': 'Home',
  'Nos Formules': 'Our Plans',
  'Simulateur Devis': 'Quote Simulator',
  'Réseau de Soins': 'Care Network',
  'Vérif. Hôpital': 'Hospital Check',
  'Déclarer un Sinistre': 'File a Claim',
  'Régulation ARCA': 'ARCA Regulation',
  'Mon Espace Privé': 'My Private Space',
  'Connexion': 'Sign in',
  'Espace Connexion Diasporas': 'Diaspora Sign in',
  'Sécurisé': 'Secure',
  'Service sécurisé': 'Secure service',
  'Vérifier': 'Verify',
  'Clair': 'Light',
  'Sombre': 'Dark',
  'Outil d’Aide à la Décision': 'Decision Support Tool',
  'Tarificateur En Ligne': 'Online Quotation',
  'Packs Micro-Assurance': 'Micro-Insurance Plans',
  'Souscription Immédiate': 'Instant Subscription',
  'Déclaration de Sinistre': 'Claim Declaration',
  'Soumettre la déclaration': 'Submit claim',
  'Envoi en cours...': 'Submitting...',
  'Déclaration enregistrée': 'Claim saved',
  'Confirmer le règlement': 'Confirm payment',
  'Retour': 'Back',
  'Membres': 'Members',
  'Garantie': 'Coverage',
  'Essentiel': 'Essential',
  'Confort': 'Comfort',
  'Premium': 'Premium',
  'Santé / Médical': 'Health / Medical',
  'RC Automobile': 'Motor Liability',
  'Scolarité': 'School',
  'Voyage': 'Travel',
};

const reverseTranslations = Object.fromEntries(
  Object.entries(translations).map(([french, english]) => [english, french])
);

function translateVisibleInterface(language, root = document.querySelector('[data-language-scope="navbar"]')) {
  if (!root) return;
  const dictionary = language === 'en' ? translations : reverseTranslations;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName)) return;
    const original = originalTextNodes.get(textNode) || textNode.nodeValue;
    originalTextNodes.set(textNode, original);
    const trimmed = original.trim();
    if (!trimmed || !dictionary[trimmed]) return;
    const translated = original.replace(trimmed, dictionary[trimmed]);
    if (textNode.nodeValue !== translated) textNode.nodeValue = translated;
  });

  root.querySelectorAll('[placeholder], [title], [aria-label]').forEach((element) => {
    ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const storageAttribute = `data-original-${attribute}`;
      const original = element.getAttribute(storageAttribute) || value;
      element.setAttribute(storageAttribute, original);
      if (dictionary[original] && value !== dictionary[original]) {
        element.setAttribute(attribute, dictionary[original]);
      }
    });
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'fr');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    localStorage.setItem('language', language);
    translateVisibleInterface(language);

    const observer = new MutationObserver(() => translateVisibleInterface(language));
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    isFrench: language === 'fr',
    isEnglish: language === 'en',
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
