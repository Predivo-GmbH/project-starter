#!/usr/bin/env node
/**
 * prototype-qc.mjs - the G-PROTO profile from Audits/PROTOTYPE_QC_PROFILE.md, as runnable code.
 * QC gate for a CLIENT-FACING prototype. Separate from design-lint.mjs on purpose (decision D4):
 * different subject, different gates, and design-lint stays untouched as the deploy gate.
 *
 * Usage:
 *   node scripts/prototype-qc.mjs --local=http://localhost:4173 [--gated=<share link>] \
 *        [--config=prototype-qc.config.json] [--out=prototype-qc.json] [--json]
 *
 * Deps (same stack as design-lint.mjs, nothing new):  playwright  @axe-core/playwright
 *
 * TWO SURFACES (see the profile doc). Inside the portal the prototype is rendered via iframe
 * srcDoc, where the document URL is about:srcdoc - so location.search / location.hash do NOT
 * carry through and screens are NOT individually addressable there. Therefore:
 *   LOCAL preview  -> A2 A4 B1 B2 B3 B4 B5 B6   (screens addressable, deep checks)
 *   GATED share URL -> A1 B7                    (the artifact the client actually opens)
 * Weight is never measured on localhost: same-origin localhost reports transferSize 0.
 *
 * Exit 0 only when verdict === "pass". Exit 1 on fail OR incomplete (missing surface / unfilled
 * manual slots), so an agent loop or CI can gate on it and cannot pass by omission.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';

const PROFILE_VERSION = '1.0';

// ---- CLI ----
const args = process.argv.slice(2);
const flag = (n, d) => { const a = args.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const asJson = args.includes('--json');

const cfgPath = flag('config', 'prototype-qc.config.json');
const cfgFile = isAbsolute(cfgPath) ? cfgPath : resolve(process.cwd(), cfgPath);
let cfg = {};
if (existsSync(cfgFile)) {
  try { cfg = JSON.parse(readFileSync(cfgFile, 'utf8')); }
  catch (e) { console.error(`prototype-qc: failed to parse ${cfgFile}: ${e.message}`); process.exit(2); }
}

const local = flag('local', cfg.local);
const gated = flag('gated', cfg.gated || null);
const outPath = flag('out', cfg.out || 'prototype-qc.json');
if (!local) {
  console.error('usage: node scripts/prototype-qc.mjs --local=<preview url> [--gated=<share link>] [--config=path] [--out=path] [--json]');
  process.exit(2);
}

// ---- Config ----
const slug = cfg.slug || 'unknown';
const screenParam = cfg.screenParam || 'hash';                 // query-param name, or "hash"
const screens = cfg.screens || [];                             // screens the build actually has
const briefScreens = cfg.briefScreens || [];                   // screens the brief demands (A2)
const widths = cfg.widths || [375, 390, 500, 600, 700, 768, 900, 1024, 1100, 1440];
const shortVp = cfg.shortViewport || { width: 390, height: 480 };
const primarySel = cfg.primarySelector || '[data-primary], main button, main a[href]';
const tokensPath = cfg.tokens || 'docs/design-tokens.json';
const maxClicksPerScreen = cfg.maxClicksPerScreen ?? 40;
const skip = new Set(cfg.skipChecks || []);
const T = { maxLcpMs: 3000, maxTransferKb: 2500, ...(cfg.thresholds || {}) };
// B5 language: the expected language is the CLIENT'S MARKET language, taken from the project
// config, never a hardcoded English default. (Roger 2026-08-19: the English-only rule in
// DESIGN_PIPELINE.md:151 governs the client PORTAL, not the prototype build.)
const languageGate = cfg.languageGate || null;                 // e.g. {"expect":"de"}

const screenUrl = (s) => screenParam === 'hash'
  ? `${local.replace(/\/$/, '')}/#/${s}`
  : `${local}${local.includes('?') ? '&' : '?'}${screenParam}=${encodeURIComponent(s)}`;

// ---- Result scaffold ----
const R = {
  profile: 'G-PROTO', version: PROFILE_VERSION, slug,
  generatedAt: new Date().toISOString(),
  surfaces: { local, gated },
  tierA: { verdict: 'pass', checks: {} },
  tierB: { score: 0, bar: 85, checks: {} },
  tierC: { acknowledged: false, by: null, notes: [] },
  notes: [], verdict: 'incomplete',
};
const A = (id, status, detail, extra = {}) => { R.tierA.checks[id] = { status, detail, ...extra }; if (status === 'fail') R.tierA.verdict = 'fail'; };
const B = (id, pts, max, detail, extra = {}) => { R.tierB.checks[id] = { points: pts, max, detail, ...extra }; };
const manual = (id, max, detail, slots) => { R.tierB.checks[id] = { points: null, max, status: 'manual-pending', detail, slots }; };

const browser = await chromium.launch();

// =====================================================================================
// LOCAL SURFACE
// =====================================================================================
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ screen: current, text: m.text().slice(0, 300) }); });
page.on('pageerror', (e) => consoleErrors.push({ screen: current, text: String(e.message || e).slice(0, 300) }));
let current = '(boot)';

const goto = async (s) => { current = s; const r = await page.goto(screenUrl(s), { waitUntil: 'networkidle', timeout: 60000 }); await page.waitForTimeout(250); return r; };

// ---- A2 flow completeness -----------------------------------------------------------
if (!skip.has('A2')) {
  const missing = briefScreens.filter(s => !screens.includes(s));
  const empty = [];
  const dead = [];
  const truncated = [];
  for (const s of screens) {
    const resp = await goto(s);
    if (!resp || !resp.ok()) { empty.push(`${s}: HTTP ${resp ? resp.status() : 'no response'}`); continue; }
    const filled = await page.evaluate(() => (document.body.innerText || '').trim().length);
    if (filled < 20) empty.push(`${s}: renders < 20 chars of text`);

    // Dead-control probe: click each interactive element and look for ANY observable change.
    // React handlers are props, not DOM attributes, so presence cannot be inspected statically -
    // the only honest test is to click and diff.
    const count = await page.locator('button, a[href], [role="button"]').count();
    const probe = Math.min(count, maxClicksPerScreen);
    if (count > probe) truncated.push(`${s}: probed ${probe}/${count} controls (maxClicksPerScreen)`);
    for (let i = 0; i < probe; i++) {
      await goto(s);
      const el = page.locator('button, a[href], [role="button"]').nth(i);
      let label = '';
      try {
        if (!(await el.isVisible()) || !(await el.isEnabled())) continue;
        if (await el.getAttribute('aria-disabled') === 'true') continue;
        // A nav item for the screen you are already on legitimately does nothing.
        if (await el.evaluate(n => n.matches('[aria-current], .active, [data-active="true"]')).catch(() => false)) continue;
        label = ((await el.innerText().catch(() => '')) || (await el.getAttribute('aria-label')) || `#${i}`).trim().slice(0, 40);
        const before = await page.evaluate(() => document.body.innerHTML.length + '|' + location.href);
        await el.click({ timeout: 3000, noWaitAfter: true });
        await page.waitForTimeout(500);
        const after = await page.evaluate(() => document.body.innerHTML.length + '|' + location.href);
        if (before === after) dead.push(`${s}: "${label || '#' + i}" produced no observable change`);
      } catch { /* element detached by its own click = it did something; not dead */ }
    }
  }
  // HARD fail only on what a machine can be certain of: a brief screen missing, unreachable, or
  // rendering empty. Dead-control detection is a heuristic (an already-active nav item, a control
  // whose effect is off-screen), so its hits are CANDIDATES a human confirms in the agent pass.
  const fails = [...missing.map(s => `brief screen missing: ${s}`), ...empty];
  A('A2', fails.length ? 'fail' : 'pass',
    fails.length ? `${fails.length} flow problem(s)` : `${screens.length} screen(s) reachable, ${briefScreens.length} brief screen(s) present`,
    { problems: fails, deadControlCandidates: dead, deadControlsConfirmed: dead.length ? 'manual-pending' : 'none', truncated });
} else A('A2', 'skipped', 'skipChecks');

