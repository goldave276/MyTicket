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
            <div className="table-shell">
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
                    {filteredUsers.map((u) => (
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
                            onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                            className={u.isBlocked ? 'pill pill-emerald' : 'pill pill-rose'}
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
