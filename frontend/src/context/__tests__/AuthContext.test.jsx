import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import authService from '@/services/authService';

const mockReplace = vi.fn().mockResolvedValue(true);

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/dashboard',
    replace: mockReplace,
  }),
}));

vi.mock('@/services/authService', () => ({
  default: {
    getStoredUser: vi.fn(),
    getProfile: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

function Harness() {
  const { userRole, logout } = useAuth();
  return (
    <div>
      <span data-testid="role">{userRole}</span>
      <button type="button" onClick={logout}>
        Déconnexion
      </button>
    </div>
  );
}

describe('AuthContext (synchronisation rôle & déconnexion vers accueil)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('emet myticket_role_updated lorsque le role utilisateur evolue au focus', async () => {
    localStorage.setItem('myticket_token', 'tok_123');
    authService.getStoredUser.mockReturnValue({ id: 'u1', email: 'u@tg', role: 'USER' });
    authService.getProfile
      .mockResolvedValueOnce({ id: 'u1', email: 'u@tg', role: 'USER' })
      .mockResolvedValueOnce({ id: 'u1', email: 'u@tg', role: 'ORGANIZER' });

    const roleListener = vi.fn();
    window.addEventListener('myticket_role_updated', roleListener);

    const dateNowSpy = vi.spyOn(Date, 'now');
    dateNowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(20000).mockReturnValueOnce(20000);

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authService.getProfile).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('ORGANIZER');
    });
    expect(roleListener).toHaveBeenCalledTimes(1);
    expect(roleListener.mock.calls[0][0].detail).toEqual({
      prevRole: 'USER',
      role: 'ORGANIZER',
    });

    window.removeEventListener('myticket_role_updated', roleListener);
    dateNowSpy.mockRestore();
  });

  it('redirige vers / lors du logout', async () => {
    authService.getStoredUser.mockReturnValue({ id: 'u1', email: 'u@tg', role: 'USER' });
    authService.logout.mockResolvedValue();

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
