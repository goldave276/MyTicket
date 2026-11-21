import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QRCodeModal from '../common/QRCodeModal';

describe('QRCodeModal', () => {
  const sampleTicket = {
    id: 42,
    ticket_code: '550e8400-e29b-41d4-a716-446655440000',
    eventName: 'Concert Afrobeats Lomé',
    eventDate: '2026-12-20T20:00:00.000Z',
    eventLocation: 'Palais des Congrès, Lomé',
    eventId: 7,
    user_id: 'user-123',
    created_at: '2026-11-21T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ne rend rien lorsque ticket est null ou modal fermee', () => {
    const { container } = render(
      <QRCodeModal isOpen={true} onClose={vi.fn()} ticket={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche les details du billet et genere le QR code SVG client-side', () => {
    render(<QRCodeModal isOpen={true} onClose={vi.fn()} ticket={sampleTicket} />);

    expect(screen.getByText('Concert Afrobeats Lomé')).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('550e8400-e29b-41d4-a716-446655440000')).toBeInTheDocument();
    expect(screen.getByText('Palais des Congrès, Lomé')).toBeInTheDocument();

    const svgElement = document.getElementById('ticket-qr-svg-42');
    expect(svgElement).not.toBeNull();
    expect(svgElement.tagName.toLowerCase()).toBe('svg');
  });

  it('declenche window.print lors du clic sur Imprimer', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<QRCodeModal isOpen={true} onClose={vi.fn()} ticket={sampleTicket} />);

    fireEvent.click(screen.getByRole('button', { name: /Imprimer \/ Enregistrer en PDF/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose sur clic du bouton de fermeture', () => {
    const onClose = vi.fn();
    render(<QRCodeModal isOpen={true} onClose={onClose} ticket={sampleTicket} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer la fenêtre' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
