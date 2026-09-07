import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Badge from '@/components/common/Badge';
import { UserIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function ProfilePage() {
  const { user, userRole, updateProfile, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard/profile');
      return;
    }
    if (user) {
      setFullName(user.full_name || user.fullName || '');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      await updateProfile({ fullName });
      showToast('Votre profil a été mis à jour avec succès', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <>
      <Head>
        <title>Mon Profil - MyTicket</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8">
        <Sidebar mode="user" />

        <div className="flex-1 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Paramètres du Profil
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Gérez vos informations personnelles et vérifiez les privilèges de votre compte.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
            {/* Header info */}
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {(fullName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {fullName || 'Utilisateur'}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">{user.email}</p>
                <div className="pt-1">
                  <Badge status={userRole} />
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Adresse Email (non modifiable)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-400 font-medium text-sm cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50"
              >
                {updating ? 'Mise à jour...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
