import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
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
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError(true);
      showToast(err.message || 'Impossible de charger les utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Deferred to a microtask so this effect doesn't call setState synchronously.
    if (ready) queueMicrotask(() => fetchUsers());
  }, [ready, fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      showToast(`Rôle mis à jour vers ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Impossible de modifier le rôle', 'error');
    }
  };

  const handleToggleBlock = async (userId, currentBlockedState) => {
    const newState = !currentBlockedState;
    try {
      await adminService.toggleUserBlock(userId, newState);
      showToast(`Utilisateur ${newState ? 'bloqué' : 'débloqué'}`, 'info');
      fetchUsers();
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
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Gestion des Utilisateurs & Rôles
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Consultez la liste des membres, attribuez des permissions et gérez les accès.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou par email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : error ? (
            <ErrorState title="Impossible de charger les utilisateurs" onRetry={fetchUsers} />
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Aucun utilisateur trouvé</h3>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase font-semibold text-zinc-500">
                    <tr>
                      <th className="p-4">Utilisateur</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Rôle Actuel</th>
                      <th className="p-4">Modifier le Rôle</th>
                      <th className="p-4 text-right">Statut / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                          {u.fullName || u.full_name || 'Utilisateur'}
                        </td>
                        <td className="p-4 text-xs font-mono text-zinc-500">{u.email}</td>
                        <td className="p-4">
                          <Badge status={u.role || 'USER'} />
                        </td>
                        <td className="p-4">
                          <select
                            value={u.role || 'USER'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none"
                          >
                            <option value="USER">Membre (USER)</option>
                            <option value="ORGANIZER">Organisateur (ORGANIZER)</option>
                            <option value="ADMIN">Administrateur (ADMIN)</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              u.isBlocked
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                            }`}
                          >
                            {u.isBlocked ? 'Débloquer' : 'Bloquer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
