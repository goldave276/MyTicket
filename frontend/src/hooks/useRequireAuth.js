import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

/**
 * Guards a page behind authentication and, optionally, a role.
 *
 * - Redirects unauthenticated visitors to `/auth/login`, preserving the
 *   current URL so they land back here after signing in.
 * - Redirects authenticated visitors who lack the required role to `/dashboard`.
 * - Never decides real permissions on its own: the backend remains the
 *   source of truth, this only avoids flashing organizer/admin UI to users
 *   who will get a 403 from the API anyway.
 *
 * Usage: `const { ready } = useRequireAuth({ role: 'ORGANIZER' });`
 * then `if (!ready) return null;` before rendering the page body.
 */
export function useRequireAuth({ role } = {}) {
  const { user, userRole, isOrganizer, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const hasRequiredRole =
    role === 'ORGANIZER' ? isOrganizer : role === 'ADMIN' ? isAdmin : true;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (!hasRequiredRole) {
      router.push('/dashboard');
    }
  }, [authLoading, user, hasRequiredRole, router]);

  return {
    user,
    userRole,
    loading: authLoading,
    ready: !authLoading && Boolean(user) && hasRequiredRole,
  };
}

export default useRequireAuth;
