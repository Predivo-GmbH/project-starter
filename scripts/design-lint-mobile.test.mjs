// The phone check of design-lint measures a page LOADED at 390x844, never the desktop page resized to 390.
//
// Why (20.11.2026): the old check called page.setViewportSize(390x844) on the 1440 px page and measured in the same
// instant, before the layout had settled. On the runner's Linux Chromium, mitchind's start page read «Ort eingeben» at
// 1008 px in one run and 491 px in the next. Staging runs 44673855920, 44674290425 and 44685555000 failed
// «mobile-cta-fold» on unchanged code, and a local repro failed 4 of 7 runs. With a fresh page loaded at 390 it
// passed 5 of 5. From 26.11.2026 the step blocks the staging deploy, so a coin toss there would stop a release.
//
// This reads the script rather than driving a browser: guards.yml runs it with the offline suites, where
// no Chromium is installed. In a product, the staging step («Design lint») runs the real check every push.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./design-lint.mjs', import.meta.url)), 'utf8')
const start = source.indexOf('// --- Mobile skim')
const end = source.indexOf('await browser.close()', start)
const skim = start >= 0 && end > start ? source.slice(start, end) : ''

test('the script still has its mobile skim section', () => {
  assert.ok(skim, 'no «// --- Mobile skim» section before browser.close() in scripts/design-lint.mjs')
  assert.match(skim, /fail\('mobile-cta-fold'/)
  assert.match(skim, /fail\('mobile-h1-fold'/)
})

test('the desktop page is never resized for the phone check', () => {
  assert.doesNotMatch(skim, /\bpage\.setViewportSize\(/, 'the 1440 px page is resized and measured before its layout settles')
})

test('the phone check loads its own page at 390x844 before measuring', () => {
  const m = skim.match(/const (\w+) = await context\.newPage\(\)/)
  assert.ok(m, 'no fresh page for the phone check')
  const p = m[1]
  const viewport = skim.indexOf(`${p}.setViewportSize({ width: 390, height: 844 })`)
  const load = skim.indexOf(`${p}.goto(`)
  const measure = skim.indexOf(`${p}.evaluate(`)
  assert.ok(viewport >= 0, `${p} is not set to 390x844`)
  assert.ok(load > viewport, `${p} must be 390 px wide BEFORE it loads, so the page is never resized`)
  assert.ok(measure > load, `${p} is measured before it has loaded`)
})