// ---- A4 console clean ---------------------------------------------------------------
if (!skip.has('A4')) {
  A('A4', consoleErrors.length ? 'fail' : 'pass',
    consoleErrors.length ? `${consoleErrors.length} console error(s)` : 'no console errors across all screens',
    { errors: consoleErrors.slice(0, 20) });
} else A('A4', 'skipped', 'skipChecks');

// ---- A3 demo-data safety (static scan of the served bundle) -------------------------
if (!skip.has('A3')) {
  await goto(screens[0] || '');
  const sources = await page.evaluate(async () => {
    const urls = [location.href,
      ...[...document.querySelectorAll('script[src]')].map(s => s.src),
      ...[...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href)];
    const out = [];
    for (const u of urls) {
      try { const r = await fetch(u); out.push({ url: u, text: (await r.text()).slice(0, 2_000_000) }); } catch { /* unreachable asset */ }
    }
    out.push({ url: 'inline', text: document.documentElement.outerHTML });
    return out;
  });
  const SECRETS = [
    [/\bsk_(live|test)_[A-Za-z0-9]{10,}/, 'Stripe secret key'],
    [/\bservice_role\b/, 'service_role reference'],
    [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, 'JWT'],
    [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
    [/\bBearer\s+[A-Za-z0-9._-]{20,}/, 'hardcoded bearer token'],
    [/\bapi[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{16,}["']/i, 'apiKey literal'],
  ];
  const TRACKERS = /google-analytics\.com|googletagmanager\.com|connect\.facebook\.net|hotjar\.com|segment\.(io|com)|mixpanel\.com|clarity\.ms/i;
  const hits = [];
  for (const s of sources) {
    for (const [re, what] of SECRETS) if (re.test(s.text)) hits.push(`${what} in ${s.url}`);
    if (TRACKERS.test(s.text)) hits.push(`third-party tracker referenced in ${s.url}`);
  }
  // PII heuristic: real-looking emails that are not obviously placeholders.
  // The TLD must be alphabetic: the previous pattern matched CSS font-axis strings such as
  // "wght@9..144" and reported them as email addresses.
  const emails = [...new Set((sources.map(s => s.text).join('\n').match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,10}\b/g) || [])
    .filter(e => !/example\.(com|org)|test\.|\.local|localhost|@sentry|@your|@\d/i.test(e)))].slice(0, 10);
  // Secrets and trackers hard-fail. A demo email may be entirely fictional, so it is a candidate
  // for a human to confirm rather than an automatic block.
  A('A3', hits.length ? 'fail' : 'pass',
    hits.length ? `${hits.length} finding(s)` : `no secrets or trackers found; ${emails.length} email(s) to confirm`,
    { hits, emailCandidates: emails, emailsConfirmed: emails.length ? 'manual-pending' : 'none' });
} else A('A3', 'skipped', 'skipChecks');

// ---- B1 responsive (20) --------------------------------------------------------------
if (!skip.has('B1')) {
  const problems = [];
  const warnings = [];
  for (const s of screens) {
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 900 });
      await goto(s);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 1) problems.push(`${s} @${w}px: horizontal overflow ${overflow}px`);
    }
    // v11 Gate A: primary action reachable at short viewport (landscape / on-screen keyboard).
    await page.setViewportSize(shortVp);
    await goto(s);
    const reach = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { found: false };
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { found: true, ok: r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
    }, primarySel);
    if (reach.found && !reach.ok) problems.push(`${s} @${shortVp.width}x${shortVp.height}: primary action not fully reachable (top ${reach.top}, bottom ${reach.bottom}, viewport ${reach.vh})`);
    // A selector that matches nothing is a CALIBRATION problem, not a defect in the prototype.
    // Scoring it would punish the build for the config being wrong.
    if (!reach.found) warnings.push(`${s}: primarySelector "${primarySel}" matched nothing - set primarySelector (or primarySelectorByScreen) in the config`);
  }
  B('B1', Math.max(0, 20 - 4 * problems.length), 20, problems.length ? `${problems.length} responsive problem(s)` : `clean across ${screens.length} screen(s) x ${widths.length} width(s)`, { problems, warnings });
} else B('B1', 20, 20, 'skipped');

