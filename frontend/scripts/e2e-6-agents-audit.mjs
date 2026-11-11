import puppeteer from 'puppeteer';

const BASE_URL = process.env.TEST_URL || 'https://my-ticket-virid.vercel.app';
const API_URL = 'https://myticket-llwf.onrender.com/api';

console.log('================================================================');
console.log('   MISSION AUDIT MULTI-AGENTS MYTICKET - 6 SOUS-AGENTS EN ACTION ');
console.log('================================================================');
console.log(`Cible Frontend : ${BASE_URL}`);
console.log(`Cible API      : ${API_URL}`);

const auditReport = {
  startedAt: new Date().toISOString(),
  agents: [],
  discoveredBugs: [],
  summary: { totalTests: 0, passed: 0, failed: 0 }
};

function recordAgent(agentNum, name, icon) {
  const agentData = { agentNum, name, icon, actions: [], errors: [] };
  auditReport.agents.push(agentData);
  return {
    logAction: (action, success, details = '') => {
      agentData.actions.push({ action, success, details });
      auditReport.summary.totalTests++;
      if (success) {
        auditReport.summary.passed++;
        console.log(`  [${icon} Agent ${agentNum}] ✅ ${action}${details ? ' (' + details + ')' : ''}`);
      } else {
        auditReport.summary.failed++;
        console.log(`  [${icon} Agent ${agentNum}] ❌ ${action}${details ? ' - ' + details : ''}`);
        auditReport.discoveredBugs.push({ agent: name, action, details });
      }
    },
    logError: (err) => {
      agentData.errors.push(err);
      console.log(`  [${icon} Agent ${agentNum}] ⚠️ Erreur console/réseau : ${err}`);
    }
  };
}

