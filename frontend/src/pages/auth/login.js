import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { TicketIcon, UserIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      showToast('Connexion réussie ! Bienvenue sur MyTicket.', 'success');
      const redirectUrl = router.query.redirect || '/dashboard';
      router.push(redirectUrl);
    } catch (err) {
      setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connexion - MyTicket</title>
      </Head>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <TicketIcon className="w-7 h-7" />
              </div>
            </Link>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Espace Connexion
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Accédez à vos billets, vos réservations et vos événements.
            </p>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Adresse Email *
              </label>
              <input
                type="email"
                required
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Mot de passe *
                </label>
                <Link
                  href="/auth/password-reset"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Connexion en cours...' : 'Se Connecter'}
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          {/* Footer link */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Vous n’avez pas de compte ?{' '}
            <Link href="/auth/signup" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Créer un compte gratuitement
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
