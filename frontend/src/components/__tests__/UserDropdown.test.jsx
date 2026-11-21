import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserDropdown from '../layout/UserDropdown';

const mockUseAuth = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('UserDropdown (tactile Android & RBAC)', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        email: 'koffi@myticket.tg',
        full_name: 'Koffi Mensah',
      },
      userRole: 'USER',
      isOrganizer: false,
      isAdmin: false,
      logout: mockLogout,
    });
  });

  it('ouvre le menu au clic et le ferme sur pointerdown exterieur sans fermeture prematuree', () => {
    render(
      <div>
        <div data-testid="outside-area">Zone extérieure</div>
        <UserDropdown />
      </div>
    );

    const trigger = screen.getByRole('button', { name: 'Menu profil utilisateur' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Mon Profil')).not.toBeInTheDocument();

    // Pointerdown sur le bouton ne ferme pas un menu pas encore ouvert
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Mon Profil')).toBeInTheDocument();
    expect(screen.getByText('Devenir Organisateur')).toBeInTheDocument();

    // Pointerdown à l'intérieur du menu ne le ferme pas
    fireEvent.pointerDown(screen.getByText('koffi@myticket.tg'));
    expect(screen.getByText('Mon Profil')).toBeInTheDocument();

    // Pointerdown à l'extérieur ferme le menu
    fireEvent.pointerDown(screen.getByTestId('outside-area'));
    expect(screen.queryByText('Mon Profil')).not.toBeInTheDocument();
  });

  it('affiche les liens Organisateur et Administration pour un ADMIN et declenche logout', () => {
    mockUseAuth.mockReturnValue({
      user: {
        email: 'admin@myticket.tg',
        full_name: 'Admin Dave',
      },
      userRole: 'ADMIN',
      isOrganizer: true,
      isAdmin: true,
      logout: mockLogout,
    });

    render(<UserDropdown />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu profil utilisateur' }));

    expect(screen.getByText('Espace Organisateur')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.queryByText('Devenir Organisateur')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Déconnexion/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
