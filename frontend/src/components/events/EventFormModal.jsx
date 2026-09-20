import React, { useState } from 'react';
import Modal from '../common/Modal';

const CATEGORIES = [
  { id: 'CONCERT', label: 'Concert & Musique' },
  { id: 'CONFERENCE', label: 'Conférence & Tech' },
  { id: 'THEATRE', label: 'Théâtre & Spectacles' },
  { id: 'FESTIVAL', label: 'Festival' },
  { id: 'SPORT', label: 'Sport & Compétition' },
  { id: 'WORKSHOP', label: 'Atelier & Formation' },
];

function buildFormData(initialData) {
  if (!initialData) {
    return {
      title: '',
      description: '',
      eventType: 'CONCERT',
      date: '',
      location: '',
      price: 0,
      totalTickets: 100,
    };
  }
  const rawDate = initialData.date || initialData.event_date;
  return {
    title: initialData.title || '',
    description: initialData.description || '',
    eventType: initialData.eventType || initialData.event_type || 'CONCERT',
    date: rawDate ? new Date(rawDate).toISOString().slice(0, 16) : '',
    location: initialData.location || '',
    price: initialData.price ?? initialData.ticket_price ?? 0,
    totalTickets: initialData.totalTickets ?? initialData.total_tickets ?? 100,
  };
}

// `initialData` only ever changes while this component is unmounted and
// remounted under a fresh `key` (see organizer/events/index.js), so a plain
// lazy initializer is enough here — no effect needed to resynchronize state.
export default function EventFormModal({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) {
  const [formData, setFormData] = useState(() => buildFormData(initialData));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Modifier l’événement" : 'Créer un nouvel événement'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
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

        {/* Category & Date */}
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
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
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

        {/* Location */}
        <div>
          <label className="field-label">
            Lieu / Adresse *
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

        {/* Price & Capacity */}
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
              Nombre de tickets au total *
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

        {/* Description */}
        <div>
          <label className="field-label">
            Description détaillée *
          </label>
          <textarea
            rows="4"
            required
            placeholder="Présentez le programme, les artistes, l’accès..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="field-input"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-md text-sm font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Enregistrer le brouillon'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