// ---- B3 accessibility (15) ------------------------------------------------------------
if (!skip.has('B3')) {
  await page.setViewportSize({ width: 1440, height: 900 });
  const violations = new Map();
  for (const s of screens) {
    await goto(s);
    try {
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      for (const v of axe.violations) {
        const prev = violations.get(v.id) || { impact: v.impact, help: v.help, screens: [], nodes: 0 };
        prev.screens.push(s); prev.nodes += v.nodes.length; violations.set(v.id, prev);
      }
    } catch (e) { violations.set(`scan:${s}`, { impact: 'unknown', help: `axe failed: ${e.message}`, screens: [s], nodes: 0 }); }
  }
  // focus visibility + touch targets at mobile width
  await page.setViewportSize({ width: 390, height: 844 });
  const extra = [];
  for (const s of screens) {
    await goto(s);
    const t = await page.evaluate(() => ({
      small: [...document.querySelectorAll('button, a[href], [role="button"], input, select')]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); }).length,
    }));
    // Focus must be driven by the KEYBOARD. A programmatic el.focus() does not match :focus-visible,
    // which is how Tailwind and most design systems draw the ring, so it reports a false miss.
    await page.keyboard.press('Tab');
    const focusOk = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px') || cs.boxShadow !== 'none';
    });
    if (t.small > 0) extra.push(`${s}: ${t.small} touch target(s) under 44px`);
    if (focusOk === false) extra.push(`${s}: no visible focus ring on the first tab stop`);
  }
  const pts = Math.max(0, 15 - 3 * violations.size - 3 * Math.min(extra.length, 2));
  B('B3', pts, 15, `${violations.size} axe violation type(s), ${extra.length} focus/target problem(s)`,
    { axe: [...violations.entries()].map(([id, v]) => ({ id, impact: v.impact, help: v.help, nodes: v.nodes, screens: v.screens })), extra });
} else B('B3', 15, 15, 'skipped');

