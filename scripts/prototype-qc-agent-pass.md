# PROTOTYPE QC — AGENT PASS (G-PROTO, the human/agent half)

The runner `scripts/prototype-qc.mjs` fills A1–A4, B1, B3, B4(mechanical), B7 mechanically and
leaves the judgement slots `manual-pending` (points `null`). Until every slot is filled AND Tier C
is acknowledged, the report verdict is **`incomplete` and the `prototype_qc` gate cannot pass**.
That is by design — do NOT weaken it; an `incomplete` verdict is the correct output of an
unfinished run.

Profile: `Audits/PROTOTYPE_QC_PROFILE.md`. Gate wiring: cockpit `qa` step, gate `prototype_qc`.

## The pass, in order

### 0. Run the runner
```
npm run build && npm run preview          # or vite preview on the config's local port
node scripts/prototype-qc.mjs --local=http://localhost:4173 --config=prototype-qc.config.json
# add --gated=<share link> once the publish-prototype step has produced the real URL (A1 + B7)
```

### 1. Visual pass — use the existing `design-review` skill (do NOT write a new one)
The `design-review` skill (`.claude/skills/design-review/`, Playwright-driven, Stripe/Airbnb/Linear
standard) is the visual half of this pass: walk every screen at desktop 1440 / tablet 768 / mobile
375, exercise the interactive elements, watch the console. Its findings feed slots B2/B5/B6 below
and confirm/deny the A2 dead-control candidates.

### 2. Fill the slots (evidence required, not vibes)

- **A2 `deadControlCandidates`** — for each candidate, click it yourself (design-review walk).
  `clean` = every candidate is explained (already-active nav, off-screen effect, deliberate stub
  WITH visible feedback). `dead` = one silent dead control → Tier A FAILS. Record one note per
  candidate saying WHAT it did.
- **A3 `emailCandidates`** — `fictional` = invented demo addresses (check they are not a real
  person's name + real domain together). `real-pii` → Tier A FAILS.
- **B2 state coverage, PER SCREEN** — the G11 list (`DESIGN_PIPELINE.md` Step 0.7): `empty`,
  `loading`, `error`, `first-run`, `destructive-confirm`, `form-validation`. For each screen mark
  every state `present` / `missing` / `n/a` (a screen with no list has `empty: n/a`; a screen with
  no form has `form-validation: n/a` — but be honest: a table that CAN be empty needs the empty
  state). Scoring: −4 per applicable `missing`.
- **B4 duplication** — eyeball the component tree for repeated markup blocks that should be one
  component. `clean` or an integer count of duplicated-block classes (−3 each).
- **B5 content** — language from the PROJECT CONFIG `languageGate.expect` (the client's market
  language, NEVER an English default — Roger ruling 2026-08-19: English-only governs the client
  PORTAL, not the prototype build). Read every screen: spelling in THAT language, no lorem /
  "Screen N" / placeholder labels, demo data plausible and internally consistent (dates, totals,
  names). `language: match|mismatch`, `spelling: clean|issues`, `plausibility: plausible|implausible`.
- **B6 palette** — palette-vs-BRIEF (the project DESIGN_BRIEF / brand book), not vs your taste:
  `match|drift`. The runner already checked logo element + favicons mechanically.

### 3. Merge
Write the fills to `prototype-qc.agent.json`:
```json
{
  "reviewer": "who or what did this pass",
  "tierA": {
    "A2": { "deadControlsConfirmed": [] },
    "A3": { "emailsConfirmed": [] }
  },
  "tierB": {
    "B2": {
      "states": {
        "dashboard": { "empty": "present", "loading": "present", "error": "missing",
                       "first-run": "n/a", "destructive-confirm": "n/a", "form-validation": "n/a" }
      }
    },
    "B4": { "duplicatedBlockClasses": 0 },
    "B5": { "languageOk": true, "placeholdersOk": true, "plausible": true, "notes": "" },
    "B6": { "assetsOk": true, "paletteOk": true, "missingAssets": [], "notes": "" }
  },
  "tierC": { "acknowledged": false, "by": null, "notes": [] }
}
```
Then:
```
node scripts/prototype-qc-merge.mjs --report=prototype-qc.json --fill=prototype-qc.agent.json
```
It recomputes Tier B and the verdict with the profile's own rules. An unreviewed slot (any value
other than `present` / `missing` / `n/a`) is counted as MISSING, so you cannot pass by leaving a
state blank. `--judgements=` is accepted as an alias for `--fill=`.

**Do not soften a judgement to make it pass.** An honest fail costs a fix; a dishonest pass costs a
client. Exit 0 means the merged report is a `pass` and IS the receipt for the gate; exit 1 prints
the reason.

### 4. Tier C — flip ONLY after the real-device pass (C1)
- **C1**: open the gated share link on **iOS Safari AND Android Chrome** — the client will. This is
  a human (Roger) step; the agent cannot do it. Send the link, wait for the verdict.
- **C2**: does anything imply working functionality it does not have (a form that silently swallows
  a submit reads as a bug, not "a prototype")?
Only then: `"tierC": { "acknowledged": true, "by": "<who>", "notes": ["C1: …", "C2: …"] }` and
merge again.

### 5. Upload + gate
Upload the final `prototype-qc.json` to the private `prototypes` bucket **at a path the portal file
index does not list** (decision D2), then:
```
post_gate('<slug>', 'prototype_qc', 'pass', '<report URL in the private bucket>')
```
The gate fetches the report: unreachable/404 → REJECTED; prose → REJECTED; verdict
`incomplete`/`fail` or Tier B < 85 → REJECTED; private-bucket auth-wall (401/403) → accepted
UNVERIFIED (D2 convention, same as `ghRunGreen`); reachable 200 JSON → the bar is checked live.
