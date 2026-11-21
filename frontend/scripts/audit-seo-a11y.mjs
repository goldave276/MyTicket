import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core'), 'utf8');

const PORT = Number(process.env.AUDIT_PORT || 3033);
const argUrl = process.argv.find((a) => a.startsWith('--url='))?.split('=')[1];
const BASE_URL = argUrl || `http://127.0.0.1:${PORT}`;
const ROUTES = ['/', '/auth/login', '/auth/signup', '/conditions-generales', '/contact'];

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Le serveur Next.js n'a pas démarré sur ${url} sous ${timeoutMs}ms`);
}

function startLocalNextServer() {
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  return spawn(process.execPath, [nextBin, 'start', '-p', String(PORT), '-H', '127.0.0.1'], {
    stdio: 'ignore',
    env: { ...process.env, NODE_ENV: 'production' },
  });
}

async function runAudit() {
  let serverProc = null;
  let browser = null;
  let hasFailures = false;

  try {
    if (!argUrl) {
      console.log(`🚀 Démarrage temporaire de Next.js sur ${BASE_URL}...`);
      serverProc = startLocalNextServer();
      await waitForServer(`${BASE_URL}/`);
    }

    // Vérification robots.txt et sitemap.xml
    for (const staticSeoFile of ['/robots.txt', '/sitemap.xml']) {
      const res = await fetch(`${BASE_URL}${staticSeoFile}`);
      if (!res.ok) {
        console.error(`❌ SEO: ${staticSeoFile} introuvable (HTTP ${res.status})`);
        hasFailures = true;
      } else {
        console.log(`✅ SEO: ${staticSeoFile} accessible (HTTP ${res.status})`);
      }
    }

    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    for (const route of ROUTES) {
      const target = `${BASE_URL}${route}`;
      console.log(`\n🔎 Audit SEO & A11y : ${route}`);
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 600));

      const seo = await page.evaluate(() => {
        const title = document.title?.trim() || '';
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
        const lang = document.documentElement.getAttribute('lang') || '';
        const h1Count = document.querySelectorAll('h1').length;
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
        const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
        return { title, metaDesc, lang, h1Count, ogTitle, ogDesc };
      });

      if (!seo.title) {
        console.error(`  ❌ Balise <title> manquante sur ${route}`);
        hasFailures = true;
      }
      if (!seo.metaDesc) {
        console.error(`  ❌ <meta name="description"> manquante sur ${route}`);
        hasFailures = true;
      }
      if (seo.lang !== 'fr') {
        console.error(`  ❌ Attribut <html lang="fr"> attendu (trouvé: "${seo.lang}") sur ${route}`);
        hasFailures = true;
      }
      if (route === '/' && (!seo.ogTitle || !seo.ogDesc)) {
        console.error(`  ❌ Balises OpenGraph (og:title / og:description) manquantes sur /`);
        hasFailures = true;
      }
      console.log(`  📄 SEO : title="${seo.title}" | lang="${seo.lang}" | h1=${seo.h1Count}`);

      // Audit accessibilité WCAG 2.1 A/AA via axe-core
      await page.addScriptTag({ content: axeSource });
      const a11yResults = await page.evaluate(async () => {
        return await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        });
      });

      const blocking = a11yResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      const minorOrMod = a11yResults.violations.filter(
        (v) => v.impact !== 'critical' && v.impact !== 'serious'
      );

      if (blocking.length > 0) {
        hasFailures = true;
        for (const v of blocking) {
          console.error(`  ❌ A11y [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} noeud(s))`);
          for (const node of v.nodes.slice(0, 3)) {
            console.error(`     -> ${node.target.join(' ')} | ${node.html.slice(0, 140)}`);
          }
        }
      } else {
        console.log(`  ✅ A11y (axe-core WCAG A/AA): 0 violation critique/sérieuse`);
      }

      for (const v of minorOrMod) {
        console.warn(`  ⚠️ A11y [${v.impact}] ${v.id}: ${v.help}`);
      }
    }
  } finally {
    if (browser) await browser.close();
    if (serverProc && !serverProc.killed) {
      serverProc.kill('SIGTERM');
    }
  }

  if (hasFailures) {
    console.error('\n❌ Audit SEO / Accessibilité échoué.');
    process.exit(1);
  }
  console.log('\n✅ Audit SEO & Accessibilité complet validé sans erreur bloquante.');
}

runAudit().catch((err) => {
  console.error('Erreur fatale audit SEO/A11y:', err);
  process.exit(1);
});
