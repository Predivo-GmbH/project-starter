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
- **Status:** planned | implemented | tested
- **Test Files:** E2E: `e2e/staging/<feature>.spec.ts` | Unit: `src/.../<x>.test.ts`
```

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