// ---- B4 token discipline (15, mechanical half) ----------------------------------------
if (!skip.has('B4')) {
  const tf = isAbsolute(tokensPath) ? tokensPath : resolve(process.cwd(), tokensPath);
  if (!existsSync(tf)) {
    manual('B4', 15, `tokens file not found at ${tokensPath} - cannot check off-token values mechanically`, { offToken: null, duplication: null });
  } else {
    const tokens = JSON.parse(readFileSync(tf, 'utf8'));
    // Normalise both sides to 6-digit lowercase hex, and accept a token stated as rgb() too.
    const norm = (h) => {
      h = h.trim().toLowerCase();
      const rgb = h.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      if (rgb) return '#' + [1, 2, 3].map(i => (+rgb[i]).toString(16).padStart(2, '0')).join('');
      if (/^#[0-9a-f]{3}$/.test(h)) return '#' + h.slice(1).split('').map(c => c + c).join('');
      if (/^#[0-9a-f]{8}$/.test(h)) return h.slice(0, 7);
      if (/^#[0-9a-f]{4}$/.test(h)) return '#' + h.slice(1, 4).split('').map(c => c + c).join('');
      return h;
    };
    const tokenText = JSON.stringify(tokens);
    const known = new Set([
      ...(tokenText.match(/#[0-9a-fA-F]{3,8}\b/g) || []),
      ...(tokenText.match(/rgba?\([^)]+\)/g) || []),
    ].map(norm));
    // Neutral primitives are legitimate everywhere and are not token drift.
    ['#ffffff', '#000000'].forEach(h => known.add(h));
    // Scan what is actually PAINTED, not every hex in the stylesheet. Tailwind ships a large
    // default palette in CSS; scanning raw CSS text reports the whole unused palette as drift.
    const used = await page.evaluate(() => {
      const seen = new Set();
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor']) {
          const v = cs[prop];
          if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
          seen.add(v);
        }
      }
      return [...seen];
    });
    const off = [...new Set(used.map(norm))].filter(h => !known.has(h));
    // Duplication is a judgement call, not a regex: left as a manual slot.
    B('B4', Math.max(0, 15 - 3 * Math.min(off.length, 3)), 15,
      off.length ? `${off.length} colour(s) outside design-tokens.json` : 'all colours resolve to tokens',
      { offToken: off.slice(0, 20), duplication: 'manual-pending' });
  }
} else B('B4', 15, 15, 'skipped');

// ---- B5 content correctness (15, placeholders mechanical, rest manual) ----------------
if (!skip.has('B5')) {
  const PLACEHOLDER = /lorem ipsum|\bTODO\b|\bFIXME\b|placeholder|screen\s?\d+\b|\bxxx+\b/i;
  const hits = [];
  for (const s of screens) {
    await goto(s);
    const txt = await page.evaluate(() => document.body.innerText || '');
    const m = txt.match(PLACEHOLDER);
    if (m) hits.push(`${s}: "${m[0]}"`);
  }
  const langNote = languageGate
    ? `expected language: ${languageGate.expect} (client market, from config)`
    : 'no languageGate set in the config - set {"expect":"<lang>"} to the client market language';
  manual('B5', 15, `${hits.length} placeholder hit(s); ${langNote}; data plausibility needs a human`,
    { placeholders: hits, language: languageGate ? 'pending-run' : 'disabled', plausibility: 'manual-pending' });
} else B('B5', 15, 15, 'skipped');

// ---- B6 brand fidelity (10, assets mechanical, palette manual) -------------------------
if (!skip.has('B6')) {
  await goto(screens[0] || '');
  const brand = await page.evaluate(() => {
    const icons = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map(l => ({ rel: l.rel, sizes: l.sizes?.value || '', href: l.href }));
    const logo = !!document.querySelector('img[alt*="logo" i], svg[aria-label*="logo" i], [data-logo]');
    return { icons, logo };
  });
  const missing = [];
  if (!brand.logo) missing.push('no logo element found');
  for (const want of ['16', '32', '180']) if (!brand.icons.some(i => i.sizes.includes(want) || /apple-touch/.test(i.rel))) missing.push(`favicon ${want} missing`);
  manual('B6', 10, `${missing.length} brand asset problem(s); palette-vs-brief match needs a human`,
    { assets: missing, icons: brand.icons, palette: 'manual-pending' });
} else B('B6', 10, 10, 'skipped');

// ---- B2 state coverage (20) - not automatable, emit the slots ---------------------------
if (!skip.has('B2')) {
  const STATES = ['empty', 'loading', 'error', 'first-run', 'destructive-confirm', 'form-validation'];
  manual('B2', 20, 'G11 state coverage per screen - fill each slot in the agent pass',
    Object.fromEntries(screens.map(s => [s, Object.fromEntries(STATES.map(st => [st, 'unknown']))])));
} else B('B2', 20, 20, 'skipped');

await ctx.close();

// =====================================================================================
// GATED SURFACE  (A1 + B7). Without it the run is INCOMPLETE by design (decision D5).
// =====================================================================================
if (gated) {
  const gctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gpage = await gctx.newPage();
  const hosts = new Set();
  gpage.on('request', (r) => { try { hosts.add(new URL(r.url()).host); } catch { /* data:/blob: */ } });
  const gErrors = [];
  gpage.on('pageerror', (e) => gErrors.push(String(e.message || e).slice(0, 200)));

  const gresp = await gpage.goto(gated, { waitUntil: 'networkidle', timeout: 90000 });
  await gpage.waitForTimeout(2500);
  const gateHost = new URL(gated).host;
  const foreign = [...hosts].filter(h => h !== gateHost && !h.endsWith('supabase.co'));

  // The prototype renders inside an iframe (srcDoc). Confirm it actually painted.
  const painted = await gpage.evaluate(() => {
    const f = document.querySelector('iframe');
    if (!f) return { iframe: false, chars: (document.body.innerText || '').trim().length };
    try { return { iframe: true, chars: (f.contentDocument?.body?.innerText || '').trim().length }; }
    catch { return { iframe: true, chars: -1, note: 'cross-origin, cannot read - treat as manual' }; }
  });

  const a1 = [];
  if (!gresp || !gresp.ok()) a1.push(`gated URL returned HTTP ${gresp ? gresp.status() : 'nothing'}`);
  if (foreign.length) a1.push(`external host(s) requested: ${foreign.join(', ')}`);
  if (painted.chars === 0) a1.push('prototype frame rendered empty');
  if (gErrors.length) a1.push(`${gErrors.length} error(s) on the gated page`);
  A('A1', a1.length ? 'fail' : 'pass', a1.length ? `${a1.length} gate problem(s)` : `renders through the gate, no external hosts`, { problems: a1, hosts: [...hosts], painted });

  if (!skip.has('B7')) {
    const perf = await gpage.evaluate(() => new Promise((res) => {
      let lcp = 0;
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = Math.max(lcp, e.renderTime || e.loadTime || e.startTime || 0); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch { /* no CWV */ }
      let totalKb = 0, largest = { name: null, kb: 0 };
      for (const r of performance.getEntriesByType('resource')) {
        const kb = (r.transferSize || 0) / 1024; totalKb += kb;
        if (kb > largest.kb) largest = { name: (r.name || '').split('/').pop(), kb: Math.round(kb) };
      }
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) totalKb += (nav.transferSize || 0) / 1024;
      setTimeout(() => res({ lcp: Math.round(lcp), totalKb: Math.round(totalKb), largest }), 800);
    }));
    let pts = 5;
    if (perf.lcp > T.maxLcpMs) pts -= 3;
    if (perf.totalKb > T.maxTransferKb) pts -= 2;
    B('B7', Math.max(0, pts), 5, `LCP ${perf.lcp}ms (budget ${T.maxLcpMs}), ${perf.totalKb}KB transferred (budget ${T.maxTransferKb}), largest asset ${perf.largest.name || 'n/a'} ${perf.largest.kb}KB`, { perf });
  } else B('B7', 5, 5, 'skipped');
  await gctx.close();
} else {
  A('A1', 'not-run', 'no --gated share link supplied; publish the prototype first (branch step publish-prototype)');
  R.tierB.checks.B7 = { points: null, max: 5, status: 'not-run', detail: 'weight must be measured on the real gated URL, never localhost' };
  R.notes.push('INCOMPLETE: the gated surface was not tested. A1 and B7 cannot pass from a local preview.');
}

await browser.close();

// =====================================================================================
// SCORE + VERDICT
// =====================================================================================
const pending = Object.entries(R.tierB.checks).filter(([, c]) => c.points === null).map(([k]) => k);
R.tierB.score = Object.values(R.tierB.checks).reduce((n, c) => n + (c.points ?? 0), 0);
R.tierB.pending = pending;
const tierAOk = R.tierA.verdict === 'pass' && Object.values(R.tierA.checks).every(c => c.status === 'pass' || c.status === 'skipped');

if (!gated || pending.length || !R.tierC.acknowledged) {
  R.verdict = 'incomplete';
  if (pending.length) R.notes.push(`INCOMPLETE: manual slots unfilled -> ${pending.join(', ')}. Run the agent pass and merge its output.`);
  if (!R.tierC.acknowledged) R.notes.push('INCOMPLETE: Tier C (real-device pass, expectation framing) not acknowledged.');
} else if (!tierAOk) R.verdict = 'fail';
else R.verdict = R.tierB.score >= R.tierB.bar ? 'pass' : 'fail';

writeFileSync(resolve(process.cwd(), outPath), JSON.stringify(R, null, 2));

if (asJson) console.log(JSON.stringify(R, null, 2));
else {
  const mark = { pass: 'PASS', fail: 'FAIL', incomplete: 'INCOMPLETE' }[R.verdict];
  console.log(`\nprototype-qc  ${slug}  [G-PROTO v${PROFILE_VERSION}]  ->  ${mark}`);
  console.log(`  local:  ${local}`);
  console.log(`  gated:  ${gated || '(not supplied)'}`);
  console.log(`\n  TIER A (hard block): ${R.tierA.verdict.toUpperCase()}`);
  for (const [id, c] of Object.entries(R.tierA.checks)) {
    console.log(`    ${c.status === 'pass' ? 'ok  ' : c.status === 'fail' ? 'FAIL' : '--  '} ${id}: ${c.detail}`);
    for (const p of (c.problems || c.hits || c.errors || []).slice(0, 8)) console.log(`         - ${typeof p === 'string' ? p : p.text || JSON.stringify(p)}`);
  }
  console.log(`\n  TIER B: ${R.tierB.score}/100 (bar ${R.tierB.bar})`);
  for (const [id, c] of Object.entries(R.tierB.checks)) console.log(`    ${c.points === null ? '(manual)' : `${c.points}/${c.max}`.padEnd(8)} ${id}: ${c.detail}`);
  for (const n of R.notes) console.log(`\n  ! ${n}`);
  console.log(`\n  report written to ${outPath}`);
}
process.exit(R.verdict === 'pass' ? 0 : 1);
