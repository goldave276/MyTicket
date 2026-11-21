#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const scanAll = process.argv.includes('--all');
const repoRoot = process.cwd();

const SECRET_RULES = [
  {
    name: 'Clé privée cryptographique',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
  },
  {
    name: 'Clé secrète Stripe réelle',
    regex: /\b(?:sk|rk)_live_[0-9a-zA-Z]{16,}\b/,
  },
  {
    name: 'Secret webhook Stripe réel',
    regex: /\bwhsec_[0-9a-zA-Z]{20,}\b/,
  },
  {
    name: 'Jeton JWT / Clé Supabase en dur',
    regex: /\beyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    name: 'Mot de passe ou clé API codé en dur',
    regex: /\b(?:ADMIN_PASS|DB_PASSWORD|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|SMTP_PASS)\s*=\s*['"][^'"]{6,}['"]/,
  },
];

const IGNORED_PATH_PATTERNS = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.next(\/|$)/,
  /package-lock\.json$/,
  /\.env\.example$/,
  /(^|\/)scripts\/check-secrets\.mjs$/,
  /(^|\/)(?:tests?|__tests__)(\/|$)/,
  /\.(?:test|spec)\.[cm]?[jt]sx?$/,
  /\.(?:png|jpe?g|webp|ico|woff2?|pdf)$/i,
];

function getFilesToScan() {
  const cmd = scanAll
    ? 'git ls-files -z'
    : 'git diff --cached --name-only --diff-filter=ACMR -z';
  const raw = execSync(cmd, { encoding: 'utf8' });
  return raw.split('\0').filter(Boolean);
}

function isForbiddenEnvFile(filePath) {
  const base = path.basename(filePath);
  if (base === '.env') return true;
  if (base.startsWith('.env.') && base !== '.env.example' && !base.endsWith('.example')) {
    return true;
  }
  return false;
}

const files = getFilesToScan();
const findings = [];

for (const relativePath of files) {
  const normalized = relativePath.replace(/\\/g, '/');

  if (isForbiddenEnvFile(normalized)) {
    findings.push({ file: normalized, line: 1, rule: 'Fichier .env sensible versionné' });
    continue;
  }

  if (IGNORED_PATH_PATTERNS.some((pattern) => pattern.test(normalized))) {
    continue;
  }

  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((lineText, idx) => {
    for (const rule of SECRET_RULES) {
      if (rule.regex.test(lineText)) {
        findings.push({ file: normalized, line: idx + 1, rule: rule.name });
      }
    }
  });
}

if (findings.length > 0) {
  console.error('\n❌ ÉCHEC SÉCURITÉ : secrets ou fichiers sensibles détectés avant commit !\n');
  for (const f of findings) {
    console.error(`  • ${f.file}:${f.line} — ${f.rule}`);
  }
  console.error('\nDéplacez ces valeurs vers les variables d’environnement (.env non suivi, GitHub Secrets, Render ou Vercel).\n');
  process.exit(1);
}

console.log(`✅ Scan anti-secrets OK (${files.length} fichier(s) vérifié(s)).`);
