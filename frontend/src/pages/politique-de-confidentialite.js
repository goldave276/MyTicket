import Head from 'next/head';
import Link from 'next/link';

const SECTIONS = [
  { id: 'champ-application', label: 'Champ d’application' },
  { id: 'donnees-collectees', label: 'Données collectées' },
  { id: 'finalites', label: 'Finalités du traitement' },
  { id: 'base-legale', label: 'Base légale' },
  { id: 'partage', label: 'Partage & sous-traitants' },
  { id: 'conservation', label: 'Durée de conservation' },
  { id: 'securite', label: 'Sécurité des données' },
  { id: 'droits', label: 'Vos droits' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'mineurs', label: 'Mineurs' },
  { id: 'modifications', label: 'Modifications' },
  { id: 'contact', label: 'Nous contacter' },
];

function Section({ id, index, title, children }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-28">
      <span className="eyebrow text-indigo-400">{index}</span>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="text-sm text-zinc-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité - MyTicket</title>
        <meta name="description" content="Comment MyTicket collecte, utilise et protège vos données personnelles." />
      </Head>

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="page-header">
          <span className="eyebrow text-indigo-400">Sécurité & Support</span>
          <h1 className="page-title mt-1">Politique de confidentialité</h1>
          <p className="page-subtitle">Dernière mise à jour : 20 septembre 2026</p>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          MyTicket (« nous », « notre plateforme ») permet à des organisateurs de publier des événements
          et à des utilisateurs de réserver des billets en ligne. Cette page explique quelles données nous
          collectons, pourquoi, combien de temps nous les gardons, et comment vous pouvez exercer vos droits.
        </p>

        {/* Table of contents */}
        <nav className="panel p-6">
          <span className="eyebrow text-zinc-500">Sommaire</span>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-indigo-400 hover:underline">
                  {String(i + 1).padStart(2, '0')}. {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          <Section id="champ-application" index="01" title="Champ d’application">
            <p>
              Cette politique s’applique à toute personne utilisant MyTicket : visiteurs, membres inscrits,
              organisateurs d’événements et administrateurs. Elle couvre le site web et l’API qui l’alimente.
            </p>
          </Section>

          <Section id="donnees-collectees" index="02" title="Données que nous collectons">
            <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li><strong className="text-white">Compte :</strong> nom complet, adresse email, mot de passe (stocké sous forme hachée, jamais en clair).</li>
              <li><strong className="text-white">Rôle :</strong> statut Membre, Organisateur ou Administrateur, et l’historique des changements de rôle.</li>
              <li><strong className="text-white">Réservations & billets :</strong> événements réservés, quantité de places, montant payé, statut de la réservation.</li>
              <li><strong className="text-white">Dossier organisateur :</strong> si vous demandez le statut d’organisateur, les documents justificatifs et la description que vous soumettez à l’administration.</li>
              <li><strong className="text-white">Paiement :</strong> nous ne stockons jamais vos coordonnées bancaires complètes — elles transitent directement vers notre prestataire de paiement.</li>
              <li><strong className="text-white">Données techniques :</strong> adresse IP, type de navigateur et journaux serveur, à des fins de sécurité et de lutte contre la fraude.</li>
            </ul>
          </Section>

          <Section id="finalites" index="03" title="Finalités du traitement">
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Créer et gérer votre compte, et vous authentifier de façon sécurisée.</li>
              <li>Traiter vos réservations et générer vos billets électroniques (QR Pass).</li>
              <li>Examiner les demandes d’accréditation organisateur et modérer les événements soumis.</li>
              <li>Vous envoyer des communications liées au service (confirmation de réservation, changement de statut d’un événement, réinitialisation de mot de passe).</li>
              <li>Assurer la sécurité de la plateforme, détecter les fraudes et prévenir les abus.</li>
              <li>Respecter nos obligations légales et comptables.</li>
            </ul>
          </Section>

          <Section id="base-legale" index="04" title="Base légale">
            <p>Selon les cas, le traitement de vos données repose sur :</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>L’exécution du contrat qui nous lie à vous (créer votre compte, honorer une réservation) ;</li>
              <li>Votre consentement (par exemple pour certaines communications facultatives) ;</li>
              <li>Notre intérêt légitime (sécurité, prévention de la fraude, amélioration du service) ;</li>
              <li>Une obligation légale (facturation, conservation de certains documents).</li>
            </ul>
          </Section>

          <Section id="partage" index="05" title="Partage des données & sous-traitants">
            <p>Nous ne vendons aucune donnée personnelle. Elle peut être partagée uniquement dans les cas suivants :</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li><strong className="text-white">Supabase</strong> — notre hébergeur de base de données, d’authentification et de stockage de documents, agissant comme sous-traitant technique.</li>
              <li><strong className="text-white">Prestataire de paiement</strong> (carte bancaire, mobile money) — pour traiter vos transactions en toute sécurité.</li>
              <li><strong className="text-white">L’organisateur d’un événement</strong> — qui peut voir le nom, l’email et le nombre de places des personnes ayant réservé son événement, pour la gestion de l’accès le jour J.</li>
              <li><strong className="text-white">Autorités compétentes</strong> — si la loi nous y oblige.</li>
            </ul>
          </Section>

          <Section id="conservation" index="06" title="Durée de conservation">
            <p>
              Vos données de compte sont conservées tant que votre compte est actif. Les données de réservation
              et de facturation sont conservées pendant la durée nécessaire au respect de nos obligations
              comptables et légales. Vous pouvez demander la suppression de votre compte à tout moment
              (voir « Vos droits » ci-dessous) ; certaines données peuvent être conservées plus longtemps
              lorsque la loi l’exige.
            </p>
          </Section>

          <Section id="securite" index="07" title="Sécurité des données">
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Mots de passe hachés, jamais stockés en clair.</li>
              <li>Accès aux données restreint par rôle (Membre / Organisateur / Administrateur) au niveau de la base de données.</li>
              <li>Communications chiffrées entre votre navigateur et nos serveurs (HTTPS).</li>
              <li>Journalisation et limitation du débit des requêtes pour limiter les abus.</li>
            </ul>
          </Section>

          <Section id="droits" index="08" title="Vos droits">
            <p>Vous disposez, sur vos données personnelles, des droits suivants :</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Accéder aux données que nous détenons sur vous ;</li>
              <li>Les faire rectifier si elles sont inexactes ;</li>
              <li>Demander leur suppression, sous réserve de nos obligations légales ;</li>
              <li>Vous opposer à certains traitements ou en demander la limitation ;</li>
              <li>Demander la portabilité de vos données dans un format réutilisable.</li>
            </ul>
            <p>
              Pour exercer l’un de ces droits, écrivez-nous depuis notre{' '}
              <Link href="/contact" className="text-indigo-400 hover:underline">page Contact</Link>.
            </p>
          </Section>

          <Section id="cookies" index="09" title="Cookies">
            <p>
              MyTicket utilise un nombre volontairement limité de cookies, principalement pour maintenir votre
              session connectée. Le détail complet figure dans notre{' '}
              <Link href="/cookies" className="text-indigo-400 hover:underline">politique de cookies</Link>.
            </p>
          </Section>

          <Section id="mineurs" index="10" title="Mineurs">
            <p>
              MyTicket n’est pas destiné aux personnes de moins de 16 ans. Si vous pensez qu’un mineur nous a
              transmis des données personnelles sans le consentement d’un représentant légal, contactez-nous
              afin que nous puissions les supprimer.
            </p>
          </Section>

          <Section id="modifications" index="11" title="Modifications de cette politique">
            <p>
              Nous pouvons mettre à jour cette politique pour refléter une évolution du service ou de la
              réglementation. La date de dernière mise à jour, en haut de cette page, est toujours tenue à jour.
              En cas de changement important, nous vous en informerons directement.
            </p>
          </Section>

          <Section id="contact" index="12" title="Nous contacter">
            <p>
              Pour toute question relative à cette politique ou à vos données personnelles, rendez-vous sur notre{' '}
              <Link href="/contact" className="text-indigo-400 hover:underline">Centre d’aide / Contact</Link>.
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
