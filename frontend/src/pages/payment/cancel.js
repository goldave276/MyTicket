import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PaymentCancelPage() {
  const router = useRouter();
  const { paymentId } = router.query;

  return (
    <>
      <Head>
        <title>Paiement Annulé - MyTicket</title>
      </Head>

      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✕
        </div>

        <div className="space-y-2">
          <span className="eyebrow text-amber-400">Paiement interrompu</span>
          <h1 className="text-3xl font-bold text-white tracking-tight">Le paiement a été annulé</h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Vous avez annulé la transaction ou le délai de paiement a expiré. Aucun montant n&apos;a été débité de votre compte.
          </p>
        </div>

        {paymentId && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 text-left text-xs text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>Référence réservation / paiement :</span>
              <span className="font-mono text-zinc-200">#{paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span>Statut :</span>
              <span className="text-amber-400 font-semibold">EN ATTENTE / NON PAYÉ</span>
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="eyebrow px-6 py-3 rounded-md bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-semibold transition-colors"
          >
            📋 Retrouver ma réservation
          </Link>
          <Link
            href="/"
            className="eyebrow px-6 py-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    </>
  );
}
