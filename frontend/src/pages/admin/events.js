import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import adminService from '@/services/adminService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@/components/common/Icons';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Tous les statuts' },
  { id: 'APPROVED', label: 'Approuvés (Publics)' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'CANCELLED', label: 'Annulés' },
  { id: 'FINISHED', label: 'Terminés' },
];

export default function AdminEventsPage() {
  const { ready } = useRequireAuth({ role: 'ADMIN' });
  const { showToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete / Cancel modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await adminService.getAllEvents(params);
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les événements', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    if (ready) {
      queueMicrotask(() => fetchEvents());
    }
  }, [ready, fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter((ev) =>
      (ev.title || '').toLowerCase().includes(query) ||
      (ev.location || '').toLowerCase().includes(query) ||
      (ev.category || '').toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  const handleDeleteOrCancel = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);
    try {
      const res = await adminService.deleteOrCancelEvent(selectedEvent.id, forceDelete);
      showToast(res.message || 'Opération réussie', 'success');
      setSelectedEvent(null);
      setForceDelete(false);
      fetchEvents();
    } catch (err) {
      showToast(err.message || "Erreur lors de l'opération sur l'événement", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || price === '0') return 'Gratuit';
    return `${Number(price || 0).toLocaleString('fr-FR')} XOF`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date non définie';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Tous les Événements - Administration | MyTicket</title>
      </Head>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        <Sidebar mode="admin" />

        <main className="flex-1 space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <TicketIcon className="w-6 h-6 text-indigo-400" />
                Gestion de Tous les Événements
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Visualisez, modérez, annulez d&apos;urgence ou supprimez n&apos;importe quel événement de la plateforme.
              </p>
            </div>
            <div className="text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
              Total : <span className="font-semibold text-white">{filteredEvents.length}</span> événement(s)
            </div>
          </header>

          {/* Filtres et Recherche */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
                    statusFilter === f.id
                      ? 'bg-indigo-500 text-white border-indigo-400 font-medium'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Rechercher par titre, lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 text-sm rounded-md px-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Contenu */}
          {loading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <ErrorState
              title="Erreur de chargement"
              message="Impossible de récupérer la liste des événements."
              onRetry={fetchEvents}
            />
          ) : filteredEvents.length === 0 ? (
            <div className="panel p-12 text-center">
              <TicketIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-zinc-300">Aucun événement trouvé</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Aucun événement ne correspond aux critères de filtre sélectionnés.
              </p>
            </div>
          ) : (
            <div className="panel overflow-hidden border border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Événement</th>
                      <th className="py-3 px-4">Date & Lieu</th>
                      <th className="py-3 px-4">Tarif</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {filteredEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                          <div className="truncate font-semibold">{ev.title}</div>
                          <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                            <span>{ev.category || 'Événement'}</span>
                            <span>•</span>
                            <span>Capacité : {ev.capacity || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-400">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span>{formatDate(ev.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-500 mt-0.5 truncate max-w-[200px]">
                            <MapPinIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span>{ev.location || 'Lieu non spécifié'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-indigo-300">
                          {formatPrice(ev.price)}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={ev.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <Link
                            href={`/events/${ev.id}`}
                            className="inline-block text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                          >
                            Voir la page
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEvent(ev);
                              setForceDelete(false);
                            }}
                            className="text-xs px-2.5 py-1 rounded bg-red-950/70 border border-red-800 text-red-300 hover:bg-red-900/80 transition-colors font-medium"
                          >
                            Supprimer / Annuler
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modale de Suppression / Annulation d'urgence */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => {
            if (!submitting) {
              setSelectedEvent(null);
              setForceDelete(false);
            }
          }}
          title="Modération : Supprimer ou Annuler l'événement"
        >
          <div className="space-y-4 text-sm text-zinc-300">
            <p>
              Vous êtes sur le point de modérer l&apos;événement :
              <strong className="block text-white mt-1 text-base">
                {selectedEvent.title} (ID #{selectedEvent.id})
              </strong>
            </p>

            <div className="bg-amber-950/40 border border-amber-800/80 rounded-md p-3 text-xs text-amber-200 space-y-1">
              <p className="font-semibold">⚠️ Règles de modération :</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-300/90">
                <li>
                  <strong>Sans réservation :</strong> L&apos;événement sera <u>supprimé définitivement</u> de la base de données.
                </li>
                <li>
                  <strong>Avec réservations actives :</strong> L&apos;événement basculera en statut <u>ANNULÉ (`CANCELLED`)</u> d&apos;urgence, les réservations seront annulées et les billets QR invalidés pour empêcher l&apos;entrée.
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 p-2 rounded bg-zinc-900 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-red-500 focus:ring-red-400"
              />
              <span className="text-xs text-zinc-400">
                <strong className="text-red-400">Forcer la suppression physique complète</strong> même si des réservations ou paiements existent (purgera en cascade toutes les données associées).
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setSelectedEvent(null);
                  setForceDelete(false);
                }}
                className="btn btn-secondary text-xs"
              >
                Abandonner
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteOrCancel}
                className="btn bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                {submitting
                  ? 'Traitement...'
                  : forceDelete
                  ? 'Supprimer définitivement (Force)'
                  : "Confirmer l'opération"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

