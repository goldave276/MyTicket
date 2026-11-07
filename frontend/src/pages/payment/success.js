import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import paymentService from '@/services/paymentService';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { paymentId, session_id } = router.query;
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!router.isReady || !paymentId) return;

    let cancelled = false;
    queueMicrotask(async () => {
      setVerifying(true);
      try {
        const res = await paymentService.getMyPayments();
        const list = Array.isArray(res) ? res : res?.payments || [];
        const match = list.find((p) => String(p.id) === String(paymentId));
        if (!cancelled && match) {
          setPaymentStatus(match.status);
        }
      } catch {
        // Fallback if unauthenticated or network error
      } finally {
        if (!cancelled) setVerifying(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router.isReady, paymentId]);

  const isConfirmed = paymentStatus === 'SUCCEEDED';
  const isPending = paymentStatus === 'PENDING';

  return (
    <>
      <Head>
        <title>Statut du Paiement - MyTicket</title>
      </Head>

      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl border ${
            isPending
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {isPending ? '⏳' : '✓'}
        </div>

        <div className="space-y-2">
          <span className={`eyebrow ${isPending ? 'text-amber-400' : 'text-emerald-400'}`}>
            {verifying
              ? 'Vérification du paiement en cours...'
              : isConfirmed
                ? 'Paiement validé avec succès'
                : isPending
                  ? 'Paiement en attente de confirmation'
                  : 'Retour de la passerelle de paiement'}
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight">Merci pour votre commande !</h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            {isConfirmed
              ? 'Votre paiement a été confirmé. Vos billets électroniques sécurisés ont été émis et sont immédiatement disponibles dans votre espace personnel.'
              : 'Dès la confirmation finale de votre transaction par l’opérateur de paiement, vos billets électroniques apparaîtront automatiquement dans votre espace personnel.'}
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
              <span
                className={`font-semibold ${
                  isConfirmed
                    ? 'text-emerald-400'
                    : isPending
                      ? 'text-amber-400'
                      : 'text-zinc-300'
                }`}
              >
                {verifying
                  ? 'VÉRIFICATION...'
                  : isConfirmed
                    ? 'CONFIRMÉ / PAYÉ'
                    : isPending
                      ? 'EN ATTENTE'
                      : 'ENREGISTRÉ'}
              </span>
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
