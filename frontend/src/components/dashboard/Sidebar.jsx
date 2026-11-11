import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import { TicketIcon, QrCodeIcon, BuildingIcon, UserIcon, ShieldIcon, BarChartIcon, PlusIcon, CurrencyIcon } from '../common/Icons';

export default function Sidebar({ mode = 'user' }) {
  const router = useRouter();
  const { userRole, isOrganizer, isAdmin } = useAuth();
  const [adminBadgeCounts, setAdminBadgeCounts] = useState({
    pendingRequests: 0,
    pendingEvents: 0,
  });

  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const data = await adminService.getGlobalStats();
        if (isMounted) {
          const s = data?.stats || data || {};
          setAdminBadgeCounts({
            pendingRequests: s.requests_pending ?? data?.pendingRequests ?? 0,
            pendingEvents: s.events_pending ?? data?.pendingEvents ?? 0,
          });
        }
      } catch {
        // Silencieux pour ne pas perturber l'expérience utilisateur
      }
    };

    fetchCounts();
    // Rafraîchir doucement les compteurs toutes les 30 secondes si l'onglet est actif
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchCounts();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAdmin]);

  const userLinks = [
    { href: '/dashboard', label: 'Mes Réservations', icon: TicketIcon },
    { href: '/dashboard/tickets', label: 'Mes Pass & QR Codes', icon: QrCodeIcon },
    ...(!isOrganizer ? [{ href: '/dashboard/become-organizer', label: 'Devenir Organisateur', icon: BuildingIcon }] : []),
    { href: '/dashboard/profile', label: 'Mon Profil', icon: UserIcon },
  ];

  const organizerLinks = [
    { href: '/organizer', label: 'Vue d\'ensemble', icon: BarChartIcon },
    { href: '/organizer/events', label: 'Mes Événements', icon: TicketIcon },
    { href: '/organizer/events/create', label: 'Nouveau Brouillon', icon: PlusIcon },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Statistiques Globales', icon: BarChartIcon },
    { href: '/admin/events', label: 'Tous les Événements', icon: TicketIcon },
    {
      href: '/admin/organizer-requests',
      label: 'Demandes Organisateur',
      icon: BuildingIcon,
      badge: adminBadgeCounts.pendingRequests,
      badgeColor: 'bg-indigo-500 text-zinc-950',
    },
    {
      href: '/admin/events-pending',
      label: 'Événements à approuver',
      icon: TicketIcon,
      badge: adminBadgeCounts.pendingEvents,
      badgeColor: 'bg-amber-400 text-zinc-950',
    },
    { href: '/admin/payments', label: 'Paiements sur Place', icon: CurrencyIcon },
    { href: '/admin/users', label: 'Utilisateurs & Rôles', icon: ShieldIcon },
  ];

  const links = mode === 'organizer' ? organizerLinks : mode === 'admin' ? adminLinks : userLinks;

  return (
    <>
      {/* Version Mobile (iPhone / Android) : Barre de navigation horizontale fluide et compacte */}
      <nav
        aria-label="Navigation secondaire mobile"
        className="md:hidden w-full overflow-x-auto no-scrollbar flex items-center gap-2 p-1.5 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 shrink-0 sticky top-20 z-30 shadow-md"
      >
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = router.pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`eyebrow flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs whitespace-nowrap transition-all touch-manipulation min-h-[40px] shrink-0 ${
                isActive
                  ? 'bg-indigo-400 text-zinc-950 font-bold shadow'
                  : 'text-zinc-300 hover:bg-zinc-800/80 bg-zinc-950/40'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
              <span>{link.label}</span>
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold leading-none ${
                    isActive ? 'bg-zinc-950 text-indigo-300' : link.badgeColor || 'bg-indigo-500 text-white'
                  }`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Version Desktop (Tablette & Ordinateur) : Sidebar latérale persistante */}
      <aside className="hidden md:block w-64 shrink-0 panel p-4 h-fit sticky top-24">
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
                className={`eyebrow flex items-center justify-between gap-3 px-4 py-3 rounded-md transition-all ${
                  isActive
                    ? 'bg-indigo-400 text-zinc-950'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-zinc-950' : 'text-zinc-500'}`} />
                  <span>{link.label}</span>
                </div>
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                      isActive ? 'bg-zinc-950 text-indigo-300' : link.badgeColor || 'bg-indigo-500 text-white'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {(isAdmin || isOrganizer) && (
          <div className="pt-4 mt-4 border-t border-zinc-800 space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Accès Rapides
            </span>
            {isAdmin && mode !== 'admin' && (
              <Link
                href="/admin"
                className="eyebrow flex items-center justify-between px-4 py-2.5 rounded-md text-amber-400 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Administration</span>
                </div>
                {adminBadgeCounts.pendingRequests > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-zinc-950">
                    {adminBadgeCounts.pendingRequests}
                  </span>
                )}
              </Link>
            )}
            {isOrganizer && mode !== 'organizer' && (
              <Link
                href="/organizer"
                className="eyebrow flex items-center gap-3 px-4 py-2.5 rounded-md text-purple-400 hover:bg-zinc-800 transition-colors"
              >
                <BuildingIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Espace Organisateur</span>
              </Link>
            )}
            {mode !== 'user' && (
              <Link
                href="/dashboard"
                className="eyebrow flex items-center gap-3 px-4 py-2.5 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                <TicketIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Espace Client</span>
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
