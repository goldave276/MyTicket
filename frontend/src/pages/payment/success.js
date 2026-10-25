import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { paymentId, session_id } = router.query;

  return (
    <>
      <Head>
        <title>Paiement Confirmé - MyTicket</title>
      </Head>

      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>

        <div className="space-y-2">
          <span className="eyebrow text-emerald-400">Paiement validé avec succès</span>
          <h1 className="text-3xl font-bold text-white tracking-tight">Merci pour votre commande !</h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Votre paiement a été traité. Vos billets électroniques sécurisés ont été émis et sont immédiatement disponibles dans votre espace personnel.
          </p>
        </div>

        {paymentId && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 text-left text-xs text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>Référence paiement :</span>
              <span className="font-mono text-zinc-200">#{paymentId}</span>
            </div>
            {session_id && (
              <div className="flex justify-between">
                <span>Identifiant session :</span>
                <span className="font-mono text-zinc-300 truncate max-w-[200px]">{session_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Statut :</span>
              <span className="text-emerald-400 font-semibold">CONFIRMÉ / PAYÉ</span>
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/tickets"
            className="eyebrow px-6 py-3 rounded-md bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-semibold transition-colors"
          >
            🎟️ Voir mes billets & QR Pass
          </Link>
          <Link
            href="/dashboard"
            className="eyebrow px-6 py-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors"
          >
            Mes réservations
          </Link>
        </div>
      </div>
    </>
  );
}
