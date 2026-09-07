import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const CATEGORIES = [
  { id: 'CONCERT', label: 'Concert & Musique' },
  { id: 'CONFERENCE', label: 'Conférence & Tech' },
  { id: 'THEATRE', label: 'Théâtre & Spectacles' },
  { id: 'FESTIVAL', label: 'Festival' },
  { id: 'SPORT', label: 'Sport & Compétition' },
  { id: 'WORKSHOP', label: 'Atelier & Formation' },
];

export default function EventFormModal({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'CONCERT',
    date: '',
    location: '',
    price: 0,
    totalTickets: 100,
    imageUrl: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        eventType: initialData.eventType || initialData.event_type || 'CONCERT',
        date: initialData.date || initialData.event_date ? new Date(initialData.date || initialData.event_date).toISOString().slice(0, 16) : '',
        location: initialData.location || '',
        price: initialData.price ?? initialData.ticket_price ?? 0,
        totalTickets: initialData.totalTickets ?? initialData.total_tickets ?? 100,
        imageUrl: initialData.imageUrl || initialData.image_url || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        eventType: 'CONCERT',
        date: '',
        location: '',
        price: 0,
        totalTickets: 100,
        imageUrl: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Modifier l'événement" : 'Créer un nouvel événement'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Titre de l'événement *
          </label>
          <input
            type="text"
            required
            placeholder="ex: Concert Live Afrobeat 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Catégorie *
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Date & Heure *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Location & Image URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Lieu / Adresse *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Palais des Congrès, Lomé"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Image URL (Couverture)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Price & Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Prix du ticket (FCFA) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nombre de tickets au total *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.totalTickets}
              onChange={(e) => setFormData({ ...formData, totalTickets: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Description détaillée *
          </label>
          <textarea
            rows="4"
            required
            placeholder="Présentez le programme, les artistes, l'accès..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Enregistrer le brouillon'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
