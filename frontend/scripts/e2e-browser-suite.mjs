import puppeteer from 'puppeteer';

const BASE_URL = 'https://my-ticket-virid.vercel.app';
const ADMIN_EMAIL = 'e2e.test.runner@example.com';
const ADMIN_PASS = 'Password123!';

async function runBrowserSuite() {
  console.log('--- Lancement du test automatisé sur Chrome ---');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(45000);

  const results = [];
  const log = (step, ok, note = '') => {
    results.push({ step, ok, note });
    console.log(`${ok ? '✅' : '❌'} ${step} ${note ? '(' + note + ')' : ''}`);
  };

  try {
    // 1. Accès Accueil
    console.log('\n[1/5] Page d’accueil & Découverte');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    log('Accueil accessible', title.includes('MyTicket'), title);

    // 2. Accès Formulaire Inscription
    console.log('\n[2/5] Formulaire d’inscription');
    await page.goto(`${BASE_URL}/auth/signup`, { waitUntil: 'domcontentloaded' });
    const nameField = await page.$('input[placeholder*="Jean Dupont"]');
    log('Formulaire Inscription complet', Boolean(nameField));

    // 3. Connexion Administrateur
    console.log('\n[3/5] Connexion Administrateur');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.type('input[type="email"]', ADMIN_EMAIL);
    await page.type('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    // Attente du traitement login
    await new Promise(r => setTimeout(r, 4000));
    const tokenStored = await page.evaluate(() => Boolean(localStorage.getItem('myticket_token')));
    log('Session Administrateur active', tokenStored, tokenStored ? 'Token JWT stocké' : 'Non connecté');

    // 4. Espace Candidature Organisateur
    console.log('\n[4/5] Espace Demande Organisateur');
    await page.goto(`${BASE_URL}/dashboard/become-organizer`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    const orgPageTitle = await page.evaluate(() => document.body.innerText.includes('Demande Organisateur'));
    log('Page Demande Organisateur affichée', orgPageTitle);

    // 5. Portails Administrateur
    console.log('\n[5/5] Portails Administrateur');
    const adminRoutes = [
      { path: '/admin', label: 'Tableau de bord Admin' },
      { path: '/admin/organizer-requests', label: 'Modération Demandes Organisateur' },
      { path: '/admin/events-pending', label: 'Modération Événements en attente' },
      { path: '/admin/payments', label: 'Gestion des Paiements' },
      { path: '/admin/users', label: 'Gestion des Utilisateurs & Rôles' },
    ];

    for (const r of adminRoutes) {
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
      await new Promise(res => setTimeout(res, 2000));
      const bodyText = await page.evaluate(() => document.body.innerText);
      const isOk = !bodyText.includes('404') && (bodyText.includes('Admin') || bodyText.includes('Tableau') || bodyText.includes('Demandes') || bodyText.includes('Événements') || bodyText.includes('Paiements') || bodyText.includes('Utilisateurs') || bodyText.includes('Membres'));
      log(r.label, isOk, r.path);
    }

  } catch (err) {
    console.error('Erreur test :', err.message);
  } finally {
    console.log('\n=======================================');
    console.log('         RÉSULTATS DE LA RECETTE       ');
    console.log('=======================================');
    const passCount = results.filter(r => r.ok).length;
    console.log(`Succès : ${passCount}/${results.length}`);
    await new Promise(r => setTimeout(r, 4000));
    await browser.close();
  }
}

runBrowserSuite();

