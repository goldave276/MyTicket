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

  const fetchRequests = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(false);
    try {
      const data = await adminService.getOrganizerRequests();
      setRequests(Array.isArray(data) ? data : data.requests || []);
    } catch (err) {
      if (!isBackground) {
        setError(true);
        showToast(err.message || 'Impossible de charger les demandes', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Premier chargement
    if (ready) queueMicrotask(() => fetchRequests());
  }, [ready, fetchRequests]);

  // Auto-rafraîchissement périodique (15 secondes) et au focus de l'onglet
  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true);
      }
    }, 15000);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
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
            <>
              {/* Vue Mobile (Android & iPhone) : Liste de fiches tactiles complètes */}
              <div className="block md:hidden space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {req.user?.fullName || req.user?.full_name || req.userName || 'Membre'}
                          </div>
                          <div className="text-xs font-mono text-zinc-400">{req.user?.email}</div>
                        </div>
                      </div>
                      <Badge status={req.status} />
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-500 uppercase tracking-wider font-semibold block text-[10px]">
                          Type d&apos;événement
                        </span>
                        <span className="font-semibold text-zinc-200">
                          {req.eventType || req.event_type}
                        </span>
                      </div>

                      {req.description && (
                        <div>
                          <span className="text-zinc-500 uppercase tracking-wider font-semibold block text-[10px]">
                            Description
                          </span>
                          <p className="text-zinc-300 mt-0.5 whitespace-pre-line leading-relaxed">
                            {req.description}
                          </p>
                        </div>
                      )}

                      <div className="pt-1">
                        {req.signed_document_url || req.signedDocumentUrl ? (
                          <a
                            href={req.signed_document_url || req.signedDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 font-semibold text-xs border border-indigo-500/30 touch-manipulation min-h-[40px]"
                          >
                            <span>📄 Consulter le justificatif</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-zinc-500 text-xs">
                            📄 {req.documentPath || req.document_path || 'Document joint'}
                          </span>
                        )}
                      </div>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-3">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 touch-manipulation min-h-[44px] shadow-sm transition-all"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          className="flex-1 py-2.5 px-4 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 touch-manipulation min-h-[44px] transition-all"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          <span>Refuser</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Vue Desktop : Table classique */}
              <div className="hidden md:block table-shell">
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
                            {req.signed_document_url || req.signedDocumentUrl ? (
                              <a
                                href={req.signed_document_url || req.signedDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-semibold transition-all border border-indigo-500/20"
                                title="Ouvrir le justificatif dans un nouvel onglet"
                              >
                                <span>📄 Voir justificatif</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="px-2 py-1 rounded-sm bg-zinc-800 text-zinc-500 font-semibold truncate max-w-[120px] inline-block" title={req.documentPath || req.document_path}>
                                📄 {req.documentPath || req.document_path || 'Document'}
                              </span>
                            )}
                          </td>
                          <td className="text-xs text-zinc-400 max-w-xs">
                            {req.description ? (
                              <p className="whitespace-pre-line line-clamp-4" title={req.description}>
                                {req.description}
                              </p>
                            ) : (
                              <span className="text-zinc-500">Aucune description</span>
                            )}
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
            </>
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
