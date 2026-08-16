#!/usr/bin/env node
/**
 * design-lint.mjs — the enforcement loop from DESIGN_PIPELINE.md §0.0c, as runnable code.
 * KB-derived mechanical gates + axe accessibility scan. Run after every build until it passes.
 *
 * Usage:  node scripts/design-lint.mjs [url] [--route=A|B|C] [--json] [--config=path]
 * Deps (already present in fleet projects that do E2E):  playwright  @axe-core/playwright
 *   If missing:  npm i -D playwright @axe-core/playwright && npx playwright install chromium
 *
 * PER-PROJECT CALIBRATION — optional `design-lint.config.json` in the project root (or --config=path).
 * The heuristic gates (hero region, CTA detection, thresholds) are generic by default and WILL
 * false-positive on non-English sites or bespoke hero markup. Override per project:
 *   {
 *     "url": "http://localhost:3000",          // default scan target when no CLI url is given
 *     "route": "A",                            // A|B|C — C relaxes the hero-height ceiling
 *     "scroll": true,                          // scroll the page before the a11y scan so
 *                                              //   framer-motion whileInView content is caught
 *     "hero": { "selector": "section[aria-label=\"Hero\"]" },  // exact hero region (beats generic guess)
 *     "cta": { "regex": "loslegen|starten|get|start|try|demo", "flags": "i" }, // action-word matcher (localise!)
 *     "thresholds": { "maxLinks": 12, "maxHeroVh": 160, "maxFontSizes": 8, "maxHeroLinks": 5,
 *                     "maxLcpMs": 3000, "maxCls": 0.1, "maxTransferKb": 2500, "maxJsKb": 1200 },  // perf budget (G8)
 *     "skipGates": ["type-scale"]              // gate names to disable for this project (use sparingly)
 *   }
 * Only the keys you set are overridden; everything else keeps the KB default. CLI url/route win over config.
 *
 * Exit code 0 = all gates pass; 1 = at least one violation (so CI / an agent loop can gate on it).
 * Design heuristics are KB-sourced (DESIGN_METHODOLOGY_KB_SYNTHESIS_2026-08-11.md), tuned per project.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';

// ---- CLI ----
const args = process.argv.slice(2);
const flag = (name, def) => { const a = args.find(x => x.startsWith(`--${name}=`)); return a ? a.split('=').slice(1).join('=') : def; };
const positional = args.filter(a => !a.startsWith('--'));
const asJson = args.includes('--json');

// ---- Config (optional, per-project) ----
const cfgPath = flag('config', 'design-lint.config.json');
const cfgFile = isAbsolute(cfgPath) ? cfgPath : resolve(process.cwd(), cfgPath);
let cfg = {};
if (existsSync(cfgFile)) {
  try { cfg = JSON.parse(readFileSync(cfgFile, 'utf8')); }
  catch (e) { console.error(`design-lint: failed to parse ${cfgFile}: ${e.message}`); process.exit(2); }
}

const url = positional[0] || cfg.url;
const route = flag('route', cfg.route || 'A');
if (!url) { console.error('usage: node scripts/design-lint.mjs <url> [--route=A|B|C] [--json] [--config=path]  (or set "url" in design-lint.config.json)'); process.exit(2); }

// ---- Thresholds (KB defaults, config-overridable) ----
const T = {
  maxLinks: 12,                                   // whole-page ceiling; hero-region ~4.4 checked separately
  maxHeroVh: route === 'C' ? 100 : 90,            // false bottom kills scroll; Route C relaxes it
  maxFontSizes: 8,                                // distinct rendered font-sizes above the fold
  maxHeroLinks: 5,                                // clickables inside the hero (aim ~1 primary)
  // Performance budget (G8, DESIGN §0.0c "PageSpeed = release-blocker"). Core Web Vitals "good"
  // thresholds; a poor score FAILS the gate. Override per project in design-lint.config.json.
  maxLcpMs: 3000,                                 // Largest Contentful Paint (CWV good ≤2500; 3000 = ship floor)
  maxCls: 0.1,                                    // Cumulative Layout Shift (CWV good ≤0.1)
  maxTransferKb: 2500,                            // total bytes over the wire (0 on localhost — see note)
  maxJsKb: 1200,                                  // JS bytes over the wire
  ...(cfg.thresholds || {}),
};
const heroSelector = cfg.hero?.selector || '[data-hero], header, main > section, body > section, section';
const ctaRegex = cfg.cta?.regex || 'get|start|try|buy|book|sign|join|see|learn|demo|free';
const ctaFlags = cfg.cta?.flags || 'i';
const doScroll = cfg.scroll !== false;            // default ON — honest a11y needs animated content in view
const skip = new Set(cfg.skipGates || []);

const findings = [];
const fail = (gate, detail) => { if (!skip.has(gate)) findings.push({ gate, detail }); };

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
if (!resp || !resp.ok()) fail('reachable', `HTTP ${resp ? resp.status() : 'no response'}`);

// Scroll top->bottom->top so framer-motion whileInView / IntersectionObserver content settles to opacity:1
// (axe skips invisible nodes — without this the a11y scan gives a false clean).
if (doScroll) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  });
}

// --- Mechanical gates (KB) ---
const m = await page.evaluate(({ maxHeroVh, heroSelector, ctaRegex, ctaFlags }) => {
  const vh = window.innerHeight;
  const cta = new RegExp(ctaRegex, ctaFlags);
  const foldEls = [...document.body.querySelectorAll('*')].filter(el => {
    const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && r.width > 0 && r.height > 0;
  });
  const q = s => document.querySelectorAll(s).length;
  const hero = document.querySelector(heroSelector);
  const heroVh = hero ? Math.round((hero.getBoundingClientRect().height / vh) * 100) : null;
  const heroLinks = hero ? hero.querySelectorAll('a,button').length : null;
  const fontSizes = new Set(foldEls.map(el => getComputedStyle(el).fontSize));
  const inputs = [...document.querySelectorAll('input,select,textarea')];
  const unlabeled = inputs.filter(el => {
    if (el.type === 'hidden') return false;
    const id = el.id;
    const hasLabel = (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label') ||
      el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    return !hasLabel;
  }).length;
  const h1 = q('h1'), h2 = q('h2');
  const foldHasCTA = foldEls.some(el => /^(a|button)$/i.test(el.tagName) && cta.test(el.textContent || ''));
  const totalLinks = q('a[href]');
  return { vh, heroVh, heroLinks, heroFound: !!hero, fontSizeCount: fontSizes.size, unlabeled, h1, h2, foldHasCTA, totalLinks };
}, { maxHeroVh: T.maxHeroVh, heroSelector, ctaRegex, ctaFlags });

if (m.totalLinks > T.maxLinks) fail('link-count', `${m.totalLinks} links (ceiling ${T.maxLinks})`);
if (m.heroLinks != null && m.heroLinks > T.maxHeroLinks) fail('hero-attention-ratio', `${m.heroLinks} clickables in hero (max ${T.maxHeroLinks}, aim ~1 primary)`);
if (m.heroVh != null && m.heroVh > T.maxHeroVh) fail('hero-height', `hero ${m.heroVh}vh (max ${T.maxHeroVh}vh — false bottom kills scroll)`);
if (m.fontSizeCount > T.maxFontSizes) fail('type-scale', `${m.fontSizeCount} distinct font sizes above fold (max ${T.maxFontSizes})`);
if (m.unlabeled > 0) fail('input-labels', `${m.unlabeled} input(s) without a linked label/aria-label`);
if (m.h1 !== 1) fail('h1-single', `${m.h1} <h1> (expected exactly 1)`);
if (!m.foldHasCTA) fail('cta-above-fold', 'no action CTA detected above the fold (localise cta.regex in design-lint.config.json?)');

// --- Accessibility (axe, WCAG 2 A/AA) ---
try {
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  for (const v of axe.violations) {
    const where = v.nodes.slice(0, 3).map(n => (n.target || []).join(' ')).join('  |  ');
    fail(`a11y:${v.id}`, `${v.impact}: ${v.help} (${v.nodes.length} node(s)) ${where ? '→ ' + where : ''}`);
  }
} catch (e) { fail('a11y:scan', `axe failed: ${e.message}`); }

// --- Performance budget (G8 / §0.0c PageSpeed release-blocker) ---
// Core Web Vitals measured in-page (LCP, CLS via buffered PerformanceObserver) + wire-weight from
// the resource timing API. No extra dependency — same Chromium as the rest of the lint. Note:
// transferSize is 0 for same-origin localhost/preview without proper headers, so on a local preview
// the weight gates read 0 (pass); LCP/CLS still measure. Point the lint at a real staging/prod URL
// for a true weight budget. Skippable per project via skipGates: ["perf-lcp","perf-cls",...].
try {
  const perf = await page.evaluate(() => new Promise((res) => {
    let lcp = 0, cls = 0;
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = Math.max(lcp, e.renderTime || e.loadTime || e.startTime || 0); }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    } catch { /* browser without CWV observers — LCP/CLS stay 0, gates pass */ }
    let totalKb = 0, jsKb = 0;
    for (const r of performance.getEntriesByType('resource')) {
      const kb = (r.transferSize || 0) / 1024; totalKb += kb;
      if (/\.m?js(\?|$)/i.test(r.name || '') || r.initiatorType === 'script') jsKb += kb;
    }
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) totalKb += (nav.transferSize || 0) / 1024;
    setTimeout(() => res({ lcp: Math.round(lcp), cls: Math.round(cls * 1000) / 1000, totalKb: Math.round(totalKb), jsKb: Math.round(jsKb) }), 600);
  }));
  if (perf.lcp > T.maxLcpMs) fail('perf-lcp', `LCP ${perf.lcp}ms (budget ${T.maxLcpMs}ms — Core Web Vitals)`);
  if (perf.cls > T.maxCls) fail('perf-cls', `CLS ${perf.cls} (budget ${T.maxCls})`);
  if (perf.totalKb > T.maxTransferKb) fail('perf-weight', `${perf.totalKb}KB transferred (budget ${T.maxTransferKb}KB)`);
  if (perf.jsKb > T.maxJsKb) fail('perf-js', `${perf.jsKb}KB JS over the wire (budget ${T.maxJsKb}KB)`);
} catch (e) { fail('perf:scan', `perf measurement failed: ${e.message}`); }

