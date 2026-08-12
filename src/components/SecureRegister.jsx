import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import {
  FaShieldAlt, FaEnvelope, FaArrowRight, FaSpinner, FaGoogle,
  FaGlobe, FaChevronDown
} from 'react-icons/fa';

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

export default function SecureRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const googleBtnRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'France'
  });

  const countries = ["France", "Belgique", "Canada", "USA", "Royaume-Uni", "Allemagne", "Autre"];

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
            try {
              var result = await authService.loginWithGoogle(response.credential);
              if (result.success) {
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
  }, []);

  const handleInputChange = function (e) {
    var name = e.target.name;
    var value = e.target.value;
    setFormData(function (prev) {
      return Object.assign({}, prev, { [name]: value });
    });
  };

  const handleFormSubmit = async function (e) {
    e.preventDefault();

    if (formData.password.length < 6) {
      notificationService.error('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      notificationService.error('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      notificationService.info('Creation du compte Diaspora...');
      var result = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        country: formData.country
      });

      if (result && result.success) {
        notificationService.success('Compte cree. Connectez-vous.');
        navigate('/login');
      } else {
        notificationService.error((result && result.error) || "Echec de l'inscription.");
      }
    } catch (error) {
      console.error('[Registration Error]', error);
      notificationService.error("Une erreur est survenue. L'email est peut-etre deja utilise.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#090d16] flex items-center justify-center px-3 py-4 relative overflow-x-hidden overflow-y-auto font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#CE1126_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.05] z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-20 w-full max-w-[620px] bg-[#111827] p-4 sm:p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-slate-800 flex flex-col rounded-none"
      >
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
                name="country" value={formData.country} onChange={handleInputChange}
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none appearance-none cursor-pointer"
              >
                {countries.map(function (c) {
                  return <option key={c} value={c} className="bg-[#111827]">{c}</option>;
                })}
              </select>
              <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
            </div>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe</label>
              <input
                type="password" name="password" required value={formData.password} onChange={handleInputChange}
                placeholder="••••••"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmation</label>
              <input
                type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange}
                placeholder="••••••"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600"
              />
            </div>
          </div>

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
      </motion.div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] opacity-30" />
    </div>
  );
}
