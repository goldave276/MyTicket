import { spawn } from 'node:child_process';
import path from 'node:path';
import puppeteer from 'puppeteer';

const PORT = Number(process.env.AUDIT_PORT || 3034);
const argUrl = process.argv.find((a) => a.startsWith('--url='))?.split('=')[1];
const BASE_URL = argUrl || `http://127.0.0.1:${PORT}`;
const ROUTES = ['/', '/auth/login'];

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Wait for Next.js
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Le serveur Next.js n'a pas démarré sur ${url}`);
}

function startLocalNextServer() {
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  return spawn(process.execPath, [nextBin, 'start', '-p', String(PORT), '-H', '127.0.0.1'], {
    stdio: 'ignore',
    env: { ...process.env, NODE_ENV: 'production' },
  });
}

async function runMobilePerfAudit() {
  let serverProc = null;
  let browser = null;

  try {
    if (!argUrl) {
      console.log(`🚀 Démarrage serveur Next.js de test perf mobile sur ${BASE_URL}...`);
      serverProc = startLocalNextServer();
      await waitForServer(`${BASE_URL}/`);
    }

    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    const client = await page.createCDPSession();
    await client.send('Network.enable');
    // Profil 3G rapide / Android milieu de gamme
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 150,
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    for (const route of ROUTES) {
      let totalBytes = 0;
      let jsBytes = 0;
      let requestCount = 0;
      const resourceTypes = new Map();

      const onResponse = (event) => {
        requestCount++;
        resourceTypes.set(event.requestId, event.type);
      };

      const onLoadingFinished = (event) => {
        const len = event.encodedDataLength || 0;
        totalBytes += len;
        if (resourceTypes.get(event.requestId) === 'Script') {
          jsBytes += len;
        }
      };

      client.on('Network.responseReceived', onResponse);
      client.on('Network.loadingFinished', onLoadingFinished);

      const t0 = Date.now();
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 45000 });
      const loadMs = Date.now() - t0;

      const perf = await page.evaluate(() => {
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        const nav = performance.getEntriesByType('navigation')[0];
        const imgs = Array.from(document.querySelectorAll('img'));
        const nonLazyImgs = imgs.filter((img) => img.getAttribute('loading') !== 'lazy').length;
        return {
          fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : null,
          domInteractiveMs: nav ? Math.round(nav.domInteractive) : null,
          imgCount: imgs.length,
          nonLazyImgs,
        };
      });

      client.off('Network.responseReceived', onResponse);
      client.off('Network.loadingFinished', onLoadingFinished);

      console.log(`\n📱 Audit Mobile (3G / CPU 4x) : ${route}`);
      console.log(`  • First Contentful Paint (FCP) : ${perf.fcpMs ?? 'N/A'} ms`);
      console.log(`  • DOM Interactive              : ${perf.domInteractiveMs ?? 'N/A'} ms`);
      console.log(`  • Temps de chargement complet  : ${loadMs} ms`);
      console.log(`  • Requêtes / Transfert JS      : ${requestCount} reqs | ${(jsBytes / 1024).toFixed(1)} Ko JS / ${(totalBytes / 1024).toFixed(1)} Ko total`);
      console.log(`  • Images sur la vue            : ${perf.imgCount} (dont sans lazy-load : ${perf.nonLazyImgs})`);
    }
  } finally {
    if (browser) await browser.close();
    if (serverProc && !serverProc.killed) {
      serverProc.kill('SIGTERM');
    }
  }
}

runMobilePerfAudit().catch((err) => {
  console.error('Erreur audit mobile:', err);
  process.exit(1);
});
