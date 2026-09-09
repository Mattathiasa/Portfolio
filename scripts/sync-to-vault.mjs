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
const VC_START = '<!-- VAULT-COMMENTS:START (written from Portfolio admin > Vault comments tab) -->';
const VC_END = '<!-- VAULT-COMMENTS:END -->';

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

function upsertBlock(existing, block, startMark = SYNC_START, endMark = SYNC_END) {
  if (!existing) return block + '\n';
  const start = existing.indexOf(startMark);
  const end = existing.indexOf(endMark);
  if (start !== -1 && end !== -1 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + endMark.length);
  }
  return existing.replace(/\s*$/, '\n') + '\n---\n\n' + block + '\n';
}

function stripMarkerBlocks(text) {
  let out = text ?? '';
  for (const [s, e] of [[SYNC_START, SYNC_END], [VC_START, VC_END]]) {
    let a, b;
    while ((a = out.indexOf(s)) !== -1 && (b = out.indexOf(e, a)) !== -1) {
      out = (out.slice(0, a) + out.slice(b + e.length)).trim();
    }
  }
  // drop trailing `---` separators the rebuild adds (keeps re-runs idempotent)
  while (/(?:^|\n)---\s*$/.test(out)) out = out.replace(/(?:\n+---\s*)+$/, '').trimEnd();
  return out.replace(/\n{3,}/g, '\n\n').trim();
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

// ── Line diff (LCS-based, small files only) ──────────────────────────────────
function diffLines(aText, bText) {
  const a = (aText ?? '').split('\n');
  const b = (bText ?? '').split('\n');
  const n = a.length, m = b.length;
  // LCS table
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ t: ' ', s: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: '-', s: a[i++] }); }
    else { out.push({ t: '+', s: b[j++] }); }
  }
  while (i < n) out.push({ t: '-', s: a[i++] });
  while (j < m) out.push({ t: '+', s: b[j++] });
  return out;
}

