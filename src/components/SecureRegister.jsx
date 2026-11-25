import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import TurnstileField from './TurnstileField';
import {
  FaShieldAlt, FaEnvelope, FaArrowRight, FaSpinner, FaGoogle,
  FaGlobe, FaChevronDown, FaPhone, FaCheckCircle, FaEye, FaEyeSlash, FaKey,
  FaHome, FaLock
} from 'react-icons/fa';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const countryNames = new Intl.DisplayNames(['fr'], { type: 'region' });

function flagForCountry(countryCode) {
  return countryCode.replace(/./g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
}

const countries = getCountries().map((code) => ({
  code,
  name: countryNames.of(code) || code,
  callingCode: getCountryCallingCode(code),
  prefix: `+${getCountryCallingCode(code)}`,
  flag: flagForCountry(code),
}));

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="' + GIS_SRC + '"]');
    if (existing) {
      existing.addEventListener('load', function () { resolve(); });
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = function () { resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function passwordScore(password) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

function PasswordStrength({ password }) {
  const score = passwordScore(password);
  const labels = ['Faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Tres fort'];
  const colors = ['bg-red-700', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500', 'bg-emerald-400'];
  return (
    <div className="mt-1" aria-live="polite">
      <div className="flex h-1 gap-1">
        {[0, 1, 2, 3, 4].map((item) => <span key={item} className={`flex-1 ${item < score ? colors[score] : 'bg-slate-200'}`} />)}
      </div>
      <span className="text-[9px] text-slate-500 font-semibold">Force : {labels[score]}</span>
    </div>
  );
}

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const values = new Uint32Array(16);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}

export default function SecureRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneVerification, setPhoneVerification] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [phoneCountryIso, setPhoneCountryIso] = useState('FR');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'France',
    countryIso: 'FR',
    phoneCountryCode: '33',
    phone: ''
  });
  const turnstileTokenRef = useRef('');
  const registrationDataRef = useRef({ formData, phoneCountryIso });
  const googleBtnRef = useRef(null);


  registrationDataRef.current = { formData, phoneCountryIso };

  useEffect(function () {
    if (authService.isLoggedIn()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(function () {
    var cancelled = false;
    (async function () {
      try {
        var cfg = await authService.getAuthConfig();
        var clientId = cfg.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        if (!clientId || cancelled) {
          setGoogleReady(false);
          return;
        }
        setGoogleClientId(clientId);
        await loadGisScript();
        if (cancelled || !(window.google && window.google.accounts && window.google.accounts.id)) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async function (response) {
            if (!(response && response.credential)) {
              notificationService.error('Reponse Google invalide.');
              return;
            }
            setIsLoading(true);
            setRegistrationStatus('Vérification de votre identité Google en cours...');
            try {
              var currentRegistration = registrationDataRef.current;
              var googlePhone = parsePhoneNumberFromString(currentRegistration.formData.phone, currentRegistration.phoneCountryIso);
              if (!googlePhone || !googlePhone.isValid()) {
                notificationService.error('Pour créer un compte avec Google, saisissez d’abord un numéro de téléphone valide pour le pays sélectionné.');
                setRegistrationStatus('Votre numéro est nécessaire pour la vérification de sécurité par SMS.');
                return;
              }
              var result = await authService.loginWithGoogle(response.credential, turnstileTokenRef.current, {
                phone: googlePhone.number,
                phoneCountryCode: googlePhone.countryCallingCode,
                phoneCountryIso: currentRegistration.phoneCountryIso,
                country: currentRegistration.formData.country,
              });
              if (result.success) {
                if (result.requiresPhoneVerification) {
                  setPhoneVerification({
                    userId: result.user?.id,
                    challengeId: result.phoneVerification?.challengeId,
                    maskedPhone: result.phoneVerification?.maskedPhone,
                  });
                  setRegistrationStatus('Identité Google validée. Saisissez le code SMS pour terminer la création de votre profil.');
                  notificationService.info('Un code de sécurité a été envoyé par SMS.');
                  return;
                }
                setRegistrationStatus('Validation Google réussie. Ouverture de votre espace sécurisé...');
                notificationService.success('Compte Google connecte !');
                window.location.href = '/dashboard';
              } else {
                notificationService.error(result.error || 'Echec Google.');
              }
            } catch (err) {
              console.error(err);
              notificationService.error('Echec authentification Google.');
            } finally {
              setIsLoading(false);
            }
          },
          auto_select: false,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: Math.min(400, googleBtnRef.current.clientWidth || 400),
            text: 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
        if (!cancelled) setGoogleReady(true);
      } catch (e) {
        console.warn('Google GIS non disponible:', e);
        if (!cancelled) setGoogleReady(false);
      }
    })();
    return function () { cancelled = true; };
  }, [turnstileToken]);

  const handleInputChange = function (e) {
    var name = e.target.name;
    var value = e.target.value;
    setFormData(function (prev) {
      return Object.assign({}, prev, { [name]: value });
    });
  };

  const handleFormSubmit = async function (e) {
    e.preventDefault();

    if (phoneVerification) {
      if (!/^\d{6}$/.test(verificationCode)) {
        notificationService.error('Saisissez le code SMS a 6 chiffres.');
        return;
      }
      setIsLoading(true);
      setRegistrationStatus('Validation du code de sécurité en cours...');
      try {
        var verificationResult = await authService.verifyPhone(
          phoneVerification.userId,
          phoneVerification.challengeId,
          verificationCode
        );
        if (verificationResult.success) {
          setRegistrationStatus('Validation de connexion réussie. Votre compte a été créé avec succès.');
          notificationService.success('Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.');
          navigate('/login', { state: { registrationValidated: true } });
        } else {
          notificationService.error(verificationResult.error || 'Code SMS invalide.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (passwordScore(formData.password) < 4) {
      notificationService.error('Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule et un chiffre.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      notificationService.error('Les mots de passe ne correspondent pas.');
      return;
    }
    const parsedPhone = parsePhoneNumberFromString(formData.phone, phoneCountryIso);
    if (!parsedPhone || !parsedPhone.isValid()) {
      notificationService.error(`Numero invalide pour ${countryNames.of(phoneCountryIso)}. Saisissez le numero national exact.`);
      return;
    }

    setIsLoading(true);
    setRegistrationStatus('Création de votre profil. Vérification des informations en cours...');
    try {
      notificationService.info('Creation du compte Diaspora...');
      var result = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        country: formData.country,
        countryIso: formData.countryIso,
        phone: parsedPhone.number,
        phoneCountryCode: parsedPhone.countryCallingCode,
        phoneCountryIso: phoneCountryIso
        ,turnstileToken
      });

      if (result && result.success) {
        if (result.phoneVerification) {
          setPhoneVerification({
            userId: result.user?.id,
            challengeId: result.phoneVerification.challengeId,
            maskedPhone: result.phoneVerification.maskedPhone,
          });
          notificationService.success('Code SMS envoye a votre numero.');
          setRegistrationStatus('Profil créé. En attente de la vérification de votre numéro par SMS.');
        } else {
          notificationService.success('Compte cree. Connectez-vous.');
          setRegistrationStatus('Validation de connexion réussie. Votre compte a été créé avec succès.');
          navigate('/login');
        }
      } else {
        notificationService.error((result && result.error) || "Impossible de créer le compte. Vérifiez les informations saisies et réessayez.");
      }
    } catch (error) {
      console.error('[Registration Error]', error);
      notificationService.error(error.userMessage || error.message || "Le service d'inscription est momentanément indisponible. Réessayez dans quelques instants.");
    } finally {
      setIsLoading(false);
    }
  };

    return (
    <div className="min-h-dvh bg-white text-slate-900 flex flex-col justify-between px-4 py-5 sm:px-6 sm:py-8 relative overflow-x-hidden overflow-y-auto font-sans">
      {/* ================= FOND RIPPLEGRID ANIMÉ (VERSION CLAIRE) ================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Grille quadrillée claire */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 35%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 35%, transparent 100%)'
          }}
        />

        {/* Halo lumineux central subtil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] sm:w-[620px] sm:h-[620px] rounded-full bg-[#CE1126]/[0.05] blur-3xl" />

        {/* Ondes concentriques Ripple */}
        <div
          className="ripple-wave w-[300px] h-[300px] sm:w-[500px] sm:h-[500px]"
          style={{ borderColor: 'rgba(206, 17, 38, 0.22)' }}
        />
        <div
          className="ripple-wave w-[480px] h-[480px] sm:w-[760px] sm:h-[760px]"
          style={{ animationDelay: '2.3s', borderColor: 'rgba(0, 163, 224, 0.22)' }}
        />
        <div
          className="ripple-wave w-[660px] h-[660px] sm:w-[1000px] sm:h-[1000px]"
          style={{ animationDelay: '4.6s', borderColor: 'rgba(206, 17, 38, 0.16)' }}
        />
      </div>

      {/* ================= BARRE SUPÉRIEURE COMPACTE ================= */}
      <div className="relative z-20 w-full max-w-[600px] mx-auto mb-4 sm:mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
        >
          <FaHome size={11} className="text-[#CE1126]" />
          <span>Accueil</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Inscription ARCA SSL
        </span>
      </div>

      {/* ================= CARTE PRINCIPALE D'INSCRIPTION ================= */}
      <div className="relative z-20 w-full max-w-[600px] mx-auto my-auto bg-white/95 backdrop-blur-xl px-5 py-6 sm:px-8 sm:py-8 shadow-[0_25px_70px_rgba(15,23,42,0.10)] border border-slate-200 flex flex-col rounded-none">
        {/* En-tête Brand (Sans icône) */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-[26px] font-black uppercase tracking-tighter text-slate-900 leading-none">
            ESNA<span className="text-[#CE1126] lowercase">s</span>{' '}
            <span className="text-slate-500 font-extrabold">DRC</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
            Création de Compte Diaspora & Local
          </p>
          {registrationStatus && (
            <p className="mt-3 text-[11px] font-bold leading-relaxed text-[#CE1126] bg-red-50 border border-red-200 px-3 py-2" aria-live="polite">
              {registrationStatus}
            </p>
          )}
        </div>

        {/* Bouton Google */}
        {!phoneVerification && (
          <>
            <div className="mb-4 flex flex-col items-center gap-2">
              <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
              {!googleReady && (
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 text-slate-400 bg-slate-50 text-xs font-bold cursor-not-allowed"
                >
                  <FaGoogle />
                  <span>S&apos;inscrire avec Google</span>
                  {!googleClientId && (
                    <span className="text-[9px] uppercase text-slate-400">(non configuré)</span>
                  )}
                </button>
              )}
            </div>

            {/* Séparateur */}
            <div className="relative flex items-center mb-5">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Ou par formulaire
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>
          </>
        )}

        {/* Formulaire */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <TurnstileField onToken={updateTurnstileToken} />

          {/* ÉTAPE VÉRIFICATION SMS */}
          {phoneVerification ? (
            <div className="space-y-4 text-center py-2">
              <FaCheckCircle className="mx-auto text-emerald-500" size={36} />
              <h2 className="text-lg font-black uppercase text-slate-900">
                Vérifiez votre téléphone
              </h2>
              <p className="text-xs leading-relaxed text-slate-500 max-w-sm mx-auto">
                Saisissez le code à 6 chiffres envoyé par SMS au numéro <strong className="text-slate-900">{phoneVerification.maskedPhone}</strong>.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                value={verificationCode}
                onChange={function (e) { setVerificationCode(e.target.value.replace(/\D/g, '')); }}
                placeholder="000000"
                required
                className="w-full border border-slate-300 bg-slate-50 px-3 py-3 text-center text-xl font-black tracking-[0.5em] outline-none focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none placeholder-slate-400"
              />
            </div>
          ) : (
            <>
              {/* Nom & Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="MBUYI"
                    className="w-full border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none uppercase placeholder-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    className="w-full border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Pays de résidence */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                  <FaGlobe size={11} className="text-[#CE1126]" /> Pays de résidence
                </label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={function (e) {
                      var selected = countries.find(function (item) { return item.name === e.target.value; });
                      setFormData(function (prev) { return Object.assign({}, prev, { country: selected.name, countryIso: selected.code }); });
                    }}
                    className="w-full border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none appearance-none cursor-pointer"
                  >
                    {countries.map(function (c) {
                      return <option key={c.code} value={c.name} className="bg-white text-slate-900">{c.flag} {c.name}</option>;
                    })}
                  </select>
                  <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={11} />
                </div>
              </div>

              {/* Téléphone avec indicatif */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                  <FaPhone size={11} className="text-[#CE1126]" /> Téléphone / WhatsApp
                </label>
                  <select
                    name="phoneCountryCode"
                    value={phoneCountryIso}
                    onChange={function (e) {
                      var selected = countries.find(function (item) { return item.code === e.target.value; });
                      setPhoneCountryIso(selected.code);
                      setFormData(function (prev) { return Object.assign({}, prev, { phoneCountryCode: selected.callingCode }); });
                    }}
                    className="w-full border border-slate-300 bg-slate-50/70 px-2.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold outline-none focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none cursor-pointer"
                    aria-label="Pays et indicatif téléphonique"
                  >
                    {countries.map(function (item) {
                      return <option key={item.code} value={item.code} className="bg-white text-slate-900">{item.flag} {item.name} ({item.prefix})</option>;
                    })}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={phoneCountryIso === 'CD' ? '81 234 5678' : 'Numéro national'}
                    inputMode="tel"
                    className="w-full border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none placeholder-slate-400"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {flagForCountry(phoneCountryIso)} {countryNames.of(phoneCountryIso)} : saisissez uniquement le numéro national.
                </p>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                  <FaEnvelope size={11} className="text-[#CE1126]" /> Adresse Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="votre@email.com"
                  className="w-full border border-slate-300 bg-slate-50/70 px-3.5 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none placeholder-slate-400"
                />
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                  <FaLock size={11} className="text-[#CE1126]" /> Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 8 caractères"
                    className="w-full border border-slate-300 bg-slate-50/70 pl-3.5 pr-10 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Bouton de validation */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-3.5 bg-[#CE1126] hover:bg-[#a80d1e] text-white font-black uppercase text-[11px] tracking-[0.18em] transition-all active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2.5 shadow-md rounded-none cursor-pointer"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <>
                  <span>{phoneVerification ? 'Valider le code SMS' : 'Créer mon compte'}</span>
                  <FaArrowRight size={11} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Lien vers Connexion */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-[11px] font-semibold text-slate-500">
            Déjà inscrit sur ESNAs ?
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-slate-900 hover:text-[#CE1126] font-black uppercase tracking-wider text-[10px] pl-2 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>

      {/* ================= PIED DISCRET & LISERÉ RDC ================= */}
      <div className="relative z-20 text-center mt-5 sm:mt-6 pb-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
          ESNAs RDC • Écosystème Numérique des Assurances
        </p>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] opacity-80 z-30" />
    </div>
  );
}
