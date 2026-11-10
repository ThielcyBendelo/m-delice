import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import TurnstileField from './TurnstileField';
import {
  FaShieldAlt, FaEnvelope, FaArrowRight, FaSpinner, FaGoogle,
  FaGlobe, FaChevronDown, FaPhone, FaCheckCircle, FaEye, FaEyeSlash, FaKey
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
        {[0, 1, 2, 3, 4].map((item) => <span key={item} className={`flex-1 ${item < score ? colors[score] : 'bg-slate-700'}`} />)}
      </div>
      <span className="text-[9px] text-slate-400">Force : {labels[score]}</span>
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
  const turnstileTokenRef = useRef('');
  const registrationDataRef = useRef({ formData, phoneCountryIso });
  const googleBtnRef = useRef(null);
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

  const updateTurnstileToken = useCallback((token) => {
    turnstileTokenRef.current = token;
    setTurnstileToken(token);
  }, []);

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
    <div className="min-h-dvh bg-[#090d16] flex items-center justify-center px-3 py-4 relative overflow-x-hidden overflow-y-auto font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#CE1126_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.05] z-10" />

      <div className="relative z-20 w-full max-w-[620px] bg-[#111827] p-4 sm:p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-slate-800 flex flex-col rounded-none animate-fadeIn">
        <div className="text-center mb-4">
          <div className="w-10 h-10 bg-[#CE1126] text-white flex items-center justify-center mx-auto mb-2 shadow-lg rounded-none">
            <FaShieldAlt size={20} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
            ESNA<span className="text-[#CE1126]">s DRC</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-3">
            Creation de Compte Diaspora
          </p>
          {registrationStatus && <p className="mt-3 text-[10px] font-semibold leading-relaxed text-[#CE1126]" aria-live="polite">{registrationStatus}</p>}
        </div>

        <div className="mb-3 flex flex-col items-center gap-2">
          <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
          {!googleReady && (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 py-3 border border-slate-800 text-slate-500 bg-[#090d16] text-sm font-bold cursor-not-allowed"
            >
              <FaGoogle /> S&apos;inscrire avec Google
              {!googleClientId && (
                <span className="text-[9px] uppercase text-slate-600">(non configure)</span>
              )}
            </button>
          )}
        </div>

        <div className="relative flex py-1 items-center mb-3">
          <div className="flex-grow border-t border-slate-800" />
          <span className="flex-shrink mx-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Ou par formulaire</span>
          <div className="flex-grow border-t border-slate-800" />
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <TurnstileField onToken={updateTurnstileToken} />
          {phoneVerification ? (
            <div className="space-y-4 text-center">
              <FaCheckCircle className="mx-auto text-emerald-500" size={36} />
              <h2 className="text-lg font-black uppercase text-white">Verifiez votre telephone</h2>
              <p className="text-xs leading-relaxed text-slate-400">
                Saisissez le code a 6 chiffres envoye par SMS au numero {phoneVerification.maskedPhone}.
              </p>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength="6"
                value={verificationCode} onChange={function (e) { setVerificationCode(e.target.value.replace(/\D/g, '')); }}
                placeholder="000000" required
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-center text-xl font-black tracking-[0.5em] outline-none focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
              />
            </div>
          ) : null}
          {!phoneVerification ? (
          <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom</label>
              <input
                type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange}
                placeholder="Mbuyi"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none uppercase placeholder-slate-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prenom</label>
              <input
                type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange}
                placeholder="Jean"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaGlobe size={10} className="text-[#CE1126]" /> Pays de residence
            </label>
            <div className="relative">
              <select
                name="country" value={formData.country} onChange={function (e) {
                  var selected = countries.find(function (item) { return item.name === e.target.value; });
                  setFormData(function (prev) { return Object.assign({}, prev, { country: selected.name, countryIso: selected.code }); });
                }}
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none appearance-none cursor-pointer"
              >
                {countries.map(function (c) {
                  return <option key={c.code} value={c.name} className="bg-[#111827]">{c.flag} {c.name}</option>;
                })}
              </select>
              <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaPhone size={10} className="text-[#CE1126]" /> Telephone
            </label>
            <div className="grid grid-cols-[minmax(150px,0.9fr)_1fr] gap-2">
              <select
                name="phoneCountryCode"
                value={phoneCountryIso}
                onChange={function (e) {
                  var selected = countries.find(function (item) { return item.code === e.target.value; });
                  setPhoneCountryIso(selected.code);
                  setFormData(function (prev) { return Object.assign({}, prev, { phoneCountryCode: selected.callingCode }); });
                }}
                className="w-full border border-slate-800 bg-[#090d16] px-2 py-2.5 text-sm font-bold outline-none focus:border-[#CE1126] text-white rounded-none"
                aria-label="Pays et indicatif téléphonique"
              >
                {countries.map(function (item) {
                  return <option key={item.code} value={item.code} className="bg-[#111827]">{item.flag} {item.name} ({item.prefix})</option>;
                })}
              </select>
              <input
                type="tel" name="phone" required value={formData.phone} onChange={handleInputChange}
                placeholder={phoneCountryIso === 'CD' ? '81 234 5678' : 'Numero national'}
                inputMode="tel"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
              />
            </div>
            <p className="text-[9px] text-slate-500">{flagForCountry(phoneCountryIso)} {countryNames.of(phoneCountryIso)} : saisissez uniquement le numero national. Le format sera verifie avant inscription.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FaEnvelope size={10} className="text-[#CE1126]" /> Email
            </label>
            <input
              type="email" name="email" required value={formData.email} onChange={handleInputChange}
              placeholder="jean.mbuyi@gmail.com"
              className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FaKey size={10} className="text-[#CE1126]" /> Mot de passe</label>
              <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleInputChange}
                placeholder="8 caracteres minimum" autoComplete="new-password"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
              />
                <button type="button" onClick={function () { setShowPassword(function (value) { return !value; }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
              {formData.password && <PasswordStrength password={formData.password} />}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmation</label>
              <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange}
                placeholder="Retapez le mot de passe" autoComplete="new-password"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
              />
                <button type="button" onClick={function () { setShowConfirmPassword(function (value) { return !value; }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
            </div>
          </div>

          <button type="button" onClick={function () {
            var generated = generatePassword();
            setFormData(function (prev) { return Object.assign({}, prev, { password: generated, confirmPassword: generated }); });
            setShowPassword(true);
            setShowConfirmPassword(true);
          }} className="text-[10px] font-bold uppercase tracking-widest text-[#CE1126] hover:text-white">
            Generer un mot de passe securise
          </button>

          <div className="pt-1">
            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl rounded-none hover:bg-[#CE1126] hover:text-white"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <>
                  <span>Creer mon compte</span>
                  <FaArrowRight size={10} />
                </>
              )}
            </button>
          </div>
          </>
          ) : null}
          {phoneVerification ? (
            <div className="pt-1">
              <button
                type="button" disabled={isLoading}
                onClick={async function () {
                  setIsLoading(true);
                  var resent = await authService.resendPhoneVerification(phoneVerification.userId);
                  setIsLoading(false);
                  if (resent.success) {
                    setPhoneVerification(function (prev) { return Object.assign({}, prev, resent.phoneVerification); });
                    notificationService.success('Nouveau code SMS envoye.');
                  } else notificationService.error(resent.error);
                }}
                className="w-full py-3 border border-slate-700 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] hover:border-[#CE1126] hover:text-white disabled:opacity-40"
              >
                Renvoyer le code SMS
              </button>
            </div>
          ) : null}
        </form>

        <div className="mt-3 pt-3 border-t border-slate-800 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Deja membre ?
            <span
              onClick={function () { navigate('/login'); }}
              className="text-[#CE1126] cursor-pointer hover:text-red-500 pl-2 underline underline-offset-4"
            >
              Se connecter
            </span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] opacity-30" />
    </div>
  );
}
