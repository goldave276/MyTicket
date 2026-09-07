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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = (user.full_name || user.fullName || user.email || 'U')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
          {initials}
        </div>
        <span className="hidden md:inline text-sm font-semibold text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
          {user.full_name || user.fullName || user.email?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {user.full_name || user.fullName || 'Utilisateur'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mb-2">{user.email}</p>
            <Badge status={userRole} />
          </div>

          {/* Navigation Links */}
          <div className="py-2 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <TicketIcon className="w-4 h-4 text-indigo-500" />
              Mes Réservations & Tickets
            </Link>

            {isOrganizer && (
              <Link
                href="/organizer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <BuildingIcon className="w-4 h-4 text-purple-500" />
                Espace Organisateur
              </Link>
            )}

            {!isOrganizer && (
              <Link
                href="/dashboard/become-organizer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors font-medium"
              >
                <BuildingIcon className="w-4 h-4" />
                Devenir Organisateur
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors font-medium"
              >
                <ShieldIcon className="w-4 h-4" />
                Administration
              </Link>
            )}

            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-zinc-400" />
              Mon Profil
            </Link>
          </div>

          {/* Logout */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
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
