import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import TurnstileField from './TurnstileField';
import { FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';

function passwordScore(password) {
  return [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
}

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const values = new Uint32Array(16);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}

export default function PasswordResetPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  async function requestReset(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      notificationService.error('Saisissez une adresse email valide.');
      return;
    }
    setLoading(true);
    setStatusMessage('Vérification de votre demande et préparation du lien sécurisé...');
    try {
      await authService.requestPasswordReset(email, turnstileToken);
      setSent(true);
      setStatusMessage('Si cette adresse existe, un lien sécurisé a été envoyé. Consultez votre boîte email.');
      notificationService.success('Si l’adresse existe, un lien a été envoyé.');
    } catch {
      notificationService.error('Impossible de traiter la demande.');
    } finally {
      setLoading(false);
    }
  }

  async function reset(event) {
    event.preventDefault();
    if (passwordScore(password) < 4) {
      notificationService.error('Utilisez au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
      return;
    }
    if (password !== confirmPassword) {
      notificationService.error('La confirmation du mot de passe ne correspond pas.');
      return;
    }
    setLoading(true);
    setStatusMessage('Validation du lien et sécurisation de votre nouveau mot de passe...');
    try {
      const result = await authService.resetPassword(token, password, turnstileToken);
      if (!result.success) throw new Error(result.message);
      notificationService.success('Mot de passe réinitialisé.');
      setStatusMessage('Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.');
      navigate('/login', { replace: true });
    } catch (error) {
      notificationService.error(error.message || 'Lien invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#090d16] flex items-center justify-center px-4 text-white">
      <form onSubmit={token ? reset : requestReset} className="w-full max-w-md border border-slate-800 bg-[#111827] p-6 space-y-4">
        <h1 className="flex items-center gap-2 text-xl font-black uppercase"><FaKey className="text-[#CE1126]" /> {token ? 'Nouveau mot de passe sécurisé' : 'Mot de passe oublié'}</h1>
        <p className="text-sm text-slate-400">{token ? 'Choisissez un mot de passe fort pour votre compte.' : 'Nous vous répondrons avec un lien sécurisé si le compte existe.'}</p>
        {statusMessage && <p className="border border-slate-700 bg-[#090d16] p-3 text-xs leading-relaxed text-slate-300" aria-live="polite">{statusMessage}</p>}
        {!token && <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="votre@email.com" className="w-full bg-[#090d16] border border-slate-700 p-3" />}
        {token && <>
          <div className="relative"><input type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nouveau mot de passe" autoComplete="new-password" className="w-full bg-[#090d16] border border-slate-700 p-3 pr-10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
          {password && <div aria-live="polite" className="text-xs text-slate-400">Force : {['Faible', 'Faible', 'Moyenne', 'Bonne', 'Forte', 'Très forte'][passwordScore(password)]} · 8 caractères, majuscule, minuscule et chiffre requis</div>}
          <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirmer le mot de passe" autoComplete="new-password" className="w-full bg-[#090d16] border border-slate-700 p-3" />
          <div className="flex flex-wrap gap-3 text-xs">
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-300 underline">{showPassword ? 'Masquer' : 'Afficher'} les mots de passe</button>
            <button type="button" onClick={() => { const value = generatePassword(); setPassword(value); setConfirmPassword(value); setShowPassword(true); }} className="text-[#CE1126] underline">Générer un mot de passe sécurisé</button>
          </div>
        </>}
        <TurnstileField onToken={setTurnstileToken} />
        <button type="submit" disabled={loading || sent} className="w-full bg-white text-black p-3 font-black uppercase disabled:opacity-40">{loading ? 'Traitement...' : sent ? 'Email envoyé' : token ? 'Réinitialiser' : 'Envoyer le lien'}</button>
      </form>
    </main>
  );
}
