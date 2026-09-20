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
          <div className="page-header">
            <span className="eyebrow text-indigo-400">Accréditation</span>
            <h1 className="page-title mt-1">
              Demandes d’Accréditation Organisateur
            </h1>
            <p className="page-subtitle">
              Examinez les dossiers soumis et attribuez le rôle Organisateur aux membres vérifiés.
            </p>
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <ErrorState title="Impossible de charger les demandes" onRetry={fetchRequests} />
          ) : requests.length === 0 ? (
            <div className="empty-state space-y-4">
              <h3 className="text-xl font-bold text-white">Aucune demande en attente</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Toutes les demandes d’organisateur ont été traitées.
              </p>
            </div>
          ) : (
            <div className="table-shell">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Demandeur</th>
                      <th>Type</th>
                      <th>Justificatif</th>
                      <th>Description</th>
                      <th>Statut</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id}>
                        <td className="font-bold text-white">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div>
                              <div>{req.user?.fullName || req.user?.full_name || req.userName || 'Membre'}</div>
                              <div className="text-xs font-mono font-normal text-zinc-500">{req.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="font-semibold text-zinc-300">
                          {req.eventType || req.event_type}
                        </td>
                        <td className="text-xs font-mono">
                          <span className="px-2 py-1 rounded-sm bg-zinc-800 text-indigo-400 font-semibold truncate max-w-[120px] inline-block">
                            📄 {req.documentPath || req.document_path || 'Document'}
                          </span>
                        </td>
                        <td className="text-xs text-zinc-500 max-w-xs truncate">
                          {req.description || 'Aucune description'}
                        </td>
                        <td>
                          <Badge status={req.status} />
                        </td>
                        <td className="text-right space-x-2">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="pill pill-emerald"
                              >
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Approuver
                              </button>
                              <button
                                onClick={() => setRejectingId(req.id)}
                                className="pill pill-rose"
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
            <p className="text-sm text-zinc-300">
              Veuillez indiquer le motif du refus (ce motif sera transmis au demandeur) :
            </p>
            <textarea
              rows="3"
              required
              placeholder="ex: Document justificatif incomplet ou illisible."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="field-input"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-md text-sm font-semibold text-zinc-400 hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={submitting}
                className="px-5 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm disabled:opacity-50"
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
