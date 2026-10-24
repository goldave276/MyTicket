import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import adminService from '@/services/adminService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { CheckCircleIcon, CurrencyIcon, UserIcon, TicketIcon } from '@/components/common/Icons';

export default function AdminPaymentsPage() {
  const { ready } = useRequireAuth({ role: 'ADMIN' });
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Confirm Modal State
  const [confirmingPayment, setConfirmingPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getPendingPayments();
      setPayments(Array.isArray(data) ? data : data.payments || []);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les paiements en attente', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (ready) queueMicrotask(() => fetchPayments());
  }, [ready, fetchPayments]);

  const handleConfirmPayment = async () => {
    if (!confirmingPayment) return;
    setSubmitting(true);
    try {
      await adminService.confirmOnSitePayment(confirmingPayment.id);
      showToast('Paiement sur place confirmé avec succès ! Les billets et QR codes ont été générés.', 'success');
      setConfirmingPayment(null);
      fetchPayments();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la confirmation du paiement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>Paiements sur place - Admin</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="admin" />

        <div className="flex-1 space-y-6">
          <div className="page-header">
            <span className="eyebrow text-indigo-400">Caisse & Guichet</span>
            <h1 className="page-title mt-1">
              Validation des Paiements sur Place (ON_SITE)
            </h1>
            <p className="page-subtitle">
              Confirmez la réception effective des règlements physiques pour valider définitivement les réservations et émettre les pass.
            </p>
          </div>

          {loading ? (
            <SkeletonTable rows={4} />
          ) : error ? (
            <ErrorState title="Impossible de charger les paiements en attente" onRetry={fetchPayments} />
          ) : payments.length === 0 ? (
            <div className="empty-state space-y-4">
              <h3 className="text-xl font-bold text-white">Aucun paiement sur place en attente</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Toutes les réservations avec règlement sur place ont été confirmées ou aucune commande n’est en suspens.
              </p>
            </div>
          ) : (
            <div className="table-shell">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Réf. Paiement</th>
                      <th>Réservation</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Statut</th>
                      <th className="text-right">Action Guichet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs text-indigo-400 font-bold">
                          #{p.id}
                          <span className="block text-[11px] font-normal text-zinc-500 font-sans">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Date inconnue'}
                          </span>
                        </td>
                        <td className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <TicketIcon className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Réservation #{p.reservation_id}</span>
                          </div>
                          {p.user_id && (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                              <UserIcon className="w-3 h-3 text-zinc-500" />
                              <span className="truncate max-w-[140px]">{p.user_id}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="font-bold text-emerald-400 text-sm">
                            {Number(p.amount || 0).toLocaleString('fr-FR')} FCFA
                          </div>
                        </td>
                        <td>
                          <span className="px-2 py-1 rounded-sm bg-zinc-800 text-amber-400 font-semibold text-xs inline-flex items-center gap-1">
                            <CurrencyIcon className="w-3 h-3" />
                            {p.payment_method || 'ON_SITE'}
                          </span>
                        </td>
                        <td>
                          <Badge status={p.status} />
                        </td>
                        <td className="text-right">
                          {p.status === 'PENDING' && (
                            <button
                              onClick={() => setConfirmingPayment(p)}
                              className="pill pill-emerald"
                              title="Encaisser et émettre les billets"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Confirmer le paiement
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Modal */}
        <Modal
          isOpen={Boolean(confirmingPayment)}
          onClose={() => setConfirmingPayment(null)}
          title="Confirmer l'encaissement sur place"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Confirmez-vous avoir reçu la somme de{' '}
              <strong className="text-emerald-400 font-bold">
                {Number(confirmingPayment?.amount || 0).toLocaleString('fr-FR')} FCFA
              </strong>{' '}
              pour le règlement de la réservation #{confirmingPayment?.reservation_id} ?
            </p>
            <p className="text-xs text-zinc-400 bg-zinc-800/60 p-3 rounded-lg border border-zinc-700/50">
              ℹ️ Cette action est irréversible. Dès confirmation, la réservation passera au statut <span className="text-emerald-400 font-semibold">CONFIRMED</span> et les tickets officiels avec QR pass seront immédiatement générés pour le client.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmingPayment(null)}
                className="px-4 py-2 rounded-md text-sm font-semibold text-zinc-400 hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={submitting}
                className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-50 inline-flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {submitting ? 'Validation...' : 'Valider l’encaissement'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
