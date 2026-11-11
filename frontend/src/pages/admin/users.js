import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import adminService from '@/services/adminService';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import ErrorState from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { SearchIcon, UserIcon } from '@/components/common/Icons';

export default function AdminUsersPage() {
  const { ready } = useRequireAuth({ role: 'ADMIN' });
  const { user: currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(false);
    try {
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      if (!isBackground) {
        setError(true);
        showToast(err.message || 'Impossible de charger les utilisateurs', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Premier chargement
    if (ready) queueMicrotask(() => fetchUsers());
  }, [ready, fetchUsers]);

  // Auto-rafraîchissement au focus et au changement de visibilité
  useEffect(() => {
    if (!ready) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchUsers(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [ready, fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      showToast(`Rôle mis à jour vers ${newRole}`, 'success');
      await fetchUsers(true);
      if (currentUser?.id === userId) {
        await refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Impossible de modifier le rôle', 'error');
    }
  };

  const handleToggleBlock = async (userId, currentBlockedState) => {
    const newState = !currentBlockedState;
    try {
      await adminService.toggleUserBlock(userId, newState);
      showToast(`Utilisateur ${newState ? 'bloqué' : 'débloqué'}`, 'info');
      await fetchUsers(true);
      if (currentUser?.id === userId) {
        await refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors du changement de statut', 'error');
    }
  };

  if (!ready) return null;

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    return (
      (u.fullName || u.full_name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Head>
        <title>Gestion des Utilisateurs - Admin</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="admin" />

        <div className="flex-1 space-y-6">
          <div className="page-header">
            <span className="eyebrow text-indigo-400">Membres</span>
            <h1 className="page-title mt-1">
              Gestion des Utilisateurs & Rôles
            </h1>
            <p className="page-subtitle">
              Consultez la liste des membres, attribuez des permissions et gérez les accès.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou par email..."
              aria-label="Rechercher par nom ou par email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input pl-11"
            />
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <ErrorState title="Impossible de charger les utilisateurs" onRetry={fetchUsers} />
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state space-y-4">
              <h3 className="text-xl font-bold text-white">Aucun utilisateur trouvé</h3>
            </div>
          ) : (
            <>
              {/* Vue Mobile (Android & iPhone) : Cartes tactiles avec actions claires */}
              <div className="block md:hidden space-y-4">
                {filteredUsers.map((u) => {
                  const isBlocked = Boolean(u.is_blocked ?? u.isBlocked);
                  return (
                    <div
                      key={u.id}
                      className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {u.fullName || u.full_name || 'Utilisateur'}
                            </div>
                            <div className="text-xs font-mono text-zinc-400">{u.email}</div>
                          </div>
                        </div>
                        <Badge status={u.role || 'USER'} />
                      </div>

                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-zinc-500 uppercase tracking-wider font-semibold block text-[10px] mb-1.5">
                            Modifier le rôle
                          </label>
                          <select
                            value={u.role || 'USER'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800/90 border border-zinc-700 text-xs font-bold text-white focus:outline-none min-h-[44px]"
                          >
                            <option value="USER">Membre (USER)</option>
                            <option value="ORGANIZER">Organisateur (ORGANIZER)</option>
                            <option value="ADMIN">Administrateur (ADMIN)</option>
                          </select>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                          <span className="text-xs text-zinc-400">
                            Statut compte : <span className={isBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{isBlocked ? 'Bloqué' : 'Actif'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(u.id, isBlocked)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                              isBlocked
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {isBlocked ? 'Débloquer le compte' : 'Bloquer le compte'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vue Desktop : Table classique */}
              <div className="hidden md:block table-shell">
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Rôle Actuel</th>
                        <th>Modifier le Rôle</th>
                        <th className="text-right">Statut / Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isBlocked = Boolean(u.is_blocked ?? u.isBlocked);
                        return (
                          <tr key={u.id}>
                            <td className="font-bold text-white flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                              {u.fullName || u.full_name || 'Utilisateur'}
                            </td>
                            <td className="text-xs font-mono text-zinc-500">{u.email}</td>
                            <td>
                              <Badge status={u.role || 'USER'} />
                            </td>
                            <td>
                              <select
                                value={u.role || 'USER'}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-bold text-white focus:outline-none"
                              >
                                <option value="USER">Membre (USER)</option>
                                <option value="ORGANIZER">Organisateur (ORGANIZER)</option>
                                <option value="ADMIN">Administrateur (ADMIN)</option>
                              </select>
                            </td>
                            <td className="text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleBlock(u.id, isBlocked)}
                                className={isBlocked ? 'pill pill-emerald' : 'pill pill-rose'}
                              >
                                {isBlocked ? 'Débloquer' : 'Bloquer'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
