import React from 'react';
import Link from 'next/link';
import { TicketIcon } from '../common/Icons';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <TicketIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                MyTicket
              </span>
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              La plateforme moderne pour réserver, créer et gérer vos tickets d'événements en toute sécurité.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Plateforme
            </h4>
            <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Tous les événements
                </Link>
              </li>
              <li>
                <Link href="/dashboard/become-organizer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Organiser un événement
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tickets" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Mes billets électroniques
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Catégories
            </h4>
            <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Concerts & Festivals</li>
              <li>Conférences & Tech</li>
              <li>Théâtre & Spectacles</li>
              <li>Sport & Esport</li>
            </ul>
          </div>

          {/* Legal / Security */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Sécurité & Support
            </h4>
            <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Politique de confidentialité</li>
              <li>Conditions Générales de Vente</li>
              <li>Centre d'aide / Contact</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} MyTicket. Tous droits réservés.</p>
          <p className="mt-2 sm:mt-0">Plateforme de réservation événementielle sécurisée.</p>
        </div>
      </div>
    </footer>
  );
}
