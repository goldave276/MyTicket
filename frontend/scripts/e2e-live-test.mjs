import puppeteer from 'puppeteer';

const BASE_URL = process.env.TEST_URL || 'https://my-ticket-virid.vercel.app';
const API_URL = 'https://myticket-llwf.onrender.com/api';

console.log('--- Démarrage de la suite de tests E2E automatisés MyTicket ---');
console.log(`Cible Frontend : ${BASE_URL}`);
console.log(`Cible Backend  : ${API_URL}`);

async function runTests() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = [];

  const logResult = (testName, passed, details = '') => {
    results.push({ testName, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} : ${testName}${details ? ' - ' + details : ''}`);
  };

  try {
    // Test 1 : Chargement de la page d'accueil
    console.log('\n[1/6] Test de la page d’accueil...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    const pageTitle = await page.title();
    const hasMyTicketInTitle = pageTitle.includes('MyTicket');
    logResult('Navigation page d’accueil', hasMyTicketInTitle, `Titre : "${pageTitle}"`);

    // Test 2 : Présence de la navbar et des liens clés
    console.log('\n[2/6] Test des composants UI d’accueil...');
    const logoExists = await page.$('a[href="/"]') !== null;
    const searchInput = await page.$('input[placeholder*="Rechercher"]') !== null;
    logResult('Composants essentiels (Logo & Barre de recherche)', logoExists && searchInput);

    // Test 3 : Page Inscription (/auth/signup)
    console.log('\n[3/6] Test de la page d’inscription...');
    await page.goto(`${BASE_URL}/auth/signup`, { waitUntil: 'networkidle2', timeout: 30000 });
    const nameInput = await page.$('input[type="text"]') !== null;
    const emailInput = await page.$('input[type="email"]') !== null;
    const passInput = await page.$('input[type="password"]') !== null;
    logResult('Formulaire d’inscription complet', nameInput && emailInput && passInput);

    // Test 4 : Page Connexion (/auth/login)
    console.log('\n[4/6] Test de la page de connexion...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    const loginEmail = await page.$('input[type="email"]');
    const loginPass = await page.$('input[type="password"]');
    const submitBtn = await page.$('button[type="submit"]');
    logResult('Formulaire de connexion', Boolean(loginEmail && loginPass && submitBtn));

    // Test 5 : Soumission avec identifiants erronés (anti-régression sécurité/erreur)
    console.log('\n[5/6] Test de rejet sécurisé sur mauvais identifiants...');
    await loginEmail.type('test.e2e.inexistant@myticket-fail.tg');
    await loginPass.type('BadPassword123!');
    await submitBtn.click();
    
    // Attente du toast ou message d'erreur
    let caughtError = false;
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes('incorrect') || document.body.innerText.includes('invalide') || document.body.innerText.includes('Erreur'),
        { timeout: 7000 }
      );
      caughtError = true;
    } catch {
      caughtError = false;
    }
    logResult('Gestion d’erreur sur tentative de login invalide', caughtError, caughtError ? 'Notification d’erreur affichée' : 'Timeout toast');

    // Test 6 : Pages légales (Conditions générales et Cookies)
    console.log('\n[6/6] Test des pages légales et encodage...');
    await page.goto(`${BASE_URL}/conditions-generales`, { waitUntil: 'networkidle2', timeout: 30000 });
    const cguContent = await page.evaluate(() => document.body.innerText);
    const cguValid = cguContent.includes('Conditions') && !cguContent.includes('Ã©') && !cguContent.includes('Ã¨');
    logResult('Page CGU & Encodage UTF-8 sain', cguValid);

    await page.goto(`${BASE_URL}/cookies`, { waitUntil: 'networkidle2', timeout: 30000 });
    const cookiesContent = await page.evaluate(() => document.body.innerText);
    const cookiesValid = cookiesContent.includes('Cookies') && !cookiesContent.includes('Ã©');
    logResult('Page Cookies & Encodage UTF-8 sain', cookiesValid);

  } catch (err) {
    console.error('Erreur durant l’exécution du test E2E :', err.message);
  } finally {
    console.log('\n=== Synthèse des tests E2E ===');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    console.log(`Total : ${passed}/${total} tests validés`);
    
    // Pause de 4 secondes pour observation visuelle
    await new Promise(r => setTimeout(r, 4000));
    await browser.close();
  }
}

runTests();
