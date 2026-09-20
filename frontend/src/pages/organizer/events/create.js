import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import eventService from '@/services/eventService';
import Sidebar from '@/components/dashboard/Sidebar';
import { ArrowRightIcon } from '@/components/common/Icons';

export default function CreateEventPage() {
  const { ready } = useRequireAuth({ role: 'ORGANIZER' });
  const { showToast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'CONCERT',
    date: '',
    location: '',
    price: 0,
    totalTickets: 100,
  });
  const [submitting, setSubmitting] = useState(false);

  if (!ready) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await eventService.createDraftEvent(formData);
      showToast('Brouillon d’événement créé avec succès !', 'success');
      router.push('/organizer/events');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la création de l’événement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Créer un Événement - Organisateur</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="organizer" />

        <div className="flex-1 space-y-6">
          <div className="page-header">
            <Link href="/organizer/events" className="eyebrow text-zinc-500 hover:text-zinc-200">
              ← Retour à mes événements
            </Link>
            <h1 className="page-title mt-2">
              Créer un nouvel événement
            </h1>
            <p className="page-subtitle">
              Remplissez les détails. L’événement sera enregistré comme brouillon avant d’être soumis à validation.
            </p>
          </div>

          <div className="panel p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
              <div>
                <label className="field-label">
                  Titre de l’événement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Concert Live Afrobeat 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="field-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">
                    Catégorie *
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="field-input"
                  >
                    <option value="CONCERT">Concert & Musique</option>
                    <option value="CONFERENCE">Conférence & Tech</option>
                    <option value="THEATRE">Théâtre & Spectacles</option>
                    <option value="FESTIVAL">Festival</option>
                    <option value="SPORT">Sport & Compétition</option>
                    <option value="WORKSHOP">Atelier & Formation</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">
                    Date & Heure *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">
                  Lieu / Salle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Palais des Congrès, Lomé"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="field-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">
                    Prix du ticket (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">
                    Nombre total de places *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalTickets}
                    onChange={(e) => setFormData({ ...formData, totalTickets: Number(e.target.value) })}
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">
                  Description détaillée *
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Décrivez le contenu et les temps forts de l’événement..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="field-input"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
                <Link
                  href="/organizer/events"
                  className="px-5 py-3 rounded-md text-sm font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {submitting ? 'Création...' : 'Enregistrer le Brouillon'}
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
