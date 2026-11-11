import React, { useState, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import reservationService from '@/services/reservationService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import ErrorState from '@/components/common/ErrorState';
import { BuildingIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon } from '@/components/common/Icons';

function formatRequestDate(request) {
  const raw = request.createdAt || request.created_at;
  return raw ? new Date(raw).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Date inconnue';
}

export default function BecomeOrganizerPage() {
  const { ready, isOrganizer } = useRequireAuth();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [eventType, setEventType] = useState('CONCERT');
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const prevPendingRef = useRef(false);

  const fetchRequests = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(false);
    try {
      const data = await reservationService.getMyOrganizerRequests();
      const list = Array.isArray(data) ? data : data.requests || [];
      setRequests(list);

      // Si une demande a été approuvée, synchroniser le statut utilisateur
      const hasApproved = list.some((r) => r.status === 'APPROVED');
      if (hasApproved && !isOrganizer) {
        await refreshUser();
        showToast('Félicitations ! Votre demande d’organisateur a été validée.', 'success');
      }
    } catch (err) {
      if (!isBackground) {
        setError(true);
        showToast(err.message || 'Impossible de charger vos demandes', 'error');
        setRequests([]);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [isOrganizer, refreshUser, showToast]);

  useEffect(() => {
    // Premier chargement
    if (ready) queueMicrotask(() => fetchRequests());
  }, [ready, fetchRequests]);

  const hasPending = requests.some((r) => r.status === 'PENDING');

  // Auto-rafraîchissement intelligent : polling doux tant qu'une demande est en attente
  useEffect(() => {
    if (!ready || !hasPending) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true);
      }
    }, 12000); // 12 secondes

    return () => clearInterval(interval);
  }, [ready, hasPending, fetchRequests]);

  // Auto-rafraîchissement au focus et au changement de visibilité d'onglet
  useEffect(() => {
    if (!ready) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [ready, fetchRequests]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast('Le fichier dépasse la taille maximale autorisée (5 Mo)', 'error');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Format non supporté. Formats acceptés : PDF, JPG, PNG', 'error');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Veuillez sélectionner un fichier justificatif', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const base64Data = await fileToBase64(selectedFile);

      await reservationService.submitOrganizerRequest({
        eventType,
        description,
        file: {
          filename: selectedFile.name,
          mimeType: selectedFile.type,
          base64Data,
        },
      });
      showToast('Votre demande d’organisateur a été soumise à l’administration !', 'success');
      setSelectedFile(null);
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Espace Demande Organisateur
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Soumettez vos justificatifs pour obtenir les droits de création et gestion d’événements.
            </p>
          </div>

          {error && (
            <ErrorState
              title="Impossible de charger vos demandes"
              message="Une erreur est survenue lors de la récupération de vos demandes d'accréditation."
              onRetry={fetchRequests}
            />
          )}

          {/* Already Organizer Banner */}
          {isOrganizer && (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-100 space-y-3">
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
            <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-100 space-y-3">
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
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
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
                    Document justificatif officiel *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer"
                  />
                  <p className="text-xs text-zinc-400 mt-1.5">
                    Formats acceptés : PDF, JPG, PNG (taille maximale : 5 Mo). Le document est stocké dans votre coffre privé et chiffré.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Présentation de votre structure ou activité *
                  </label>
                  <textarea
                    rows="4"
                    required
                    minLength={20}
                    maxLength={1000}
                    placeholder="Présentez brièvement vos projets d’événements et votre organisation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="flex justify-between text-xs text-zinc-400 mt-1.5">
                    <span>Entre 20 et 1000 caractères.</span>
                    <span className={description.trim().length < 20 ? 'text-amber-500' : ''}>
                      {description.trim().length} / 1000
                    </span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Envoi du dossier...' : 'Soumettre ma demande d’accréditation'}
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* History of Requests */}
          {!loading && requests.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">Historique de vos demandes</h4>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white block">
                          {req.eventType || req.event_type}
                        </span>
                        <p className="text-xs text-zinc-400 mt-0.5">{formatRequestDate(req)}</p>
                      </div>
                      <Badge status={req.status} />
                    </div>
                    {(req.adminComment || req.admin_comment) && (
                      <div className="text-xs p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        <span className="font-bold">Motif du refus : </span>
                        <span>{req.adminComment || req.admin_comment}</span>
                      </div>
                    )}
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
