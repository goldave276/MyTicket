import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { TicketIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rawRedirect = typeof router.query.redirect === 'string' ? router.query.redirect : '';
  const safeRedirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null;
  const loginHref = safeRedirect ? `/auth/login?redirect=${encodeURIComponent(safeRedirect)}` : '/auth/login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup({
        fullName,
        email,
        password,
      });
      showToast('Votre compte a été créé avec succès !', 'success');
      router.push(safeRedirect || '/dashboard');
    } catch (err) {
      if (err.data?.errors) {
        const errorDetails = Object.values(err.data.errors).join('. ');
        setError(errorDetails || err.message || 'Impossible de créer le compte.');
      } else {
        setError(err.message || 'Impossible de créer le compte. Vérifiez les informations saisies.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Inscription - MyTicket</title>
      </Head>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          {/* Header */}
          <div className="text-center space-y-3">
            <Link href="/" aria-label="Retour à l'accueil MyTicket" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg">
                <TicketIcon className="w-7 h-7" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Créer un compte
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Rejoignez MyTicket pour réserver vos billets en toute simplicité.
            </p>
          </div>

          {/* Redirect Context Banner */}
          {safeRedirect && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
              Créez votre compte pour poursuivre votre action. Vous serez automatiquement redirigé après inscription.
            </div>
          )}

          {/* Alert Error */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="signup-fullname"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Nom complet *
              </label>
              <input
                id="signup-fullname"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="ex: Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Adresse Email *
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  id="signup-password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Création du compte...' : 'Créer mon Compte'}
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          {/* Footer link */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Vous avez déjà un compte ?{' '}
            <Link href={loginHref} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
