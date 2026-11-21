import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../layout/Navbar';

const mockUseAuth = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Navbar (menu mobile 3 barres)', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        email: 'kewiyodaably@gmail.com',
        full_name: 'kewi',
      },
      userRole: 'USER',
      isOrganizer: false,
      isAdmin: false,
      loading: false,
      logout: mockLogout,
    });
  });

  it('ouvre la fiche profil et la navigation dans le tiroir des 3 barres en haut a droite', () => {
    render(<Navbar />);

    const hamburger = screen.getByRole('button', { name: 'Ouvrir le menu' });
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Le dropdown flottant desktop est masqué sur mobile via hidden md:block
    const desktopTrigger = screen.getByRole('button', { name: 'Menu profil utilisateur' });
    expect(desktopTrigger.closest('.hidden.md\\:block')).not.toBeNull();

    fireEvent.click(hamburger);
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('kewiyodaably@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Mon Profil')).toBeInTheDocument();
    expect(screen.getByText('Devenir Organisateur')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Déconnexion/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
