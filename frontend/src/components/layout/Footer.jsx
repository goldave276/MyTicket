import React from 'react';
import Link from 'next/link';
import { TicketIcon } from '../common/Icons';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#08090e] pt-12 pb-10 safe-pb transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                <TicketIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                MyTicket
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              La plateforme de billetterie et réservation événementielle conçue pour une expérience mobile fluide et sécurisée.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Plateforme
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Tous les événements
                </Link>
              </li>
              <li>
                <Link href="/dashboard/become-organizer" className="hover:text-cyan-400 transition-colors">
                  Organiser un événement
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tickets" className="hover:text-cyan-400 transition-colors">
                  Mes billets électroniques
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Catégories
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Concerts & Festivals</li>
              <li>Conférences & Tech</li>
              <li>Théâtre & Spectacles</li>
              <li>Sport & Esport</li>
            </ul>
          </div>

          {/* Legal / Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Sécurité & Support
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/politique-de-confidentialite" className="hover:text-cyan-400 transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/conditions-generales" className="hover:text-cyan-400 transition-colors">
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-cyan-400 transition-colors">
                  Politique de cookies
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} MyTicket. Tous droits réservés.</p>
          <p>Plateforme de réservation événementielle sécurisée.</p>
        </div>
      </div>
    </footer>
  );
}
