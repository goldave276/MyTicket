import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import authService from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { TicketIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);

    const errDesc = hashParams.get('error_description') || queryParams.get('error_description');
    if (errDesc) {
      queueMicrotask(() => setError(errDesc));
      return;
    }

    const token = hashParams.get('access_token') || queryParams.get('access_token') || '';
    const refresh = hashParams.get('refresh_token') || queryParams.get('refresh_token') || '';
    queueMicrotask(() => {
      setAccessToken(token);
      setRefreshToken(refresh);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!accessToken) {
      setError('Lien de réinitialisation manquant ou expiré. Veuillez redemander un lien.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword({ accessToken, refreshToken, password });
      setSuccess(true);
      showToast('Mot de passe mis à jour avec succès !', 'success');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Nouveau mot de passe - MyTicket</title>
      </Head>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div className="text-center space-y-3">
            <Link href="/" aria-label="Retour à l'accueil MyTicket" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg">
                <TicketIcon className="w-7 h-7" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <span className="text-3xl">✅</span>
              <h2 className="font-bold text-emerald-600 dark:text-emerald-400">Mot de passe modifié !</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Redirection vers la page de connexion...
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Se connecter maintenant →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Nouveau mot de passe *
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="•••••••• (min. 8 caractères)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors touch-manipulation"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  8 caractères minimum, comprenant au moins 1 lettre et 1 chiffre.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Confirmer le mot de passe *
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !accessToken}
                className="w-full py-4 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/auth/password-reset" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
