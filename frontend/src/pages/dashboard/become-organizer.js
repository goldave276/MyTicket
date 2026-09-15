import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import reservationService from '@/services/reservationService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import { BuildingIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon } from '@/components/common/Icons';

function formatRequestDate(request) {
  const raw = request.createdAt || request.created_at;
  return raw ? new Date(raw).toLocaleDateString('fr-FR') : 'Date inconnue';
}

export default function BecomeOrganizerPage() {
  const { ready, user, isOrganizer } = useRequireAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [eventType, setEventType] = useState('CONCERT');
  const [documentPath, setDocumentPath] = useState('');
  const [description, setDescription] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reservationService.getMyOrganizerRequests();
      setRequests(Array.isArray(data) ? data : data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchRequests());
  }, [ready, fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await reservationService.submitOrganizerRequest({
        eventType,
        documentPath: `${user.id}/${documentPath}`,
        description,
      });
      showToast('Votre demande d’organisateur a été soumise à l’administration !', 'success');
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Impossible de soumettre la demande', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  const pendingRequest = requests.find((r) => r.status === 'PENDING');

  return (
    <>
      <Head>
        <title>Devenir Organisateur - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="user" />

        <div className="flex-1 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Espace Demande Organisateur
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Soumettez vos justificatifs pour obtenir les droits de création et gestion d’événements.
            </p>
          </div>

          {/* Already Organizer Banner */}
          {isOrganizer && (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-100 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-bold">Vous êtes un Organisateur Officiel !</h3>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Votre compte dispose de toutes les autorisations. Vous pouvez créer, modifier et suivre vos événements directement depuis l’espace organisateur.
              </p>
              <Link
                href="/organizer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
              >
                Accéder à l’Espace Organisateur
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Pending Request Alert */}
          {!isOrganizer && pendingRequest && (
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-100 space-y-3">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-bold">Demande en cours de traitement</h3>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Votre dossier est actuellement examiné par l’équipe administrative de MyTicket. Vous recevrez une réponse dans les plus brefs délais.
              </p>
              <div className="text-xs font-semibold">
                Type : <span className="font-bold">{pendingRequest.eventType || pendingRequest.event_type}</span> | Soumis le :{' '}
                {formatRequestDate(pendingRequest)}
              </div>
            </div>
          )}

          {/* Application Form */}
          {!isOrganizer && !pendingRequest && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BuildingIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Formulaire d’accréditation</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Remplissez les informations relatives à votre activité</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Type principal d’événements à organiser *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="CONCERT">Concerts & Spectacles Musicaux</option>
                    <option value="CONFERENCE">Conférences, Forums & Séminaires</option>
                    <option value="FESTIVAL">Festivals & Événements Culturels</option>
                    <option value="SPORT">Sport & Tournois</option>
                    <option value="WORKSHOP">Ateliers & Formations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Nom du fichier justificatif déjà déposé *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: autorisation-prefecture.pdf"
                    value={documentPath}
                    onChange={(e) => setDocumentPath(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-xs text-zinc-400 mt-1.5">
                    Le document doit d’abord être déposé dans votre espace de stockage sécurisé personnel ; indiquez uniquement son nom de fichier ici.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Présentation de votre structure ou activité *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Présentez brièvement vos projets d’événements et votre organisation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
                >
                  {submitting ? 'Envoi du dossier...' : 'Soumettre ma demande d’accréditation'}
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* History of Requests */}
          {!loading && requests.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">Historique de vos demandes</h4>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {req.eventType || req.event_type}
                      </span>
                      <p className="text-xs text-zinc-400">{formatRequestDate(req)}</p>
                    </div>
                    <Badge status={req.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
