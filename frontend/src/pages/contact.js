import Head from 'next/head';
import { TicketIcon, ShieldIcon, BuildingIcon } from '@/components/common/Icons';

const FAQ_GROUPS = [
  {
    title: 'Compte & connexion',
    icon: ShieldIcon,
    items: [
      {
        q: 'J’ai oublié mon mot de passe, comment le réinitialiser ?',
        a: 'Depuis la page de connexion, cliquez sur « Mot de passe oublié ? » et suivez les instructions envoyées par email.',
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Écrivez-nous via le formulaire ci-dessous en précisant l’adresse email de votre compte : nous traitons chaque demande de suppression manuellement sous quelques jours.',
      },
    ],
  },
  {
    title: 'Réservation & billets',
    icon: TicketIcon,
    items: [
      {
        q: 'Où retrouver mon billet et mon QR Pass ?',
        a: 'Dans votre espace « Mes billets & QR Codes », accessible depuis votre tableau de bord une fois connecté.',
      },
      {
        q: 'Puis-je me faire rembourser une réservation ?',
        a: 'Si l’organisateur annule l’événement, vous êtes remboursé automatiquement. Pour toute autre demande, contactez-nous : chaque cas est traité individuellement selon la politique de l’organisateur.',
      },
      {
        q: 'L’événement affiche « Complet », que faire ?',
        a: 'Le nombre de places est limité et mis à jour en temps réel. Il n’est malheureusement pas possible de réserver au-delà de la capacité fixée par l’organisateur.',
      },
    ],
  },
  {
    title: 'Devenir organisateur',
    icon: BuildingIcon,
    items: [
      {
        q: 'Comment publier mon propre événement ?',
        a: 'Faites une demande d’accréditation Organisateur depuis « Devenir Organisateur » dans votre espace compte, avec un justificatif. Une fois validée par notre équipe, vous pourrez créer des événements.',
      },
      {
        q: 'Combien de temps prend la validation d’un événement ?',
        a: 'Nos équipes examinent chaque événement soumis avant sa mise en ligne publique, généralement sous 24 à 48h.',
      },
    ],
  },
];

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Centre d’aide & Contact - MyTicket</title>
        <meta name="description" content="Questions fréquentes et moyens de contacter l’équipe MyTicket." />
      </Head>

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="page-header">
          <span className="eyebrow text-indigo-400">Sécurité & Support</span>
          <h1 className="page-title mt-1">Centre d’aide & Contact</h1>
          <p className="page-subtitle">
            Une question ? Parcourez la FAQ ci-dessous, ou écrivez-nous directement.
          </p>
        </div>

        {/* Direct contact */}
        <div className="panel p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="eyebrow text-zinc-500">Nous écrire</span>
            <p className="text-white font-bold text-lg mt-1">support@myticket.app</p>
            <p className="text-sm text-zinc-400 mt-1">Réponse sous 24 à 48h ouvrées.</p>
          </div>
          <a href="mailto:support@myticket.app" className="btn-primary shrink-0">
            Envoyer un email
          </a>
        </div>

        {/* FAQ */}
        <div className="space-y-8">
          {FAQ_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <section key={group.title} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span className="eyebrow text-white">{group.title}</span>
                </div>
                <div className="panel divide-y divide-zinc-800 overflow-hidden">
                  {group.items.map((item) => (
                    <details key={item.q} className="group p-5">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-sm text-white">
                        {item.q}
                        <span className="text-zinc-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                      </summary>
                      <p className="text-sm text-zinc-400 leading-relaxed mt-3">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="panel p-6 sm:p-8 text-center space-y-3">
          <h3 className="text-lg font-bold text-white">Vous n’avez pas trouvé votre réponse ?</h3>
          <p className="text-sm text-zinc-400">Notre équipe vous répond directement par email.</p>
          <a href="mailto:support@myticket.app" className="btn-outline inline-flex">
            Contacter le support
          </a>
        </div>
      </div>
    </>
  );
}
