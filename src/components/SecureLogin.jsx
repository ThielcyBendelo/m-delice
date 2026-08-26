import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { FaShieldAlt, FaArrowRight, FaSpinner, FaGoogle } from 'react-icons/fa';

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
  const googleBtnRef = useRef(null);

  const continueAfterLogin = useCallback(() => {
    const destination = location.state?.from || '/dashboard';
    const { from: _from, ...routeState } = location.state || {};
    navigate(destination, { replace: true, state: routeState });
  }, [location.state, navigate]);

  useEffect(function () {
    if (authService.isLoggedIn()) {
      continueAfterLogin();
    }
  }, [continueAfterLogin]);

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
              var result = await authService.loginWithGoogle(response.credential);
              if (result.success) {
                notificationService.success('Connexion Google reussie !');
                continueAfterLogin();
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
  }, [continueAfterLogin]);

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
      notificationService.info('Verification securisee en cours...');
      var result = await authService.login(credentials.email, credentials.password);
      if (result && result.success) {
        notificationService.success('Connexion validee avec succes !');
        continueAfterLogin();
      } else {
        notificationService.error((result && result.error) || 'Identifiants incorrects.');
      }
    } catch (error) {
      console.error(error);
      notificationService.error('Identifiants incorrects ou serveur indisponible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#090d16] flex items-center justify-center px-3 py-4 relative overflow-x-hidden overflow-y-auto font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#CE1126_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.05] z-10" />

      <div className="relative z-20 w-full max-w-[420px] bg-[#111827] p-5 sm:p-7 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-slate-800 flex flex-col rounded-none animate-fadeIn">
        <div className="text-center mb-5">
          <div className="w-10 h-10 bg-[#CE1126] text-white flex items-center justify-center mx-auto mb-3 shadow-lg rounded-none">
            <FaShieldAlt size={20} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
            ESNAs <span className="text-[#CE1126]">DRC</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-3">
            Authentification Securisee ARCA
          </p>
        </div>

        <div className="mb-4 flex flex-col items-center gap-2">
          <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
          {!googleReady && (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 py-3 border border-slate-800 text-slate-500 bg-[#090d16] text-sm font-bold cursor-not-allowed"
              title={googleClientId ? 'Chargement Google...' : 'Configurez VITE_GOOGLE_CLIENT_ID / GOOGLE_CLIENT_ID'}
            >
              <FaGoogle /> Continuer avec Google
              {!googleClientId && (
                <span className="text-[9px] uppercase text-slate-600">(non configure)</span>
              )}
            </button>
          )}
        </div>

        <div className="relative flex py-1 items-center mb-4">
          <div className="flex-grow border-t border-slate-800" />
          <span className="flex-shrink mx-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Ou via email
          </span>
          <div className="flex-grow border-t border-slate-800" />
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Email</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={credentials.email}
              onChange={handleInputChange}
              placeholder="votre@email.com"
              className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Mot de passe</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl rounded-none hover:bg-[#CE1126] hover:text-white"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <>
                  <span>Se connecter</span>
                  <FaArrowRight size={10} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nouveau sur la plateforme ?
            <span
              onClick={function () { navigate('/register'); }}
              className="text-[#CE1126] cursor-pointer hover:text-red-500 pl-2 underline underline-offset-4"
            >
              Creer un compte
            </span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] opacity-30" />
    </div>
  );
}
