import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import eventService from '@/services/eventService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import EventFormModal from '@/components/events/EventFormModal';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { PlusIcon, EditIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from '@/components/common/Icons';

export default function OrganizerEventsListPage() {
  const { ready } = useRequireAuth({ role: 'ORGANIZER' });
  const { showToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await eventService.getMyEvents();
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger vos événements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchEvents());
  }, [ready, fetchEvents]);

  const handleSubmitEvent = async (eventId) => {
    try {
      await eventService.submitEvent(eventId);
      showToast('Événement soumis à l’administration pour validation !', 'success');
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Impossible de soumettre l’événement', 'error');
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet événement ?')) return;

    try {
      await eventService.cancelEvent(eventId);
      showToast('Événement annulé', 'info');
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Impossible d’annuler l’événement', 'error');
    }
  };

  const handleSaveForm = async (formData) => {
    setSubmitting(true);
    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, formData);
        showToast('Événement mis à jour avec succès', 'success');
      } else {
        await eventService.createDraftEvent(formData);
        showToast('Brouillon d’événement créé avec succès', 'success');
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Erreur lors de l’enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  const filteredEvents = events.filter((e) => {
    if (activeTab === 'ALL') return true;
    return e.status === activeTab;
  });

  const TABS = [
    { id: 'ALL', label: 'Tous' },
    { id: 'DRAFT', label: 'Brouillons' },
    { id: 'PENDING', label: 'En attente' },
    { id: 'APPROVED', label: 'Approuvés' },
    { id: 'REJECTED', label: 'Refusés' },
  ];

  return (
    <>
      <Head>
        <title>Gestion des Événements - Organisateur</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="organizer" />

        <div className="flex-1 space-y-6">
          <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="eyebrow text-indigo-400">Organisateur</span>
              <h1 className="page-title mt-1">
                Mes Événements
              </h1>
              <p className="page-subtitle">
                Gérez vos brouillons, soumettez-les à l’administration et suivez les ventes.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5" />
              Nouveau Brouillon
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex overflow-x-auto gap-2 border-b border-zinc-800 pb-3 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <ErrorState
              title="Impossible de charger vos événements"
              onRetry={fetchEvents}
            />
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state space-y-4">
              <h3 className="text-xl font-bold text-white">Aucun événement dans cet onglet</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Créez un nouveau brouillon pour commencer à organiser vos futurs événements.
              </p>
            </div>
          ) : (
            <div className="table-shell">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Date & Lieu</th>
                      <th>Prix</th>
                      <th>Places</th>
                      <th>Statut</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="font-bold text-white">
                          {event.title}
                          <span className="block text-[10px] text-zinc-500 font-normal uppercase">
                            {event.eventType || event.event_type}
                          </span>
                        </td>
                        <td className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-zinc-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                            {event.date || event.event_date
                              ? new Date(event.date || event.event_date).toLocaleDateString('fr-FR')
                              : 'À venir'}
                          </div>
                          <div className="text-zinc-500 truncate max-w-[150px]">{event.location}</div>
                        </td>
                        <td className="font-bold text-indigo-400">
                          {event.price || event.ticket_price || 0} FCFA
                        </td>
                        <td className="text-xs">
                          <span className="font-bold text-white">
                            {event.availableTickets ?? event.available_tickets ?? 0}
                          </span>{' '}
                          / {event.totalTickets ?? event.total_tickets ?? 0}
                        </td>
                        <td>
                          <Badge status={event.status} />
                        </td>
                        <td className="text-right space-x-2">
                          {(event.status === 'DRAFT' || event.status === 'REJECTED') && (
                            <button
                              onClick={() => handleSubmitEvent(event.id)}
                              className="pill pill-emerald"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Soumettre
                            </button>
                          )}
                          {(event.status === 'DRAFT' || event.status === 'REJECTED') && (
                            <button
                              onClick={() => {
                                setEditingEvent(event);
                                setIsModalOpen(true);
                              }}
                              className="pill pill-neutral"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                              Modifier
                            </button>
                          )}
                          <Link
                            href={`/organizer/events/${event.id}/reservations`}
                            className="pill pill-accent"
                          >
                            Réservations
                          </Link>
                          {event.status === 'APPROVED' && (
                            <button
                              onClick={() => handleCancelEvent(event.id)}
                              className="pill pill-rose"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" />
                              Annuler
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

        {/* Modal Form — keyed so it fully remounts (and resets its internal
            state) each time it is opened for a different target, or reopened
            for a new draft. See EventFormModal.jsx for why. */}
        <EventFormModal
          key={isModalOpen ? `event-form-${editingEvent?.id ?? 'new'}` : 'event-form-closed'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={handleSaveForm}
          initialData={editingEvent}
          isSubmitting={submitting}
        />
      </div>
    </>
  );
}
