import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { FaShieldAlt, FaArrowRight, FaSpinner, FaGoogle,  FaHome, FaEnvelope, FaLock, FaEye } from 'react-icons/fa';
import TurnstileField from './TurnstileField';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

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

export default function SecureLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileTokenRef = useRef('');
  const googleBtnRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);


  const updateTurnstileToken = useCallback((token) => {
    turnstileTokenRef.current = token;
    setTurnstileToken(token);
  }, []);

  const continueAfterLogin = useCallback(() => {
    const destination = location.state?.from || '/dashboard';
    const { from: _from, ...routeState } = location.state || {};
    navigate(destination, { replace: true, state: routeState });
  }, [location.state, navigate]);

  useEffect(function () {
    if (location.state?.registrationValidated) {
      notificationService.success('Validation de connexion réussie. Bienvenue sur ESNAS.');
      navigate('/login', { replace: true, state: {} });
      return;
    }
    if (authService.isLoggedIn()) {
      continueAfterLogin();
    }
  }, [continueAfterLogin, location.state, navigate]);

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
            try {
              var result = await authService.loginWithGoogle(response.credential, turnstileTokenRef.current);
              if (result.success) {
                notificationService.success('Connexion Google reussie !');
                continueAfterLogin();
              } else {
                notificationService.error(result.error || 'Echec Google.');
              }
            } catch (err) {
              console.error(err);
              notificationService.error(err.userMessage || err.message || 'Google n’a pas pu valider votre identité. Réessayez avec un compte vérifié.');
            } finally {
              setIsLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: Math.min(360, googleBtnRef.current.clientWidth || 360),
            text: 'continue_with',
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
  }, [continueAfterLogin, turnstileToken]);

  const handleInputChange = function (e) {
    var name = e.target.name;
    var value = e.target.value;
    setCredentials(function (prev) {
      return Object.assign({}, prev, { [name]: value });
    });
  };

  const handleFormSubmit = async function (e) {
    e.preventDefault();
    if (!credentials.email.includes('@') || credentials.password.length < 6) {
      notificationService.error('Saisissez un email valide et un mot de passe de 6 caracteres minimum.');
      return;
    }

    setIsLoading(true);
    try {
      notificationService.info('Vérification sécurisée de vos informations en cours...');
      var result = await authService.login(credentials.email, credentials.password, turnstileToken);
      if (result && result.success) {
        notificationService.success('Validation de connexion réussie. Bienvenue sur ESNAS.');
        continueAfterLogin();
      } else {
        notificationService.error((result && result.error) || 'Identifiants incorrects.');
      }
    } catch (error) {
      console.error(error);
      notificationService.error(error.userMessage || error.message || 'Connexion impossible pour le moment. Vérifiez vos informations ou réessayez dans quelques instants.');
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[560px] sm:h-[560px] rounded-full bg-[#CE1126]/[0.05] blur-3xl" />

        {/* Ondes concentriques Ripple */}
        <div
          className="ripple-wave w-[280px] h-[280px] sm:w-[460px] sm:h-[460px]"
          style={{ borderColor: 'rgba(206, 17, 38, 0.22)' }}
        />
        <div
          className="ripple-wave w-[440px] h-[440px] sm:w-[700px] sm:h-[700px]"
          style={{ animationDelay: '2.3s', borderColor: 'rgba(0, 163, 224, 0.22)' }}
        />
        <div
          className="ripple-wave w-[620px] h-[620px] sm:w-[940px] sm:h-[940px]"
          style={{ animationDelay: '4.6s', borderColor: 'rgba(206, 17, 38, 0.16)' }}
        />
      </div>

      {/* ================= BARRE SUPÉRIEURE COMPACTE ================= */}
      <div className="relative z-20 w-full max-w-[440px] mx-auto mb-4 sm:mb-6 flex items-center justify-between">
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
          Connexion SSL
        </span>
      </div>

      {/* ================= CARTE PRINCIPALE D'AUTHENTIFICATION ================= */}
      <div className="relative z-20 w-full max-w-[440px] mx-auto my-auto bg-white/95 backdrop-blur-xl px-5 py-6 sm:px-8 sm:py-8 shadow-[0_25px_70px_rgba(15,23,42,0.10)] border border-slate-200 flex flex-col rounded-none">
        {/* En-tête Brand (Sans icône) */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-[26px] font-black uppercase tracking-tighter text-slate-900 leading-none">
            ESNA<span className="text-[#CE1126] lowercase">s</span>{' '}
            <span className="text-slate-500 font-extrabold">DRC</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
            Authentification Sécurisée ARCA
          </p>
        </div>

        {/* Bouton Google */}
        <div className="mb-5 flex flex-col items-center gap-2">
          <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
          {!googleReady && (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 text-slate-400 bg-slate-50 text-xs font-bold cursor-not-allowed"
              title={googleClientId ? 'Chargement Google...' : 'Configurez VITE_GOOGLE_CLIENT_ID / GOOGLE_CLIENT_ID'}
            >
              <FaGoogle />
              <span>Continuer avec Google</span>
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
            Ou par identifiants
          </span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        {/* Formulaire */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <TurnstileField onToken={updateTurnstileToken} />

          {/* Champ Email */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
              Adresse Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={credentials.email}
                onChange={handleInputChange}
                placeholder="votre@email.com"
                className="w-full border border-slate-300 bg-slate-50/70 pl-10 pr-3.5 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none placeholder-slate-400"
              />
            </div>
          </div>

          {/* Champ Mot de passe avec œil */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-[10px] font-bold text-slate-500 hover:text-[#CE1126] transition-colors cursor-pointer"
              >
                Oublié ?
              </button>
            </div>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                autoComplete="current-password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full border border-slate-300 bg-slate-50/70 pl-10 pr-10 py-2.5 sm:py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-white text-slate-900 rounded-none placeholder-slate-400"
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

          {/* Bouton de connexion */}
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
                  <span>Se connecter</span>
                  <FaArrowRight size={11} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Lien vers Inscription */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-[11px] font-semibold text-slate-500">
            Nouveau sur la plateforme ?
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-slate-900 hover:text-[#CE1126] font-black uppercase tracking-wider text-[10px] pl-2 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Créer un compte
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
