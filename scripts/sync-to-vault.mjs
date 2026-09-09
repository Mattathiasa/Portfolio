#!/usr/bin/env node
/**
 * sync-to-vault.mjs — one-way sync: Portfolio Firestore → Obsidian vault
 *
 * Pulls the `projects` collection and the `content/develop` doc (the admin
 * "comments and such") from Firestore via its REST API, then:
 *   1. Writes/refreshes  Vault/Atlas/Portfolio Sync.md  (live portfolio MOC)
 *   2. Injects a marker-delimited block into each matched project folder's
 *      comments.md  (<!-- PORTFOLIO-SYNC:START/END -->). Anything outside the
 *      markers is never modified. If a matched folder has no comments.md,
 *      a minimal one is created around the block.
 *
 * The vault is read-only downstream: nothing here writes back to Firestore.
 *
 * Usage:
 *   node scripts/sync-to-vault.mjs            # sync for real
 *   node scripts/sync-to-vault.mjs --dry-run  # show what would change
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

// ── Paths ────────────────────────────────────────────────────────────────────
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PORTFOLIO_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECTS_ROOT = resolve(PORTFOLIO_ROOT, '..'); // D:\Projects
const VAULT_ROOT = join(PROJECTS_ROOT, 'Vault');
const ATLAS_DIR = join(VAULT_ROOT, 'Atlas');

const DRY_RUN = process.argv.includes('--dry-run');
const SYNC_START = '<!-- PORTFOLIO-SYNC:START (auto-generated from Portfolio admin - do not edit inside these markers) -->';
const SYNC_END = '<!-- PORTFOLIO-SYNC:END -->';

// ── Portfolio title → workspace folder aliases ─────────────────────────────
// Normalized (lowercase, alphanumeric-only) portfolio title → folder name.
// Add entries here when a portfolio project doesn't auto-match a folder.
const ALIASES = {
  'ahawchurchmanagement': 'mahibere-ahaw',
  'mahibereahawchurchmanagementsystem': 'mahibere-ahaw',
  'mahibereahaw': 'mahibere-ahaw',
  'dafwatermeter': 'daf_water_meter',
  'watermeter': 'daf_water_meter',
  'lifequest': 'lifequest',
  'flameup': 'FlameUp',
  'aviatormultiplayer': 'Aviator',
  'bingogame': 'Bingo',
  'karaoke': 'karaoki',
  'zemaoki': 'karaoki',
  'clashroller': 'AnimeCrewClash',
  'animecrewclash': 'AnimeCrewClash',
  'iconeleven': 'Icon-Eleven',
  'mysticleader': 'mystic_ledger',
  'mysticledger': 'mystic_ledger',
  'sugarflow': 'SugarFlow',
  'sugarflowpersonalbloodsugarhealthtracker': 'SugarFlow',
  'billsystem': 'Bill-System-Web-Version',
  'driverlicense': 'DAFTech-DriverLicense-System',
  'driverlicenseregistrationandverificationapp': 'DAFTech-DriverLicense-System',
  'lyricloom': 'LyricLoom',
  'lyricloomssongmeaninganalyzer': 'LyricLoom',
  'skzshowcase': 'skz-showcase',
  'skzpymusicplayer': 'skz-showcase',
  'skzpy': 'skz-showcase',
  'musicscout': 'AudioScout',
  'audioscout': 'AudioScout',
  'portfolio': 'Portfolio',
  'portfoliov2': 'Portfolio',
  'portfoliosite': 'Portfolio',
  'thisportfoliowebsite': 'Portfolio',
  'salemartportfolio': 'sphere-canvas-showcase',
  'schoolmanagementsystem': 'mahibere-ahaw',
  'churchmanagement': 'mahibere-ahaw',
  'iecchildrenministry': 'iec-kids-connect',
  'solassweet': 'sola-s-sweet-showcase',
  'aichatbot': 'ChatBot',
  'chatbot': 'ChatBot',
  'lehulutrading': 'lehulu-living',
  'footballfreestyle': 'FootballFreestyle',
};

// ── Env loading ──────────────────────────────────────────────────────────────
function loadEnv() {
  const out = {};
  for (const f of ['.env.local', '.env']) {
    const p = join(PORTFOLIO_ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

// ── Firestore REST helpers ───────────────────────────────────────────────────
function fv(fields) {
  // Convert a Firestore REST `fields` object into plain JS.
  const out = {};
  for (const [k, v] of Object.entries(fields ?? {})) out[k] = fvValue(v);
  return out;
}
function fvValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fvValue);
  if ('mapValue' in v) return fv(v.mapValue.fields);
  return undefined;
}

async function restGet(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Firestore REST ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// ── Matching ─────────────────────────────────────────────────────────────────
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const GENERIC = new Set(['app', 'mobile', 'web', 'website', 'site', 'system', 'project', 'page', 'the', 'and', 'for', 'with']);
const tokens = s => (s || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !GENERIC.has(t));

function matchFolder(title, folders) {
  const n = norm(title);
  if (ALIASES[n]) return { folder: ALIASES[n], how: 'alias' };
  // exact normalized equality
  const exact = folders.find(f => norm(f) === n);
  if (exact) return { folder: exact, how: 'exact' };
  // substring either way
  const sub = folders.find(f => f.length > 3 && (norm(f).includes(n) || n.includes(norm(f))));
  if (sub) return { folder: sub, how: 'substring' };
  // token overlap (>= half of the smaller set); skip 1-token folder names —
  // too generic (e.g. "App") and they false-match everything
  const tt = new Set(tokens(title));
  let best = null, bestScore = 0;
  for (const f of folders) {
    const ft = new Set(tokens(f));
    if (ft.size < 2 || !tt.size) continue;
    let inter = 0;
    for (const t of tt) if (ft.has(t)) inter++;
    const score = inter / Math.min(tt.size, ft.size);
    if (score > bestScore) { bestScore = score; best = f; }
  }
  if (best && bestScore >= 0.5) return { folder: best, how: `fuzzy(${bestScore.toFixed(2)})` };
  return null;
}

// ── Block rendering ──────────────────────────────────────────────────────────
const oneLine = s => (s || '').replace(/\r?\n/g, ' · ').trim();

function devItemLines(items, doneMark = 'x') {
  const list = items ?? [];
  if (!list.length) return ['  - *(none yet)*'];
  return list.map(it => `  - [${it.done ? doneMark : ' '}] ${oneLine(it.text)}`);
}

function renderBlock(project, dev) {
  const L = [];
  L.push(SYNC_START);
  L.push(`### 🎛️ Portfolio Admin Sync — ${project.title || '(untitled)'}`);
  L.push(`- **Lifecycle stage:** ${dev?.stage || 'Not set'}`);
  const links = [`Portfolio entry: [[Portfolio Sync]]`];
  if (project.github) links.push(`GitHub: ${project.github}`);
  if (project.demo) links.push(`Demo: ${project.demo}`);
  L.push(`- ${links.join(' · ')}`);
  if (project.techStack?.length) L.push(`- **Tech stack:** ${project.techStack.join(', ')}`);
  L.push(`- **Features / comments (${(dev?.features ?? []).length}):**`);
  L.push(...devItemLines(dev?.features));
  L.push(`- **Todos (${(dev?.todos ?? []).length}):**`);
  L.push(...devItemLines(dev?.todos, 'X'));
  if (oneLine(dev?.notes)) {
    L.push(`- **Admin notes:**`);
    L.push(`  > ${oneLine(dev.notes)}`);
  }
  L.push(`- *Synced: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}*`);
  L.push(SYNC_END);
  return L.join('\n');
}

function upsertBlock(existing, block) {
  if (!existing) return block + '\n';
  const start = existing.indexOf(SYNC_START);
  const end = existing.indexOf(SYNC_END);
  if (start !== -1 && end !== -1 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + SYNC_END.length);
  }
  return existing.replace(/\s*$/, '\n') + '\n---\n\n' + block + '\n';
}

function freshComments(folder, title, block) {
  const today = new Date().toISOString().slice(0, 10);
  return `---
title: Comments & Collaboration - ${title}
created: ${today}
updated: ${today}
tags:
  - comments
  - feedback
project: "[[${folder}/README|${title}]]"
parent: "[[comments|Master Comments Hub]]"
---

# 💬 ${title} — Comments & Notes

> **Project Hub:** [[00_Projects_Hub|Projects Hub]] | [[comments|Master Comments Hub]]

---

## 🗣️ User Directives & Instructions for AI
- [ ] 

## ✅ Open Action Items
- [ ] 

${block}
`;
}

// ── Sync note ────────────────────────────────────────────────────────────────
// Best existing doc in a folder to link from the sync note
function docFor(folder) {
  for (const name of ['README', 'AGENTS', 'comments']) {
    if (existsSync(join(PROJECTS_ROOT, folder, `${name}.md`))) return name;
  }
  return null;
}

function renderSyncNote(rows, unmatched, projectsCount) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const L = [];
  L.push(`---`);
  L.push(`title: Portfolio Sync`);
  L.push(`type: moc`);
  L.push(`updated: ${now.slice(0, 10)}`);
  L.push(`tags:`);
  L.push(`  - moc`);
  L.push(`  - portfolio`);
  L.push(`---`);
  L.push(``);
  L.push(`# 🎛️ Portfolio Sync`);
  L.push(``);
  L.push(`> [!info]`);
  L.push(`> Live view of the **Portfolio admin** (Firestore → vault, one-way).`);
  L.push(`> Regenerated by \`Portfolio/scripts/sync-to-vault.mjs\` — edit data in the`);
  L.push(`> portfolio admin page, not here. Up: [[MOC Index]] · Hub: [[00_Projects_Hub|Projects Hub]]`);
  L.push(``);
  L.push(`## Projects (${projectsCount} in portfolio, ${rows.length} matched)`);
  L.push(``);
  L.push(`| Portfolio project | Workspace | Stage | Tech | Features | Todos | Links |`);
  L.push(`| :-- | :-- | :-- | :-- | :---: | :---: | :-- |`);
  for (const r of rows) {
    const doc = r.folder ? docFor(r.folder) : null;
    const link = doc ? `[[${r.folder}/${doc}|${r.title}]]` : r.title;
    const tech = oneLine((r.project.techStack ?? []).slice(0, 4).join(', ')) || '—';
    const links = [r.project.demo ? `[demo](${r.project.demo})` : null, r.project.github ? `[code](${r.project.github})` : null].filter(Boolean).join(' ') || '—';
    L.push(`| ${link} | ${r.folder ?? '*(unmatched)*'} | ${r.dev?.stage || '—'} | ${tech} | ${(r.dev?.features ?? []).length} | ${(r.dev?.todos ?? []).length} | ${links} |`);
  }
  if (unmatched.length) {
    L.push(``);
    L.push(`## ⚠️ Unmatched portfolio projects`);
    L.push(``);
    L.push(`These exist in the portfolio admin but didn't match a workspace folder.`);
    L.push(`Add an alias in \`Portfolio/scripts/sync-to-vault.mjs → ALIASES\`:`);
    L.push(``);
    for (const u of unmatched) L.push(`- **${u.title}** — ${oneLine(u.description) || '(no description)'}`);
  }
  L.push(``);
  L.push(`---`);
  L.push(`*Last synced: ${now} (EAT ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Addis_Ababa' })})*`);
  L.push(``);
  return L.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();
  const cfg = {
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    apiKey: env.VITE_FIREBASE_API_KEY,
  };
  if (!cfg.projectId || !cfg.apiKey) {
    console.error('✗ Missing VITE_FIREBASE_PROJECT_ID / VITE_FIREBASE_API_KEY in Portfolio/.env.local');
    process.exit(1);
  }

  const base = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents`;
  const key = `key=${cfg.apiKey}`;

  console.log('→ Pulling projects + content/develop from Firestore…');
  const [projectsRes, developRes] = await Promise.all([
    restGet(`${base}/projects?pageSize=200&${key}`).catch(e => { throw new Error(`projects: ${e.message}`); }),
    restGet(`${base}/content/develop?${key}`).catch(e => { throw new Error(`content/develop: ${e.message} (if rules deny public reads, allow read for content/* )`); }),
  ]);

  const projects = (projectsRes.documents ?? [])
    .map(d => ({ ...fv(d.fields), id: d.name.split('/').pop() }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const develop = fv(developRes.fields).items ?? {};

  console.log(`  ✓ ${projects.length} project(s), ${Object.keys(develop).length} dev-note doc(s)`);

  // Workspace folders — any top-level dir except the vault itself and dots
  const folders = readdirSync(PROJECTS_ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'Vault')
    .map(e => e.name);

  const rows = [];
  const unmatched = [];
  for (const p of projects) {
    const m = matchFolder(p.title, folders);
    const dev = develop[p.id] || develop[p.title] || null; // admin keys dev-notes by Firestore doc id
    rows.push({ title: p.title, project: p, dev, folder: m?.folder ?? null, how: m?.how ?? null });
    if (!m) unmatched.push(p);
  }

  // Report
  for (const r of rows) {
    if (r.folder) console.log(`  • "${r.title}" → ${r.folder} (${r.how})`);
    else console.log(`  • "${r.title}" → UNMATCHED`);
  }

  if (DRY_RUN) {
    console.log('\n(dry-run: no files written)');
    return;
  }

  // 1. Sync note
  writeFileSync(join(ATLAS_DIR, 'Portfolio Sync.md'), renderSyncNote(rows, unmatched, projects.length));
  console.log('✓ wrote Vault/Atlas/Portfolio Sync.md');

  // 2. comments.md blocks
  let injected = 0, created = 0, skipped = 0;
  for (const r of rows) {
    if (!r.folder) { skipped++; continue; }
    const dir = join(PROJECTS_ROOT, r.folder);
    const cmPath = join(dir, 'comments.md');
    const block = renderBlock(r.project, r.dev);
    if (existsSync(cmPath)) {
      const before = readFileSync(cmPath, 'utf8');
      const after = upsertBlock(before, block);
      if (after !== before) { writeFileSync(cmPath, after); injected++; }
    } else {
      writeFileSync(cmPath, freshComments(r.folder, r.title, block));
      created++;
    }
  }
  console.log(`✓ comments.md blocks: ${injected} updated, ${created} created, ${skipped} skipped (unmatched)`);
  if (unmatched.length) {
    console.log(`⚠ ${unmatched.length} unmatched: ${unmatched.map(u => `"${u.title}"`).join(', ')}`);
    console.log('  → add aliases in scripts/sync-to-vault.mjs ALIASES and re-run');
  }
}

main().catch(e => { console.error('✗ sync failed:', e.message); process.exit(1); });
