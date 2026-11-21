import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';
import { UserIcon, TicketIcon, BuildingIcon, ShieldIcon, LogOutIcon } from '../common/Icons';

export default function UserDropdown() {
  const { user, userRole, logout, isAdmin, isOrganizer } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  const initials = (user.full_name || user.fullName || user.email || 'U')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu profil utilisateur"
        className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/10 active:scale-95 touch-manipulation transition-all border border-transparent hover:border-white/10 focus:outline-none"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center shadow-md">
          {initials}
        </div>
        <span className="hidden md:inline text-sm font-semibold text-slate-200 max-w-[120px] truncate">
          {user.full_name || user.fullName || user.email?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-[#11141e] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-bold text-white truncate">
              {user.full_name || user.fullName || 'Utilisateur'}
            </p>
            <p className="text-xs text-slate-400 truncate mb-2">{user.email}</p>
            <Badge status={userRole} />
          </div>

          {/* Navigation Links */}
          <div className="py-2 space-y-0.5">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <TicketIcon className="w-4 h-4 text-cyan-400" />
              Mes Réservations & Tickets
            </Link>

            {isOrganizer && (
              <Link
                href="/organizer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <BuildingIcon className="w-4 h-4 text-purple-400" />
                Espace Organisateur
              </Link>
            )}

            {!isOrganizer && (
              <Link
                href="/dashboard/become-organizer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-cyan-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors font-medium"
              >
                <BuildingIcon className="w-4 h-4" />
                Devenir Organisateur
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors font-medium"
              >
                <ShieldIcon className="w-4 h-4 text-amber-400" />
                Administration
              </Link>
            )}

            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              Mon Profil
            </Link>
          </div>

          {/* Logout */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors text-left font-medium"
            >
              <LogOutIcon className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