// --- Mobile skim: H1/CTA above the fold at 390px ---
await page.setViewportSize({ width: 390, height: 844 });
const mob = await page.evaluate((ctaSrc) => {
  const vh = window.innerHeight;
  const cta = new RegExp(ctaSrc.regex, ctaSrc.flags);
  const above = sel => [...document.querySelectorAll(sel)].some(el => el.getBoundingClientRect().top < vh);
  return { h1: above('h1'), cta: [...document.querySelectorAll('a,button')].some(el => el.getBoundingClientRect().top < vh && cta.test(el.textContent || '')) };
}, { regex: ctaRegex, flags: ctaFlags });
if (!mob.h1) fail('mobile-h1-fold', 'H1 not above the fold at 390px');
if (!mob.cta) fail('mobile-cta-fold', 'CTA not above the fold at 390px');

await browser.close();

const pass = findings.length === 0;
if (asJson) { console.log(JSON.stringify({ url, route, config: existsSync(cfgFile) ? cfgFile : null, pass, findings }, null, 2)); }
else {
  console.log(`\ndesign-lint  ${url}  [route ${route}]${existsSync(cfgFile) ? '  (config: ' + cfgPath + ')' : ''}  ->  ${pass ? 'PASS ✔' : `FAIL ✘ (${findings.length})`}`);
  if (!m.heroFound) console.log(`  ⚠ hero selector "${heroSelector}" matched nothing — set hero.selector in design-lint.config.json`);
  for (const f of findings) console.log(`  ✘ ${f.gate}: ${f.detail}`);
  if (pass) console.log('  all gates clean');
}
process.exit(pass ? 0 : 1);
