import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import eventService from '@/services/eventService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import EventFormModal from '@/components/events/EventFormModal';
import { SkeletonTable } from '@/components/common/Skeleton';
import { PlusIcon, EditIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from '@/components/common/Icons';

export default function OrganizerEventsListPage() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isOrganizer) {
      router.push('/dashboard');
      return;
    }

    if (user && isOrganizer) {
      fetchEvents();
    }
  }, [user, isOrganizer, authLoading, router]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getMyEvents();
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch {
      // Demo fallback
      setEvents([
        {
          id: 'org-ev-1',
          title: 'Concert Live Afrobeat 2026',
          eventType: 'CONCERT',
          date: '2026-10-15T20:00:00Z',
          location: 'Palais des Congrès, Lomé',
          price: 5000,
          totalTickets: 200,
          availableTickets: 152,
          status: 'DRAFT',
        },
        {
          id: 'org-ev-2',
          title: 'Workshop IA & Web Dev',
          eventType: 'WORKSHOP',
          date: '2026-11-20T14:00:00Z',
          location: 'Hub Tech Lomé',
          price: 2000,
          totalTickets: 50,
          availableTickets: 38,
          status: 'PENDING',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvent = async (eventId) => {
    try {
      await eventService.submitEvent(eventId);
      showToast('Événement soumis à l\'administration pour validation !', 'success');
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Impossible de soumettre l\'événement', 'error');
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet événement ?')) return;

    try {
      await eventService.cancelEvent(eventId);
      showToast('Événement annulé', 'info');
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Impossible d\'annuler l\'événement', 'error');
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
        showToast('Brouillon d\'événement créé avec succès', 'success');
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isOrganizer) return null;

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                Mes Événements
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Gérez vos brouillons, soumettez-les à l'administration et suivez les ventes.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-md transition-all hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Nouveau Brouillon
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex overflow-x-auto gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Aucun événement dans cet onglet</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Créez un nouveau brouillon pour commencer à organiser vos futurs événements.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase font-extrabold text-zinc-500">
                    <tr>
                      <th className="p-4">Titre</th>
                      <th className="p-4">Date & Lieu</th>
                      <th className="p-4">Prix</th>
                      <th className="p-4">Places</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 dark:text-white">
                          {event.title}
                          <span className="block text-[10px] text-zinc-400 font-normal uppercase">
                            {event.eventType || event.event_type}
                          </span>
                        </td>
                        <td className="p-4 text-xs space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                            {event.date || event.event_date
                              ? new Date(event.date || event.event_date).toLocaleDateString('fr-FR')
                              : 'À venir'}
                          </div>
                          <div className="text-zinc-400 truncate max-w-[150px]">{event.location}</div>
                        </td>
                        <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                          {event.price || event.ticket_price || 0} FCFA
                        </td>
                        <td className="p-4 text-xs">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {event.availableTickets ?? event.available_tickets ?? 0}
                          </span>{' '}
                          / {event.totalTickets ?? event.total_tickets ?? 0}
                        </td>
                        <td className="p-4">
                          <Badge status={event.status} />
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {(event.status === 'DRAFT' || event.status === 'REJECTED') && (
                            <button
                              onClick={() => handleSubmitEvent(event.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors"
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 transition-colors"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                              Modifier
                            </button>
                          )}
                          <Link
                            href={`/organizer/events/${event.id}/reservations`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-colors"
                          >
                            Réservations
                          </Link>
                          {event.status === 'APPROVED' && (
                            <button
                              onClick={() => handleCancelEvent(event.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors"
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

        {/* Modal Form */}
        <EventFormModal
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