function unifiedDiff(path, before, after, context = 2) {
  const d = diffLines(before, after);
  if (!d.some(x => x.t !== ' ')) return null;
  const L = [`--- a/${path}`, `+++ b/${path}`];
  // group into hunks with `context` lines of surrounding context
  let idx = 0;
  while (idx < d.length) {
    if (d[idx].t === ' ') { idx++; continue; }
    const start = Math.max(0, idx - context);
    let end = idx;
    let gap = 0;
    for (let k = idx; k < d.length; k++) {
      if (d[k].t === ' ') { gap++; if (gap > context * 2) { end = k - gap + context; break; } }
      else { gap = 0; end = Math.min(d.length - 1, k + context); }
    }
    const slice = d.slice(start, end + 1);
    const a0 = start + 1, b0 = start + 1;
    const aN = slice.filter(x => x.t !== '+').length;
    const bN = slice.filter(x => x.t !== '-').length;
    L.push(`@@ -${a0},${aN} +${b0},${bN} @@`);
    for (const x of slice) L.push(x.t + x.s);
    idx = end + 1;
  }
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

  console.log('→ Pulling projects + content/develop + content/vault-comments from Firestore…');
  const [projectsRes, developRes, vcRes] = await Promise.all([
    restGet(`${base}/projects?pageSize=200&${key}`).catch(e => { throw new Error(`projects: ${e.message}`); }),
    restGet(`${base}/content/develop?${key}`).catch(e => { throw new Error(`content/develop: ${e.message} (if rules deny public reads, allow read for content/* )`); }),
    restGet(`${base}/content/vault-comments.meta?${key}`).catch(() => null), // optional — created on first sync/admin save
  ]);

  const projects = (projectsRes.documents ?? [])
    .map(d => ({ ...fv(d.fields), id: d.name.split('/').pop() }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const develop = fv(developRes.fields).items ?? {};
  const vcFields = vcRes ? fv(vcRes.fields) : {};
  const vaultComments = vcFields.items ?? {};
  const lastSyncedAt = vcFields.syncedAt ?? null;

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

  // ── PLAN: compute every target comments.md without writing ────────────────
  const plan = [];
  for (const r of rows) {
    if (!r.folder) continue;
    const cmPath = join(PROJECTS_ROOT, r.folder, 'comments.md');
    const block = renderBlock(r.project, r.dev);
    const localRaw = existsSync(cmPath) ? readFileSync(cmPath, 'utf8') : null;
    const localHand = localRaw ? stripMarkerBlocks(localRaw) : '';
    const metaEntry = vaultComments[r.folder];
    const adminEdited = !!(metaEntry?.updatedAt && (!lastSyncedAt || metaEntry.updatedAt > lastSyncedAt));
    let hand, source;
    if (adminEdited && (metaEntry.mirror ?? '').trim()) {
      hand = metaEntry.mirror.trim(); source = 'admin';
    } else {
      hand = localHand; source = 'local';
    }
    const next = localRaw
      ? (hand ? hand + '\n\n---\n\n' : '') + block + '\n'
      : freshComments(r.folder, r.title, block);
    const change = !localRaw ? 'create' : (next !== localRaw ? 'update' : 'unchanged');
    plan.push({ folder: r.folder, cmPath, source, hand, next, change });
  }

  // ── PREVIEW (dry-run): unified diffs of every file that would change ─────
  if (DRY_RUN) {
    const changed = plan.filter(p => p.change !== 'unchanged');
    console.log(`\n≡ DRY-RUN PREVIEW — ${changed.length} file(s) would change, ${plan.length - changed.length} untouched:`);
    for (const p of changed) {
      const rel = p.cmPath.slice(PROJECTS_ROOT.length + 1);
      const diff = unifiedDiff(rel, p.change === 'create' ? '' : (readFileSync(p.cmPath, 'utf8')), p.next);
      console.log('\n' + (diff ?? `(no textual diff for ${rel})`));
    }
    if (!changed.length) console.log('  (nothing to do — every comments.md already matches)');
    console.log('\n(dry-run: no files written. Run without --dry-run to apply.)');
    return;
  }

  // ── APPLY ──────────────────────────────────────────────────────────────────
  // 1. Sync note
  writeFileSync(join(ATLAS_DIR, 'Portfolio Sync.md'), renderSyncNote(rows, unmatched, projects.length));
  console.log('✓ wrote Vault/Atlas/Portfolio Sync.md');

  // 2. comments.md files from the plan
  let updated = 0, created = 0, unchanged = 0;
  for (const p of plan) {
    if (p.change === 'update') { writeFileSync(p.cmPath, p.next); updated++; }
    else if (p.change === 'create') { writeFileSync(p.cmPath, p.next); created++; }
    else unchanged++;
  }
  console.log(`✓ comments.md: ${updated} updated, ${created} created, ${unchanged} unchanged`);
  console.log(`  hand-written part: admin-won ${plan.filter(p => p.source === 'admin').length}, local-won ${plan.filter(p => p.source === 'local').length}`);

  // 3. Mirror back to Firestore for the admin "Vault comments" tab:
  //    per-folder hand-written comments (markers stripped) + folder catalog.
  const now = new Date().toISOString();
  const itemsMap = {};
  const catalog = [];
  for (const p of plan) {
    itemsMap[p.folder] = { mirror: p.hand, disk: p.hand, updatedAt: now };
    catalog.push({ folder: p.folder, doc: docFor(p.folder) ?? '' });
  }
  const fields = {
    items: { mapValue: { fields: Object.fromEntries(Object.entries(itemsMap).map(([k, v]) => [
      k, { mapValue: { fields: { mirror: { stringValue: v.mirror }, disk: { stringValue: v.disk }, updatedAt: { stringValue: v.updatedAt } } } },
    ])) } },
    catalog: { arrayValue: { values: catalog.map(c => ({ mapValue: { fields: { folder: { stringValue: c.folder }, doc: { stringValue: c.doc } } } })) } },
    syncedAt: { stringValue: now },
  };
  const patchRes = await fetch(`${base}/content/vault-comments.meta?${key}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!patchRes.ok) {
    console.warn(`⚠ could not write vault-comments.meta (${patchRes.status}) — admin tab will show stale mirrors`);
  } else {
    console.log(`✓ vault-comments.meta updated for ${Object.keys(itemsMap).length} folder(s)`);
  }
  if (unmatched.length) {
    console.log(`⚠ ${unmatched.length} unmatched: ${unmatched.map(u => `"${u.title}"`).join(', ')}`);
    console.log('  → add aliases in scripts/sync-to-vault.mjs ALIASES and re-run');
  }
}

main().catch(e => { console.error('✗ sync failed:', e.message); process.exit(1); });
