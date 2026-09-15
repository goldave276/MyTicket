import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from './UserDropdown';
import { TicketIcon, SearchIcon, PlusIcon, ShieldIcon, BuildingIcon } from '../common/Icons';

export default function Navbar() {
  const { user, isOrganizer, isAdmin, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              MyTicket
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 -mt-1">
              Événements & Billetterie
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
              router.pathname === '/' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Découvrir
          </Link>

          {isOrganizer && (
            <Link
              href="/organizer/events/create"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Créer un événement
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin/events-pending"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-semibold transition-colors"
            >
              <ShieldIcon className="w-4 h-4" />
              Modération
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : user ? (
            <UserDropdown />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
              >
                S’inscrire
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="sr-only">Open Menu</span>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200"
          >
            Découvrir les Événements
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Mes Réservations & Tickets
            </Link>
          )}
          {isOrganizer && (
            <Link
              href="/organizer"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-indigo-600 dark:text-indigo-400"
            >
              Espace Organisateur
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-purple-600 dark:text-purple-400"
            >
              Espace Administration
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
