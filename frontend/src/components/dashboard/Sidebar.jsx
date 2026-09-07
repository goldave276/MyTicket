import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { TicketIcon, QrCodeIcon, BuildingIcon, UserIcon, ShieldIcon, BarChartIcon, PlusIcon } from '../common/Icons';

export default function Sidebar({ mode = 'user' }) {
  const router = useRouter();
  const { userRole, isOrganizer, isAdmin } = useAuth();

  const userLinks = [
    { href: '/dashboard', label: 'Mes Réservations', icon: TicketIcon },
    { href: '/dashboard/tickets', label: 'Mes Pass & QR Codes', icon: QrCodeIcon },
    { href: '/dashboard/become-organizer', label: 'Devenir Organisateur', icon: BuildingIcon },
    { href: '/dashboard/profile', label: 'Mon Profil', icon: UserIcon },
  ];

  const organizerLinks = [
    { href: '/organizer', label: 'Vue d\'ensemble', icon: BarChartIcon },
    { href: '/organizer/events', label: 'Mes Événements', icon: TicketIcon },
    { href: '/organizer/events/create', label: 'Nouveau Brouillon', icon: PlusIcon },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Statistiques Globales', icon: BarChartIcon },
    { href: '/admin/organizer-requests', label: 'Demandes Organisateur', icon: BuildingIcon },
    { href: '/admin/events-pending', label: 'Événements à approuver', icon: TicketIcon },
    { href: '/admin/users', label: 'Utilisateurs & Rôles', icon: ShieldIcon },
  ];

  const links = mode === 'organizer' ? organizerLinks : mode === 'admin' ? adminLinks : userLinks;

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm h-fit">
      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {mode === 'organizer' ? 'Espace Organisateur' : mode === 'admin' ? 'Administration' : 'Mon Compte'}
        </span>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = router.pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
