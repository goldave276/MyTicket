import Head from 'next/head';
import Link from 'next/link';

const SECTIONS = [
  { id: 'objet', label: 'Objet' },
  { id: 'definitions', label: 'Définitions' },
  { id: 'compte', label: 'Création de compte & rôles' },
  { id: 'organisateur', label: 'Devenir organisateur' },
  { id: 'moderation', label: 'Publication & modération' },
  { id: 'reservation', label: 'Réservation de billets' },
  { id: 'prix-paiement', label: 'Prix & paiement' },
  { id: 'annulation', label: 'Annulation & remboursement' },
  { id: 'billet', label: 'Billet électronique & QR Pass' },
  { id: 'obligations', label: 'Vos obligations' },
  { id: 'responsabilite', label: 'Responsabilités' },
  { id: 'propriete', label: 'Propriété intellectuelle' },
  { id: 'suspension', label: 'Suspension & résiliation' },
  { id: 'droit', label: 'Droit applicable & litiges' },
  { id: 'modifications', label: 'Modification des présentes conditions' },
  { id: 'contact', label: 'Contact' },
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

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Conditions Générales - MyTicket</title>
        <meta name="description" content="Conditions générales d’utilisation et de vente de la plateforme MyTicket." />
      </Head>

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="page-header">
          <span className="eyebrow text-indigo-400">Sécurité & Support</span>
          <h1 className="page-title mt-1">Conditions Générales d’Utilisation et de Vente</h1>
          <p className="page-subtitle">Dernière mise à jour : 20 septembre 2026</p>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          Les présentes Conditions Générales d’Utilisation et de Vente (« CGU/CGV ») régissent l’accès et
          l’usage de MyTicket, plateforme de découverte, de création et de réservation d’événements. En créant
          un compte ou en réservant un billet, vous acceptez ces conditions.
        </p>

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
          <Section id="objet" index="01" title="Objet">
            <p>
              MyTicket met en relation des organisateurs d’événements (concerts, conférences, festivals,
              spectacles, compétitions sportives, ateliers...) et des utilisateurs souhaitant réserver des places.
              MyTicket agit comme intermédiaire technique : la plateforme n’organise pas elle-même les
              événements listés.
            </p>
          </Section>

          <Section id="definitions" index="02" title="Définitions">
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li><strong className="text-white">Utilisateur / Membre :</strong> toute personne inscrite pouvant réserver des billets.</li>
              <li><strong className="text-white">Organisateur :</strong> membre accrédité par l’administration, autorisé à publier des événements.</li>
              <li><strong className="text-white">Administrateur :</strong> personne chargée de valider les organisateurs et de modérer les événements.</li>
              <li><strong className="text-white">Événement :</strong> manifestation publiée sur MyTicket, avec une date, un lieu, un prix et un nombre de places défini.</li>
              <li><strong className="text-white">Billet / Ticket :</strong> preuve de réservation associée à un QR code, permettant l’accès à l’événement.</li>
            </ul>
          </Section>

          <Section id="compte" index="03" title="Création de compte & rôles">
            <p>
              L’inscription est gratuite et nécessite une adresse email valide. Chaque compte possède un rôle :
              Membre par défaut, Organisateur après validation d’une demande d’accréditation, ou Administrateur.
              Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée
              depuis votre compte.
            </p>
          </Section>

          <Section id="organisateur" index="04" title="Devenir organisateur">
            <p>
              Tout membre peut soumettre une demande d’accréditation Organisateur, accompagnée d’un document
              justificatif et d’une description de son activité. L’administration examine chaque demande et
              peut l’approuver ou la refuser, avec un motif communiqué au demandeur. MyTicket se réserve le
              droit de retirer le statut Organisateur en cas de non-respect des présentes conditions.
            </p>
          </Section>

          <Section id="moderation" index="05" title="Publication & modération des événements">
            <p>
              Un événement créé par un organisateur est d’abord enregistré en brouillon, puis soumis à
              l’administration pour validation avant d’être visible publiquement et ouvert à la réservation.
              L’administration peut refuser un événement non conforme (contenu illicite, informations
              trompeuses ou incomplètes) en indiquant le motif du refus.
            </p>
          </Section>

          <Section id="reservation" index="06" title="Réservation de billets">
            <p>
              La réservation d’un billet est confirmée dès validation du paiement (ou immédiatement pour un
              événement gratuit). Le nombre de places disponibles est mis à jour en temps réel ; une fois le
              quota atteint, l’événement passe en statut complet. Il est de votre responsabilité de vérifier
              les informations de l’événement (date, lieu, quantité) avant de finaliser votre réservation.
            </p>
          </Section>

          <Section id="prix-paiement" index="07" title="Prix & paiement">
            <p>
              Les prix des billets sont fixés par l’organisateur et affichés en FCFA, toutes taxes comprises
              sauf mention contraire. Le paiement est traité par un prestataire tiers sécurisé (carte bancaire
              ou mobile money selon les moyens disponibles) ; MyTicket ne stocke jamais vos coordonnées
              bancaires complètes.
            </p>
          </Section>

          <Section id="annulation" index="08" title="Annulation & remboursement">
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Si un organisateur annule un événement, les billets déjà réservés sont remboursés intégralement.</li>
              <li>Une demande d’annulation à l’initiative de l’utilisateur est traitée au cas par cas via notre <Link href="/contact" className="text-indigo-400 hover:underline">Centre d’aide</Link>, en fonction de la politique de l’organisateur concerné.</li>
              <li>Aucun remboursement n’est dû en cas de simple absence de l’utilisateur le jour de l’événement.</li>
            </ul>
          </Section>

          <Section id="billet" index="09" title="Billet électronique & QR Pass">
            <p>
              Chaque réservation confirmée génère un billet électronique associé à un QR Pass unique, présenté
              à l’entrée de l’événement. Ce billet est personnel et ne doit pas être revendu ou dupliqué à des
              fins frauduleuses ; l’organisateur reste libre de refuser l’accès en cas de QR code invalide ou
              déjà scanné.
            </p>
          </Section>

          <Section id="obligations" index="10" title="Vos obligations">
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Fournir des informations exactes lors de votre inscription et de vos réservations ;</li>
              <li>Ne pas utiliser la plateforme à des fins frauduleuses, illégales ou portant atteinte aux droits d’autrui ;</li>
              <li>Ne pas tenter de contourner les mesures de sécurité ou de perturber le fonctionnement du service.</li>
            </ul>
          </Section>

          <Section id="responsabilite" index="11" title="Responsabilités">
            <p>
              MyTicket agit en tant qu’intermédiaire technique entre organisateurs et utilisateurs. L’organisateur
              est seul responsable du bon déroulement, du contenu et de la conformité légale de son événement.
              MyTicket met tout en œuvre pour assurer la disponibilité et la sécurité du service, sans garantir
              une disponibilité ininterrompue, et ne saurait être tenu responsable d’un dommage indirect résultant
              de l’usage de la plateforme.
            </p>
          </Section>

          <Section id="propriete" index="12" title="Propriété intellectuelle">
            <p>
              La marque MyTicket, son interface et son contenu éditorial sont protégés par le droit de la
              propriété intellectuelle. Les visuels et descriptions des événements restent la propriété de
              leurs organisateurs respectifs, qui garantissent disposer des droits nécessaires à leur diffusion.
            </p>
          </Section>

          <Section id="suspension" index="13" title="Suspension & résiliation">
            <p>
              MyTicket peut suspendre ou résilier un compte en cas de violation des présentes conditions, sans
              préjudice d’éventuelles poursuites. Vous pouvez à tout moment demander la clôture de votre compte
              depuis votre espace profil ou via notre Centre d’aide.
            </p>
          </Section>

          <Section id="droit" index="14" title="Droit applicable & règlement des litiges">
            <p>
              Les présentes conditions sont soumises au droit applicable au lieu d’établissement de MyTicket.
              En cas de litige, une solution amiable sera recherchée en priorité via notre Centre d’aide avant
              toute action contentieuse.
            </p>
          </Section>

          <Section id="modifications" index="15" title="Modification des présentes conditions">
            <p>
              MyTicket peut modifier ces conditions pour refléter une évolution du service, technique ou
              réglementaire. La date de dernière mise à jour en haut de cette page fait foi ; les changements
              substantiels vous seront notifiés.
            </p>
          </Section>

          <Section id="contact" index="16" title="Contact">
            <p>
              Une question sur ces conditions ? Rendez-vous sur notre{' '}
              <Link href="/contact" className="text-indigo-400 hover:underline">page Contact</Link>.
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