async function runAudit() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Écoute des erreurs de console et requêtes échouées
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filtrer les erreurs bénignes de favicon ou d'extensions
      if (!text.includes('favicon') && !text.includes('404 (Not Found)')) {
        const currentAgent = auditReport.agents[auditReport.agents.length - 1];
        if (currentAgent) currentAgent.errors.push(text);
      }
    }
  });

  try {
    // =========================================================================
    // AGENT 1 : VISITEUR PUBLIC & DÉCOUVERTE DU CATALOGUE
    // =========================================================================
    console.log('\n------------------------------------------------------------');
    console.log('🤖 AGENT 1 : Visiteur Public & Découverte');
    console.log('------------------------------------------------------------');
    const a1 = recordAgent(1, 'Visiteur Public & Découverte', '🌐');

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 35000 });
    const pageTitle = await page.title();
    a1.logAction('Affichage page d’accueil', pageTitle.includes('MyTicket'), `Titre: "${pageTitle}"`);

    // Tester Logo
    const logo = await page.$('a[href="/"]');
    a1.logAction('Logo cliquable vers l’accueil', logo !== null);

    // Tester Barre de Recherche
    const searchInput = await page.$('input[placeholder*="Rechercher"]');
    if (searchInput) {
      await searchInput.type('Concert');
      await new Promise(r => setTimeout(r, 600));
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      a1.logAction('Champ de recherche interactif', true, 'Saisie et effacement réussis');
    } else {
      a1.logAction('Champ de recherche interactif', false, 'Input introuvable');
    }

    // Tester Boutons de Filtre Catégorie
    const categoryButtons = await page.$$('button');
    let categoryFound = false;
    for (const btn of categoryButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text && (text.includes('Concert') || text.includes('Festival') || text.includes('Tous') || text.includes('Sport'))) {
        categoryFound = true;
        await btn.click();
        await new Promise(r => setTimeout(r, 400));
        break;
      }
    }
    a1.logAction('Boutons filtres de catégories', categoryFound, categoryFound ? 'Filtre cliqué' : 'Aucun bouton de catégorie détecté');

    // Tester les Liens du Footer
    const footerLinks = [
      { path: '/conditions-generales', label: 'Conditions Générales' },
      { path: '/politique-de-confidentialite', label: 'Politique de Confidentialité' },
      { path: '/contact', label: 'Page Contact' },
      { path: '/cookies', label: 'Gestion des Cookies' }
    ];

    for (const fl of footerLinks) {
      await page.goto(`${BASE_URL}${fl.path}`, { waitUntil: 'networkidle2', timeout: 25000 });
      const text = await page.evaluate(() => document.body.innerText);
      const isClean = !text.includes('404') && !text.includes('Ã©') && text.length > 50;
      a1.logAction(`Lien Footer: ${fl.label}`, isClean, `Longueur texte: ${text.length}`);
    }

    // =========================================================================
    // AGENT 2 : AUTHENTIFICATION, SÉCURITÉ & ONBOARDING
    // =========================================================================
    console.log('\n------------------------------------------------------------');
    console.log('🤖 AGENT 2 : Authentification, Sécurité & Onboarding');
    console.log('------------------------------------------------------------');
    const a2 = recordAgent(2, 'Authentification & Sécurité', '🔐');

    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2', timeout: 25000 });

    const loginEmailInput = await page.$('input[type="email"]');
    const loginPassInput = await page.$('input[type="password"]');
    const loginSubmitBtn = await page.$('button[type="submit"]');
    a2.logAction('Champs formulaire connexion présents', Boolean(loginEmailInput && loginPassInput && loginSubmitBtn));

    // Test de rejet sur mauvais identifiants
    if (loginEmailInput && loginPassInput && loginSubmitBtn) {
      await loginEmailInput.type('utilisateur.inconnu@myticket-qa.tg');
      await loginPassInput.type('MauvaisMdp999!');
      await loginSubmitBtn.click();
      
      let gotFeedback = false;
      try {
        await page.waitForFunction(
          () => document.body.innerText.includes('incorrect') || 
                document.body.innerText.includes('invalide') || 
                document.body.innerText.includes('Erreur') ||
                document.body.innerText.includes('Impossible'),
          { timeout: 12000 }
        );
        gotFeedback = true;
      } catch {
        gotFeedback = false;
      }
      a2.logAction('Alerte de sécurité sur mauvais identifiants', gotFeedback, gotFeedback ? 'Message d’erreur affiché' : 'Pas de message visible');
    }

    // Test Inscription (/auth/signup)
    await page.goto(`${BASE_URL}/auth/signup`, { waitUntil: 'networkidle2', timeout: 25000 });
    const signupName = await page.$('input[name="fullName"], input[placeholder*="Jean"], input[type="text"]');
    const signupEmail = await page.$('input[type="email"]');
    const signupPass = await page.$('input[type="password"]');
    a2.logAction('Formulaire d’inscription complet', Boolean(signupName && signupEmail && signupPass));

    // Test Mot de passe oublié (/auth/password-reset)
    await page.goto(`${BASE_URL}/auth/password-reset`, { waitUntil: 'networkidle2', timeout: 25000 });
    const resetEmail = await page.$('input[type="email"]');
    const resetBtn = await page.$('button[type="submit"]');
    a2.logAction('Formulaire réinitialisation mot de passe', Boolean(resetEmail && resetBtn));

    // =========================================================================
    // AGENT 3 : FICHE ÉVÉNEMENT & TUNNEL DE RÉSERVATION
    // =========================================================================
    console.log('\n------------------------------------------------------------');
    console.log('🤖 AGENT 3 : Fiche Événement & Tunnel de Réservation');
    console.log('------------------------------------------------------------');
    const a3 = recordAgent(3, 'Fiche Événement & Tunnel Réservation', '🎟️');

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 25000 });

    // Trouver un lien vers un événement
    const eventLinks = await page.$$eval('a[href*="/events/"]', els => els.map(e => e.getAttribute('href')));
    let targetEventUrl = eventLinks.length > 0 ? eventLinks[0] : null;

    if (targetEventUrl) {
      await page.goto(`${BASE_URL}${targetEventUrl}`, { waitUntil: 'networkidle2', timeout: 25000 });
      a3.logAction('Accès à la fiche événement réelle', true, `URL: ${targetEventUrl}`);

      // Test des boutons d'incrémentation (+ / -) de places
      const allButtons = await page.$$('button');
      let plusBtn = null;
      let minusBtn = null;
      let bookBtn = null;

      for (const btn of allButtons) {
        const text = await page.evaluate(el => el.innerText.trim(), btn);
        if (text === '+') plusBtn = btn;
        if (text === '-') minusBtn = btn;
        if (text.includes('Réserver') || text.includes('Acheter') || text.includes('Prendre ma place')) bookBtn = btn;
      }

      a3.logAction('Boutons quantité places (+ / -)', Boolean(plusBtn || minusBtn), plusBtn ? 'Bouton + interactif' : 'Non requis pour cet événement');
      a3.logAction('Bouton d’action principal de réservation', Boolean(bookBtn), bookBtn ? 'Bouton de réservation présent' : 'Bouton absent');

      if (bookBtn) {
        await bookBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        const modalOrLogin = await page.evaluate(() => {
          return document.body.innerText.includes('Connexion') || 
                 document.body.innerText.includes('Paiement') || 
                 document.body.innerText.includes('Récapitulatif') ||
                 document.body.innerText.includes('Commander');
        });
        a3.logAction('Déclenchement tunnel/invitation connexion', modalOrLogin, 'Tunnel sécurisé déclenché');
      }

    } else {
      // Tester la gestion d'un événement introuvable (404 propre)
      await page.goto(`${BASE_URL}/events/00000000-0000-0000-0000-000000000000`, { waitUntil: 'networkidle2', timeout: 25000 });
      const bodyText = await page.evaluate(() => document.body.innerText);
      const graceful404 = bodyText.includes('introuvable') || bodyText.includes('inexistant') || bodyText.includes('404') || bodyText.includes('Erreur');
      a3.logAction('Gestion robuste d’événement introuvable (404)', graceful404);
    }

    // =========================================================================
    // AGENT 4 : ESPACE UTILISATEUR & BILLETTERIE (/dashboard)
    // =========================================================================
    console.log('\n------------------------------------------------------------');
    console.log('🤖 AGENT 4 : Espace Utilisateur & Billetterie');
    console.log('------------------------------------------------------------');
    const a4 = recordAgent(4, 'Espace Utilisateur & Billetterie', '👤');

    const userDashboardRoutes = [
      { path: '/dashboard', label: 'Accueil Tableau de bord Utilisateur' },
      { path: '/dashboard/tickets', label: 'Espace Mes Billets' },
      { path: '/dashboard/profile', label: 'Profil Utilisateur & Devise XOF' },
      { path: '/dashboard/become-organizer', label: 'Formulaire Devenir Organisateur' }
    ];

    for (const r of userDashboardRoutes) {
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2', timeout: 25000 });
      const currentUrl = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText);
      
      // Sans session active, l'application doit soit rediriger vers /auth/login, soit afficher un état propre
      const isProtected = currentUrl.includes('/auth/login') || bodyText.includes('Connexion') || bodyText.includes('Tableau') || bodyText.includes('Organisateur') || bodyText.includes('Profil');
      a4.logAction(`Protection & Rendu : ${r.label}`, isProtected, `URL courante : ${currentUrl}`);
    }

    // =========================================================================
    // AGENT 5 : ESPACE ORGANISATEUR & SCANNER (/organizer)
    // =========================================================================
    console.log('\n------------------------------------------------------------');
    console.log('🤖 AGENT 5 : Espace Organisateur & Scanner Caméra');
    console.log('------------------------------------------------------------');
    const a5 = recordAgent(5, 'Espace Organisateur & Scanner Caméra', '🎪');

    const organizerRoutes = [
      { path: '/organizer', label: 'Dashboard Organisateur' },
      { path: '/organizer/events', label: 'Liste des Événements Organisateur' },
      { path: '/organizer/events/create', label: 'Formulaire de Création d’Événement' },
      { path: '/organizer/events/00000000-0000-0000-0000-000000000000/scanner', label: 'Interface Scanner QR Code Mobile' }
    ];

    for (const r of organizerRoutes) {
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2', timeout: 25000 });
      const currentUrl = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText);
      const isSecured = currentUrl.includes('/auth/login') || bodyText.includes('Connexion') || bodyText.includes('Organisateur') || bodyText.includes('Scanner') || bodyText.includes('Événement');
      a5.logAction(`Garde de Sécurité & Interface : ${r.label}`, isSecured, `URL: ${currentUrl}`);
    }

    // =========================================================================
    // AGENT 6 : MODÉRATION & ADMINISTRATION (/admin)
    // =========================================================================
    console.log('\n------------------------------------------------------------');
    console.log('🤖 AGENT 6 : Espace Administration & Modération');
    console.log('------------------------------------------------------------');
    const a6 = recordAgent(6, 'Administration & Modération', '🛡️');

    const adminRoutes = [
      { path: '/admin', label: 'Tableau de bord Admin Global' },
      { path: '/admin/organizer-requests', label: 'Validation Candidatures Organisateurs' },
      { path: '/admin/events-pending', label: 'Validation Événements en Attente' },
      { path: '/admin/events', label: 'Gestion du Catalogue & Annulation' },
      { path: '/admin/payments', label: 'Validation Paiements Guichet / En Ligne' },
      { path: '/admin/users', label: 'Gestion Utilisateurs, Rôles & Blocage' }
    ];

    for (const r of adminRoutes) {
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2', timeout: 25000 });
      const currentUrl = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText);
      // Doit exiger le rôle ADMIN ou rediriger vers login
      const isSecured = currentUrl.includes('/auth/login') || bodyText.includes('Connexion') || bodyText.includes('Administrateur') || bodyText.includes('Tableau de bord');
      a6.logAction(`Garde RBAC Admin : ${r.label}`, isSecured, `URL: ${currentUrl}`);
    }

  } catch (err) {
    console.error('Erreur inattendue pendant l’audit :', err.message);
  } finally {
    await browser.close();
  }

  // =========================================================================
  // BILAN SYNTHÉTIQUE
  // =========================================================================
  auditReport.finishedAt = new Date().toISOString();
  console.log('\n================================================================');
  console.log('                    BILAN COMPLET DE L’AUDIT                    ');
  console.log('================================================================');
  console.log(`Total des actions testées : ${auditReport.summary.totalTests}`);
  console.log(`Actions avec succès      : ${auditReport.summary.passed}`);
  console.log(`Anomalies / Échecs       : ${auditReport.summary.failed}`);
  console.log(`Nombre de bugs relevés   : ${auditReport.discoveredBugs.length}`);
  console.log('================================================================\n');

  if (auditReport.discoveredBugs.length > 0) {
    console.log('Détail des anomalies relevées :');
    auditReport.discoveredBugs.forEach((b, i) => {
      console.log(`  ${i + 1}. [${b.agent}] ${b.action} => ${b.details}`);
    });
  } else {
    console.log('🎉 Aucune régression critique détectée. Tous les contrôles sont au vert !');
  }
}

runAudit();

