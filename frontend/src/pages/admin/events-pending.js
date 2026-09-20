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
import { CheckCircleIcon, XCircleIcon, CalendarIcon, MapPinIcon } from '@/components/common/Icons';

export default function AdminPendingEventsPage() {
  const { ready } = useRequireAuth({ role: 'ADMIN' });
  const { showToast } = useToast();

  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reject Modal State
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingEvents = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getPendingEvents();
      setPendingEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les événements à valider', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchPendingEvents());
  }, [ready, fetchPendingEvents]);

  const handleApprove = async (eventId) => {
    try {
      await adminService.approveEvent(eventId);
      showToast('Événement approuvé ! Il est désormais public et ouvert aux réservations.', 'success');
      fetchPendingEvents();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la validation', 'error');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    setSubmitting(true);
    try {
      await adminService.rejectEvent(rejectingId, rejectReason);
      showToast('Événement refusé.', 'info');
      setRejectingId(null);
      setRejectReason('');
      fetchPendingEvents();
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
        <title>Événements à valider - Admin</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="admin" />

        <div className="flex-1 space-y-6">
          <div className="page-header">
            <span className="eyebrow text-indigo-400">Modération</span>
            <h1 className="page-title mt-1">
              Modération des Événements Soumis
            </h1>
            <p className="page-subtitle">
              Vérifiez la conformité des événements soumis par les organisateurs avant leur mise en ligne.
            </p>
          </div>

          {loading ? (
            <SkeletonTable rows={4} />
          ) : error ? (
            <ErrorState title="Impossible de charger les événements à valider" onRetry={fetchPendingEvents} />
          ) : pendingEvents.length === 0 ? (
            <div className="empty-state space-y-4">
              <h3 className="text-xl font-bold text-white">Aucun événement à valider</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Tous les événements soumis ont été examinés par l’administration.
              </p>
            </div>
          ) : (
            <div className="table-shell">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Titre de l’événement</th>
                      <th>Catégorie</th>
                      <th>Date & Lieu</th>
                      <th>Prix / Places</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEvents.map((ev) => (
                      <tr key={ev.id}>
                        <td className="font-bold text-white">
                          {ev.title}
                          {ev.organizer && (
                            <span className="block text-xs font-normal text-zinc-400">
                              Organisé par : {ev.organizer}
                            </span>
                          )}
                        </td>
                        <td className="font-semibold text-zinc-300">
                          {ev.eventType || ev.event_type}
                        </td>
                        <td className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-zinc-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                            {ev.date || ev.event_date
                              ? new Date(ev.date || ev.event_date).toLocaleDateString('fr-FR')
                              : 'À venir'}
                          </div>
                          <div className="flex items-center gap-1 text-zinc-500">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            {ev.location}
                          </div>
                        </td>
                        <td className="text-xs">
                          <div className="font-bold text-indigo-400">
                            {ev.price || ev.ticket_price || 0} FCFA
                          </div>
                          <div className="text-zinc-500">{ev.totalTickets || ev.total_tickets} places</div>
                        </td>
                        <td className="text-right space-x-2">
                          <button
                            onClick={() => handleApprove(ev.id)}
                            className="pill pill-emerald"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Approuver
                          </button>
                          <button
                            onClick={() => setRejectingId(ev.id)}
                            className="pill pill-rose"
                          >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Refuser
                          </button>
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
          title="Refuser la publication de l’événement"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Indiquez le motif du refus (ex: contenu non conforme, informations manquantes) :
            </p>
            <textarea
              rows="3"
              required
              placeholder="Saisissez la raison du refus..."
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
                {submitting ? 'Refus...' : 'Refuser l’événement'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
