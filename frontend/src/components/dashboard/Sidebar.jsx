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
    <aside className="w-full md:w-64 shrink-0 panel p-4 h-fit">
      <div className="px-3 py-2 border-b border-zinc-800 mb-3">
        <span className="eyebrow text-zinc-500">
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
              className={`eyebrow flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                isActive
                  ? 'bg-indigo-400 text-zinc-950'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-zinc-950' : 'text-zinc-500'}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
