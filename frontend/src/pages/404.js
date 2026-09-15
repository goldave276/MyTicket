import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { TicketIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page introuvable - MyTicket</title>
      </Head>

      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TicketIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-6xl font-bold tracking-tight text-zinc-200 dark:text-zinc-800">404</span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Cette page n’existe pas
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Le lien est peut-être incorrect, ou l’événement que vous cherchiez n’est plus disponible.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
          >
            Retour au catalogue
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
