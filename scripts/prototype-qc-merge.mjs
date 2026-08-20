#!/usr/bin/env node
/**
 * prototype-qc-merge.mjs - the judgement half of the G-PROTO profile.
 *
 * prototype-qc.mjs measures what a machine can measure and leaves four things open, because they
 * need judgement, not measurement:
 *    B2  does every screen have an empty / loading / error / first-run / confirm / validation state
 *    B5  is the demo data plausible, the language right, the spelling clean
 *    B6  does the palette match the brief, are the brand assets really there
 *    plus confirming the runner's CANDIDATE lists (A2 dead controls, A3 emails)
 * and Tier C, which only a human can sign (real device pass, expectation framing).
 *
 * A reviewer (agent or human) walks the prototype following scripts/prototype-qc-agent-pass.md,
 * writes a fill file, and this script merges it in, rescores, and produces the FINAL report. The
 * scoring lives here, in code, so two reviewers cannot score the same findings differently.
 *
 * Usage:
 *   node scripts/prototype-qc-merge.mjs --report=prototype-qc.json --fill=prototype-qc.agent.json
 *        [--out=prototype-qc.json] [--json]
 *   (--judgements= is accepted as an alias for --fill)
 *
 * THE FILL FILE SHAPE (written by the reviewer following scripts/prototype-qc-agent-pass.md):
 *   {
 *     "reviewer": "who or what did this pass",
 *     "tierA": {
 *       "A2": { "deadControlsConfirmed": [] },      // [] = every candidate explained
 *       "A3": { "emailsConfirmed": [] }             // [] = all demo addresses are fictional
 *     },
 *     "tierB": {
 *       "B2": { "states": { "<screen>": { "empty": "present|missing|n/a", "loading": "...",
 *                  "error": "...", "first-run": "...", "destructive-confirm": "...",
 *                  "form-validation": "..." } } },
 *       "B4": { "duplicatedBlockClasses": 0 },     // -3 each (the runbook's B4 duplication slot)
 *       "B5": { "languageOk": true, "placeholdersOk": true, "plausible": true, "notes": "" },
 *       "B6": { "assetsOk": true, "paletteOk": true, "missingAssets": [], "notes": "" }
 *     },
 *     "tierC": { "acknowledged": true, "by": "<who>", "notes": ["C1: ...", "C2: ..."] }
 *   }
 * A CONFIRMED dead control or a CONFIRMED real email flips Tier A to FAIL. That is the point: the
 * runner's detectors over-report, the reviewer decides, this script enforces.
 *
 * Exit 0 only when the merged verdict is "pass". That is the file the prototype_qc gate accepts.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => { const a = args.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const asJson = args.includes('--json');
const abs = (p) => (isAbsolute(p) ? p : resolve(process.cwd(), p));

const reportPath = flag('report', 'prototype-qc.json');
// --fill is the spelling used by scripts/prototype-qc-agent-pass.md; --judgements is accepted as an
// alias so either wording works and neither runbook can silently fail.
const judgePath = flag('fill', flag('judgements', 'prototype-qc.agent.json'));
const outPath = flag('out', reportPath);

for (const [label, p] of [['report', reportPath], ['judgements', judgePath]]) {
  if (!existsSync(abs(p))) {
    console.error(`prototype-qc-merge: ${label} not found at ${p}`);
    console.error('  the report comes from prototype-qc.mjs; the fill file is written by the');
    console.error('  reviewer following scripts/prototype-qc-agent-pass.md');
    process.exit(2);
  }
}

const R = JSON.parse(readFileSync(abs(reportPath), 'utf8'));
const J = JSON.parse(readFileSync(abs(judgePath), 'utf8'));
if (R.profile !== 'G-PROTO') { console.error(`prototype-qc-merge: not a G-PROTO report (profile "${R.profile}")`); process.exit(2); }

const clamp = (n) => Math.max(0, Math.round(n));
const merged = [];

// ---------------------------------------------------------------------------
// TIER A - confirm the runner's candidates. Both detectors are deliberately
// over-eager; the reviewer decides which hits are real, and a CONFIRMED hit
// turns the check into a hard fail.
// ---------------------------------------------------------------------------
const a2 = R.tierA?.checks?.A2;
if (a2 && J.tierA?.A2) {
  const confirmed = J.tierA.A2.deadControlsConfirmed || [];
  a2.deadControlsConfirmed = confirmed.length ? confirmed : 'none';
  if (confirmed.length) {
    a2.status = 'fail';
    a2.detail = `${confirmed.length} confirmed dead control(s)`;
    a2.problems = [...(a2.problems || []), ...confirmed.map(c => `confirmed dead control: ${c}`)];
  }
  merged.push(`A2: ${confirmed.length} dead control(s) confirmed of ${(a2.deadControlCandidates || []).length} candidate(s)`);
}

const a3 = R.tierA?.checks?.A3;
if (a3 && J.tierA?.A3) {
  const confirmed = J.tierA.A3.emailsConfirmed || [];
  a3.emailsConfirmed = confirmed.length ? confirmed : 'none';
  if (confirmed.length) {
    a3.status = 'fail';
    a3.detail = `${confirmed.length} real personal detail(s) in demo data`;
    a3.hits = [...(a3.hits || []), ...confirmed.map(c => `confirmed real PII: ${c}`)];
  }
  merged.push(`A3: ${confirmed.length} real PII item(s) confirmed of ${(a3.emailCandidates || []).length} candidate(s)`);
}

// ---------------------------------------------------------------------------
// TIER B - the three judgement checks. Scoring per PROTOTYPE_QC_PROFILE.md.
// ---------------------------------------------------------------------------

// B2 state coverage (20): minus 4 per applicable state with no design.
// A state marked "n/a" (the screen genuinely cannot have it) does not deduct.
if (J.tierB?.B2) {
  const states = J.tierB.B2.states || {};
  const missing = [];
  for (const [screen, byState] of Object.entries(states)) {
    for (const [state, verdict] of Object.entries(byState)) {
      const v = String(verdict).toLowerCase();
      if (v === 'missing') missing.push(`${screen}: no ${state} state`);
      else if (v !== 'present' && v !== 'n/a') missing.push(`${screen}: ${state} still "${verdict}" (unreviewed)`);
    }
  }
  R.tierB.checks.B2 = {
    points: clamp(20 - 4 * missing.length), max: 20,
    detail: missing.length ? `${missing.length} state(s) missing or unreviewed` : 'every applicable state is designed',
    missing, states,
  };
  merged.push(`B2: ${R.tierB.checks.B2.points}/20`);
}

// B4 duplication (the runner scored the off-token half; the reviewer adds the duplication half).
// minus 3 per duplicated-block class, deducted from whatever the runner already awarded.
if (J.tierB?.B4) {
  const dup = Number(J.tierB.B4.duplicatedBlockClasses || 0);
  const prior = R.tierB.checks.B4 || { points: 15, max: 15, detail: '' };
  const before = prior.points ?? 15;
  R.tierB.checks.B4 = {
    ...prior,
    points: clamp(before - 3 * dup), max: 15,
    detail: dup ? `${prior.detail}; ${dup} duplicated-block class(es)` : prior.detail,
    duplicatedBlockClasses: dup,
  };
  merged.push(`B4: ${R.tierB.checks.B4.points}/15 (${dup} duplicated-block class(es))`);
}

// B5 content (15): minus 5 language mismatch, minus 5 placeholders, minus 5 implausible data.
// Placeholders were already detected mechanically; the reviewer confirms and adds plausibility.
if (J.tierB?.B5) {
  const b5 = J.tierB.B5;
  const prior = R.tierB.checks.B5 || {};
  const problems = [];
  if (b5.languageOk === false) problems.push(`language does not match the client market: ${b5.notes || 'see notes'}`);
  if (b5.placeholdersOk === false) problems.push('placeholder text still present');
  if (b5.plausible === false) problems.push('demo data is not plausible');
  R.tierB.checks.B5 = {
    points: clamp(15 - 5 * problems.length), max: 15,
    detail: problems.length ? `${problems.length} content problem(s)` : 'language, placeholders and data all clean',
    problems, machinePlaceholders: prior.slots?.placeholders || [], notes: b5.notes || null,
  };
  merged.push(`B5: ${R.tierB.checks.B5.points}/15`);
}

// B6 brand (10): minus 3 per missing asset, minus 4 for palette drift.
if (J.tierB?.B6) {
  const b6 = J.tierB.B6;
  const prior = R.tierB.checks.B6 || {};
  const missingAssets = b6.assetsOk === false ? (b6.missingAssets || prior.slots?.assets || ['unspecified']) : [];
  const drift = b6.paletteOk === false;
  R.tierB.checks.B6 = {
    points: clamp(10 - 3 * missingAssets.length - (drift ? 4 : 0)), max: 10,
    detail: missingAssets.length || drift ? `${missingAssets.length} asset problem(s)${drift ? ', palette drifts from the brief' : ''}` : 'brand assets present, palette matches the brief',
    missingAssets, paletteDrift: drift, notes: b6.notes || null,
  };
  merged.push(`B6: ${R.tierB.checks.B6.points}/10`);
}

// ---------------------------------------------------------------------------
// TIER C - the human signature. Cannot be inferred, only stated.
// ---------------------------------------------------------------------------
if (J.tierC) {
  R.tierC = {
    acknowledged: J.tierC.acknowledged === true,
    by: J.tierC.by || null,
    notes: J.tierC.notes || [],
  };
  merged.push(`Tier C: ${R.tierC.acknowledged ? `acknowledged by ${R.tierC.by || 'unnamed'}` : 'NOT acknowledged'}`);
}

// ---------------------------------------------------------------------------
// RESCORE + VERDICT. Same rules as the runner, applied once, here.
// ---------------------------------------------------------------------------
R.mergedAt = new Date().toISOString();
R.reviewer = J.reviewer || null;
R.mergeLog = merged;

const pending = Object.entries(R.tierB.checks).filter(([, c]) => c.points === null || c.points === undefined).map(([k]) => k);
R.tierB.score = Object.values(R.tierB.checks).reduce((n, c) => n + (c.points ?? 0), 0);
R.tierB.pending = pending;

R.tierA.verdict = Object.values(R.tierA.checks).some(c => c.status === 'fail') ? 'fail' : R.tierA.verdict;
const tierAOk = Object.values(R.tierA.checks).every(c => c.status === 'pass' || c.status === 'skipped');

R.notes = [];
if (pending.length) R.notes.push(`INCOMPLETE: still unscored -> ${pending.join(', ')}.`);
if (!R.tierC.acknowledged) R.notes.push('INCOMPLETE: Tier C not acknowledged.');
if (!R.surfaces?.gated) R.notes.push('INCOMPLETE: the gated surface was never tested (A1, B7).');

if (R.notes.length) R.verdict = 'incomplete';
else if (!tierAOk) R.verdict = 'fail';
else R.verdict = R.tierB.score >= R.tierB.bar ? 'pass' : 'fail';

writeFileSync(abs(outPath), JSON.stringify(R, null, 2));

if (asJson) console.log(JSON.stringify(R, null, 2));
else {
  console.log(`\nprototype-qc-merge  ${R.slug}  ->  ${R.verdict.toUpperCase()}`);
  console.log(`  reviewer: ${R.reviewer || '(unnamed)'}`);
  // A check that was never RUN is not a failure. Printing FAIL for it reads as a defect in the
  // prototype when the real cause is that a surface was not tested.
  const anyAFailed = Object.values(R.tierA.checks).some(c => c.status === 'fail');
  console.log(`\n  TIER A: ${anyAFailed ? 'FAIL' : tierAOk ? 'PASS' : 'INCOMPLETE (a check was not run)'}`);
  for (const [id, c] of Object.entries(R.tierA.checks)) console.log(`    ${c.status === 'pass' ? 'ok  ' : c.status === 'fail' ? 'FAIL' : '--  '} ${id}: ${c.detail}`);
  console.log(`\n  TIER B: ${R.tierB.score}/100 (bar ${R.tierB.bar})`);
  for (const [id, c] of Object.entries(R.tierB.checks)) console.log(`    ${c.points == null ? '(unscored)' : `${c.points}/${c.max}`.padEnd(10)} ${id}: ${c.detail}`);
  console.log(`\n  TIER C: ${R.tierC.acknowledged ? `acknowledged by ${R.tierC.by || 'unnamed'}` : 'NOT acknowledged'}`);
  for (const n of R.notes) console.log(`\n  ! ${n}`);
  console.log(`\n  final report written to ${outPath}`);
  if (R.verdict === 'pass') console.log('  this file is the receipt for the prototype_qc gate.');
}
process.exit(R.verdict === 'pass' ? 0 : 1);
