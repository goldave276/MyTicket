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
import { CheckCircleIcon, XCircleIcon, UserIcon } from '@/components/common/Icons';

export default function AdminOrganizerRequestsPage() {
  const { ready } = useRequireAuth({ role: 'ADMIN' });
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reject Modal
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getOrganizerRequests();
      setRequests(Array.isArray(data) ? data : data.requests || []);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les demandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchRequests());
  }, [ready, fetchRequests]);

  const handleApprove = async (requestId) => {
    try {
      await adminService.approveOrganizerRequest(requestId);
      showToast('Demande approuvée avec succès ! Le membre est désormais Organisateur.', 'success');
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Erreur lors de l’approbation', 'error');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    setSubmitting(true);
    try {
      await adminService.rejectOrganizerRequest(rejectingId, rejectReason);
      showToast('Demande refusée.', 'info');
      setRejectingId(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Erreur lors du refus', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>Demandes Organisateur - Admin</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="admin" />

        <div className="flex-1 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Demandes d’Accréditation Organisateur
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Examinez les dossiers soumis et attribuez le rôle Organisateur aux membres vérifiés.
            </p>
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <ErrorState title="Impossible de charger les demandes" onRetry={fetchRequests} />
          ) : requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Aucune demande en attente</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Toutes les demandes d’organisateur ont été traitées.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase font-extrabold text-zinc-500">
                    <tr>
                      <th className="p-4">Demandeur</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Justificatif</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                              <div>{req.user?.fullName || req.user?.full_name || req.userName || 'Membre'}</div>
                              <div className="text-xs font-mono font-normal text-zinc-400">{req.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-zinc-800 dark:text-zinc-200">
                          {req.eventType || req.event_type}
                        </td>
                        <td className="p-4 text-xs font-mono">
                          <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[120px] inline-block">
                            📄 {req.documentPath || req.document_path || 'Document'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-zinc-500 max-w-xs truncate">
                          {req.description || 'Aucune description'}
                        </td>
                        <td className="p-4">
                          <Badge status={req.status} />
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors"
                              >
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Approuver
                              </button>
                              <button
                                onClick={() => setRejectingId(req.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors"
                              >
                                <XCircleIcon className="w-3.5 h-3.5" />
                                Refuser
                              </button>
                            </>
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

        {/* Reject Modal */}
        <Modal
          isOpen={Boolean(rejectingId)}
          onClose={() => setRejectingId(null)}
          title="Refuser la demande d’organisateur"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Veuillez indiquer le motif du refus (ce motif sera transmis au demandeur) :
            </p>
            <textarea
              rows="3"
              required
              placeholder="ex: Document justificatif incomplet ou illisible."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md disabled:opacity-50"
              >
                {submitting ? 'Refus en cours...' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
