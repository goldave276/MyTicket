import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import authService from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { TicketIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function PasswordResetPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSubmitted(true);
      showToast('Un e-mail de réinitialisation a été envoyé si l\'adresse existe.', 'info');
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'envoi de la réinitialisation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Réinitialisation mot de passe - MyTicket</title>
      </Head>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          {/* Header */}
          <div className="text-center space-y-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <TicketIcon className="w-7 h-7" />
              </div>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Mot de passe oublié
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Saisissez votre adresse email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <span className="text-3xl">📧</span>
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400">E-mail envoyé !</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Consultez votre boîte de réception pour suivre les instructions de réinitialisation.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/auth/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              ← Retour à la page de connexion
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
