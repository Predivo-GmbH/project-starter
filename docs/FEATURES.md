# Feature Registry — `docs/FEATURES.md`

**This is the single source of truth for "what features exist and are they tested."** The CI gate
`scripts/check-feature-coverage.mjs` parses THIS file and **fails the production promotion** if any feature
marked `implemented` or `tested` lacks a test-file line whose path exists on disk (canonical spec:
`Internal Projects\standards\comprehensive-e2e-testing-methodology.md`; standard: `deploy-standard.md §4c`).

**Born at bootstrap:** seed this file with EVERY planned feature from `product_brief.md` at `status: planned`
(planned features are skipped by the gate, so a fresh project ships green). **Kept true for the product's
whole life** by the same-commit rule — whenever a user-facing feature is added / changed / removed, its
`F-XXX` row is updated in the SAME commit as the code (Rule 52 + Rule 39). As each feature is built, its
`qa-tester` flips the row `planned → tested` and adds the test-file path(s).

## Format (LOCKED — do not deviate)

```
### F-001: <feature name>
- **Status:** planned | in-progress | blocked | implemented | tested | wip | deprecated | retired | removed
- **Test Files:** E2E: `e2e/staging/<feature>.spec.ts` | Unit: `src/.../<x>.test.ts`
```

### Status vocabulary (what each word MEANS) [expanded 2026-08-24, Roger approved]

| Status | Meaning | Gate behaviour |
|---|---|---|
| `planned` | agreed, not started | not checked |
| `in-progress` | **someone is building it right now** | not checked |
| `blocked` | **started, then stopped, and cannot proceed** (waiting on a decision, a credential, a vendor) | not checked |
| `implemented` | deployed and live | **MUST have a test file that exists** |
| `tested` | live AND covered by E2E/unit tests | **MUST have a test file that exists** |
| `wip` | legacy synonym of `in-progress`, still accepted | not checked |
| `deprecated` / `retired` / `removed` | on the way out, or gone | not checked |

**Why the forward statuses matter (the reason this was expanded).** Before 2026-08-24 the live product
files only ever recorded what had already SHIPPED. A fresh session could see what exists, but not what
was half-built or **where work stopped**, which is how the same feature gets started twice or abandoned
silently. `in-progress` and `blocked` are the two words that carry that.

⚠ **`blocked` was added to the CI gate BEFORE being documented here.** The gate treats **any
unrecognised status as a hard failure** (deliberately: an unknown status used to make a feature
invisible rather than failing), so writing `blocked` into a file whose gate did not know the word
would have **failed the production promotion**. All nine live copies of
`scripts/check-feature-coverage.mjs` were widened first, then defect-injected to prove it:
a feature marked `blocked` passes, and a typo'd `blokked` still fails with a named error.
**If you add a status word, widen every gate copy first, and prove it by planting a bad one.**

**⚠ The typed prefix MUST be UNBOLDED — `E2E:`, NOT `**E2E:**`.** The parser
(`scripts/check-feature-coverage.mjs`) matches `E2E:` / `Unit:` / `Integration:` / `Component:` / `A11y:`
followed by a backtick-quoted path. Bolding the prefix inserts a `*` after the colon, the regex matches
nothing, the feature is treated as having ZERO tests, and the gate FAILS. Multiple prefixes may share one
`- **Test Files:**` line. A row with `status: implemented` or `tested` MUST carry at least one such line
pointing at a file that exists on disk.

---

<!-- Replace the example below with this product's real features from product_brief.md.
     Seed every planned feature at status: planned (the gate skips planned rows). -->

### F-001: <example — replace me>
- **Status:** planned
- **Test Files:** E2E: `e2e/staging/example.spec.ts`
