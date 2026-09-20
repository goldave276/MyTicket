import Head from 'next/head';
import Link from 'next/link';

const COOKIES = [
  {
    name: 'sb-access-token / sb-refresh-token',
    purpose: 'Maintenir votre session connectée (authentification Supabase).',
    duration: 'Session / jusqu’à déconnexion',
    type: 'Essentiel',
  },
  {
    name: 'mt_toast_dismissed',
    purpose: 'Se souvenir des notifications déjà vues pour ne pas les réafficher.',
    duration: '7 jours',
    type: 'Fonctionnel',
  },
  {
    name: 'Cookies du prestataire de paiement',
    purpose: 'Sécuriser la transaction pendant le paiement d’un billet (anti-fraude 3-D Secure).',
    duration: 'Durée du paiement',
    type: 'Tiers — paiement',
  },
];

function Section({ index, title, children }) {
  return (
    <section className="space-y-3">
      <span className="eyebrow text-indigo-400">{index}</span>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="text-sm text-zinc-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <>
      <Head>
        <title>Politique de cookies - MyTicket</title>
        <meta name="description" content="Quels cookies MyTicket utilise et pourquoi." />
      </Head>

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="page-header">
          <span className="eyebrow text-indigo-400">Sécurité & Support</span>
          <h1 className="page-title mt-1">Politique de cookies</h1>
          <p className="page-subtitle">Dernière mise à jour : 20 septembre 2026</p>
        </div>

        <div className="space-y-10">
          <Section index="01" title="Qu’est-ce qu’un cookie ?">
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite d’un site
              web. Il permet notamment de vous reconnaître d’une page à l’autre, ou d’une visite à l’autre.
            </p>
          </Section>

          <Section index="02" title="Pourquoi nous en utilisons">
            <p>
              MyTicket utilise volontairement peu de cookies. Nous n’avons, à ce jour, aucun cookie publicitaire
              ni traceur analytique tiers (type Google Analytics). Les cookies posés servent uniquement à faire
              fonctionner le service et à sécuriser vos transactions.
            </p>
          </Section>

          <Section index="03" title="Les cookies que nous utilisons">
            <div className="table-shell">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Finalité</th>
                      <th>Durée</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIES.map((c) => (
                      <tr key={c.name}>
                        <td className="font-mono text-xs text-indigo-400">{c.name}</td>
                        <td className="text-zinc-300">{c.purpose}</td>
                        <td className="text-zinc-500 text-xs">{c.duration}</td>
                        <td className="text-zinc-300 text-xs">{c.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p>
              Les cookies « Essentiel » et « Fonctionnel » ne nécessitent pas votre consentement préalable :
              sans eux, vous ne pourriez pas rester connecté ni utiliser le service normalement. Le cookie posé
              par notre prestataire de paiement n’intervient que pendant le processus de paiement.
            </p>
          </Section>

          <Section index="04" title="Comment gérer vos cookies">
            <p>
              Vous pouvez à tout moment configurer votre navigateur pour bloquer ou supprimer les cookies.
              Sachez toutefois que désactiver les cookies essentiels vous empêchera de rester connecté à votre
              compte MyTicket. La procédure dépend de votre navigateur (Chrome, Firefox, Safari, Edge) —
              consultez son menu « Confidentialité » ou « Paramètres des sites ».
            </p>
          </Section>

          <Section index="05" title="Mise à jour de cette politique">
            <p>
              Si nous introduisons de nouveaux cookies (par exemple des outils de mesure d’audience), cette
              page sera mise à jour et, si la loi l’exige, un bandeau de consentement vous sera présenté avant
              tout dépôt de cookie non essentiel.
            </p>
          </Section>

          <p className="text-sm text-zinc-400">
            Voir aussi notre{' '}
            <Link href="/politique-de-confidentialite" className="text-indigo-400 hover:underline">
              politique de confidentialité
            </Link>.
          </p>
        </div>
      </div>
    </>
  );
}
