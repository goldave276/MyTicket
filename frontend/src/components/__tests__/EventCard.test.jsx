import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from '../events/EventCard';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('EventCard', () => {
  const baseEvent = {
    id: 15,
    title: 'Festival Tech Togo',
    description: 'Conférences et ateliers pratiques sur le web mobile.',
    event_type: 'Conférence',
    location: 'Lomé',
    event_date: '2026-12-15T09:00:00.000Z',
    price: 5000,
    capacity: 100,
    remainingCapacity: 25,
    status: 'APPROVED',
  };

  it('affiche le tarif en FCFA, le chargement paresseux image et le lien de reservation', () => {
    render(<EventCard event={baseEvent} />);

    expect(screen.getByText('Festival Tech Togo')).toBeInTheDocument();
    expect(screen.getByText('5000 FCFA')).toBeInTheDocument();
    expect(screen.getByText('25 / 100')).toBeInTheDocument();

    const img = screen.getByRole('img', { name: 'Festival Tech Togo' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');

    const link = screen.getByRole('link', { name: /Réserver une place/i });
    expect(link).toHaveAttribute('href', '/events/15');
  });

  it('affiche GRATUIT quand le prix est 0', () => {
    render(<EventCard event={{ ...baseEvent, price: 0 }} />);
    expect(screen.getByText('GRATUIT')).toBeInTheDocument();
  });

  it('desactive la reservation et affiche EPUISE / Complet quand remainingCapacity vaut 0', () => {
    render(<EventCard event={{ ...baseEvent, remainingCapacity: 0 }} />);

    expect(screen.getByText('ÉPUISÉ')).toBeInTheDocument();
    const disabledBtn = screen.getByRole('button', { name: /Complet/i });
    expect(disabledBtn).toBeDisabled();
    expect(disabledBtn).toHaveAttribute('aria-disabled', 'true');
  });
});
