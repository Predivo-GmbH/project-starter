# Decisions (project-starter)

Technical decisions taken alone by a builder session, with the alternatives, so a reviewer reads decisions rather
than diffs.

## 2026-11-20: design-lint's phone check loads its own page at 390x844

- **Chosen:** the «Mobile skim» in `scripts/design-lint.mjs` opens a fresh page in the same browser context, sets
  390x844 before it loads, and gives it the desktop page's `networkidle` load and scroll. The off-origin route abort
  and `reducedMotion` stay on the context. `scripts/design-lint-mobile.test.mjs` reads the script and holds that shape.
- **Why:** the old check resized the loaded 1440 px page and measured in the same instant, before the layout had
  settled. On the self-hosted runner's Linux Chromium, mitchind's start page read its CTA at 1008 px in one run and
  491 px in the next: its staging runs 44673855920, 44674290425 and 44685555000 failed `mobile-cta-fold` on unchanged
  code (old script 4 of 7 FAIL, new 5 of 5 PASS against one build). Products copy this script, and from 26.11.2026 the
  step blocks their staging deploys.
- **Rejected:** a fixed wait after the resize (a guess, on a busy laptop runner); a ceiling or `skipGates` per product
  (the pages are fine, the measurement was wrong); a browser test in `guards.yml`, which has no Chromium.
- **Same change:** predivo-ch/mitchind#245, predivo-ch/ChannelMover#231, predivo-ch/ReplyFlow#173. Board row
  `design-lint-blocks-staging-deploys-from-2026-11-26`.
