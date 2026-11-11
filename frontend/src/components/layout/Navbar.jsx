import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from './UserDropdown';
import { TicketIcon, PlusIcon, ShieldIcon, BuildingIcon } from '../common/Icons';

export default function Navbar() {
  const { user, isOrganizer, isAdmin, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Empêcher le défilement de l'arrière-plan quand le tiroir mobile est ouvert
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Fermer le menu automatiquement lors d'une navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#08090e]/90 border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-none">
              MyTicket
            </span>
            <span className="text-[10px] tracking-wide font-medium text-cyan-400 block leading-tight mt-0.5">
              Événements & Billetterie
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors hover:text-cyan-400 ${
              router.pathname === '/' ? 'text-cyan-400' : 'text-slate-300'
            }`}
          >
            Découvrir
          </Link>

          {isOrganizer && (
            <Link
              href="/organizer/events/create"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition-all"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Créer un événement
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin/events-pending"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold transition-all"
            >
              <ShieldIcon className="w-3.5 h-3.5" />
              Modération
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
          ) : user ? (
            <UserDropdown />
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                className="btn-primary text-xs"
              >
                S’inscrire
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-11 h-11 rounded-xl text-slate-200 hover:bg-slate-800/80 active:scale-95 touch-manipulation flex items-center justify-center border border-white/10 focus:outline-none"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="text-xl leading-none font-bold">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Plein Écran */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-[#08090e]/98 backdrop-blur-2xl flex flex-col justify-between px-6 py-6 overflow-y-auto animate-in fade-in duration-200 safe-pb">
          <div className="space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3.5 rounded-xl text-base font-semibold text-slate-100 hover:bg-slate-900 active:bg-slate-800 min-h-[48px]"
            >
              <TicketIcon className="w-5 h-5 text-cyan-400" />
              Découvrir les Événements
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-xl text-base font-semibold text-slate-100 hover:bg-slate-900 active:bg-slate-800 min-h-[48px]"
                >
                  <TicketIcon className="w-5 h-5 text-cyan-400" />
                  Mes Réservations & Tickets
                </Link>

                {!isOrganizer && (
                  <Link
                    href="/dashboard/become-organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-base font-semibold text-cyan-400 hover:bg-slate-900 active:bg-slate-800 min-h-[48px]"
                  >
                    <BuildingIcon className="w-5 h-5 text-cyan-400" />
                    Devenir Organisateur
                  </Link>
                )}

                {isOrganizer && (
                  <Link
                    href="/organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-base font-semibold text-purple-400 hover:bg-slate-900 active:bg-slate-800 min-h-[48px]"
                  >
                    <BuildingIcon className="w-5 h-5 text-purple-400" />
                    Espace Organisateur
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-base font-semibold text-amber-400 hover:bg-slate-900 active:bg-slate-800 min-h-[48px]"
                  >
                    <ShieldIcon className="w-5 h-5 text-amber-400" />
                    Espace Administration
                  </Link>
                )}
              </>
            ) : (
              <div className="pt-4 space-y-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center p-3.5 rounded-xl border border-white/10 text-slate-200 font-semibold min-h-[48px]"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full min-h-[48px]"
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl text-base font-semibold text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 min-h-[48px]"
              >
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
